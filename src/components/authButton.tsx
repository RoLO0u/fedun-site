"use client"
 
import { AuthClient } from "@/lib/auth-client";
import * as React from "react"
import { Button } from "./ui/button";
 
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
    return (
      <Button variant="secondary" onClick={() => {
        authClient.signUp.email(
          {
            email: emailRef!.current!.value,
            password: passwordRef!.current!.value,
            name: nameRef!.current!.value,
          }, {
            onSuccess: (ctx) => {
              alert("Account created! You can now log in.");
              setErrorState(null);
            },
            onError: (ctx) => {
              setErrorState(ctx.error.message);
            },
          }
        );
      }} >
        Sign Up
      </Button>
    );
}