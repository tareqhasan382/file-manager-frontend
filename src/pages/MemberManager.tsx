import { useState, useEffect } from "react";
import { BASE_URL } from "../App";
import { Link } from "react-router-dom";

const API = `${BASE_URL}/api/v1`;//"http://localhost:8000/api/v1";
const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjYWViZmUxMi04N2RkLTRhOGQtODc5OC02ZmJhZjJhZjU4MzUiLCJlbWFpbCI6InRhcmVxNDEyMUBnbWFpbC5jb20iLCJyb2xlIjoiT1dORVIiLCJ0ZW5hbnRJZCI6ImIzOWU5MTQ4LWZjNWMtNDhlZS05MTZlLWJjMzkzY2I0ZjY1OSIsImlhdCI6MTc3MjUwMDY0NiwiZXhwIjo3ODIwNTAwNjQ2fQ.SUqPfVCl0V_opDEFx_VGM0hpuIkIowYdvflCe1b2QGg",
});

type Role = "ADMIN" | "MEMBER";
type Member = {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
};

type Modal = "create" | "delete" | null;

function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-medium
      ${type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
      <span>{type === "success" ? "✓" : "✕"}</span>
      {msg}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0d0d15] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h3 className="text-white font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>{title}</h3>
          <button onClick={onClose} className="text-zinc-600 hover:text-white transition-colors w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5">✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

const roleColors: Record<Role, string> = {
  ADMIN: "bg-amber-900/40 text-amber-400 border-amber-800/40",
  MEMBER: "bg-zinc-800/60 text-zinc-400 border-zinc-700/40",
};

