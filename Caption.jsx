"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { ThumbsUp, ThumbsDown } from "lucide-react";

const supabase = createClient();

const Caption = ({ caption, user, onVoted }) => {
    const [userVote, setUserVote] = useState(0); // 1 = upvote, -1 = downvote, 0 = none
    const [likes, setLikes] = useState(caption.like_count);
    const [loading, setLoading] = useState(false);
    const [voteResolved, setVoteResolved] = useState(!user);
    const [voteLocked, setVoteLocked] = useState(false);

    useEffect(() => {
        // Fetch if this user has voted on this caption already
        const fetchUserVote = async () => {
            if (!user) {
                setUserVote(0);
                setVoteLocked(false);
                setVoteResolved(true);
                return;
            }

            setVoteResolved(false);
            const { data, error } = await supabase
                .from("caption_votes")
                .select("vote_value")
                .eq("caption_id", caption.id)
                .eq("profile_id", user.id)
                .single();

            if (!error && data) {
                setUserVote(data.vote_value);
                setVoteLocked(true);
            } else {
                setUserVote(0);
                setVoteLocked(false);
            }
            setVoteResolved(true);
        };
        fetchUserVote();
    }, [user, caption.id]);

    const submitVote = async (voteValue) => {
        if (voteLocked) return;

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
                    created_by_user_id: currentUser.id,
                    modified_by_user_id: currentUser.id,
                },
                { onConflict: "profile_id, caption_id" },
            );

            if (error) throw error;

            const delta = voteValue - userVote;
            setLikes((prev) => prev + delta);
            setUserVote(voteValue);
            setVoteLocked(true);
            if (onVoted) {
                onVoted(caption.id, voteValue);
            }
            if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("caption-voted"));
            }
        } catch (err) {
            console.error("Vote error:", JSON.stringify(err, null, 2));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="caption-stack">
            <div className="caption-card">
                <div className="caption-media">
                    <img
                        src={caption.image.url}
                        alt="caption"
                        className="caption-image"
                    />
                    {caption.is_featured && (
                        <span className="caption-badge">Featured</span>
                    )}
                </div>
                <p className="caption-text">
                    {caption.content || "No content"}
                </p>
            </div>

            <div className="caption-actions">
                <button
                    onClick={() => submitVote(1)}
                    disabled={loading || !voteResolved || voteLocked}
                    className="vote-button"
                    aria-label="Upvote caption"
                >
                    <ThumbsUp
                        size={30}
                        color={userVote === 1 ? "#1f6d52" : "#2f9d76"}
                        fill={userVote === 1 ? "#1f6d52" : "none"}
                    />
                </button>

                <button
                    onClick={() => submitVote(-1)}
                    disabled={loading || !voteResolved || voteLocked}
                    className="vote-button"
                    aria-label="Downvote caption"
                >
                    <ThumbsDown
                        size={30}
                        color={userVote === -1 ? "#b23a2f" : "#e06055"}
                        fill={userVote === -1 ? "#b23a2f" : "none"}
                    />
                </button>
            </div>
        </div>
    );
};

export default Caption;
