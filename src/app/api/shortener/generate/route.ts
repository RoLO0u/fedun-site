import { generateLink } from "@/lib/db/linkActions";
import { withAuth } from "@/lib/authenticate";
import { NextRequest, NextResponse } from "next/server";

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const url = body?.url;

    if (typeof url !== "string" || !url.trim()) {
      return NextResponse.json(
        { error: "A valid URL is required." },
        { status: 400 }
      );
    }

    const shortCode = Math.random().toString(36).slice(2, 10);
    const createdLink = await generateLink(url, shortCode, body?.collectStats);

    return NextResponse.json({
      success: true,
      shortUrl: createdLink.shortUrl,
    });
  } catch (error) {
    console.error("Failed to generate short link", error);
    return NextResponse.json(
      { error: "Failed to generate short link." },
      { status: 500 }
    );
  }
}, { requireVerifiedEmail: true });