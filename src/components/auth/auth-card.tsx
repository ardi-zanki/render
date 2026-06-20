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

function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="flex w-full max-w-[380px] flex-col gap-4">
      <div className="flex flex-col items-center gap-2.5">
        <Link href="/" aria-label="Render Studio beranda">
          <Logo size={28} />
        </Link>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-lg font-semibold tracking-normal text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="max-w-sm text-sm leading-6 text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <Card className="border-border/75 bg-card/95 shadow-soft">
        <CardContent className="flex flex-col gap-4 px-5 py-5">
          {children}
        </CardContent>
      </Card>

      {footer && (
        <p className="text-center text-sm text-muted-foreground">{footer}</p>
      )}
    </div>
  );
}

export { AuthCard };
