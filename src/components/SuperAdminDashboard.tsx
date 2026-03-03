import { useState, useEffect } from "react";
import { BASE_URL } from "../App";
import { store } from "../Redux/store";
const API = `${BASE_URL}/api/v1/admin`;
const headers = {
  "Content-Type": "application/json",
  Authorization: store.getState().auth.accessToken,   //  NOT Bearer
};

type Plan = "FREE" | "SILVER" | "GOLD" | "DIAMOND";
type Tenant = {
  id: string;
  name: string;
  plan: Plan;
  isBanned: boolean;
  subscriptionStatus: string | null;
  storageUsed: number;
  createdAt: string;
  _count: { users: number; files: number; folders: number };
};
type User = {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  tenant: { name: string; plan: Plan; isBanned: boolean } | null;
};
type Stats = {
  totalTenants: number;
  activeTenants: number;
  bannedTenants: number;
  totalUsers: number;
  totalFiles: number;
  planBreakdown: { plan: Plan; count: number }[];
};

const planColors: Record<Plan, string> = {
  FREE: "bg-slate-700 text-slate-300",
  SILVER: "bg-zinc-600 text-zinc-200",
  GOLD: "bg-amber-900 text-amber-300",
  DIAMOND: "bg-cyan-900 text-cyan-300",
};

const planDot: Record<Plan, string> = {
  FREE: "bg-slate-400",
  SILVER: "bg-zinc-300",
  GOLD: "bg-amber-400",
  DIAMOND: "bg-cyan-400",
};

