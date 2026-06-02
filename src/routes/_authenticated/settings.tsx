import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Moon, Sun, Users, Shield, Plus, X, Mail, Loader2, Copy, Check } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { useFamilyContext } from "@/lib/db/hooks";
import { membersQuery, invitesQuery, type FamilyMember } from "@/lib/db/queries";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — FamilyFlow AI" },
      { name: "description", content: "Manage your family profile, members, and invites." },
    ],
  }),
  component: SettingsPage,
});

const COLORS = ["#7c5cff", "#22c55e", "#f59e0b", "#06b6d4", "#ec4899", "#ef4444", "#0ea5e9"];

function SettingsPage() {
  const { theme, toggle } = useTheme();
  const { user, signOut } = useAuth();
  const { familyId, userId, family } = useFamilyContext();
  const qc = useQueryClient();

  const { data: members = [] } = useQuery({
    ...membersQuery(familyId ?? ""),
    enabled: !!familyId,
  });
  const { data: invites = [] } = useQuery({
    ...invitesQuery(familyId ?? ""),
    enabled: !!familyId,
  });

  const [editing, setEditing] = useState<FamilyMember | null>(null);
  const [newMember, setNewMember] = useState({ name: "", role: "Member", color: COLORS[0] });
  const [inviteEmail, setInviteEmail] = useState("");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const invMembers = () => qc.invalidateQueries({ queryKey: ["members", familyId] });
  const invInvites = () => qc.invalidateQueries({ queryKey: ["invites", familyId] });

  const addMember = useMutation({
    mutationFn: async () => {
      if (!familyId) throw new Error("Not ready");
      if (!newMember.name.trim()) throw new Error("Name required");
      const initial = newMember.name.trim()[0].toUpperCase();
      const { error } = await supabase.from("family_members").insert({
        family_id: familyId,
        name: newMember.name.trim(),
        role: newMember.role,
        color: newMember.color,
        initial,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewMember({ name: "", role: "Member", color: COLORS[0] });
      invMembers();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMember = useMutation({
    mutationFn: async (m: FamilyMember) => {
      const { error } = await supabase
        .from("family_members")
        .update({
          name: m.name,
          role: m.role,
          color: m.color,
          initial: m.name[0]?.toUpperCase() ?? "M",
        })
        .eq("id", m.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setEditing(null);
      invMembers();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("family_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invMembers,
    onError: (e: Error) => toast.error(e.message),
  });

  const sendInvite = useMutation({
    mutationFn: async () => {
      if (!familyId || !userId) throw new Error("Not ready");
      const email = inviteEmail.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Invalid email");
      const { error } = await supabase.from("family_invites").insert({
        family_id: familyId,
        email,
        invited_by: userId,
        role: "member",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setInviteEmail("");
      invInvites();
      toast.success("Invite created. Share the link below.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revokeInvite = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("family_invites").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invInvites,
    onError: (e: Error) => toast.error(e.message),
  });

  const inviteLink = (token: string) =>
    typeof window !== "undefined" ? `${window.location.origin}/login?invite=${token}` : "";

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Configure your family workspace.</p>
      </header>

      <section className="rounded-2xl border border-border bg-surface p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <Users className="size-4 text-brand" /> Family members
        </div>
        <ul className="divide-y divide-border">
          {members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 py-3">
              <div className="grid size-10 place-items-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: m.color }}>
                {m.initial}
              </div>
              <div className="flex-1">
                <div className="font-semibold">{m.name}</div>
                <div className="text-xs text-muted-foreground">
                  {m.role} {m.points > 0 && `· ${m.points} pts`}
                </div>
              </div>
              <button onClick={() => setEditing(m)} className="text-xs font-medium text-brand hover:underline">Edit</button>
              <button onClick={() => removeMember.mutate(m.id)} className="text-muted-foreground hover:text-destructive" aria-label="Remove">
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addMember.mutate();
          }}
          className="mt-4 grid gap-2 sm:grid-cols-[1fr,120px,auto,auto]"
        >
          <input
            value={newMember.name}
            onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
            placeholder="Name"
            maxLength={40}
            className="rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <input
            value={newMember.role}
            onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
            placeholder="Role"
            maxLength={20}
            className="rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <div className="flex items-center gap-1">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNewMember({ ...newMember, color: c })}
                className="size-6 rounded-full ring-offset-2 ring-offset-surface transition-all"
                style={{ backgroundColor: c, boxShadow: newMember.color === c ? `0 0 0 2px ${c}` : "none" }}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
          <button
            type="submit"
            disabled={addMember.isPending}
            className="inline-flex items-center gap-1 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-brand-foreground hover:opacity-90 disabled:opacity-50"
          >
            {addMember.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Add
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <Mail className="size-4 text-brand" /> Invite by email
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendInvite.mutate();
          }}
          className="flex flex-wrap items-center gap-2"
        >
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="friend@example.com"
            maxLength={120}
            className="flex-1 min-w-[200px] rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <button
            type="submit"
            disabled={sendInvite.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:opacity-90 disabled:opacity-50"
          >
            {sendInvite.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Create invite
          </button>
        </form>
        {invites.length > 0 && (
          <ul className="mt-4 space-y-2">
            {invites.map((inv) => (
              <li key={inv.id} className="flex items-center gap-2 rounded-lg border border-border p-2 text-xs">
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{inv.email}</div>
                  <div className="text-muted-foreground truncate">{inviteLink(inv.token)}</div>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(inviteLink(inv.token));
                    setCopiedToken(inv.token);
                    setTimeout(() => setCopiedToken(null), 1500);
                  }}
                  className="rounded p-1 text-muted-foreground hover:bg-secondary"
                  aria-label="Copy link"
                >
                  {copiedToken === inv.token ? <Check className="size-3.5 text-brand" /> : <Copy className="size-3.5" />}
                </button>
                <button onClick={() => revokeInvite.mutate(inv.id)} className="rounded p-1 text-muted-foreground hover:text-destructive" aria-label="Revoke">
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
          {theme === "dark" ? <Moon className="size-4 text-brand" /> : <Sun className="size-4 text-brand" />}
          Appearance
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Dark mode</div>
            <div className="text-xs text-muted-foreground">
              Currently using <strong className="capitalize">{theme}</strong> theme.
            </div>
          </div>
          <button
            onClick={toggle}
            className="relative h-6 w-11 rounded-full bg-secondary transition-colors data-[on=true]:bg-brand"
            data-on={theme === "dark"}
            aria-label="Toggle dark mode"
          >
            <span
              className="absolute top-0.5 left-0.5 size-5 rounded-full bg-surface shadow transition-transform"
              style={{ transform: theme === "dark" ? "translateX(20px)" : "translateX(0)" }}
            />
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <Shield className="size-4 text-brand" /> Account
        </div>
        <p className="text-xs text-muted-foreground">
          Family workspace: <strong>{family?.name ?? "—"}</strong> · {members.length} members
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Signed in as <strong>{user?.email}</strong></p>
        <button
          onClick={() => signOut()}
          className="mt-3 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary"
        >
          Sign out
        </button>
      </section>

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setEditing(null)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              updateMember.mutate(editing);
            }}
            className="w-full max-w-sm space-y-3 rounded-2xl border border-border bg-surface p-6 shadow-xl"
          >
            <h2 className="text-lg font-bold">Edit member</h2>
            <input
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              maxLength={40}
              className="w-full rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-sm outline-none focus:border-brand"
            />
            <input
              value={editing.role}
              onChange={(e) => setEditing({ ...editing, role: e.target.value })}
              placeholder="Role"
              maxLength={20}
              className="w-full rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-sm outline-none focus:border-brand"
            />
            <div className="flex flex-wrap gap-1">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setEditing({ ...editing, color: c })}
                  className="size-7 rounded-full transition-all"
                  style={{ backgroundColor: c, boxShadow: editing.color === c ? `0 0 0 2px ${c}` : "none" }}
                />
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:bg-secondary">
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateMember.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:opacity-90 disabled:opacity-50"
              >
                {updateMember.isPending && <Loader2 className="size-4 animate-spin" />}
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
