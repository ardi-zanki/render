"use client";

import { ImageIcon, Loader2, Plus, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { RenderImage } from "@/components/app/render-image";
import { Modal } from "@/components/ui/modal";
import { apiErrorMessage, apiJson } from "@/lib/client-api";
import { cn } from "@/lib/utils";

type SearchRenderItem = {
  id: string;
  title: string;
  mode: string;
  projectName: string | null;
  createdAt: string;
  thumbnailUrl: string | null;
};

type SearchResponse = {
  items: SearchRenderItem[];
};

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function GlobalSearchCommand({
  expanded,
  onNavigate,
}: {
  expanded: boolean;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SearchRenderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        if (query.trim()) params.set("q", query.trim());
        const result = await apiJson<SearchResponse>(
          `/api/renders/search${params.toString() ? `?${params}` : ""}`,
          { signal: controller.signal },
        );
        setItems(result.items);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(apiErrorMessage(err, "Gagal memuat render"));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, query.trim() ? 300 : 0);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [open, query]);

  function close() {
    setOpen(false);
    setQuery("");
    setError("");
  }

  function goTo(href: string) {
    close();
    onNavigate?.();
    router.push(href);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={!expanded ? "Cari render" : undefined}
        className="group relative grid w-full grid-cols-[40px_minmax(0,1fr)] items-center rounded-md py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
      >
        <Search className="mx-auto size-4 shrink-0" />
        <span
          className={cn(
            "block min-w-0 truncate text-left transition-[opacity,transform] duration-150 ease-out",
            expanded
              ? "translate-x-0 opacity-100"
              : "pointer-events-none w-0 -translate-x-1 overflow-hidden opacity-0",
          )}
        >
          Cari render
        </span>
        {!expanded && (
          <span className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background shadow-elevated group-hover:block">
            Cari render
          </span>
        )}
      </button>

      {open && (
        <Modal
          onClose={close}
          label="Cari render"
          panelClassName="w-full max-w-xl overflow-hidden rounded-lg border border-border bg-card shadow-dialog"
          containerClassName="items-start pt-[12vh]"
        >
          <div className="flex h-14 items-center gap-3 border-b border-border px-4">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari render..."
              className="h-full min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
            />
            <button
              type="button"
              onClick={close}
              aria-label="Tutup pencarian"
              title="Tutup"
              className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="max-h-[min(560px,70vh)] overflow-y-auto p-2">
            <button
              type="button"
              onClick={() => goTo("/renders/new")}
              className="grid w-full grid-cols-[36px_minmax(0,1fr)] items-center rounded-md px-2 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted/80"
            >
              <span className="flex size-8 items-center justify-center rounded-md bg-accent text-primary">
                <Plus className="size-4" />
              </span>
              <span>Buat Render</span>
            </button>

            {!query.trim() && !loading && items.length > 0 && (
              <p className="px-2 pb-1 pt-3 text-xs font-semibold text-muted-foreground">
                Render terbaru
              </p>
            )}

            {loading ? (
              <div className="flex items-center gap-2 px-3 py-8 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Memuat render...
              </div>
            ) : error ? (
              <p className="px-3 py-8 text-sm text-destructive">{error}</p>
            ) : items.length === 0 ? (
              <div className="flex items-center gap-2 px-3 py-8 text-sm text-muted-foreground">
                <Search className="size-4" />
                {query.trim() ? "Render tidak ditemukan" : "Belum ada render"}
              </div>
            ) : (
              <div className="space-y-1">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goTo(`/renders/${item.id}`)}
                    className="grid w-full grid-cols-[44px_minmax(0,1fr)] items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted/80"
                  >
                    <span className="flex aspect-square size-11 items-center justify-center overflow-hidden rounded-md bg-muted text-muted-foreground">
                      {item.thumbnailUrl ? (
                        <RenderImage
                          src={item.thumbnailUrl}
                          alt={item.title}
                          className="size-full"
                        />
                      ) : (
                        <ImageIcon className="size-4" />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-foreground">
                        {item.title}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {item.projectName ? `${item.projectName} · ` : ""}
                        {item.mode} · {dateFmt.format(new Date(item.createdAt))}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
