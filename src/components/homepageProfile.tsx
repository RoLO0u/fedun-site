"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { GoogleSignInButton } from "@/components/authButton";
import { authClient } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function HomepageProfile() {

  const router = useRouter();

  const session = authClient.useSession();

  if (session.isPending) {
    return (
      <div className="flex justify-center items-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!session.data?.user) {
    return (
      <GoogleSignInButton callbackURL={window.location.href} shrink={true} />
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Image
          width={30}
          height={30}
          src={session.data?.user.image || "/default-avatar.svg"}
          alt="User Avatar"
          className="rounded-full hover:drop-shadow-[0_0_1rem_rgb(200,0,200)] duration-300 cursor-pointer"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel className="text-sm text-muted-foreground">
          Signed in as {session.data?.user.email}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => {
              authClient.signOut();
              router.refresh();
            }}
            className="text-sm text-red-500 dark:text-red-400"
          >
            Sign out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}