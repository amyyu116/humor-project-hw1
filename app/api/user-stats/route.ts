import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rated = await supabase
        .from("caption_votes")
        .select("id", { count: "exact", head: true })
        .eq("profile_id", user.id);

    const liked = await supabase
        .from("caption_votes")
        .select("id", { count: "exact", head: true })
        .eq("profile_id", user.id)
        .eq("vote_value", 1);

    const downvoted = await supabase
        .from("caption_votes")
        .select("id", { count: "exact", head: true })
        .eq("profile_id", user.id)
        .eq("vote_value", -1);

    if (rated.error || liked.error || downvoted.error) {
        return NextResponse.json(
            { error: "Failed to load stats" },
            { status: 500 },
        );
    }

    return NextResponse.json({
        ratedCount: rated.count ?? 0,
        likedCount: liked.count ?? 0,
        downvotedCount: downvoted.count ?? 0,
    });
}
