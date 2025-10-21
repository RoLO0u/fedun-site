"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { CircleXIcon } from "lucide-react";
import { SignInButton, SignUpButton } from "@/components/authButton";

const LoginPage = () => {
    const [errorState, setErrorState] = useState<string | null>(null);
    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const nameRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    return (
        <div className="flex flex-grow flex-col mt-5 gap-4 justify-center items-center" >
            <h1 className="text-xl font-semibold">Admin Page</h1>
            <div>Welcome to the admin page.</div>
            <Input id="email" className="md:w-80" type="email" placeholder="Email" ref={emailRef} />
            <Input id="password" className="md:w-80" type="password" placeholder="Password" ref={passwordRef} />
            <Input id="name" className="md:w-80" type="text" placeholder="Login (Sign up only)" ref={nameRef} />
            <div className="flex gap-2">
                <SignInButton
                    authClient={authClient}
                    emailRef={emailRef}
                    passwordRef={passwordRef}
                    router={router}
                    setErrorState={setErrorState}
                />
                <SignUpButton
                    authClient={authClient}
                    emailRef={emailRef}
                    passwordRef={passwordRef}
                    nameRef={nameRef}
                    setErrorState={setErrorState}
                />
            </div>
            {errorState && (
                <Alert variant="destructive" className="mt-2 w-fit ">
                    <CircleXIcon/>
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{errorState}</AlertDescription>
                </Alert>
            )}
        </div>
    )
}

export default LoginPage;