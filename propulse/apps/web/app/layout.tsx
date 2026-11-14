import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@fontsource-variable/inter";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "PROPULSE | Gestão para negócios de serviços", template: "%s | PROPULSE" },
  icons: { icon: "/propulse.svg" },
  description: "Agenda, clientes e equipa para negócios de serviços por marcação.",
};

const themeScript = "try{document.documentElement.dataset.theme=localStorage.getItem('propulse-theme')||'dark'}catch{}";

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="pt-PT" suppressHydrationWarning>
    <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
    <body>{children}</body>
  </html>;
}
