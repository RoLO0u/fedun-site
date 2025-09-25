"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const LoginPage = () => {
    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    return (
        <main className="flex flex-grow flex-col mt-5 gap-4 justify-center items-center" >
            <h1 className="text-xl font-semibold">Admin Page</h1>
            <div>Welcome to the admin page.</div>
            <Input id="email" className="md:w-80" type="email" placeholder="Email" ref={emailRef} />
            <Input id="password" className="md:w-80" type="password" placeholder="Password" ref={passwordRef} />
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
        </main>
    )
}

export default LoginPage;