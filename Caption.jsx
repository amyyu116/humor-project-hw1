"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { ThumbsUp, ThumbsDown } from "lucide-react";

const supabase = createClient();

const Caption = ({ caption, user }) => {
    const [userVote, setUserVote] = useState(0); // 1 = upvote, -1 = downvote, 0 = none
    const [likes, setLikes] = useState(caption.like_count);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Fetch if this user has voted on this caption already
        const fetchUserVote = async () => {
            if (!user) return;
            const { data, error } = await supabase
                .from("caption_votes")
                .select("vote_value")
                .eq("caption_id", caption.id)
                .eq("profile_id", user.id)
                .single();

            console.log(user);
            console.log(caption);
            console.log(data);

            if (!error && data) {
                setUserVote(data.vote_value);
            }
        };
        fetchUserVote();
    }, [user, caption.id]);

    const submitVote = async (voteValue) => {
        const {
            data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (!currentUser) {
            alert("You must be logged in to vote.");
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.from("caption_votes").upsert(
                {
                    profile_id: currentUser.id,
                    caption_id: caption.id,
                    vote_value: voteValue,
                    modified_datetime_utc: new Date().toISOString(),
                    created_datetime_utc: new Date().toISOString(),
                },
                { onConflict: "profile_id, caption_id" },
            );

            if (error) throw error;

            const delta = voteValue - userVote;
            setLikes((prev) => prev + delta);
            setUserVote(voteValue);
        } catch (err) {
            console.error("Vote error:", JSON.stringify(err, null, 2));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="caption-card"
            style={{
                border: "1px solid #ddd",
                padding: "1rem",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
        >
            <img
                src={caption.image.url}
                alt="caption"
                style={{
                    width: "100%",
                    borderRadius: "8px",
                    marginBottom: "0.5rem",
                }}
            />
            <p style={{ marginBottom: "0.5rem" }}>
                {caption.content || "No content"}
            </p>

            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.9rem",
                    color: "#555",
                    alignItems: "center",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                    }}
                >
                    <button
                        onClick={() => submitVote(1)}
                        disabled={loading || userVote === 1}
                        style={{
                            cursor: "pointer",
                            border: "none",
                            background: "transparent",
                            padding: 0,
                        }}
                    >
                        <ThumbsUp
                            size={20}
                            color={userVote === 1 ? "#2E7D32" : "#4CAF50"}
                            fill={userVote === 1 ? "#2E7D32" : "none"}
                        />
                    </button>
                    <span>{likes}</span>

                    <button
                        onClick={() => submitVote(-1)}
                        disabled={loading || userVote === -1}
                        style={{
                            cursor: "pointer",
                            border: "none",
                            background: "transparent",
                            padding: 0,
                        }}
                    >
                        <ThumbsDown
                            size={20}
                            color={userVote === -1 ? "#C62828" : "#F44336"}
                            fill={userVote === -1 ? "#C62828" : "none"}
                        />
                    </button>
                </div>
                {caption.is_featured && (
                    <span style={{ fontWeight: "bold", color: "gold" }}>
                        Featured
                    </span>
                )}
            </div>
        </div>
    );
};

export default Caption;