function StatCard({ label, value, sub, accent }: { label: string; value: number | string; sub?: string; accent: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-6 bg-[#0f0f13] border border-white/5`}>
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-20 ${accent}`} />
      <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-2">{label}</p>
      <p className="text-4xl font-black text-white">{value}</p>
      {sub && <p className="text-xs text-zinc-500 mt-1">{sub}</p>}
    </div>
  );
}

function PlanBadge({ plan }: { plan: Plan }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${planColors[plan]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${planDot[plan]}`} />
      {plan}
    </span>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0f0f13] border border-white/10 rounded-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h3 className="text-white font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors text-xl">✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const [tab, setTab] = useState<"stats" | "tenants" | "users">("stats");
  const [stats, setStats] = useState<Stats | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [planModal, setPlanModal] = useState<Tenant | null>(null);
  const [newPlan, setNewPlan] = useState<Plan>("FREE");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/stats`, { headers });
      const d = await r.json();
      setStats(d.data);
    } catch { showToast("Failed to fetch stats", "error"); }
    setLoading(false);
  };

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/tenants`, { headers });
      const d = await r.json();
      setTenants(d.data || []);
    } catch { showToast("Failed to fetch tenants", "error"); }
    setLoading(false);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/users`, { headers });
      const d = await r.json();
      setUsers(d.data || []);
    } catch { showToast("Failed to fetch users", "error"); }
    setLoading(false);
  };

  useEffect(() => {
    if (tab === "stats") fetchStats();
    if (tab === "tenants") fetchTenants();
    if (tab === "users") fetchUsers();
  }, [tab]);

  const handleBanToggle = async (id: string) => {
    try {
      const r = await fetch(`${API}/tenants/${id}/ban`, { method: "PUT", headers });
      const d = await r.json();
      showToast(d.message);
      fetchTenants();
      setSelectedTenant(null);
    } catch { showToast("Failed to update ban status", "error"); }
  };

  const handlePlanChange = async () => {
    if (!planModal) return;
    try {
      const r = await fetch(`${API}/tenants/${planModal.id}/plan`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ plan: newPlan }),
      });
      const d = await r.json();
      if (d.success) {
        showToast("Plan updated successfully");
        fetchTenants();
        setPlanModal(null);
      } else showToast(d.message, "error");
    } catch { showToast("Failed to update plan", "error"); }
  };

  const filteredTenants = tenants.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const tabs = [
    { id: "stats", label: "Overview", icon: "◈" },
    { id: "tenants", label: "Tenants", icon: "⬡" },
    { id: "users", label: "Users", icon: "◎" },
  ] as const;

  return (
    <div className="min-h-screen bg-[#080809] text-white" style={{ fontFamily: "'DM Mono', monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@700;800&display=swap');
        ::-webkit-scrollbar { width: 4px; } 
        ::-webkit-scrollbar-track { background: #0f0f13; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
        .tab-active { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-2xl transition-all
          ${toast.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header className="border-b border-white/5 px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 bg-[#080809]/95 backdrop-blur-sm z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-sm font-bold">F</div>
          <div>
            <p className="text-white font-bold text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>FileVault</p>
            <p className="text-zinc-600 text-xs">Super Admin</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-zinc-500 text-xs hidden sm:block">System Online</span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-[#0f0f13] p-1.5 rounded-2xl border border-white/5 w-fit">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setSearch(""); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                ${tab === t.id ? "tab-active shadow-lg" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              <span>{t.icon}</span>
              <span className="hidden sm:block">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* ── STATS TAB ─────────────────────────────────────── */}
        {!loading && tab === "stats" && stats && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>System Overview</h1>
              <p className="text-zinc-600 text-sm mt-1">Real-time platform metrics</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Tenants" value={stats.totalTenants} accent="bg-indigo-500" />
              <StatCard label="Active" value={stats.activeTenants} sub="tenants" accent="bg-emerald-500" />
              <StatCard label="Banned" value={stats.bannedTenants} sub="tenants" accent="bg-red-500" />
              <StatCard label="Total Users" value={stats.totalUsers} accent="bg-violet-500" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StatCard label="Total Files" value={stats.totalFiles} accent="bg-amber-500" />

              <div className="rounded-2xl p-6 bg-[#0f0f13] border border-white/5">
                <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-4">Plan Breakdown</p>
                <div className="space-y-3">
                  {stats.planBreakdown.map(p => (
                    <div key={p.plan} className="flex items-center justify-between">
                      <PlanBadge plan={p.plan} />
                      <div className="flex items-center gap-3 flex-1 ml-4">
                        <div className="flex-1 bg-white/5 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${planDot[p.plan]}`}
                            style={{ width: `${Math.min((p.count / stats.totalTenants) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-white font-bold text-sm w-6 text-right">{p.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TENANTS TAB ───────────────────────────────────── */}
        {!loading && tab === "tenants" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>Tenants</h1>
                <p className="text-zinc-600 text-sm">{tenants.length} registered organizations</p>
              </div>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search tenants..."
                className="bg-[#0f0f13] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 w-full sm:w-64"
              />
            </div>

            <div className="space-y-2">
              {filteredTenants.map(t => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTenant(t)}
                  className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all hover:border-white/20
                    ${t.isBanned ? "bg-red-950/20 border-red-900/30" : "bg-[#0f0f13] border-white/5"}`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0
                      ${t.isBanned ? "bg-red-900/50 text-red-400" : "bg-indigo-900/50 text-indigo-400"}`}>
                      {t.name[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-medium text-sm truncate">{t.name}</p>
                      <p className="text-zinc-600 text-xs">{t._count.users} users · {t._count.files} files</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                    <PlanBadge plan={t.plan} />
                    {t.isBanned && (
                      <span className="text-xs px-2 py-1 bg-red-900/50 text-red-400 rounded-full font-bold">BANNED</span>
                    )}
                    <span className="text-zinc-600 text-lg">›</span>
                  </div>
                </div>
              ))}

              {filteredTenants.length === 0 && (
                <div className="text-center py-16 text-zinc-600">No tenants found</div>
              )}
            </div>
          </div>
        )}

        {/* ── USERS TAB ─────────────────────────────────────── */}
        {!loading && tab === "users" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>Users</h1>
                <p className="text-zinc-600 text-sm">{users.length} registered users</p>
              </div>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search users..."
                className="bg-[#0f0f13] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 w-full sm:w-64"
              />
            </div>

            <div className="space-y-2">
              {filteredUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between p-4 rounded-xl bg-[#0f0f13] border border-white/5">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-violet-900/50 text-violet-400 flex items-center justify-center text-sm font-black flex-shrink-0">
                      {u.email[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm truncate">{u.email}</p>
                      <p className="text-zinc-600 text-xs">{u.tenant?.name || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold
                      ${u.role === "OWNER" ? "bg-indigo-900/50 text-indigo-400"
                        : u.role === "ADMIN" ? "bg-amber-900/50 text-amber-400"
                        : "bg-zinc-800 text-zinc-400"}`}>
                      {u.role}
                    </span>
                    {u.tenant && <PlanBadge plan={u.tenant.plan} />}
                  </div>
                </div>
              ))}

              {filteredUsers.length === 0 && (
                <div className="text-center py-16 text-zinc-600">No users found</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── TENANT DETAIL MODAL ───────────────────────────── */}
      {selectedTenant && (
        <Modal title={selectedTenant.name} onClose={() => setSelectedTenant(null)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Plan", value: <PlanBadge plan={selectedTenant.plan} /> },
                { label: "Status", value: selectedTenant.isBanned ? <span className="text-red-400 font-bold text-sm">Banned</span> : <span className="text-emerald-400 font-bold text-sm">Active</span> },
                { label: "Users", value: <span className="text-white text-sm">{selectedTenant._count.users}</span> },
                { label: "Files", value: <span className="text-white text-sm">{selectedTenant._count.files}</span> },
                { label: "Storage", value: <span className="text-white text-sm">{selectedTenant.storageUsed} MB</span> },
                { label: "Folders", value: <span className="text-white text-sm">{selectedTenant._count.folders}</span> },
              ].map(item => (
                <div key={item.label} className="bg-white/5 rounded-xl p-3">
                  <p className="text-zinc-600 text-xs mb-1">{item.label}</p>
                  {item.value}
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setPlanModal(selectedTenant); setNewPlan(selectedTenant.plan); setSelectedTenant(null); }}
                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-colors"
              >
                Change Plan
              </button>
              <button
                onClick={() => handleBanToggle(selectedTenant.id)}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors
                  ${selectedTenant.isBanned
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                    : "bg-red-600 hover:bg-red-500 text-white"}`}
              >
                {selectedTenant.isBanned ? "Unban" : "Ban"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── PLAN CHANGE MODAL ─────────────────────────────── */}
      {planModal && (
        <Modal title="Change Plan" onClose={() => setPlanModal(null)}>
          <div className="space-y-4">
            <p className="text-zinc-500 text-sm">Select a new plan for <strong className="text-white">{planModal.name}</strong></p>
            <div className="grid grid-cols-2 gap-3">
              {(["FREE", "SILVER", "GOLD", "DIAMOND"] as Plan[]).map(p => (
                <button
                  key={p}
                  onClick={() => setNewPlan(p)}
                  className={`p-3 rounded-xl border text-sm font-bold transition-all flex items-center gap-2
                    ${newPlan === p ? "border-indigo-500 bg-indigo-900/30 text-indigo-400" : "border-white/10 text-zinc-500 hover:border-white/20"}`}
                >
                  <span className={`w-2 h-2 rounded-full ${planDot[p]}`} />
                  {p}
                </button>
              ))}
            </div>
            <button
              onClick={handlePlanChange}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm hover:opacity-90 transition-opacity"
            >
              Confirm Change
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}