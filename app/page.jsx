"use client"; // make this a client component

import React, { useEffect, useState } from "react";
import CaptionsList from "../CaptionsList";
import { createClient } from "../utils/supabase/client";

const supabase = createClient();

export default function Home() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            const { data } = await supabase.auth.getUser();
            setUser(data.user || null);
        };
        fetchUser();
    }, []);

    return (
        <main>
            <CaptionsList user={user} />
        </main>
    );
}
