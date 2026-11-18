"use client";

import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import { knowledgeApi } from "@/lib/api/knowledge";
import { CheckCircle2, Sparkles, AlertCircle } from "lucide-react";

export default function KnowledgeGapsModal({ gap, isOpen, onClose, onResolved }) {
  const [answer, setAnswer] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  if (!gap) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!answer.trim()) return;

    setIsSaving(true);
    setError("");
    try {
      await knowledgeApi.resolveKnowledgeGap(gap.id, answer.trim());
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setAnswer("");
        onResolved?.(gap.id);
        onClose?.();
      }, 900);
    } catch (err) {
      setError(err.message || "Failed to save answer. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Resolve Knowledge Gap"
      description={`Asked ${gap.askedCount || 1} times by visitors without a verified match.`}
    >
      {success ? (
        <div className="py-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="font-semibold text-sm text-[var(--text-primary)]">
            Knowledge updated
          </h4>
          <p className="text-xs text-[var(--text-muted)]">
            Answer indexed into the knowledge base. Your chatbot can now respond accurately.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {error && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/12 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-500/12 border border-amber-200 dark:border-amber-500/25">
            <span className="font-semibold text-amber-800 dark:text-amber-300 block mb-0.5">
              Unanswered Visitor Query
            </span>
            <p className="text-[var(--text-primary)] font-medium">
              &ldquo;{gap.question}&rdquo;
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Verified Official Answer
            </label>
            <textarea
              rows={4}
              required
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Write the authoritative answer visitors should receive..."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--focus-ring)]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="h-9 px-4 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSaving ? "Syncing..." : "Save & Index Answer"}</span>
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
