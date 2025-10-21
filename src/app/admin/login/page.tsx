"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { CircleXIcon, InfoIcon } from "lucide-react";
import { SignInButton, SignUpButton } from "@/components/authButton";

const LoginPage = () => {
    const [errorState, setErrorState] = useState<string | null>(null);
    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const nameRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    return (
        <div className="flex flex-grow flex-row mt-5 gap-4 justify-center items-center" >
            <div className="flex flex-col gap-4 justify-center items-center">
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
            </div>
            <div className="flex flex-col gap-3">
                {errorState && (
                    <Alert variant="destructive" className="max-w-96">
                        <CircleXIcon/>
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{errorState}</AlertDescription>
                    </Alert>
                )}
                <Alert className="max-w-96">
                    <InfoIcon/>
                    <AlertTitle>Info</AlertTitle>
                    <AlertDescription>
                        Please sign in to access the admin page. <br />
                        Name must be between 3 and 30 characters long and can only contain letters, numbers, and underscores.
                    </AlertDescription>
                </Alert>
            </div>
        </div>
    )
}

export default LoginPage;