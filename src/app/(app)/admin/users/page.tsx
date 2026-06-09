import type { Metadata } from "next";

import { AdminDataToolbar } from "@/components/app/admin-data-toolbar";
import { AdminUserActions } from "@/components/app/admin-user-actions";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { countUsers, listUsers } from "@/lib/admin/service";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Admin · User" };

const idr = new Intl.NumberFormat("id-ID");
const dateFmt = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });

function parseRole(value?: string): "admin" | "user" | undefined {
  if (value === "admin" || value === "user") return value;
  return undefined;
}

function parseStatus(
  value?: string,
): "active" | "disabled" | "unverified" | undefined {
  if (
    value === "active" ||
    value === "disabled" ||
    value === "unverified"
  ) {
    return value;
  }
  return undefined;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; role?: string; status?: string }>;
}) {
  const session = await requireAdmin();
  const { page: pageParam, q, role, status } = await searchParams;
  const filters = {
    q: q?.trim() || undefined,
    role: parseRole(role),
    status: parseStatus(status),
  };
  const pageSize = 20;
  const page = Math.max(1, Number(pageParam) || 1);
  const [users, total] = await Promise.all([
    listUsers(pageSize, (page - 1) * pageSize, filters),
    countUsers(filters),
  ]);
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="flex flex-col gap-4">
      <AdminDataToolbar
        search={filters.q}
        searchPlaceholder="Cari nama atau email user"
        resetHref="/admin/users"
        filters={[
          {
            name: "role",
            label: "Role",
            value: filters.role,
            options: [
              { label: "Semua role", value: "" },
              { label: "Admin", value: "admin" },
              { label: "User", value: "user" },
            ],
          },
          {
            name: "status",
            label: "Status",
            value: filters.status,
            options: [
              { label: "Semua status", value: "" },
              { label: "Aktif", value: "active" },
              { label: "Nonaktif", value: "disabled" },
              { label: "Belum verified", value: "unverified" },
            ],
          },
        ]}
      />
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="bg-muted/60 text-left text-xs font-semibold text-muted-foreground">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Kredit</th>
              <th className="px-4 py-3">Gabung</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-9 text-center text-muted-foreground"
                >
                  Tidak ada user yang cocok.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const isSelf = u.id === session.user.id;
                return (
                  <tr key={u.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          {u.name}
                          {isSelf && (
                            <span className="ml-1 text-xs text-muted-foreground">
                              (Anda)
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {u.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {u.role === "admin" ? (
                        <Badge>Admin</Badge>
                      ) : (
                        <Badge variant="secondary">User</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {u.isDisabled ? (
                        <Badge variant="destructive">Nonaktif</Badge>
                      ) : !u.emailVerified ? (
                        <Badge variant="warning">Belum verified</Badge>
                      ) : (
                        <Badge variant="success">Aktif</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {idr.format(u.balance ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {dateFmt.format(u.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {isSelf ? (
                        <span className="block text-right text-muted-foreground">
                          -
                        </span>
                      ) : (
                        <AdminUserActions user={u} />
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} />
    </div>
  );
}
