import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Admin - Copa Navideña",
  description: "Panel de administración",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased admin-theme">
        {children}
      </body>
    </html>
  );
}
