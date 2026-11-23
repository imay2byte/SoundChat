import "./globals.css";
import { Fraunces, IBM_Plex_Mono } from "next/font/google";

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});

export const metadata = {
  title: "SoundChat — El canal de aire",
  description: "Transmisión de datos mediante ondas sonoras audibles.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={`${fraunces.variable} ${plexMono.variable}`}>
        {children}
      </body>
    </html>
  );
}