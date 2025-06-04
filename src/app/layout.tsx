import type { Metadata } from "next";
  import { Geist, Geist_Mono } from "next/font/google";
  import "./globals.css";
  import Navigation from "@/components/Navigation";

  const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
  });

  const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
  });

  export const metadata: Metadata = {
    title: "HotBoxes | Super Bowl Squares Reimagined",
    description: "A modern way to play Super Bowl Squares with friends",
  };

  export default function RootLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return (
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 
  dark:from-gray-900 dark:to-gray-800">
            <Navigation user={null} />
            {children}
          </div>
        </body>
      </html>
    );
  }