export default function MemberManager() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const [selected, setSelected] = useState<Member | null>(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [form, setForm] = useState({ email: "", password: "", role: "MEMBER" as Role });
  const [formLoading, setFormLoading] = useState(false);

  const showToast = (msg: string, type: "success" | "error" = "success") => setToast({ msg, type });

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/tenant/members`, { headers: getHeaders() });
      const d = await r.json();
      if (!d.success) throw new Error(d.message);
      setMembers(d.data || []);
    } catch (err: any) {
      showToast(err.message || "Failed to load members", "error");
    }
    setLoading(false);
  };

  useEffect(() => { fetchMembers(); }, []);

  const handleCreate = async () => {
    if (!form.email || !form.password) return;
    setFormLoading(true);
    try {
      const r = await fetch(`${API}/tenant/members`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.message);
      showToast("Member added successfully");
      setModal(null);
      setForm({ email: "", password: "", role: "MEMBER" });
      fetchMembers();
    } catch (err: any) {
      showToast(err.message, "error");
    }
    setFormLoading(false);
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      const r = await fetch(`${API}/tenant/members/${selected.id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.message);
      showToast("Member removed successfully");
      setModal(null);
      setSelected(null);
      fetchMembers();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const filtered = members.filter(m =>
    m.email.toLowerCase().includes(search.toLowerCase()) ||
    m.role.toLowerCase().includes(search.toLowerCase())
  );

  const admins = filtered.filter(m => m.role === "ADMIN");
  const regularMembers = filtered.filter(m => m.role === "MEMBER");

  return (
    <div className="min-h-screen bg-[#05050a] text-white" style={{ fontFamily: "'DM Mono', monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800;900&display=swap');
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #222; border-radius: 2px; }
      `}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <header className="max-w-7xl mx-auto flex items-center justify-between sticky top-0 z-40 bg-[#05050a]/95 backdrop-blur-sm border-b border-white/5 px-4 md:px-8 py-4">

        <Link to="/">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-sm font-black">F</div>
            <span className="text-white font-black text-base hidden sm:block" style={{ fontFamily: "'Syne', sans-serif" }}>
              File<span className="text-violet-400">Vault</span>
            </span>
          </div>
        </Link>

      </header>
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4">
        <div>
          <h1 className="text-white font-black text-lg" style={{ fontFamily: "'Syne', sans-serif" }}>
            Team Members
          </h1>
          <p className="text-zinc-600 text-xs">{members.length} member{members.length !== 1 ? "s" : ""} in your organization</p>
        </div>
        <button
          onClick={() => setModal("create")}
          className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-violet-500/20"
        >
          <span className="text-base">+</span>
          <span>Add Member</span>
        </button>
      </div>
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-8">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: "Total Members", value: members.length, color: "bg-violet-500/10 border-violet-500/20 text-violet-400" },
            { label: "Admins", value: admins.length, color: "bg-amber-500/10 border-amber-500/20 text-amber-400" },
            { label: "Members", value: regularMembers.length, color: "bg-zinc-800 border-zinc-700/40 text-zinc-400" },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl border p-5 ${s.color.split(" ").slice(0, 2).join(" ")} bg-[#0d0d15]`}>
              <p className="text-zinc-600 text-xs uppercase tracking-widest mb-2">{s.label}</p>
              <p className={`text-3xl font-black ${s.color.split(" ")[2]}`} style={{ fontFamily: "'Syne', sans-serif" }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by email or role..."
          className="w-full bg-[#0d0d15] border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-700 outline-none focus:border-violet-500/40 transition-colors"
        />

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center text-3xl mb-4">👥</div>
            <p className="text-white font-bold mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>No members yet</p>
            <p className="text-zinc-600 text-sm mb-6">Invite your first team member to get started</p>
            <button
              onClick={() => setModal("create")}
              className="text-sm px-5 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-xl text-white font-bold transition-colors"
            >
              Add Member
            </button>
          </div>
        )}

        {/* Member List */}
        {!loading && filtered.length > 0 && (
          <div className="space-y-6">
            {/* Admins Section */}
            {admins.length > 0 && (
              <div>
                <p className="text-xs font-bold tracking-widest uppercase text-zinc-600 mb-3 px-1">Admins — {admins.length}</p>
                <div className="space-y-2">
                  {admins.map(m => (
                    <MemberRow key={m.id} member={m} onDelete={() => { setSelected(m); setModal("delete"); }} />
                  ))}
                </div>
              </div>
            )}

            {/* Members Section */}
            {regularMembers.length > 0 && (
              <div>
                <p className="text-xs font-bold tracking-widest uppercase text-zinc-600 mb-3 px-1">Members — {regularMembers.length}</p>
                <div className="space-y-2">
                  {regularMembers.map(m => (
                    <MemberRow key={m.id} member={m} onDelete={() => { setSelected(m); setModal("delete"); }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── CREATE MODAL ──────────────────────────────────────── */}
      {modal === "create" && (
        <Modal title="Add Team Member" onClose={() => { setModal(null); setForm({ email: "", password: "", role: "MEMBER" }); }}>
          <div className="space-y-4">
            <div>
              <label className="text-zinc-500 text-xs uppercase tracking-widest block mb-2">Email</label>
              <input
                autoFocus
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="member@company.com"
                className="w-full bg-white/5 border border-white/10 focus:border-violet-500/50 rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-700 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-zinc-500 text-xs uppercase tracking-widest block mb-2">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Min. 6 characters"
                className="w-full bg-white/5 border border-white/10 focus:border-violet-500/50 rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-700 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-zinc-500 text-xs uppercase tracking-widest block mb-2">Role</label>
              <div className="grid grid-cols-2 gap-3">
                {(["MEMBER", "ADMIN"] as Role[]).map(r => (
                  <button
                    key={r}
                    onClick={() => setForm({ ...form, role: r })}
                    className={`py-3 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-2
                      ${form.role === r
                        ? r === "ADMIN"
                          ? "border-amber-500/50 bg-amber-500/10 text-amber-400"
                          : "border-violet-500/50 bg-violet-500/10 text-violet-400"
                        : "border-white/10 text-zinc-600 hover:border-white/20 hover:text-zinc-400"}`}
                  >
                    <span>{r === "ADMIN" ? "🔑" : "👤"}</span>
                    {r}
                  </button>
                ))}
              </div>
              <p className="text-zinc-700 text-xs mt-2">
                {form.role === "ADMIN"
                  ? "Admins can manage files, folders, and members."
                  : "Members can only view and manage files."}
              </p>
            </div>

            <button
              onClick={handleCreate}
              disabled={formLoading || !form.email || !form.password}
              className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 disabled:opacity-40 text-white font-bold py-3 rounded-xl text-sm transition-all"
            >
              {formLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Adding...
                </span>
              ) : "Add Member"}
            </button>
          </div>
        </Modal>
      )}

      {/* ── DELETE MODAL ──────────────────────────────────────── */}
      {modal === "delete" && selected && (
        <Modal title="Remove Member" onClose={() => { setModal(null); setSelected(null); }}>
          <div className="space-y-4">
            <div className="bg-[#0a0a12] rounded-xl p-4 flex items-center gap-3 border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-violet-900/50 text-violet-400 flex items-center justify-center font-black text-sm flex-shrink-0">
                {selected.email[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{selected.email}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${roleColors[selected.role]}`}>
                  {selected.role}
                </span>
              </div>
            </div>

            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <p className="text-red-400 text-sm">⚠️ This member will lose access to all files and folders immediately.</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setModal(null); setSelected(null); }}
                className="flex-1 py-3 border border-white/10 rounded-xl text-zinc-400 text-sm hover:border-white/20 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function MemberRow({ member, onDelete }: { member: Member; onDelete: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="flex items-center justify-between p-4 rounded-xl bg-[#0d0d15] border border-white/5 hover:border-white/10 transition-all group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-900/60 to-fuchsia-900/40 text-violet-400 flex items-center justify-center font-black text-sm flex-shrink-0 border border-violet-800/20">
          {member.email[0].toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-white text-sm font-medium truncate">{member.email}</p>
          <p className="text-zinc-700 text-xs mt-0.5">
            Joined {new Date(member.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0 ml-3">
        <span className={`text-xs px-2.5 py-1 rounded-full border font-bold ${roleColors[member.role]}`}>
          {member.role}
        </span>
        <button
          onClick={onDelete}
          className={`w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center text-xs transition-all
            ${hovered ? "opacity-100" : "opacity-0"}`}
        >
          ✕
        </button>
      </div>
    </div>
  );
}