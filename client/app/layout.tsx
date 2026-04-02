import type { Metadata } from "next";
import "./globals.css";
import { GameProvider } from "@/lib/game-context";

export const metadata: Metadata = {
  title: "CodeCrafters 🏫",
  description: "Collaborate. Code. Build Your Campus together.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&family=Black+Han+Sans&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <GameProvider>{children}</GameProvider>
      </body>
    </html>
  );
}
