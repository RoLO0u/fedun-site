import type { Metadata } from "next";

import Image from "next/image";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";

import { ModeToggle } from "@/components/ui/mode-toggle";
import { Separator } from "@/components/ui/separator";

import { ThemeProvider } from "@/components/theme-provider";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Fedun.Site", template: "%s @ Fedun.Site" },
  description: "Next.js + TypeScript + Tailwind CSS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased p-5 flex flex-col min-h-screen 2xl:mx-32 xl:mx-20 md:mx-0`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="theme"
        >
        <header className="flex items-center justify-between">
          <Link href="/" passHref>
            <span className={`flex flex-row gap-0 hover:cursor-pointer hover:underline`}>
              <Image
                src="/logo.ico"
                alt="Home"
                className="mr-1"
                width={32}
                height={32}
              />
              <span className="font-semibold text-xl">Fedun.Site</span>
            </span>
          </Link>
          <span className={`flex flex-row gap-4 items-center`}>
            <Link href="https://github.com/RoLO0u" target="_blank">
              <Image
                width={30}
                height={30} 
                src="/github.svg"
                alt="GitHub"
                className="dark:invert hover:drop-shadow-[0_0_1rem_rgb(150,150,150)] duration-300"
              />
            </Link>
            <Link href="https://t.me/feddunn" target="_blank">
              <Image
                width={30}
                height={30}
                src="/telegram.svg"
                alt="Telegram"
                className="dark:invert hover:drop-shadow-[0_0_1rem_rgb(0,200,200)] duration-300"
              />
            </Link>
            <ModeToggle />
          </span>
        </header>
        {children}
        <footer className="mt-10 flex justify-center items-center">
          <div className="flex space-x-3 h-5 items-center">
            <Link href="/" className="hover:underline">
              Fedun.Site
            </Link>
            <Separator orientation="vertical" />
            <Link href="/privacy" className="hover:underline">
              Privacy Policy
            </Link>
          </div>
        </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
