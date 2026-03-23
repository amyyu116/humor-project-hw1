"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "./utils/supabase/client";
import Caption from "./Caption";
const supabase = createClient();

const CaptionsList = ({ user }) => {
    const [captions, setCaptions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [offset, setOffset] = useState(0);
    const seenIdsRef = React.useRef(new Set());

    const batchSize = 20;
    const lowThreshold = 5;

    const fetchBatch = async (nextOffset) => {
        if (!supabase) throw new Error("Supabase client not initialized.");

        const { data: captionsData, error: captionsError } = await supabase
            .from("captions")
            .select("id, content, like_count, is_featured, image_id")
            .eq("is_public", true)
            .order("like_count", { ascending: false })
            .range(nextOffset, nextOffset + batchSize - 1);

        if (captionsError) throw captionsError;

        const captionIds = (captionsData || []).map((c) => c.id);

        let votedCaptionIds = new Set();
        if (user?.id && captionIds.length > 0) {
            const { data: votesData, error: votesError } = await supabase
                .from("caption_votes")
                .select("caption_id")
                .eq("profile_id", user.id)
                .in("caption_id", captionIds);

            if (votesError) throw votesError;
            votedCaptionIds = new Set(
                (votesData || []).map((v) => v.caption_id),
            );
        }

        const unrankedCaptions = (captionsData || []).filter(
            (c) => !votedCaptionIds.has(c.id) && !seenIdsRef.current.has(c.id),
        );

        const imageIds = unrankedCaptions
            .map((c) => c.image_id)
            .filter((id) => id != null);

        let imagesMap = {};
        if (imageIds.length > 0) {
            const { data: imagesData, error: imagesError } = await supabase
                .from("images")
                .select("id, url")
                .eq("is_public", true)
                .in("id", imageIds);

            if (imagesError) throw imagesError;

            imagesMap = Object.fromEntries(
                imagesData.map((img) => [img.id, img]),
            );
        }

        const merged = unrankedCaptions
            .map((c) => ({
                ...c,
                image: c.image_id ? imagesMap[c.image_id] : null,
            }))
            .filter((c) => c.image);

        merged.forEach((c) => seenIdsRef.current.add(c.id));

        return { merged, nextOffset: nextOffset + batchSize };
    };

    const fetchUntilFound = async (startOffset, { append } = { append: false }) => {
        let next = startOffset;
        let attempts = 0;
        let collected = [];

        while (attempts < 5 && collected.length === 0) {
            const { merged, nextOffset } = await fetchBatch(next);
            collected = merged;
            next = nextOffset;
            attempts += 1;
        }

        setCaptions((prev) => (append ? [...prev, ...collected] : collected));
        setOffset(next);
    };

    useEffect(() => {
        let cancelled = false;
        const run = async () => {
            try {
                setLoading(true);
                if (cancelled) return;
                await fetchUntilFound(0, { append: false });
                if (!cancelled) setCurrentIndex(0);
            } catch (err) {
                console.error("Error fetching data:", err);
                setError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        seenIdsRef.current = new Set();
        setOffset(0);
        run();
        return () => {
            cancelled = true;
        };
    }, [user?.id]);

    const handleVoted = (captionId) => {
        setCaptions((prev) => prev.filter((c) => c.id !== captionId));
        setCurrentIndex(0);
    };

    useEffect(() => {
        if (loadingMore) return;
        if (captions.length > 0 && captions.length <= lowThreshold) {
            const run = async () => {
                try {
                    setLoadingMore(true);
                    await fetchUntilFound(offset, { append: true });
                } catch (err) {
                    console.error("Error fetching more captions:", err);
                } finally {
                    setLoadingMore(false);
                }
            };
            run();
        }
    }, [captions.length, offset, loadingMore]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    if (captions.length === 0)
        return <div>No more captions to rank.</div>;

    const currentCaption = captions[currentIndex];
    if (!currentCaption?.image?.url)
        return <div>No more captions to rank.</div>;

    return (
        <Caption
            key={currentCaption.id}
            caption={currentCaption}
            user={user}
            onVoted={handleVoted}
        />
    );
};

export default CaptionsList;
