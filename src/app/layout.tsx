import type { Metadata } from "next";

import Image from "next/image";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";

import { ModeToggle } from "@/components/ui/mode-toggle";
import { Separator } from "@/components/ui/separator";

import { ThemeProvider } from "@/components/theme-provider";

import "./globals.css";
import { ExternalLinkIcon, MenuIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Fedun.Site", template: "Fedun.Site | %s" },
  description: "Analyze chats, create sticker packs in telegram",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        <div className="p-5 flex flex-col min-h-screen 2xl:mx-32 xl:mx-20">
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
            <Link href="/" className="hover:underline hidden sm:block" >
              Fedun.Site
            </Link>
            <Separator orientation="vertical" className="hidden sm:block" />
            <Link href="/contact" className="hover:underline hidden sm:block">
              Contact me
            </Link>
            <Separator orientation="vertical" className="hidden sm:block" />
            <Link href="/privacy" className="hover:underline">
              Privacy Policy
            </Link>
            <Separator orientation="vertical" />
            <Link href="https://github.com/RoLO0u/fedun-site" target="_blank" className="hover:underline sm:flex items-center gap-1 hidden">
              Source Code <ExternalLinkIcon className="w-4 h-4 mb-0.5"/>
            </Link>
            <Separator orientation="vertical" className="hidden sm:block" />
            <Link href="/admin" className="hover:underline hidden sm:block">
              Admin Panel
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger className="visible sm:hidden">
                <MenuIcon className="h-6 w-6"/>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="mr-5">
                  <DropdownMenuGroup className="text-foreground text-xl flex flex-col gap-2 my-1.5">
                    <Link href="/">
                      <DropdownMenuItem className={`flex flex-row gap-1.5 hover:cursor-pointer hover:underline font-semibold mx-1 text-xl`}>
                        <Image
                          src="/logo.ico"
                          alt="Home"
                          width={32}
                          height={32}
                        />
                        Fedun.Site 
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/contact" className="hover:underline">
                      <DropdownMenuItem>
                        Contact me
                      </DropdownMenuItem>
                    </Link>
                    <Link href="https://github.com/RoLO0u/fedun-site" target="_blank" className="hover:underline flex items-center gap-1">
                      <DropdownMenuItem>
                        Source Code <ExternalLinkIcon className="w-4 h-4 mb-0.5"/>
                      </DropdownMenuItem>
                    </Link>
                  </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </footer>
        </ThemeProvider>
        </div>
      </body>
    </html>
  );
}
