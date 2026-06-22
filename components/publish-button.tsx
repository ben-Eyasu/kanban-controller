"use client";

import { useState } from "react";

interface PublishButtonProps {
  projectId: string;
  projectName: string;
}

export function PublishButton({ projectId, projectName }: PublishButtonProps) {
  const [loading, setLoading] = useState(false);
  const [published, setPublished] = useState(false);

  async function handlePublish() {
    setLoading(true);
    try {
      const res = await fetch("/api/portfolio/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Failed to publish");
        return;
      }
      setPublished(true);
    } catch (err: any) {
      alert(err.message ?? "Failed to publish");
    } finally {
      setLoading(false);
    }
  }

  if (published) {
    return (
      <span className="rounded-md bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-500">
        Published
      </span>
    );
  }

  return (
    <button
      onClick={handlePublish}
      disabled={loading}
      className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
    >
      {loading ? "Publishing..." : "Publish"}
    </button>
  );
}
