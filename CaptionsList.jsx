"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "./utils/supabase/client";
import Caption from "./Caption";
const supabase = createClient();

const CaptionsList = ({ user }) => {
    const [captions, setCaptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCaptionsAndImages = async () => {
            try {
                if (!supabase)
                    throw new Error("Supabase client not initialized.");

                // 1️⃣ Fetch all captions
                const { data: captionsData, error: captionsError } =
                    await supabase
                        .from("captions")
                        .select(
                            "id, content, like_count, is_featured, image_id",
                        )
                        .order("like_count", { ascending: false });

                if (captionsError) throw captionsError;

                // 2️⃣ Collect image_ids
                const imageIds = captionsData
                    .map((c) => c.image_id)
                    .filter((id) => id != null);

                let imagesMap = {};
                if (imageIds.length > 0) {
                    // 3️⃣ Fetch images separately
                    const { data: imagesData, error: imagesError } =
                        await supabase
                            .from("images")
                            .select("id, url")
                            .in("id", imageIds);

                    if (imagesError) throw imagesError;

                    // 4️⃣ Convert to map for easy lookup
                    imagesMap = Object.fromEntries(
                        imagesData.map((img) => [img.id, img]),
                    );
                }

                // 5️⃣ Merge images into captions
                const merged = captionsData.map((c) => ({
                    ...c,
                    image: c.image_id ? imagesMap[c.image_id] : null,
                }));

                setCaptions(merged);
            } catch (err) {
                console.error("Error fetching data:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCaptionsAndImages();
    }, []);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="captions-container" style={{ padding: "2rem" }}>
            <h2>Captions List</h2>
            <div
                className="captions-grid"
                style={{
                    display: "grid",
                    gap: "1rem",
                    gridTemplateColumns:
                        "repeat(auto-fill, minmax(300px, 1fr))",
                }}
            >
                {captions
                    .filter((caption) => caption.image?.url) // Only captions with images
                    .map((caption) => (
                        <Caption
                            key={caption.id}
                            caption={caption}
                            user={user}
                        />
                    ))}
            </div>
        </div>
    );
};

export default CaptionsList;
