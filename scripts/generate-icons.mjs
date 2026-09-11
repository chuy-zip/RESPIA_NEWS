/*
 * Genera los iconos PNG de la PWA a partir del logo, sin dependencias externas.
 *
 *   node scripts/generate-icons.mjs   (o: npm run icons)
 *
 * Los PNG se versionan en public/icons, así que solo hay que volver a correrlo
 * cuando cambie el logo. Cuando exista la marca definitiva, se ajustan los
 * colores y la geometría de drawLogo() y se ejecuta de nuevo.
 */

import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUTPUT_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "public",
  "icons",
);

// Mismos valores que --color-ink / --color-surface en src/styles/tokens.css.
const COLOR_BACKGROUND = [0x14, 0x16, 0x1d, 0xff];
const COLOR_BARS = [0xfb, 0xfb, 0xfd, 0xff];
const COLOR_DOT = [0x7c, 0x6b, 0xff, 0xff];

/** Se dibuja a 4x y se reduce al final: así los bordes salen suavizados. */
const SUPERSAMPLE = 4;

const ICONS = [
  { file: "icon-192.png", size: 192, maskable: false },
  { file: "icon-512.png", size: 512, maskable: false },
  // Android recorta el maskable con la forma del sistema: el logo va más
  // pequeño para que no se le coman los bordes.
  { file: "icon-maskable-512.png", size: 512, maskable: true },
  { file: "apple-touch-icon.png", size: 180, maskable: false },
];

// ---------------------------------------------------------------- dibujo

function createCanvas(size) {
  return { size, pixels: new Uint8ClampedArray(size * size * 4) };
}

function setPixel(canvas, x, y, [r, g, b, a]) {
  const index = (y * canvas.size + x) * 4;
  canvas.pixels[index] = r;
  canvas.pixels[index + 1] = g;
  canvas.pixels[index + 2] = b;
  canvas.pixels[index + 3] = a;
}

function fillBackground(canvas, color) {
  for (let y = 0; y < canvas.size; y += 1) {
    for (let x = 0; x < canvas.size; x += 1) {
      setPixel(canvas, x, y, color);
    }
  }
}

function fillRoundedRect(canvas, x, y, width, height, radius, color) {
  const right = x + width;
  const bottom = y + height;

  for (let py = Math.floor(y); py < Math.ceil(bottom); py += 1) {
    for (let px = Math.floor(x); px < Math.ceil(right); px += 1) {
      // Punto más cercano del rectángulo interior (el que excluye las esquinas)
      const cx = Math.min(Math.max(px + 0.5, x + radius), right - radius);
      const cy = Math.min(Math.max(py + 0.5, y + radius), bottom - radius);
      const dx = px + 0.5 - cx;
      const dy = py + 0.5 - cy;

      if (dx * dx + dy * dy <= radius * radius) {
        setPixel(canvas, px, py, color);
      }
    }
  }
}

function fillCircle(canvas, cx, cy, radius, color) {
  for (let py = Math.floor(cy - radius); py < Math.ceil(cy + radius); py += 1) {
    for (let px = Math.floor(cx - radius); px < Math.ceil(cx + radius); px += 1) {
      const dx = px + 0.5 - cx;
      const dy = py + 0.5 - cy;

      if (dx * dx + dy * dy <= radius * radius) {
        setPixel(canvas, px, py, color);
      }
    }
  }
}

/**
 * El logo: tres líneas de texto que se acortan, y el punto de señal.
 * Es el mismo dibujo que el SVG de SiteHeader, en una rejilla de 24 unidades.
 */
function drawLogo(canvas, maskable) {
  fillBackground(canvas, COLOR_BACKGROUND);

  const artFraction = maskable ? 0.56 : 0.7;
  const art = canvas.size * artFraction;
  const unit = art / 24;
  const originX = (canvas.size - art) / 2;
  const originY = (canvas.size - art) / 2;

  const toX = (value) => originX + value * unit;
  const toY = (value) => originY + value * unit;

  const bars = [
    { x: 2, y: 4, width: 20 },
    { x: 2, y: 10.5, width: 14 },
    { x: 2, y: 17, width: 9 },
  ];

  for (const bar of bars) {
    fillRoundedRect(
      canvas,
      toX(bar.x),
      toY(bar.y),
      bar.width * unit,
      3 * unit,
      1.5 * unit,
      COLOR_BARS,
    );
  }

  fillCircle(canvas, toX(19.5), toY(18.5), 2.5 * unit, COLOR_DOT);
}

/** Promedia cada bloque de SUPERSAMPLE×SUPERSAMPLE en un pixel final. */
function downsample(canvas, targetSize) {
  const output = createCanvas(targetSize);
  const block = SUPERSAMPLE * SUPERSAMPLE;

  for (let y = 0; y < targetSize; y += 1) {
    for (let x = 0; x < targetSize; x += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;

      for (let sy = 0; sy < SUPERSAMPLE; sy += 1) {
        for (let sx = 0; sx < SUPERSAMPLE; sx += 1) {
          const index =
            ((y * SUPERSAMPLE + sy) * canvas.size + (x * SUPERSAMPLE + sx)) * 4;
          r += canvas.pixels[index];
          g += canvas.pixels[index + 1];
          b += canvas.pixels[index + 2];
          a += canvas.pixels[index + 3];
        }
      }

      setPixel(output, x, y, [r / block, g / block, b / block, a / block]);
    }
  }

  return output;
}

// ------------------------------------------------------------ PNG encoder

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);

  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }

  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);

  const typeAndData = Buffer.concat([Buffer.from(type, "ascii"), data]);

  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));

  return Buffer.concat([length, typeAndData, crc]);
}

function encodePng(canvas) {
  const { size, pixels } = canvas;

  // Cada fila lleva delante un byte de filtro (0 = sin filtro).
  const raw = Buffer.alloc((size * 4 + 1) * size);
  let cursor = 0;

  for (let y = 0; y < size; y += 1) {
    raw[cursor] = 0;
    cursor += 1;
    for (let x = 0; x < size * 4; x += 1) {
      raw[cursor] = pixels[y * size * 4 + x];
      cursor += 1;
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header.writeUInt8(8, 8); // profundidad de bits
  header.writeUInt8(6, 9); // color RGBA
  header.writeUInt8(0, 10); // compresión
  header.writeUInt8(0, 11); // filtro
  header.writeUInt8(0, 12); // sin entrelazado

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(raw, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

// ------------------------------------------------------------------ main

mkdirSync(OUTPUT_DIR, { recursive: true });

for (const icon of ICONS) {
  const canvas = createCanvas(icon.size * SUPERSAMPLE);
  drawLogo(canvas, icon.maskable);

  const path = join(OUTPUT_DIR, icon.file);
  writeFileSync(path, encodePng(downsample(canvas, icon.size)));

  console.log(`✓ ${icon.file} (${icon.size}×${icon.size})`);
}

console.log(`\nIconos escritos en ${OUTPUT_DIR}`);
