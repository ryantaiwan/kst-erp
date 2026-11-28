"use client";

import { useState } from "react";
import { X } from "lucide-react";

/** 通用的編輯彈窗外框 */
export function EditModal({
  title, onClose, children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#5538d6]">{title}</h3>
          <button onClick={onClose} aria-label="關閉" className="rounded p-1 text-[#9b96b0] hover:bg-[#fbfaff]">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
