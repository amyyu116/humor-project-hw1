"use client";

import { useState } from "react";
import { Rss, Upload } from "lucide-react";
import CaptionsList from "../CaptionsList";
import ImageUpload from "./image-upload";

export default function HomeTabs({ user }: { user: any }) {
    const [activeTab, setActiveTab] = useState<"upload" | "feed">("upload");

    const getTabStyle = (isActive: boolean) => ({
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 16px",
        cursor: "pointer",
        backgroundColor: isActive ? "white" : "transparent",
        border: "none",
        borderRadius: "6px",
        boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
        color: isActive ? "#0f172a" : "#64748b",
        fontWeight: "500",
        fontSize: "14px",
        transition: "all 0.2s ease",
    });

    return (
        <div>
            <div
                style={{
                    display: "inline-flex",
                    backgroundColor: "#f1f5f9",
                    padding: "4px",
                    borderRadius: "8px",
                    marginBottom: "24px",
                }}
            >
                <button
                    onClick={() => setActiveTab("feed")}
                    style={getTabStyle(activeTab === "feed")}
                >
                    <Rss size={18} />
                    Feed
                </button>
                <button
                    onClick={() => setActiveTab("upload")}
                    style={getTabStyle(activeTab === "upload")}
                >
                    <Upload size={18} />
                    Upload
                </button>
            </div>

            {activeTab === "upload" ? (
                <div style={{ marginBottom: "20px" }}>
                    <ImageUpload />
                </div>
            ) : (
                <CaptionsList user={user} />
            )}
        </div>
    );
}
