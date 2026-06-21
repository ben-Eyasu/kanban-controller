"use client";

import { useState } from "react";

interface IssueMirroringToggleProps {
  projectId: string;
  enabled: boolean;
}

export function IssueMirroringToggle({ projectId, enabled: initialEnabled }: IssueMirroringToggleProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      await fetch(`/api/projects/${projectId}/issue-mirroring`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !enabled }),
      });
      setEnabled(!enabled);
    } catch {
      // TODO: show error
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
      <div>
        <h3 className="text-sm font-medium text-foreground">Mirror GitHub Issues as Tasks</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Automatically create tasks from GitHub Issues. Closing an issue checks off the task.
        </p>
      </div>
      <button
        onClick={toggle}
        disabled={loading}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? "bg-primary" : "bg-muted"
        } disabled:opacity-50`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
