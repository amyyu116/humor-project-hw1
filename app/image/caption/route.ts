import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
    try {
        const { imageId } = await req.json();

        if (!imageId) {
            return NextResponse.json(
                { error: "Missing imageId" },
                { status: 400 },
            );
        }

        // 🔑 get logged-in session
        const supabase = await createClient();

        const {
            data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        // 📡 call AlmostCrackd caption endpoint
        const upstreamUrl =
            "https://api.almostcrackd.ai/pipeline/generate-captions";
        const requestId = crypto.randomUUID();
        let response: Response;

        try {
            response = await fetch(upstreamUrl, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                    "Content-Type": "application/json",
                    "X-Request-Id": requestId,
                },
                body: JSON.stringify({
                    imageId,
                }),
            });
        } catch (err) {
            console.error("Caption generation fetch failed:", {
                requestId,
                upstreamUrl,
                error:
                    err instanceof Error
                        ? { name: err.name, message: err.message }
                        : err,
            });

            return NextResponse.json(
                {
                    error: true,
                    message: "Upstream caption service unreachable",
                    requestId,
                    upstreamUrl,
                },
                { status: 502 },
            );
        }

        if (!response.ok) {
            const text = await response.text();
            console.error("Caption generation error:", {
                requestId,
                upstreamUrl,
                status: response.status,
                statusText: response.statusText,
                body: text,
            });

            return NextResponse.json(
                {
                    error: true,
                    message: "Failed to generate captions",
                    requestId,
                    upstreamUrl,
                    status: response.status,
                    statusText: response.statusText,
                },
                { status: response.status },
            );
        }

        const captions = await response.json();

        // 👇 this matches your frontend expectation
        return NextResponse.json(captions);
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
