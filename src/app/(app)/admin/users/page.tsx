import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listUsers } from "@/lib/admin/service";
import { requireAdmin } from "@/lib/session";
import {
  creditAdjustmentAction,
  setRoleAction,
  toggleDisableAction,
} from "./actions";

export const metadata: Metadata = { title: "Admin · User" };

const idr = new Intl.NumberFormat("id-ID");
const dateFmt = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });

export default async function AdminUsersPage() {
  const session = await requireAdmin();
  const users = await listUsers();

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full min-w-[980px] text-sm">
        <thead className="bg-muted/60 text-left text-xs font-semibold text-muted-foreground">
          <tr>
            <th className="px-4 py-3">User</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Kredit</th>
            <th className="px-4 py-3">Adjustment</th>
            <th className="px-4 py-3">Gabung</th>
            <th className="px-4 py-3 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {users.map((u) => {
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
                  ) : (
                    <Badge variant="success">Aktif</Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums">
                  {idr.format(u.balance ?? 0)}
                </td>
                <td className="px-4 py-3">
                  <form action={creditAdjustmentAction} className="flex gap-2">
                    <input type="hidden" name="userId" value={u.id} />
                    <Input
                      name="amount"
                      type="number"
                      className="h-8 w-20 bg-background px-2 text-xs"
                      placeholder="+/-"
                    />
                    <Input
                      name="description"
                      className="h-8 w-36 bg-background px-2 text-xs"
                      placeholder="Catatan"
                    />
                    <Button type="submit" variant="outline" size="sm">
                      Simpan
                    </Button>
                  </form>
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
                    <div className="flex justify-end gap-2">
                      <form action={setRoleAction}>
                        <input type="hidden" name="userId" value={u.id} />
                        <input
                          type="hidden"
                          name="role"
                          value={u.role === "admin" ? "user" : "admin"}
                        />
                        <Button type="submit" variant="outline" size="sm">
                          {u.role === "admin" ? "Jadikan User" : "Jadikan Admin"}
                        </Button>
                      </form>
                      <form action={toggleDisableAction}>
                        <input type="hidden" name="userId" value={u.id} />
                        <input
                          type="hidden"
                          name="disabled"
                          value={u.isDisabled ? "false" : "true"}
                        />
                        <Button
                          type="submit"
                          variant={u.isDisabled ? "outline" : "destructive"}
                          size="sm"
                        >
                          {u.isDisabled ? "Aktifkan" : "Nonaktifkan"}
                        </Button>
                      </form>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
