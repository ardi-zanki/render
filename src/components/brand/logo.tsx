import { cn } from "@/lib/utils";

type LogoMarkProps = {
  className?: string;
  /** Pixel size of the square mark. */
  size?: number;
};

/**
 * RenderAI logo mark — a navy rounded square with two forward-leaning white
 * bars suggesting speed ("render in seconds"). Original mark, brand language
 * inspired by the reference but intentionally distinct.
 */
function LogoMark({ className, size = 32 }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      role="img"
      aria-label="RenderAI"
      className={cn("shrink-0", className)}
    >
      <rect width="40" height="40" rx="11" fill="var(--primary)" />
      <path
        d="M11.5 28 18 12h4.4l-6.5 16H11.5Z"
        fill="#FFFFFF"
      />
      <path
        d="M20.6 28 27.1 12h4.4l-6.5 16h-4.4Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

type LogoProps = LogoMarkProps & {
  /** Show the "RenderAI." wordmark next to the mark. */
  withWordmark?: boolean;
  /** Small byline under the wordmark, e.g. the studio name. */
  byline?: string;
};

function Logo({
  className,
  size = 32,
  withWordmark = true,
  byline,
}: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      {withWordmark && (
        <span className="flex flex-col leading-none">
          <span className="text-xl font-extrabold tracking-tight text-foreground">
            RenderAI<span className="text-primary">.</span>
          </span>
          {byline && (
            <span className="mt-0.5 text-[11px] font-medium text-muted-foreground">
              {byline}
            </span>
          )}
        </span>
      )}
    </span>
  );
}

export { Logo, LogoMark };
