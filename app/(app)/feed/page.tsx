import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import CaptionsList from "@/CaptionsList";

export default async function FeedPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return redirect("/login");
    }

    return (
        <section className="panel">
            <CaptionsList user={user} />
        </section>
    );
}
