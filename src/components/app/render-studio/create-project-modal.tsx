"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";

export function CreateProjectModal({
  name,
  setName,
  errors,
  setErrors,
  creating,
  onClose,
  onSubmit,
}: {
  name: string;
  setName: (name: string) => void;
  errors: Record<string, string>;
  setErrors: (updater: (prev: Record<string, string>) => Record<string, string>) => void;
  creating: boolean;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <Modal
      onClose={onClose}
      labelledBy="rs-create-project-title"
      panelClassName="w-full max-w-sm rounded-lg border border-border bg-card p-5 shadow-dialog"
    >
      <h2
        id="rs-create-project-title"
        className="text-base font-semibold text-foreground"
      >
        Buat project baru
      </h2>
      <div className="mt-4 flex flex-col gap-1.5">
        <Label htmlFor="rs-new-project">Nama project</Label>
        <Input
          id="rs-new-project"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setErrors((prev) => ({ ...prev, name: "" }));
          }}
          placeholder="Nama project"
          maxLength={80}
          aria-invalid={!!errors.name}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSubmit();
            }
          }}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name}</p>
        )}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={creating}>
          Batal
        </Button>
        <Button onClick={onSubmit} disabled={creating}>
          {creating && <Loader2 className="animate-spin" />}
          Buat
        </Button>
      </div>
    </Modal>
  );
}
