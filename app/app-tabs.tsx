"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Rss, Upload } from "lucide-react";

const tabs = [
    { href: "/feed", label: "Rank Captions", Icon: Rss },

    { href: "/upload", label: "Upload Your Own Image", Icon: Upload },
];

export default function AppTabs() {
    const pathname = usePathname();

    return (
        <nav className="tab-bar" aria-label="Primary">
            {tabs.map(({ href, label, Icon }) => {
                const isActive = pathname === href;

                return (
                    <Link
                        key={href}
                        href={href}
                        className={`tab-link${isActive ? " active" : ""}`}
                        aria-current={isActive ? "page" : undefined}
                    >
                        <Icon size={16} />
                        <span>{label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
