import { Search } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type FilterConfig = {
  name: string;
  label: string;
  value?: string;
  options: { label: string; value: string }[];
};

export function AdminDataToolbar({
  search,
  searchPlaceholder = "Cari data",
  filters = [],
  resetHref,
}: {
  search?: string;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  resetHref: string;
}) {
  return (
    <form
      method="get"
      className="flex flex-col gap-2 rounded-lg border border-border/80 bg-card p-3 shadow-soft lg:flex-row lg:items-end"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <label
          htmlFor="admin-search"
          className="text-xs font-medium text-muted-foreground"
        >
          Cari
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="admin-search"
            name="q"
            defaultValue={search}
            placeholder={searchPlaceholder}
            className="pl-9"
          />
        </div>
      </div>

      {filters.map((filter) => (
        <div key={filter.name} className="flex flex-col gap-1.5 lg:w-44">
          <label
            htmlFor={`admin-filter-${filter.name}`}
            className="text-xs font-medium text-muted-foreground"
          >
            {filter.label}
          </label>
          <Select
            id={`admin-filter-${filter.name}`}
            name={filter.name}
            defaultValue={filter.value ?? ""}
          >
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      ))}

      <div className="flex gap-2 lg:shrink-0">
        <Button type="submit" className="flex-1 lg:flex-none">
          Terapkan
        </Button>
        <Button asChild variant="outline" className="flex-1 lg:flex-none">
          <Link href={resetHref}>Reset</Link>
        </Button>
      </div>
    </form>
  );
}
