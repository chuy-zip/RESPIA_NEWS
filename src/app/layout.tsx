import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import { ServiceWorkerRegistrar } from "@/components/pwa/ServiceWorkerRegistrar";
import { getSiteUrl } from "@/lib/site";
import { getCurrentUser } from "@/lib/auth/dal";
import { DemoSession } from "@/components/news/DemoSession";

import "@/styles/globals.css";

/*
 * next/font descarga y auto-hospeda las tipografías en el build, así que no hay
 * petición a Google en tiempo de ejecución. Cada familia expone una variable CSS
 * que consumen los tokens en src/styles/tokens.css.
 */
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "The Meridian Times",
    template: "%s · The Meridian Times",
  },
  description:
    "Tecnología, economía y finanzas en contexto. Una experiencia editorial de RESPIA News.",
  applicationName: "RESPIA News",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  // iOS solo abre la app en modo standalone si encuentra estos metadatos.
  appleWebApp: {
    capable: true,
    title: "RESPIA",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Necesario para que el contenido llegue hasta los bordes en iPhone con notch.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfbfd" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0f14" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  return (
    <html
      lang="es"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <DemoSession key={user?.id ?? "visitor"}>{children}</DemoSession>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
