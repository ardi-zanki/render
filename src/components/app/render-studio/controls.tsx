"use client";

import { Lightbulb, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { RenderMode, RenderOutputFormat } from "@/db/schema";
import { cn } from "@/lib/utils";
import {
  MODES,
  OUTPUT_FORMATS,
  STYLES,
  SURROUNDINGS,
  TIMES,
  WEATHERS,
} from "./constants";
import { ChipGroup } from "./chip-group";
import type { RenderStudioProject } from "./types";

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
}) {
  const styleLabel = mode === "interior" ? "Style Interior" : "Style Arsitektur";
  const surroundingOptions =
    mode === "interior" ? SURROUNDINGS.interior : SURROUNDINGS.exterior;
  const surroundingLabel =
    mode === "interior" ? "View Jendela" : "Lingkungan Sekitar";

  return (
    <Card className="h-fit">
      <CardContent className="flex flex-col gap-5 py-5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="project">Project</Label>
          <div className="flex gap-2">
            <Select
              id="project"
              value={projectId}
              onChange={(e) => onSwitchProject(e.target.value)}
              className="flex-1"
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
            >
              <Plus />
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Mode Render</Label>
          <div className="grid grid-cols-2 gap-2">
            {MODES.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => {
                  setMode(m.value);
                  setSurrounding("auto");
                  if (m.value === "interior") setWeather("auto");
                }}
                className={cn(
                  "flex items-center gap-2 rounded-md border px-3 py-2.5 text-sm font-medium transition-colors",
                  mode === m.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                <m.icon className="size-4" />
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="style">{styleLabel}</Label>
          <Select
            id="style"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
          >
            {STYLES.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="outputFormat">Format Output</Label>
          <Select
            id="outputFormat"
            value={outputFormat}
            onChange={(e) => setOutputFormat(e.target.value as RenderOutputFormat)}
          >
            {OUTPUT_FORMATS.map((format) => (
              <option key={format.value} value={format.value}>
                {format.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="location">Lokasi Proyek</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Bandung, Bali, Jakarta"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="surrounding">{surroundingLabel}</Label>
          <Select
            id="surrounding"
            value={surrounding}
            onChange={(e) => setSurrounding(e.target.value)}
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
            <ChipGroup options={WEATHERS} value={weather} onChange={setWeather} />
          </div>
        )}

        <div className="flex flex-col gap-2.5 border-t border-border pt-4">
          <Label className="font-semibold text-foreground">Objek</Label>
          <button
            type="button"
            aria-pressed={lightsOn}
            onClick={() => setLightsOn((value) => !value)}
            className={cn(
              "flex h-10 items-center justify-between gap-3 rounded-md border px-3 text-sm font-medium transition-colors",
              lightsOn
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-secondary/60 text-foreground hover:border-primary/40",
            )}
          >
            <span className="flex items-center gap-2">
              <Lightbulb className="size-4" />
              Nyalain Lampu
            </span>
            <span
              className={cn(
                "flex h-5 w-9 items-center rounded-full p-0.5 transition-colors",
                lightsOn ? "bg-primary" : "bg-muted-foreground/25",
              )}
            >
              <span
                className={cn(
                  "size-4 rounded-full bg-background shadow-sm transition-transform",
                  lightsOn && "translate-x-4",
                )}
              />
            </span>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
