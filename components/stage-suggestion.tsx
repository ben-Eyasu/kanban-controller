"use client";

import { useState } from "react";

interface StageSuggestionProps {
  projectId: string;
  currentStage: string;
  suggestion: {
    type: "pr_opened" | "pr_merged";
    targetStage: string;
    prNumber?: number;
    prTitle?: string;
  } | null;
}

export function StageSuggestionBanner({ projectId, currentStage, suggestion }: StageSuggestionProps) {
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!suggestion || dismissed) return null;

  const message =
    suggestion.type === "pr_opened"
      ? `PR #${suggestion.prNumber} opened: "${suggestion.prTitle}". Move to ${suggestion.targetStage}?`
      : `PR #${suggestion.prNumber} merged. Move to ${suggestion.targetStage}?`;

  async function acceptSuggestion() {
    setLoading(true);
    try {
      await fetch(`/api/projects/${projectId}/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId: suggestion!.targetStage }),
      });
      setDismissed(true);
    } catch {
      // TODO: show error
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-foreground">{message}</p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={acceptSuggestion}
            disabled={loading}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Moving..." : "Move"}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
