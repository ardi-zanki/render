"use client";

import { PanelLeft, Plus } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { ChoiceCard } from "@/components/ui/choice-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ToggleRow } from "@/components/ui/toggle-row";
import type { RenderMode, RenderOutputFormat } from "@/db/schema";
import {
  MODES,
  OUTPUT_FORMATS,
  STYLE_OPTIONS,
  SURROUNDINGS,
  TIMES,
  WEATHERS,
} from "./constants";
import { ChipGroup } from "./chip-group";
import type { RenderStudioProject } from "./types";

function ControlSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-border/70 pb-5 last:border-b-0 last:pb-0">
      <div className="mb-3 flex items-center">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      <div className="flex flex-col gap-3.5">{children}</div>
    </section>
  );
}

export function RenderStudioControls({
  projectId,
  projects,
  mode,
  setMode,
  style,
  setStyle,
  outputFormat,
  setOutputFormat,
  location,
  setLocation,
  surrounding,
  setSurrounding,
  lightsOn,
  setLightsOn,
  time,
  setTime,
  weather,
  setWeather,
  onSwitchProject,
  onCreateProject,
  onCollapse,
  footer,
}: {
  projectId: string;
  projects: RenderStudioProject[];
  mode: RenderMode;
  setMode: (mode: RenderMode) => void;
  style: string;
  setStyle: (style: string) => void;
  outputFormat: RenderOutputFormat;
  setOutputFormat: (format: RenderOutputFormat) => void;
  location: string;
  setLocation: (location: string) => void;
  surrounding: string;
  setSurrounding: (surrounding: string) => void;
  lightsOn: boolean;
  setLightsOn: (updater: (value: boolean) => boolean) => void;
  time: string;
  setTime: (time: string) => void;
  weather: string;
  setWeather: (weather: string) => void;
  onSwitchProject: (projectId: string) => void;
  onCreateProject: () => void;
  onCollapse?: () => void;
  footer?: ReactNode;
}) {
  const styleLabel = mode === "interior" ? "Style interior" : "Style arsitektur";
  const styleOptions =
    mode === "interior" ? STYLE_OPTIONS.interior : STYLE_OPTIONS.exterior;
  const surroundingOptions =
    mode === "interior" ? SURROUNDINGS.interior : SURROUNDINGS.exterior;
  const surroundingLabel =
    mode === "interior" ? "View Jendela" : "Lingkungan Sekitar";

  return (
    // In the fixed-height studio, fill the column so its bottom lines up with
    // the prompt/info columns (grows taller and scrolls when content overflows).
    <div className="h-fit max-w-full overflow-hidden rounded-lg border border-border/80 bg-card lg:h-full lg:min-h-0">
      <div className="flex min-h-0 min-w-0 flex-col overflow-visible lg:h-full">
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/70 bg-card px-4 py-3">
          <h1 className="text-sm font-semibold text-foreground">Konfigurasi</h1>
          {onCollapse && (
            <button
              type="button"
              onClick={onCollapse}
              aria-label="Ciutkan panel"
              title="Ciutkan panel"
              className="hidden size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:flex [&_svg]:size-4"
            >
              <PanelLeft />
            </button>
          )}
        </div>

        <div className="flex flex-col gap-5 overflow-visible px-4 py-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto [&>*]:shrink-0">
          <ControlSection title="Project">
            <div className="flex min-w-0 gap-2">
              <Select
                id="project"
                value={projectId}
                onChange={(e) => onSwitchProject(e.target.value)}
                className="h-8 min-w-0 flex-1"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={onCreateProject}
                title="Buat project baru"
                aria-label="Buat project baru"
                className="size-8 shrink-0"
              >
                <Plus />
              </Button>
            </div>
          </ControlSection>

          <ControlSection title="Konteks & Style">
            <div className="grid grid-cols-2 gap-2">
              {MODES.map((m) => {
                return (
                  <ChoiceCard
                    key={m.value}
                    active={mode === m.value}
                    icon={m.icon}
                    label={m.label}
                    aria-label={m.label}
                    className="h-20 w-full min-w-0 flex-col justify-center gap-2 text-center [&>span]:items-center [&_svg]:size-5"
                    onClick={() => {
                      setMode(m.value);
                      setStyle("auto");
                      setSurrounding("auto");
                      if (m.value === "interior") setWeather("auto");
                    }}
                  />
                );
              })}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="style">{styleLabel}</Label>
              <Select
                id="style"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="h-9 rounded-md"
              >
                {styleOptions.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </div>
          </ControlSection>

          <ControlSection title="Environment & Lighting">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="location">Lokasi Proyek</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="contoh: Bandung, Bali, Jakarta"
                className="h-9 rounded-md"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="surrounding">{surroundingLabel}</Label>
              <Select
                id="surrounding"
                value={surrounding}
                onChange={(e) => setSurrounding(e.target.value)}
                className="h-9 rounded-md"
              >
                {surroundingOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Waktu</Label>
              <ChipGroup options={TIMES} value={time} onChange={setTime} />
            </div>

            {mode !== "interior" && (
              <div className="flex flex-col gap-2">
                <Label>Cuaca</Label>
                <ChipGroup
                  options={WEATHERS}
                  value={weather}
                  onChange={setWeather}
                />
              </div>
            )}
          </ControlSection>

          <ControlSection title="Output">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="outputFormat">Format output</Label>
              <Select
                id="outputFormat"
                value={outputFormat}
                onChange={(e) =>
                  setOutputFormat(e.target.value as RenderOutputFormat)
                }
                className="h-9 rounded-md"
              >
                {OUTPUT_FORMATS.map((format) => (
                  <option key={format.value} value={format.value}>
                    {format.label}
                  </option>
                ))}
              </Select>
            </div>
          </ControlSection>

          <ControlSection title="Objek">
            <ToggleRow
              checked={lightsOn}
              onCheckedChange={(next) => setLightsOn(() => next)}
              label="Nyalakan Lampu"
              className="h-10 w-full min-w-0 gap-2 px-3 text-xs sm:text-sm"
            />
          </ControlSection>
        </div>
        {footer && (
          <div className="shrink-0 border-t border-border/70 bg-card p-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
