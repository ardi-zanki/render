"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Popover } from "@/components/ui/popover";

/**
 * Studio header: "Render Studio | {name} ▼". The ▼ menu offers Rename, which
 * turns the name into an inline input (text pre-selected); Enter saves.
 */
export function StudioTitleBar({
  name,
  onSave,
}: {
  name: string;
  onSave: (name: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function startRename() {
    setMenuOpen(false);
    setValue(name);
    setEditing(true);
  }

  function commit() {
    const next = value.trim();
    setEditing(false);
    if (next && next !== name) onSave(next);
    else setValue(name);
  }

  return (
    <div className="hidden items-center gap-2 lg:flex">
      <Link
        href="/dashboard"
        title="Kembali ke Dashboard"
        className="shrink-0 rounded-sm text-sm font-semibold tracking-normal text-foreground transition-colors hover:text-primary"
      >
        Render Studio
      </Link>
      <span className="text-border" aria-hidden="true">
        |
      </span>
      {editing ? (
        <input
          ref={inputRef}
          value={value}
          maxLength={80}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setValue(name);
              setEditing(false);
            }
          }}
          className="min-w-32 rounded-md border border-primary/45 bg-card px-2 py-0.5 text-sm font-semibold text-foreground outline-none ring-2 ring-ring/20"
        />
      ) : (
        <>
          <span
            onDoubleClick={startRename}
            title="Double click untuk rename"
            className="cursor-text truncate rounded-sm text-sm font-semibold text-foreground"
          >
            {name}
          </span>
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Opsi render"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronDown className="size-4" />
          </button>
        </>
      )}

      <Popover
        anchorRef={triggerRef}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        width={160}
        align="start"
        className="rounded-lg border border-border/80 bg-popover p-1 shadow-elevated"
      >
        <button
          type="button"
          onClick={startRename}
          className="flex w-full cursor-pointer items-center rounded-md px-2.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/80"
        >
          Rename
        </button>
      </Popover>
    </div>
  );
}
