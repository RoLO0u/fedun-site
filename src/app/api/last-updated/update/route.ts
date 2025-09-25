import { updateLastUpdated } from "@/lib/db/lastUpdatedActions";
import { withAuth } from "@/lib/authenticate";
import { NextResponse } from "next/server";

type UpdateData = {
    id: number,
    date: string
}[];

export const POST = withAuth(async (_req, _session) => {
    const data: UpdateData = await _req.json();
    data.forEach(async (project) => {
        await updateLastUpdated(project.id, project.date);
    });
    return NextResponse.json({ message: `${data.map(
        (proj) => `Project ID ${proj.id} updated to ${proj.date}`
    )}` });
}, { requireAdmin: true });