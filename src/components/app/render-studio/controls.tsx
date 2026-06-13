"use client";

import { Lightbulb, PanelLeft, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
  const styleLabel = mode === "interior" ? "Style Interior" : "Style Arsitektur";
  const surroundingOptions =
    mode === "interior" ? SURROUNDINGS.interior : SURROUNDINGS.exterior;
  const surroundingLabel =
    mode === "interior" ? "View Jendela" : "Lingkungan Sekitar";

  return (
    // In the fixed-height studio, fill the column so its bottom lines up with
    // the prompt/info columns (grows taller and scrolls when content overflows).
    <Card className="h-fit lg:min-h-full">
      <CardContent className="flex flex-col gap-4 py-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="project">Project</Label>
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
              <ChoiceCard
                key={m.value}
                active={mode === m.value}
                icon={m.icon}
                label={m.label}
                description={
                  m.comingSoon ? (
                    <Badge
                      variant="secondary"
                      className="mt-0.5 px-1.5 py-0 text-micro"
                    >
                      Segera hadir
                    </Badge>
                  ) : undefined
                }
                disabled={m.comingSoon}
                onClick={() => {
                  setMode(m.value);
                  setSurrounding("auto");
                  if (m.value === "interior") setWeather("auto");
                }}
              />
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
          <Label htmlFor="location">Lokasi Project</Label>
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

        <div className="flex flex-col gap-2.5 border-t border-border/80 pt-4">
          <Label className="font-semibold text-foreground">Pencahayaan</Label>
          <ToggleRow
            checked={lightsOn}
            onCheckedChange={(next) => setLightsOn(() => next)}
            icon={Lightbulb}
            label="Nyalakan Lampu"
          />
        </div>
      </CardContent>
    </Card>
  );
}
