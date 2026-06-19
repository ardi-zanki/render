"use client";

import Image from "next/image";
import { useRef, useState } from "react";

export function BeforeAfterSlider() {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(50);
  const [dragging, setDragging] = useState(false);

  function updateFromClientX(clientX: number) {
    const rect = sliderRef.current?.getBoundingClientRect();
    if (!rect) return;

    const next = ((clientX - rect.left) / rect.width) * 100;
    setValue(Math.min(85, Math.max(15, Math.round(next))));
  }

  return (
    <div
      ref={sliderRef}
      role="slider"
      tabIndex={0}
      aria-label="Geser perbandingan hasil dan gambar asli"
      aria-valuemin={15}
      aria-valuemax={85}
      aria-valuenow={value}
      className="relative aspect-[16/9] cursor-ew-resize touch-none overflow-hidden rounded-lg border border-border/70 bg-card outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
      onPointerDown={(event) => {
        setDragging(true);
        event.currentTarget.setPointerCapture(event.pointerId);
        updateFromClientX(event.clientX);
      }}
      onPointerMove={(event) => {
        if (dragging) updateFromClientX(event.clientX);
      }}
      onPointerUp={(event) => {
        setDragging(false);
        event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={() => setDragging(false)}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          setValue((current) => Math.max(15, current - 2));
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          setValue((current) => Math.min(85, current + 2));
        }
      }}
    >
      <Image
        src="/marketing/renderai-bedroom-original.png"
        alt="Gambar asli sebelum render"
        fill
        priority
        sizes="(min-width: 1024px) 780px, 100vw"
        className="size-full object-cover"
      />
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - value}% 0 0)` }}
      >
        <Image
          src="/marketing/renderai-bedroom.png"
          alt="Hasil render AI"
          fill
          priority
          sizes="(min-width: 1024px) 780px, 100vw"
          className="size-full object-cover"
        />
      </div>

      <div
        className="pointer-events-none absolute inset-y-0 w-px bg-card"
        style={{ left: `${value}%` }}
      />
      <div
        className="pointer-events-none absolute top-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border/80 bg-card text-xs font-semibold text-foreground shadow-floating"
        style={{ left: `${value}%` }}
        aria-hidden
      >
        ||
      </div>

      <div className="absolute left-3 top-3 rounded-md bg-card/90 px-2.5 py-1 text-xs font-semibold text-foreground shadow-hairline">
        Hasil
      </div>
      <div className="absolute right-3 top-3 rounded-md bg-card/90 px-2.5 py-1 text-xs font-semibold text-foreground shadow-hairline">
        Asli
      </div>

      <div className="pointer-events-none absolute inset-x-4 bottom-4 h-1 rounded-full bg-card/75">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
