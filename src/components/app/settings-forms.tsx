"use client";

import { Check, Loader2 } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { PasswordInput } from "@/components/auth/password-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  updatePreferencesAction,
  updateProfileAction,
  type ActionState,
} from "@/app/(app)/settings/actions";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { zodFieldErrors } from "@/lib/form";
import { changePasswordSchema } from "@/lib/validations/account";

const initial: ActionState = {};

function Saved() {
  return (
    <p className="flex items-center gap-1 text-sm text-success">
      <Check className="size-4" /> Tersimpan
    </p>
  );
}

export function ProfileForm({
  name,
  displayName,
  email,
}: {
  name: string;
  displayName: string;
  email: string;
}) {
  const [state, action, pending] = useActionState(
    updateProfileAction,
    initial,
  );
  useEffect(() => {
    if (state.ok) toast.success("Profil diperbarui");
  }, [state]);
  return (
    <form action={action} className="flex flex-col gap-4">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nama lengkap</Label>
        <Input id="name" name="name" defaultValue={name} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="displayName">Nama tampilan</Label>
        <Input
          id="displayName"
          name="displayName"
          defaultValue={displayName}
          placeholder="Opsional"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" defaultValue={email} disabled />
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />} Simpan profil
        </Button>
        {state.ok && <Saved />}
      </div>
    </form>
  );
}

export function PreferencesForm({
  emailNotificationsEnabled,
  defaultRenderMode,
  defaultOutputFormat,
}: {
  emailNotificationsEnabled: boolean;
  defaultRenderMode: string;
  defaultOutputFormat: string;
}) {
  const [state, action, pending] = useActionState(
    updatePreferencesAction,
    initial,
  );
  useEffect(() => {
    if (state.ok) toast.success("Preferensi disimpan");
  }, [state]);
  return (
    <form action={action} className="flex flex-col gap-4">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <label className="flex items-center gap-2 text-sm text-foreground">
        <Checkbox
          name="emailNotificationsEnabled"
          defaultChecked={emailNotificationsEnabled}
        />
        Kirim notifikasi lewat email
      </label>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="defaultRenderMode">Mode render default</Label>
        <Select
          id="defaultRenderMode"
          name="defaultRenderMode"
          defaultValue={defaultRenderMode}
        >
          <option value="interior">Interior</option>
          <option value="exterior">Exterior</option>
          <option value="style_transfer">Style Transfer</option>
          <option value="upscale">Upscale</option>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="defaultOutputFormat">Format output default</Label>
        <Select
          id="defaultOutputFormat"
          name="defaultOutputFormat"
          defaultValue={defaultOutputFormat}
        >
          <option value="jpg">JPG</option>
          <option value="png">PNG</option>
          <option value="webp">WebP</option>
          <option value="avif">AVIF</option>
        </Select>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />} Simpan preferensi
        </Button>
        {state.ok && <Saved />}
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [values, setValues] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof values) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setValues((v) => ({ ...v, [field]: e.target.value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setDone(false);
    const parsed = changePasswordSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setLoading(true);
    const { error } = await authClient.changePassword({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
      revokeOtherSessions: true,
    });
    setLoading(false);
    if (error) {
      setFormError(authErrorMessage(error, "Gagal mengganti password."));
      return;
    }
    setValues({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setDone(true);
    toast.success("Password berhasil diganti");
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="currentPassword">Password saat ini</Label>
        <PasswordInput
          id="currentPassword"
          value={values.currentPassword}
          onChange={update("currentPassword")}
          autoComplete="current-password"
        />
        {errors.currentPassword && (
          <p className="text-xs text-destructive">{errors.currentPassword}</p>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="newPassword">Password baru</Label>
        <PasswordInput
          id="newPassword"
          value={values.newPassword}
          onChange={update("newPassword")}
          autoComplete="new-password"
        />
        {errors.newPassword && (
          <p className="text-xs text-destructive">{errors.newPassword}</p>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmPassword">Konfirmasi password baru</Label>
        <PasswordInput
          id="confirmPassword"
          value={values.confirmPassword}
          onChange={update("confirmPassword")}
          autoComplete="new-password"
        />
        {errors.confirmPassword && (
          <p className="text-xs text-destructive">{errors.confirmPassword}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="animate-spin" />} Ganti password
        </Button>
        {done && <Saved />}
      </div>
    </form>
  );
}
