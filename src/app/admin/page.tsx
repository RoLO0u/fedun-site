"use client";

import { useState, useEffect } from "react";

import { authClient } from "@/lib/auth-client";
import { Project } from "./project";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { Loader2 } from "lucide-react";
import { SignOutButton } from "@/components/authButton";
import { User, columns } from "@/lib/column";
import { DataTable } from "@/components/data-table";

const AdminPage = () => {
    const [saveLabel, setSaveLabel] = useState<string>("Save");
    const [analyzerDate, setAnalyzerDate] = useState<Date | undefined>(undefined)
    const [botDate, setBotDate] = useState<Date | undefined>(undefined)
    const [users, setUsers] = useState<User[] | null>(null);
    const {
        data: session,
        isPending,
        error,
        refetch,
    } = authClient.useSession();

    useEffect(() => {
        if (!isPending && !session) {
            redirect("/admin/login");
        }
    }, [isPending, session]);
    
    useEffect(() => {
        if (isPending) return;
        fetch("/api/last-updated/get-all")
            .then((res) => {
                if (!res.ok) throw new Error(`Failed to fetch last updated dates: ${res.status}`);
                return res.json();
            })
            .then((data: 
                { id: number, date: string }[]
            ) => {
                setAnalyzerDate(new Date(data.find((proj: {id: number, date: string}) => proj.id === 0)!.date));
                setBotDate(new Date(data.find((proj: {id: number, date: string}) => proj.id === 1)!.date));
            })
            .catch(console.error)
        fetch("/api/users/get-all")
            .then((res) => {
                if (!res.ok) throw new Error(`Failed to fetch users: ${res.status}`);
                return res.json();
            })
            .then((data: User[]
            ) => {
                setUsers(data);
            })
            .catch(console.error)
    }, [isPending]);
    
    
    if (isPending || !session) {
        return (
            <div className="flex flex-grow flex-col mt-5 gap-4 justify-center items-center" >
                <h1 className="text-xl font-semibold">Admin Page</h1>
                <Loader2 className="animate-spin" />
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="flex flex-grow flex-col mt-5 gap-4 justify-center items-center" >
                <h1 className="text-xl font-semibold">Admin Page</h1>
                <div>Error: {error.status} - {error.message}<br/>{error.statusText}</div>
            </div>
        );
    }

    if (session.user.role !== "admin") {
        return (
            <div className="flex flex-grow flex-col mt-5 gap-4 justify-center items-center" >
                <h1 className="text-xl font-semibold">Admin Page</h1>
                <h1 className="text-lg font-semibold">Error 403 | Forbidden</h1>
                <div>You do not have permission to access this page.</div>
                <SignOutButton authClient={authClient} refetch={refetch} />
            </div>
        );
    }
    
    return (
        <div className="flex flex-grow flex-col mt-5 gap-8 justify-center items-center" >
            <h1 className="text-2xl font-semibold flex-none mt-2">Admin Page</h1>
            <div className="flex flex-col gap-4 justify-center items-center w-full">
                <Project label="Chat analyzer" date={analyzerDate!} setDate={setAnalyzerDate} />
                <Separator className="max-w-1/3" />
                <Project label="Sticker bot" date={botDate!} setDate={setBotDate} />
                <Separator className="max-w-1/3" />
                <Button className="hover:cursor-pointer" onClick={() => {
                    const UTCDates = [
                        new Date(Date.UTC(analyzerDate?.getFullYear()!, analyzerDate?.getMonth(), analyzerDate?.getDate())),
                        new Date(Date.UTC(botDate?.getFullYear()!, botDate?.getMonth(), botDate?.getDate())),
                    ]
                    fetch("/api/last-updated/update", {
                        method: "POST",
                        body: JSON.stringify([
                            { id: 0, date: UTCDates[0].toUTCString() },
                            { id: 1, date: UTCDates[1].toUTCString() },
                        ]),
                        headers: {
                            "Content-Type": "application/json",
                        },
                    })
                    .then((res) => {
                        if (!res.ok) throw new Error("Failed to update last updated");
                        setSaveLabel("Saved ✔️");
                    })
                    .catch((err) => {
                        console.error(err);
                        alert("Failed to save last updated dates");
                    });
                }}>
                    {saveLabel}
                </Button>
                <DataTable columns={columns} data={users || []} />
                <SignOutButton authClient={authClient} refetch={refetch} />
            </div>
        </div>
    );
}

export default AdminPage;