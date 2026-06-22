"use client";

import { useState } from "react";

interface StartProjectButtonProps {
  projectId: string;
  hasRepo: boolean;
  hasTemplate: boolean;
}

export function StartProjectButton({ projectId, hasRepo, hasTemplate }: StartProjectButtonProps) {
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);

  if (hasRepo || !hasTemplate) return null;

  async function handleStart() {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/start`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Failed to start project");
        return;
      }
      setStarted(true);
      window.location.reload();
    } catch (err: any) {
      alert(err.message ?? "Failed to start project");
    } finally {
      setLoading(false);
    }
  }

  if (started) return null;

  return (
    <button
      onClick={handleStart}
      disabled={loading}
      className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
    >
      {loading ? "Starting..." : "Start Project"}
    </button>
  );
}
