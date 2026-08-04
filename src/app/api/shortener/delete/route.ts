import { deleteLinkByShortUrl } from "@/lib/db/linkActions";
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

    const deletedLink = await deleteLinkByShortUrl(shortUrl);

    if (!deletedLink) {
      return NextResponse.json(
        { error: "Short URL not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(deletedLink);
  } catch (error) {
    console.error("Failed to delete", error);
    return NextResponse.json(
      { error: "Failed to delete." },
      { status: 500 }
    );
  }
}, { requireVerifiedEmail: true });