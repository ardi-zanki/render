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
    <div className="flex w-full max-w-[390px] flex-col gap-4">
      <div className="flex flex-col items-center gap-2.5">
        <Link href="/" aria-label="RenderAI beranda">
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

      <Card className="border-border/80 bg-card/95 shadow-[0_1px_2px_rgb(15_23_42/0.04)]">
        <CardContent className="flex flex-col gap-4 py-4">
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
