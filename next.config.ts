import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Next 16 escribe AGENTS.md y CLAUDE.md en la raíz del repo en cada
  // `next dev`. No son documentación del equipo (esa vive en docs/), así que se
  // desactiva. No quitarlo sin consultarlo.
  agentRules: false,

  async headers() {
    return [
      {
        // El service worker no debe quedar cacheado: el navegador tiene que ver
        // la versión nueva en cada deploy para actualizar la app instalada.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
