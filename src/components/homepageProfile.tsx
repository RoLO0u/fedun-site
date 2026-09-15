"use client";

import { useRouter } from "next/navigation";
import { GoogleSignIn, GoogleSignInButton } from "@/components/authButton";
import { authClient } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";
import { SiGoogle } from "@icons-pack/react-simple-icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarBadge
} from "@/components/ui/avatar"

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
        <Avatar>
          <AvatarImage
            src={session.data?.user.image || "/default-avatar.svg"}
            alt="@user-avatar"
            className={`${session.data?.user.image ? '' : 'dark:invert'} hover:drop-shadow-[0_0_1rem_rgb(200,0,200)] duration-300 cursor-pointer`}
          />
          <AvatarFallback>CN</AvatarFallback>
          { 
            session.data?.user.isAnonymous &&
            <AvatarBadge className="bg-amber-300 dark:bg-amber-400" />
          }
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel className="text-sm text-muted-foreground">
          Signed in as {session.data?.user.email.slice(0, 25)}{session.data?.user.email.length > 25 ? "..." : ""}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          { session.data?.user.isAnonymous &&
            <DropdownMenuItem
              onClick={() => {
                GoogleSignIn({ callbackURL: window.location.href });
              }}
              className="text-sm flex items-center gap-1"
            >
              Link Account <SiGoogle className="size-3" />
            </DropdownMenuItem>
          }
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