'use client';

import React, { useEffect, useId, useRef } from 'react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

/**
 * Modal dialog built on the native <dialog> element, which provides focus
 * trapping, Escape to close and the dialog role for screen readers.
 */
export function Dialog({ open, onClose, title, description, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // Click on the backdrop (outside the panel) closes the dialog
        if (e.target === ref.current) onClose();
      }}
      className="w-[calc(100%-2rem)] max-w-sm m-auto p-0 rounded-3xl bg-transparent backdrop:bg-slate-950/70 backdrop:backdrop-blur-xs"
    >
      <div className="bg-white rounded-3xl p-5 shadow-2xl border border-slate-200">
        <h2 id={titleId} className="text-base font-extrabold text-slate-900 mb-1">
          {title}
        </h2>
        {description && (
          <p id={descriptionId} className="text-xs text-slate-500 mb-4">
            {description}
          </p>
        )}
        {open && children}
      </div>
    </dialog>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Accessible replacement for window.confirm() */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Keep',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel} title={title} description={description}>
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`flex-1 py-2.5 rounded-xl text-white text-xs font-bold ${
            destructive ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
