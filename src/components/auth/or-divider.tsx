function OrDivider({ label = "Atau" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-border/90" />
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="h-px flex-1 bg-border/90" />
    </div>
  );
}

export { OrDivider };
