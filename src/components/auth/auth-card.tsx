import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "@/components/brand/logo";
import { Card, CardContent } from "@/components/ui/card";

type AuthCardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

/** Centered auth card with logo header (login/register/etc.). */
function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <div className="flex flex-col items-center gap-4">
        <Link href="/" aria-label="RenderAI beranda">
          <Logo />
        </Link>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-extrabold text-foreground">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-5 py-6">{children}</CardContent>
      </Card>

      {footer && (
        <p className="text-center text-sm text-muted-foreground">{footer}</p>
      )}
    </div>
  );
}

export { AuthCard };
