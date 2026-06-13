"use client";

import { Lightbulb, PanelLeft, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChoiceCard } from "@/components/ui/choice-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ToggleRow } from "@/components/ui/toggle-row";
import type { RenderMode, RenderOutputFormat } from "@/db/schema";
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
  onCollapse,
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
}) {
  const styleLabel = mode === "interior" ? "Style interior" : "Style arsitektur";
  const surroundingOptions =
    mode === "interior" ? SURROUNDINGS.interior : SURROUNDINGS.exterior;
  const surroundingLabel =
    mode === "interior" ? "Pemandangan jendela" : "Lingkungan sekitar";

  return (
    // In the fixed-height studio, fill the column so its bottom lines up with
    // the prompt/info columns (grows taller and scrolls when content overflows).
    <Card className="h-fit max-w-full overflow-hidden lg:min-h-full">
      <CardContent className="flex min-w-0 flex-col gap-4 px-3 py-4 sm:px-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="project" className="text-sm font-semibold">
              Project
            </Label>
            {onCollapse && (
              <button
                type="button"
                onClick={onCollapse}
                aria-label="Ciutkan panel"
                title="Ciutkan panel"
                className="hidden size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:flex [&_svg]:size-4"
              >
                <PanelLeft />
              </button>
            )}
          </div>
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
        </div>

        <div className="flex flex-col gap-2">
          <Label>Mode render</Label>
          <div className="grid grid-cols-2 gap-2">
            {MODES.map((m) => {
              const card = (
                <ChoiceCard
                  active={mode === m.value}
                  icon={m.icon}
                  label={m.label}
                  disabled={m.comingSoon}
                  aria-label={m.comingSoon ? `${m.label} - Segera hadir` : m.label}
                  className="h-full w-full min-w-0"
                  onClick={() => {
                    setMode(m.value);
                    setSurrounding("auto");
                    if (m.value === "interior") setWeather("auto");
                  }}
                />
              );

              return m.comingSoon ? (
                <span key={m.value} className="block min-w-0" title="Segera hadir">
                  {card}
                </span>
              ) : (
                <span key={m.value} className="block min-w-0">
                  {card}
                </span>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="style">{styleLabel}</Label>
          <Select
            id="style"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="h-8"
          >
            {STYLES.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="outputFormat">Format output</Label>
          <Select
            id="outputFormat"
            value={outputFormat}
            onChange={(e) => setOutputFormat(e.target.value as RenderOutputFormat)}
            className="h-8"
          >
            {OUTPUT_FORMATS.map((format) => (
              <option key={format.value} value={format.value}>
                {format.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="location">Lokasi project</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Bandung, Bali, Jakarta"
            className="h-8"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="surrounding">{surroundingLabel}</Label>
          <Select
            id="surrounding"
            value={surrounding}
            onChange={(e) => setSurrounding(e.target.value)}
            className="h-8"
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

        <div className="flex flex-col gap-2.5 border-t border-border/80 pt-4">
          <Label className="font-semibold text-foreground">Pencahayaan</Label>
          <ToggleRow
            checked={lightsOn}
            onCheckedChange={(next) => setLightsOn(() => next)}
            icon={Lightbulb}
            label="Nyalakan Lampu"
            className="h-9 w-full min-w-0 gap-2 px-2.5 text-xs sm:text-sm"
          />
        </div>
      </CardContent>
    </Card>
  );
}
