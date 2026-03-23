// c:\Users\amyyu\Downloads\S26 HW\humor-project-hw\app\page.tsx

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return redirect("/login");
    }

    return redirect("/feed");
}
