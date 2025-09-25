"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const LoginPage = () => {
    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const nameRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    return (
        <main className="flex flex-grow flex-col mt-5 gap-4 justify-center items-center" >
            <h1 className="text-xl font-semibold">Admin Page</h1>
            <div>Welcome to the admin page.</div>
            <Input id="email" className="md:w-80" type="email" placeholder="Email" ref={emailRef} />
            <Input id="password" className="md:w-80" type="password" placeholder="Password" ref={passwordRef} />
            <Input id="name" className="md:w-80" type="text" placeholder="Login (Sign up only)" ref={nameRef} />
            <div className="flex gap-2">
            <Button onClick={() => {
                authClient.signIn.email(
                    {
                        email: emailRef.current!.value,
                        password: passwordRef.current!.value,
                    }, {
                        onSuccess: (ctx) => {
                            router.push("/admin");
                        },
                        onError: (ctx) => {
                            alert(ctx.error.message);
                        },
                    }
                );
            }}>Sign In</Button>
            <Button variant="secondary" onClick={() => {
                authClient.signUp.email(
                    {
                        email: emailRef.current!.value,
                        password: passwordRef.current!.value,
                        name: nameRef.current!.value,
                    }, {
                        onSuccess: (ctx) => {
                            alert("Account created! You can now log in.");
                        },
                        onError: (ctx) => {
                            alert(ctx.error.message);
                        },
                    }
                );
            }} >
                Sign Up
            </Button>
            </div>
        </main>
    )
}

export default LoginPage;