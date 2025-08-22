"use client";

import { useEffect } from "react";

export default function AuthErrorModal({
  open,
  title = "로그인 오류",
  message,
  onClose,
}: {
  open: boolean;
  title?: string;
  message: string;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#0b0b0b] p-5 text-white shadow-2xl"
      >
        <h2 className="mb-2 text-lg font-semibold">{title}</h2>
        <p className="mb-4 text-sm text-white/80">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-white/15 px-3 py-1.5 text-sm hover:bg-white/5"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
