"use client";

import { useState, useEffect, useMemo } from "react";

import { authClient } from "@/lib/auth-client";
import { Project } from "./project";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { Loader2 } from "lucide-react";
import { SignOutButton } from "@/components/authButton";
import { User, columns } from "@/lib/column";
import { DataTable } from "@/components/data-table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type BulkActionType = "verify" | "ban" | "delete";

const AdminPage = () => {
    const [saveLabel, setSaveLabel] = useState<string>("Save");
    const [analyzerDate, setAnalyzerDate] = useState<Date | undefined>(undefined);
    const [botDate, setBotDate] = useState<Date | undefined>(undefined);
    const [shortenerDate, setShortenerDate] = useState<Date | undefined>(undefined);
    const [users, setUsers] = useState<User[] | null>(null);
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
    const [selectionResetSignal, setSelectionResetSignal] = useState(0);
    const [bulkAction, setBulkAction] = useState<BulkActionType | null>(null);
    const [bulkLoading, setBulkLoading] = useState(false);
    const {
        data: session,
        isPending,
        error,
        refetch,
    } = authClient.useSession();
    const selectedCount = selectedUsers.length;
    const bulkActionCopy = useMemo(() => ({
        verify: {
            title: "Verify selected users",
            description: `Mark ${selectedCount} selected user${selectedCount === 1 ? "" : "s"} as verified.`,
            confirmText: "Verify users",
            variant: "default" as const,
        },
        ban: {
            title: "Ban selected users",
            description: `Set the banned flag for ${selectedCount} selected account${selectedCount === 1 ? "" : "s"}.`,
            confirmText: "Ban users",
            variant: "destructive" as const,
        },
        delete: {
            title: "Delete selected users",
            description: `Permanently delete ${selectedCount} account${selectedCount === 1 ? "" : "s"}. This removes their login access and related sessions.`,
            confirmText: "Delete users",
            variant: "destructive" as const,
        },
    }), [selectedCount]);

    const closeBulkDialog = () => {
        if (bulkLoading) return;
        setBulkAction(null);
    };

    const handleBulkAction = async () => {
        if (!bulkAction || selectedCount === 0) return;
        const ids = selectedUsers.map((user) => user.id);
        setBulkLoading(true);
        try {
            const ensureOk = async (res: Response) => {
                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(text || `Request failed with status ${res.status}`);
                }
            };

            if (bulkAction === "verify") {
                await Promise.all(
                    ids.map((userId) =>
                        fetch(`/api/users/verify-email?userId=${userId}&verify=true`, {
                            method: "POST",
                        }).then(ensureOk)
                    )
                );
                setUsers((prev) =>
                    prev?.map((user) =>
                        ids.includes(user.id) ? { ...user, emailVerified: true } : user
                    ) ?? prev
                );
            }

            if (bulkAction === "ban") {
                await Promise.all(
                    ids.map((userId) =>
                        fetch("/api/users/ban", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ userId, banned: true }),
                        }).then(ensureOk)
                    )
                );
                setUsers((prev) =>
                    prev?.map((user) =>
                        ids.includes(user.id) ? { ...user, banned: true } : user
                    ) ?? prev
                );
            }

            if (bulkAction === "delete") {
                await Promise.all(
                    ids.map((userId) =>
                        fetch("/api/users/delete", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ userId }),
                        }).then(ensureOk)
                    )
                );
                setUsers((prev) => prev?.filter((user) => !ids.includes(user.id)) ?? prev);
            }

            setSelectionResetSignal((prev) => prev + 1);
            setSelectedUsers([]);
            setBulkAction(null);
        } catch (err) {
            console.error(err);
            alert(`Bulk action failed: ${(err as Error).message}`);
        } finally {
            setBulkLoading(false);
        }
    };

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
                setShortenerDate(new Date(data.find((proj: {id: number, date: string}) => proj.id === 2)!.date));
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
            <div className="flex grow flex-col mt-5 gap-4 justify-center items-center" >
                <h1 className="text-xl font-semibold">Admin Page</h1>
                <Loader2 className="animate-spin" />
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="flex grow flex-col mt-5 gap-4 justify-center items-center" >
                <h1 className="text-xl font-semibold">Admin Page</h1>
                <div>Error: {error.status} - {error.message}<br/>{error.statusText}</div>
            </div>
        );
    }

    if (session.user.role !== "admin") {
        return (
            <div className="flex grow flex-col mt-5 gap-4 justify-center items-center" >
                <h1 className="text-xl font-semibold">Admin Page</h1>
                <h1 className="text-lg font-semibold">Error 403 | Forbidden</h1>
                <div>You do not have permission to access this page.</div>
                <SignOutButton authClient={authClient} refetch={refetch} />
            </div>
        );
    }
    
    return (
        <div className="flex grow flex-col mt-5 gap-8 justify-center items-center" >
            <h1 className="text-2xl font-semibold flex-none mt-2">Admin Page</h1>
            <div className="flex flex-col gap-4 justify-center items-center w-full">
                <Project label="Chat Analyzer" date={analyzerDate!} setDate={setAnalyzerDate} />
                <Separator className="max-w-1/3" />
                <Project label="Sticker Bot" date={botDate!} setDate={setBotDate} />
                <Separator className="max-w-1/3" />
                <Project label="URL Shortener" date={shortenerDate!} setDate={setShortenerDate} />
                <Separator className="max-w-1/3" />
                <Button className="hover:cursor-pointer" onClick={() => {
                    const UTCDates = [
                        new Date(Date.UTC(analyzerDate?.getFullYear()!, analyzerDate?.getMonth(), analyzerDate?.getDate())),
                        new Date(Date.UTC(botDate?.getFullYear()!, botDate?.getMonth(), botDate?.getDate())),
                        new Date(Date.UTC(shortenerDate?.getFullYear()!, shortenerDate?.getMonth(), shortenerDate?.getDate())),
                    ]
                    fetch("/api/last-updated/update", {
                        method: "POST",
                        body: JSON.stringify([
                            { id: 0, date: UTCDates[0].toUTCString() },
                            { id: 1, date: UTCDates[1].toUTCString() },
                            { id: 2, date: UTCDates[2].toUTCString() },
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
                <div className="flex w-full flex-col gap-3">
                    <div className="flex flex-wrap gap-2 justify-end">
                        <Button
                            variant="secondary"
                            disabled={selectedCount === 0}
                            onClick={() => setBulkAction("verify")}
                        >
                            Verify selected
                        </Button>
                        <Button
                            variant="secondary"
                            disabled={selectedCount === 0}
                            onClick={() => setBulkAction("ban")}
                        >
                            Ban selected
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={selectedCount === 0}
                            onClick={() => setBulkAction("delete")}
                        >
                            Delete selected
                        </Button>
                    </div>
                    <DataTable
                        columns={columns}
                        data={users || []}
                        setData={setUsers}
                        onSelectionChange={setSelectedUsers}
                        clearSelectionSignal={selectionResetSignal}
                    />
                </div>
                <SignOutButton authClient={authClient} refetch={refetch} />
            </div>
            <Dialog open={!!bulkAction} onOpenChange={(open) => {
                if (!open) {
                    closeBulkDialog();
                }
            }}>
                {bulkAction && (
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>{bulkActionCopy[bulkAction].title}</DialogTitle>
                            <DialogDescription>
                                {bulkActionCopy[bulkAction].description}
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="mt-4">
                            <Button variant="outline" onClick={closeBulkDialog} disabled={bulkLoading}>
                                Cancel
                            </Button>
                            <Button
                                variant={bulkActionCopy[bulkAction].variant}
                                onClick={handleBulkAction}
                                disabled={bulkLoading}
                            >
                                {bulkLoading ? "Working..." : bulkActionCopy[bulkAction].confirmText}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                )}
            </Dialog>
        </div>
    );
}

export default AdminPage;