import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Barra POS",
  description: "Sistema de ventas y gestión comercial",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full flex flex-col bg-gray-100 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
