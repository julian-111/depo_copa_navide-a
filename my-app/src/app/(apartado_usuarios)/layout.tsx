import type { Metadata } from "next";
import "../globals.css";
import Navbar from "../../components/Navbar/Navbar";

export const metadata: Metadata = {
  title: "Copa Navideña",
  description: "Torneo de fútbol navideño",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
