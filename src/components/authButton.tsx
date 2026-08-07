"use client"
 
import { AuthClient } from "@/lib/auth-client";
import * as React from "react"
import { Button, buttonVariants } from "./ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import { authClient } from "@/lib/auth-client";
import { SiGoogle } from "@icons-pack/react-simple-icons";
 
export function SignOutButton({
  authClient,
  refetch,
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  authClient: AuthClient;
  refetch: () => void;
}) {
    return (
    <Button variant="destructive" className="hover:cursor-pointer" onClick={() => {
      authClient.signOut();
      refetch();
    }}>
      Sign out
    </Button>
    );
}
    
export function SignInButton({
  authClient,
  emailRef,
  passwordRef,
  router,
  setErrorState,
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  authClient: AuthClient;
  emailRef: React.RefObject<HTMLInputElement | null>;
  passwordRef: React.RefObject<HTMLInputElement | null>;
  router: ReturnType<typeof import("next/navigation").useRouter>;
  setErrorState: React.Dispatch<React.SetStateAction<string | null>>;
}) {
    return (
      <Button onClick={() => {
        authClient.signIn.email(
          {
            email: emailRef.current?.value || "",
            password: passwordRef.current?.value || "",
          }, {
            onSuccess: (ctx) => {
              router.push("/admin");
            },
            onError: (ctx) => {
              setErrorState(ctx.error.message);
            },
          }
        );
      }}>Sign In</Button>
    );
}
    
export function SignUpButton({
  authClient,
  emailRef,
  passwordRef,
  nameRef,
  setErrorState,
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  authClient: AuthClient;
  emailRef: React.RefObject<HTMLInputElement | null>;
  passwordRef: React.RefObject<HTMLInputElement | null>;
  nameRef: React.RefObject<HTMLInputElement | null>;
  setErrorState: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <Popover open={open}>
      <PopoverTrigger className={buttonVariants({ variant: "secondary" })} onClick={() => {
        authClient.signUp.email(
          {
            email: emailRef!.current!.value,
            password: passwordRef!.current!.value,
            name: nameRef!.current!.value,
          }, {
            onSuccess: (ctx) => {
                setOpen(true);
                setErrorState(null);
              },
              onError: (ctx) => {
                setErrorState(ctx.error.message);
              },
            }
          );
        }} >
          Sign Up
      </PopoverTrigger>
      <PopoverContent
        className="w-fit"
        onInteractOutside={() => setOpen(false)}
        onEscapeKeyDown={() => setOpen(false)}
      >
        <div className="font-medium">Success!</div>
      </PopoverContent>
    </Popover>
  );
}

export function GoogleSignInButton({
  callbackURL,
  setErrorState,
  className,
  shrink,
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  callbackURL: string;
  setErrorState?: React.Dispatch<React.SetStateAction<string | null>>;
  className?: string;
  shrink?: boolean;
}) {
  return (
    <Button 
      onClick={async () => {
        try {
          await authClient.signIn.social({
            provider: "google",
            callbackURL,
          });
        } catch (error) {
          if (setErrorState) {
            setErrorState(error instanceof Error ? error.message : "Google sign-in failed");
          } else {
            console.error("Google sign-in failed:", error);
          }
        }
      }}
      className={`flex items-center ${ shrink ? "sm:rounded-md rounded-full" : "" } gap-2 ${className || ""}`}
    >
      <div className={ shrink ? "hidden sm:block" : "" }>Continue with</div> <SiGoogle />
    </Button>
  );
}   