"use client";

import {
  BadgeCheck,
  Check,
  KeyRound,
  Link2,
  Loader2,
  ShieldAlert,
  Unlink,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { PasswordInput } from "@/components/auth/password-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  disconnectGoogleAction,
  setPasswordAction,
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
  emailVerified,
}: {
  name: string;
  displayName: string;
  email: string;
  emailVerified: boolean;
}) {
  const [state, action, pending] = useActionState(
    updateProfileAction,
    initial,
  );
  const [clearedFields, setClearedFields] = useState<Record<string, boolean>>({});
  const fieldErrors = state.fieldErrors ?? {};
  useEffect(() => {
    if (state.ok) toast.success("Profil diperbarui");
  }, [state]);
  return (
    <form
      action={action}
      className="flex flex-col gap-4"
      noValidate
      onSubmit={() => setClearedFields({})}
    >
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nama lengkap</Label>
        <Input
          id="name"
          name="name"
          defaultValue={name}
          onChange={() =>
            setClearedFields((prev) => ({ ...prev, name: true }))
          }
          aria-invalid={!!fieldErrors.name && !clearedFields.name}
        />
        {fieldErrors.name && !clearedFields.name && (
          <p className="text-xs text-destructive">{fieldErrors.name}</p>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="displayName">Nama tampilan</Label>
        <Input
          id="displayName"
          name="displayName"
          defaultValue={displayName}
          placeholder="Opsional"
          onChange={() =>
            setClearedFields((prev) => ({ ...prev, displayName: true }))
          }
          aria-invalid={
            !!fieldErrors.displayName && !clearedFields.displayName
          }
        />
        {fieldErrors.displayName && !clearedFields.displayName && (
          <p className="text-xs text-destructive">
            {fieldErrors.displayName}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Input
            id="email"
            defaultValue={email}
            disabled
            className={emailVerified ? "pr-32" : "pr-40"}
          />
          <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2">
            {emailVerified ? (
              <Badge variant="success" className="h-6 px-1.5 text-micro">
                <BadgeCheck /> Terverifikasi
              </Badge>
            ) : (
              <Badge variant="warning" className="h-6 px-1.5 text-micro">
                <ShieldAlert /> Belum terverifikasi
              </Badge>
            )}
          </span>
        </div>
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
  defaultRenderMode,
  defaultOutputFormat,
}: {
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
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="defaultRenderMode">Mode render default</Label>
        <Select
          id="defaultRenderMode"
          name="defaultRenderMode"
          defaultValue={defaultRenderMode}
        >
          <option value="interior">Interior</option>
          <option value="exterior" disabled>
            Exterior (Segera hadir)
          </option>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="defaultOutputFormat">Format output default</Label>
        <Select
          id="defaultOutputFormat"
          name="defaultOutputFormat"
          defaultValue={defaultOutputFormat}
        >
          <option value="original">Original</option>
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

function SetPasswordForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState(setPasswordAction, initial);
  const [clearedFields, setClearedFields] = useState<Record<string, boolean>>({});
  const fieldErrors = state.fieldErrors ?? {};

  useEffect(() => {
    if (!state.ok) return;
    toast.success("Password berhasil dibuat");
    router.refresh();
  }, [router, state.ok]);

  return (
    <form
      action={action}
      className="flex flex-col gap-4"
      noValidate
      onSubmit={() => setClearedFields({})}
    >
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="setNewPassword">Password baru</Label>
        <PasswordInput
          id="setNewPassword"
          name="newPassword"
          autoComplete="new-password"
          aria-invalid={!!fieldErrors.newPassword && !clearedFields.newPassword}
          onChange={() =>
            setClearedFields((prev) => ({ ...prev, newPassword: true }))
          }
        />
        {fieldErrors.newPassword && !clearedFields.newPassword && (
          <p className="text-xs text-destructive">{fieldErrors.newPassword}</p>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="setConfirmPassword">Konfirmasi password baru</Label>
        <PasswordInput
          id="setConfirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          aria-invalid={
            !!fieldErrors.confirmPassword && !clearedFields.confirmPassword
          }
          onChange={() =>
            setClearedFields((prev) => ({ ...prev, confirmPassword: true }))
          }
        />
        {fieldErrors.confirmPassword && !clearedFields.confirmPassword && (
          <p className="text-xs text-destructive">
            {fieldErrors.confirmPassword}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <KeyRound />}
          Buat password
        </Button>
        {state.ok && <Saved />}
      </div>
    </form>
  );
}

function ChangePasswordForm() {
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
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((v) => ({ ...v, [field]: e.target.value }));
      setErrors((prev) => ({
        ...prev,
        [field]: "",
        ...(field === "newPassword" ? { confirmPassword: "" } : {}),
      }));
      setFormError("");
    };
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
          aria-invalid={!!errors.currentPassword}
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
          aria-invalid={!!errors.newPassword}
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
          aria-invalid={!!errors.confirmPassword}
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

export function PasswordForm({ passwordReady }: { passwordReady: boolean }) {
  return passwordReady ? <ChangePasswordForm /> : <SetPasswordForm />;
}

export function GoogleAccountForm({
  email,
  googleConnected,
  passwordReady,
}: {
  email: string;
  googleConnected: boolean;
  passwordReady: boolean;
}) {
  const router = useRouter();
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState("");
  const [disconnectError, setDisconnectError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function connectGoogle() {
    setConnecting(true);
    setConnectError("");
    try {
      const response = await fetch("/api/auth/link-social", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          provider: "google",
          callbackURL: "/dashboard",
          errorCallbackURL: "/dashboard?google=link-error",
          disableRedirect: true,
        }),
      });
      const json = (await response.json()) as {
        url?: string;
        error?: { message?: string };
        message?: string;
      };
      if (!response.ok || !json.url) {
        throw new Error(
          json.error?.message || json.message || "Gagal menghubungkan Google.",
        );
      }
      window.location.href = json.url;
    } catch (err) {
      setConnecting(false);
      setConnectError(
        err instanceof Error ? err.message : "Gagal menghubungkan Google.",
      );
    }
  }

  function disconnectGoogle() {
    setDisconnectError("");
    startTransition(() => {
      void (async () => {
        const result = await disconnectGoogleAction();
        if (result.error) {
          setDisconnectError(result.error);
          return;
        }
        toast.success("Akun Google dilepas");
        router.refresh();
      })();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {(connectError || disconnectError) && (
        <Alert variant="destructive">
          <AlertDescription>{connectError || disconnectError}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {googleConnected ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={disconnectGoogle}
            disabled={!passwordReady || isPending}
            title={
              passwordReady
                ? undefined
                : "Buat password sebelum melepas Google"
            }
          >
            {isPending ? <Loader2 className="animate-spin" /> : <Unlink />}
            Disconnect
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={connectGoogle}
            disabled={connecting}
          >
            {connecting ? <Loader2 className="animate-spin" /> : <Link2 />}
            Connect
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Google yang dihubungkan harus memakai email {email}.
      </p>
    </div>
  );
}
