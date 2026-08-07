import { getLinksByUserId } from "@/lib/db/linkActions";
import { withAuth } from "@/lib/authenticate";
import { NextRequest, NextResponse } from "next/server";

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const userId = body?.userId;

    if (typeof userId !== "string" || !userId.trim()) {
      return NextResponse.json(
        { error: "A valid user ID is required." },
        { status: 400 }
      );
    }

    const linksList = await getLinksByUserId(userId);

    return NextResponse.json(linksList);
  } catch (error) {
    console.error("Failed to redirect", error);
    return NextResponse.json(
      { error: "Failed to redirect." },
      { status: 500 }
    );
  }
});