"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, useTransition } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function DebouncedSearchInput({
  value,
  placeholder,
  className,
  inputClassName,
  paramName = "q",
  debounceMs = 400,
}: {
  value: string;
  placeholder: string;
  className?: string;
  inputClassName?: string;
  paramName?: string;
  debounceMs?: number;
}) {
  return (
    <DebouncedSearchInputInner
      key={`${paramName}:${value}`}
      value={value}
      placeholder={placeholder}
      className={className}
      inputClassName={inputClassName}
      paramName={paramName}
      debounceMs={debounceMs}
    />
  );
}

function DebouncedSearchInputInner({
  value,
  placeholder,
  className,
  inputClassName,
  paramName,
  debounceMs,
}: {
  value: string;
  placeholder: string;
  className?: string;
  inputClassName?: string;
  paramName: string;
  debounceMs: number;
}) {
  const id = useId();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const paramsString = searchParams.toString();
  const currentValue = searchParams.get(paramName) ?? "";
  const [inputValue, setInputValue] = useState(value);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const updateUrl = useCallback(
    (nextValue: string) => {
      const nextParams = new URLSearchParams(paramsString);
      const normalized = nextValue.trim();

      nextParams.delete("page");
      if (normalized) nextParams.set(paramName, normalized);
      else nextParams.delete(paramName);

      const query = nextParams.toString();
      const href = query ? `${pathname}?${query}` : pathname;
      startTransition(() => router.replace(href, { scroll: false }));
    },
    [paramName, paramsString, pathname, router],
  );

  useEffect(() => {
    if (inputValue.trim() === currentValue.trim()) return;
    const timer = window.setTimeout(() => updateUrl(inputValue), debounceMs);
    return () => window.clearTimeout(timer);
  }, [currentValue, debounceMs, inputValue, updateUrl]);

  function clearSearch() {
    setInputValue("");
    updateUrl("");
    inputRef.current?.focus();
  }

  return (
    <div className={cn("relative min-w-0 flex-1 sm:w-64 sm:flex-none", className)}>
      <label htmlFor={id} className="sr-only">
        Cari
      </label>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        id={id}
        value={inputValue}
        onChange={(event) => setInputValue(event.target.value)}
        placeholder={placeholder}
        className={cn("pl-9 pr-9", inputClassName, isPending && "opacity-80")}
      />
      {inputValue && (
        <button
          type="button"
          onClick={clearSearch}
          aria-label="Hapus pencarian"
          title="Hapus pencarian"
          className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
