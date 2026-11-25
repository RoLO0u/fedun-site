"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLinkIcon, MenuIcon } from "lucide-react";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import HomepageProfile from "@/components/homepageProfile";
import {
  StickerSetsLayout,
  useStickerSetsLayout,
} from "@/components/stickerSetsLayout";
import { SidebarTrigger } from "@/components/ui/sidebar";

const SiteHeader = ({
  hasSidebar = false,
  isStickerSetsRoute = false,
}: {
  hasSidebar?: boolean;
  isStickerSetsRoute?: boolean;
}) => (
  <header
    className={`relative z-20 flex items-center justify-between bg-background pt-5 ${
      isStickerSetsRoute ? "px-5" : ""
    }`}
  >
    <div className="flex items-center gap-2">
      {hasSidebar && <SidebarTrigger label="Packs" className="md:hidden" />}
      <Link href="/" className="home-brand-link">
        <span className="flex flex-row gap-0 hover:cursor-pointer">
          <Image
            src="/logo.ico"
            alt="Home"
            className="mr-1"
            width={32}
            height={32}
            unoptimized
          />
          <span className="home-link inline-block font-semibold text-xl">Fedun.Site</span>
        </span>
      </Link>
    </div>
    <span className="ml-auto flex flex-row items-center gap-4">
      <Link
        href="https://github.com/RoLO0u"
        target="_blank"
        className="header-outline-control hidden md:inline-flex"
      >
        <Image
          width={30}
          height={30}
          src="/github.svg"
          alt="GitHub"
          className="dark:invert"
        />
        <svg className="header-outline-ring size-full" viewBox="0 0 40 40" aria-hidden="true">
          <circle cx="20" cy="20" r="19" pathLength="100" />
        </svg>
      </Link>
      <Link
        href="https://t.me/feddunn"
        target="_blank"
        className="header-outline-control hidden md:inline-flex"
      >
        <Image
          width={30}
          height={30}
          src="/telegram.svg"
          alt="Telegram"
          className="dark:invert"
        />
        <svg className="header-outline-ring size-full" viewBox="0 0 40 40" aria-hidden="true">
          <circle cx="20" cy="20" r="19" pathLength="100" />
        </svg>
      </Link>
      <HomepageProfile />
      <ModeToggle />
    </span>
  </header>
);

const SiteFooter = () => (
  <footer className="mt-10 flex items-center justify-center">
    <div className="flex h-5 items-center space-x-3">
      <Link href="/" className="hidden hover:underline sm:block">
        Fedun.Site
      </Link>
      <Separator orientation="vertical" className="hidden sm:block" />
      <Link href="/contact" className="hidden hover:underline sm:block">
        Contact me
      </Link>
      <Separator orientation="vertical" className="hidden sm:block" />
      <Link href="/privacy" className="hover:underline">
        Privacy Policy
      </Link>
      <Separator orientation="vertical" />
      <Link
        href="https://github.com/RoLO0u/fedun-site"
        target="_blank"
        className="hidden items-center gap-1 hover:underline sm:flex"
      >
        Source Code <ExternalLinkIcon className="mb-0.5 h-4 w-4" />
      </Link>
      <Separator orientation="vertical" className="hidden sm:block" />
      <Link href="/admin" className="hidden hover:underline sm:block">
        Admin Panel
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger className="visible sm:hidden">
          <MenuIcon className="h-6 w-6" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="mr-5">
          <DropdownMenuGroup className="my-1.5 flex flex-col gap-2 text-xl text-foreground">
            <Link href="/">
              <DropdownMenuItem className="mx-1 flex flex-row gap-1.5 text-xl font-semibold hover:cursor-pointer hover:underline">
                <Image src="/logo.ico" alt="Home" width={32} height={32} unoptimized />
                Fedun.Site
              </DropdownMenuItem>
            </Link>
            <Link href="/contact" className="flex hover:underline">
              <DropdownMenuItem>Contact me</DropdownMenuItem>
            </Link>
            <Link
              href="https://github.com/RoLO0u/fedun-site"
              target="_blank"
              className="flex items-center gap-1 hover:underline"
            >
              <DropdownMenuItem>
                Source Code <ExternalLinkIcon className="mb-0.5 h-4 w-4" />
              </DropdownMenuItem>
            </Link>
            <Link href="/admin" className="flex hover:underline">
              <DropdownMenuItem>Admin Panel</DropdownMenuItem>
            </Link>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </footer>
);

const SiteFrame = ({
  children,
  isStickerSetsRoute,
  hasSidebar = false,
}: {
  children: React.ReactNode;
  isStickerSetsRoute: boolean;
  hasSidebar?: boolean;
}) => (
  <div
    className={`flex min-w-0 flex-1 flex-col ${
      isStickerSetsRoute ? "min-h-svh pb-5" : ""
    }`}
  >
    <SiteHeader hasSidebar={hasSidebar} isStickerSetsRoute={isStickerSetsRoute} />
    <main
      className={`flex min-w-0 flex-1 flex-col ${
        isStickerSetsRoute ? "px-4" : ""
      }`}
    >
      {children}
    </main>
    <SiteFooter />
  </div>
);

const StickerSetsSiteFrame = ({ children }: { children: React.ReactNode }) => {
  const { showSidebar } = useStickerSetsLayout();
  return (
    <SiteFrame isStickerSetsRoute hasSidebar={showSidebar}>
      {children}
    </SiteFrame>
  );
};

export const SiteShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const isStickerSetsRoute =
    pathname === "/sticker-sets" || pathname.startsWith("/sticker-sets/");

  if (isStickerSetsRoute) {
    return (
      <StickerSetsLayout>
        <StickerSetsSiteFrame>{children}</StickerSetsSiteFrame>
      </StickerSetsLayout>
    );
  }

  return (
    <div className="flex min-h-screen flex-col px-5 pb-5 2xl:mx-32 xl:mx-20">
      <SiteFrame isStickerSetsRoute={false}>{children}</SiteFrame>
    </div>
  );
};
