import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import AppTabs from "@/app/app-tabs";
import UserMenu from "./user-menu";

export default async function AppLayout({
    children,
}: {
    children: ReactNode;
}) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return redirect("/login");
    }

    return (
        <div className="app-shell">
            <header className="app-header">
                <div>
                    <p className="app-eyebrow">Humor Studies Project</p>
                    <h1 className="app-title">Caption Studio</h1>
                    <p className="app-subtitle">
                        Upload images, generate captions, and vote on the best
                        ones.
                    </p>
                </div>
                <div className="app-user">
                    <UserMenu email={user.email ?? "Account"} />
                </div>
            </header>
            <AppTabs />
            <main className="app-content">{children}</main>
        </div>
    );
}
