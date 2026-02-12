// c:\Users\amyyu\Downloads\S26 HW\humor-project-hw\app\protected\page.tsx

import CaptionsList from "@/CaptionsList";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return redirect("/login");
    }

    return (
        <div style={{ padding: "20px" }}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "20px",
                }}
            >
                <h1>Protected Content</h1>
                <div>
                    <span>Welcome, {user.email}</span>
                    <form
                        action="/auth/signout"
                        method="post"
                        style={{ display: "inline-block", marginLeft: "10px" }}
                    >
                        <button
                            type="submit"
                            style={{ padding: "5px 10px", cursor: "pointer" }}
                        >
                            Sign out
                        </button>
                    </form>
                </div>
            </div>
            <CaptionsList />
        </div>
    );
}
