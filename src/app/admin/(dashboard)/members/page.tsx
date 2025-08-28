"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { Pencil, Trash2, X } from "lucide-react";

type Profile = {
  id: string;
  email: string | null;
  name: string | null;
  phone_number: string | null;
  role: string | null;
  created_at: string | null;
};

type EditDraft = Pick<Profile, "id" | "name" | "email" | "phone_number" | "role">;

function formatDateKOR(dt?: string | null) {
  if (!dt) return "-";
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminMembersPage() {
  const router = useRouter();
  const [meRole, setMeRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Profile[]>([]);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "ADMIN" | "USER" | "EMPTY">("ALL");

  // Modals
  const [editing, setEditing] = useState<EditDraft | null>(null);
  const [deleting, setDeleting] = useState<Profile | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");

      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        router.replace("/admin/(auth)/login");
        return;
      }

      const { data: my, error: myErr } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", auth.user.id)
        .maybeSingle();

      if (myErr || !my?.role || String(my.role).toUpperCase() !== "ADMIN") {
        router.replace("/admin/(auth)/login");
        return;
      }
      setMeRole(String(my.role).toUpperCase());

      const { data, error: listErr } = await supabase
        .from("profiles")
        .select("id, email, name, phone_number, role, created_at")
        .order("created_at", { ascending: false });

      if (listErr) setError(listErr.message);
      else setRows(data || []);

      setLoading(false);
    })();
  }, [router]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();

    return rows.filter((r) => {
      const role = (r.role || "").toUpperCase();
      if (roleFilter === "ADMIN" && role !== "ADMIN") return false;
      if (roleFilter === "USER" && role !== "USER") return false;
      if (roleFilter === "EMPTY" && role !== "") return false;

      if (!s) return true;
      return [r.name, r.email, r.phone_number, r.role, formatDateKOR(r.created_at)]
        .map((x) => (x || "").toString().toLowerCase())
        .some((v) => v.includes(s));
    });
  }, [rows, q, roleFilter]);

  async function refresh() {
    const { data, error: listErr } = await supabase
      .from("profiles")
      .select("id, email, name, phone_number, role, created_at")
      .order("created_at", { ascending: false });
    if (!listErr) setRows(data || []);
  }

  async function submitEdit() {
    if (!editing) return;
    setBusy(true);
    setError("");

    const payload = {
      name: editing.name ?? null,
      email: editing.email ?? null,
      phone_number: editing.phone_number ?? null,
      role: editing.role ? editing.role.toUpperCase() : null,
    };

    const { error: upErr } = await supabase.from("profiles").update(payload).eq("id", editing.id);

    if (upErr) setError(upErr.message);
    else {
      setEditing(null);
      await refresh();
    }
    setBusy(false);
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    setError("");

    const { error: delErr } = await supabase.from("profiles").delete().eq("id", deleting.id);
    if (delErr) setError(delErr.message);
    else {
      setDeleting(null);
      await refresh();
    }
    setBusy(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white p-8">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-2xl font-bold">Members</h1>
          <p className="mt-4 text-white/70">Loading…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold">Members</h1>
            <p className="text-sm text-white/60">
              Admin-only. Showing <b>all roles</b>. Your role: {meRole}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name / email / phone / role / date…"
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              title="Filter by role"
            >
              <option value="ALL">All roles</option>
              <option value="ADMIN">ADMIN only</option>
              <option value="USER">USER only</option>
              <option value="EMPTY">Empty role</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-white/5">
              <tr className="text-left text-sm text-white/70">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Registered At</th>
                <th className="px-4 py-3 w-36 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filtered.map((r) => (
                <tr key={r.id} className="text-sm">
                  <td className="px-4 py-3">{r.name || "-"}</td>
                  <td className="px-4 py-3">{r.email || "-"}</td>
                  <td className="px-4 py-3">{r.phone_number || "-"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-white/10 px-2 py-0.5 text-xs font-semibold">
                      {(r.role || "").toUpperCase() || "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/70">{formatDateKOR(r.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() =>
                          setEditing({
                            id: r.id,
                            name: r.name,
                            email: r.email,
                            phone_number: r.phone_number,
                            role: r.role || "USER",
                          })
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-1.5 text-xs hover:bg-white/5"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" /> Edit
                      </button>
                      <button
                        onClick={() => setDeleting(r)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/20"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-white/60">
                    No members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <Modal onClose={() => !busy && setEditing(null)} title="Edit member">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!busy) submitEdit();
            }}
            className="space-y-4"
          >
            <Field label="Name">
              <input
                className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                value={editing.name ?? ""}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              />
            </Field>
            <Field label="Email">
              <input
                className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                type="email"
                value={editing.email ?? ""}
                onChange={(e) => setEditing({ ...editing, email: e.target.value })}
              />
            </Field>
            <Field label="Phone">
              <input
                className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                value={editing.phone_number ?? ""}
                onChange={(e) => setEditing({ ...editing, phone_number: e.target.value })}
              />
            </Field>
            <Field label="Role">
              <select
                className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                value={(editing.role || "USER").toUpperCase()}
                onChange={(e) => setEditing({ ...editing, role: e.target.value.toUpperCase() })}
              >
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </Field>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => !busy && setEditing(null)}
                className="rounded-lg border border-white/15 px-3 py-2 text-sm hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-50"
              >
                {busy ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Modal */}
      {deleting && (
        <Modal onClose={() => !busy && setDeleting(null)} title="Delete member">
          <p className="text-sm text-white/80">
            Are you sure you want to delete{" "}
            <span className="font-semibold">{deleting.name || deleting.email || deleting.id}</span>?
            This action cannot be undone.
          </p>

          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => !busy && setDeleting(null)}
              className="rounded-lg border border-white/15 px-3 py-2 text-sm hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => !busy && confirmDelete()}
              className="rounded-lg bg-red-500/90 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
              disabled={busy}
            >
              {busy ? "Deleting…" : "Delete"}
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}

/* ---------- Tiny UI helpers ---------- */

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#141414] p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="rounded p-1 hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase text-white/60">{label}</span>
      {children}
    </label>
  );
}
