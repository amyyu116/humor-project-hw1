"use client";

import { useState } from "react";
import { Upload, Loader2, CheckCircle2, ImageIcon } from "lucide-react";

export default function ImageUpload() {
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<string>("");
    const [imageId, setImageId] = useState<string | null>(null);
    const [captions, setCaptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);

        setStatus("Getting presigned URL...");
        setImageId(null);
        setCaptions([]);

        try {
            const response = await fetch("/image/url", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contentType: file.type }),
            });

            if (!response.ok) {
                throw new Error(
                    `Failed to get presigned URL: ${response.status}`,
                );
            }

            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("text/html")) {
                throw new Error(
                    "Received HTML response. You may need to log in again.",
                );
            }

            const { presignedUrl, cdnUrl } = await response.json();

            setStatus("Uploading to S3...");

            const uploadResponse = await fetch(presignedUrl, {
                method: "PUT",
                headers: { "Content-Type": file.type },
                body: file,
            });

            if (!uploadResponse.ok) {
                throw new Error("Failed to upload to S3");
            }

            setStatus("Registering image...");

            const registerResponse = await fetch("/image/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageUrl: cdnUrl }),
            });

            if (!registerResponse.ok) {
                throw new Error("Failed to register image");
            }

            const { imageId } = await registerResponse.json();
            setImageId(imageId);

            setStatus("Generating captions...");

            const captionResponse = await fetch("/image/caption", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageId }),
            });

            if (!captionResponse.ok) {
                throw new Error("Failed to generate captions");
            }

            const captionsData = await captionResponse.json();
            setCaptions(captionsData);

            setStatus("Process complete!");
        } catch (e) {
            console.error(e);
            setStatus("Upload failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="upload-card">
            <div className="upload-header">
                <div className="upload-title">
                    <ImageIcon size={18} />
                    <h2>Upload Image</h2>
                </div>
                <p className="upload-subtitle">
                    Add a photo to generate captions and rank them.
                </p>
            </div>

            <label className="upload-dropzone">
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="upload-input"
                />
                <div className="upload-dropzone-inner">
                    <div className="upload-dropzone-icon">
                        <ImageIcon size={20} />
                    </div>
                    <div className="upload-dropzone-text">
                        <span className="upload-filename">
                            {file ? file.name : "Choose an image"}
                        </span>
                        <span className="upload-hint">
                            PNG, JPG, or WEBP up to 10MB
                        </span>
                    </div>
                </div>
            </label>

            <button
                onClick={handleUpload}
                disabled={!file || loading}
                className="upload-button"
            >
                {loading ? (
                    <>
                        <Loader2 size={16} className="upload-spin" />
                        Uploading...
                    </>
                ) : (
                    <>
                        <Upload size={16} />
                        Upload
                    </>
                )}
            </button>

            <p className="upload-status">
                {status && <CheckCircle2 size={14} />}
                {status || " "}
            </p>

            {imageId && <p className="upload-meta">Image ID: {imageId}</p>}

            {captions.length > 0 && (
                <div className="upload-captions">
                    <h3>Generated Captions</h3>
                    <ul>
                        {captions.map((caption, i) => (
                            <li key={i}>
                                {typeof caption === "object" && caption?.content
                                    ? caption.content
                                    : typeof caption === "object"
                                      ? JSON.stringify(caption)
                                      : caption}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
