import type { MetadataRoute } from "next";

/**
 * Manifiesto de la PWA. Next lo sirve en /manifest.webmanifest.
 *
 * Es lo que permite instalar la app: sin `name`, `icons` de 192 y 512 px,
 * `start_url` y `display: standalone`, Chrome no ofrece "Instalar" y iOS no la
 * abre a pantalla completa.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RESPIA News",
    short_name: "RESPIA",
    description:
      "Portal de noticias con IA. Instalable en Android y iOS desde el navegador.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fbfbfd",
    theme_color: "#fbfbfd",
    lang: "es",
    dir: "ltr",
    categories: ["news", "magazines"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        // El icono "maskable" deja que Android lo recorte con la forma del
        // sistema (círculo, squircle) sin comerse el logo.
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
