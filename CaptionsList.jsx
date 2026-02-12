"use client";
import React, { useEffect, useState } from "react";

// Initialize Supabase client
// TODO: Replace with your actual Supabase URL and Anon Key
import { createClient } from "./utils/supabase/client";
const supabase = createClient();

const CaptionsList = () => {
    const [captions, setCaptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCaptions = async () => {
            try {
                if (!supabase) {
                    throw new Error("Supabase URL or Anon Key is missing.");
                }

                // Fetch rows from the 'captions' table
                const { data, error } = await supabase
                    .from("captions")
                    .select("*");

                if (error) throw error;
                setCaptions(data);
            } catch (err) {
                console.error("Error fetching data:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCaptions();
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
                {captions.map((caption) => (
                    <div
                        key={caption.id}
                        className="caption-card"
                        style={{
                            border: "1px solid #ddd",
                            padding: "1rem",
                            borderRadius: "8px",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        }}
                    >
                        <p style={{ marginBottom: "0.5rem" }}>
                            {caption.content || "No content"}
                        </p>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                fontSize: "0.9rem",
                                color: "#555",
                            }}
                        >
                            <span>Likes: {caption.like_count}</span>
                            {caption.is_featured && (
                                <span
                                    style={{
                                        fontWeight: "bold",
                                        color: "gold",
                                    }}
                                >
                                    Featured
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CaptionsList;
