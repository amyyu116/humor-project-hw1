"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Stats = {
    ratedCount: number;
    likedCount: number;
    downvotedCount: number;
};

export default function UserMenu({ email }: { email: string }) {
    const [open, setOpen] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const loadStats = async (force = false) => {
        if (!force && (stats || loading)) return;
        setLoading(true);
        try {
            const response = await fetch("/api/user-stats");
            if (!response.ok) throw new Error("Failed to load stats");
            const data = await response.json();
            setStats(data);
        } catch (err) {
            console.error(err);
            setStats({ ratedCount: 0, likedCount: 0, downvotedCount: 0 });
        } finally {
            setLoading(false);
        }
    };

    const openStats = async () => {
        setShowStats(true);
        await loadStats(true);
        setOpen(false);
    };

    useEffect(() => {
        const handleVoted = () => {
            setStats(null);
            if (showStats) {
                loadStats(true);
            }
        };

        window.addEventListener("caption-voted", handleVoted);
        return () => window.removeEventListener("caption-voted", handleVoted);
    }, [showStats]);

    return (
        <div className="user-menu" ref={menuRef}>
            <button
                type="button"
                className="user-button"
                onClick={() => setOpen((prev) => !prev)}
                aria-expanded={open}
                aria-haspopup="menu"
            >
                <span className="user-email">{email}</span>
                <span className="user-caret" aria-hidden="true">
                    ▾
                </span>
            </button>

            {open && (
                <div className="user-dropdown" role="menu">
                    <button
                        type="button"
                        className="user-menu-item"
                        role="menuitem"
                        onClick={openStats}
                    >
                        Show me my stats
                    </button>
                    <form action="/auth/signout" method="post">
                        <button
                            type="submit"
                            className="user-menu-item danger"
                            role="menuitem"
                        >
                            Sign out
                        </button>
                    </form>
                </div>
            )}

            {showStats &&
                mounted &&
                createPortal(
                    <div
                        className="modal-backdrop"
                        onClick={() => setShowStats(false)}
                    >
                        <div
                            className="modal"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h3>My Stats</h3>
                                <button
                                    className="modal-close"
                                    onClick={() => setShowStats(false)}
                                    aria-label="Close stats"
                                >
                                    ×
                                </button>
                            </div>
                            <div className="modal-body">
                                {loading && !stats ? (
                                    <p>Loading...</p>
                                ) : (
                                    <ul className="stats-list">
                                        <li>
                                            Captions rated:{" "}
                                            <strong>
                                                {stats?.ratedCount ?? 0}
                                            </strong>
                                        </li>
                                        <li>
                                            Captions liked:{" "}
                                            <strong>
                                                {stats?.likedCount ?? 0}
                                            </strong>
                                        </li>
                                        <li>
                                            Captions downvoted:{" "}
                                            <strong>
                                                {stats?.downvotedCount ?? 0}
                                            </strong>
                                        </li>
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>,
                    document.body,
                )}
        </div>
    );
}
