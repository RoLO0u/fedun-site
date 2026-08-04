import { getLinkByShortUrl } from "@/lib/db/linkActions";
import { withAuth } from "@/lib/authenticate";
import { NextRequest, NextResponse } from "next/server";

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const shortUrl = body?.shortUrl;

    if (typeof shortUrl !== "string" || !shortUrl.trim()) {
      return NextResponse.json(
        { error: "A valid short URL is required." },
        { status: 400 }
      );
    }

    const foundLink = await getLinkByShortUrl(shortUrl);

    if (!foundLink) {
      return NextResponse.json(
        { error: "Short URL not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(foundLink);
  } catch (error) {
    console.error("Failed to redirect", error);
    return NextResponse.json(
      { error: "Failed to redirect." },
      { status: 500 }
    );
  }
}, {requireAdmin: true});