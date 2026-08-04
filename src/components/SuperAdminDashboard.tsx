import { useState, useEffect, useRef } from "react";
import {
  useGetStatsQuery,
  useGetAllTenantsQuery,
  useToggleBanTenantMutation,
  useChangeTenantPlanMutation,
  useGetAllUsersQuery,
  useGetAllBillingQuery,
  useGetAuditLogsQuery,
} from "../Redux/adminApi";

type Plan = "FREE" | "SILVER" | "GOLD" | "DIAMOND";
type AuditLogEntry = {
  _id: string;
  actorId: string | null;
  actorEmail: string;
  actorRole: string;
  action: string;
  resource: string;
  resourceId: string | null;
  tenantId: string | null;
  ipAddress: string;
  userAgent: string;
  details: Record<string, any> | null;
  status: "SUCCESS" | "FAILURE";
  createdAt: string;
  updatedAt: string;
};
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
  tenant: { name: string; plan: Plan; subscriptionStatus: string | null; isBanned: boolean } | null;
};
type Stats = {
  totalTenants: number;
  activeTenants: number;
  bannedTenants: number;
  totalUsers: number;
  totalFiles: number;
  planBreakdown: { plan: Plan; count: number }[];
};
type BillingType = "CHECKOUT" | "PAYMENT" | "SUBSCRIPTION";
type BillingStatus = "PENDING" | "PAID" | "ACTIVE" | "COMPLETED" | "FAILED" | "CANCELED";
type BillingRecord = {
  id: string;
  tenantName: string | null;
  plan: Plan;
  type: BillingType;
  status: BillingStatus;
  amount: number; // cents
  currency: string;
  description: string;
  createdAt: string;
};
type BillingSummary = {
  totalRecords: number;
  totalRevenue: number;
  paidPayments: number;
  activeSubscriptions: number;
  failedPayments: number;
  pendingCheckouts: number;
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

const billingStatusColors: Record<BillingStatus, string> = {
  PENDING: "bg-amber-900/50 text-amber-400",
  PAID: "bg-emerald-900/50 text-emerald-400",
  ACTIVE: "bg-indigo-900/50 text-indigo-400",
  COMPLETED: "bg-emerald-900/50 text-emerald-400",
  FAILED: "bg-red-900/50 text-red-400",
  CANCELED: "bg-zinc-800 text-zinc-400",
};

const billingTypeColors: Record<BillingType, string> = {
  CHECKOUT: "bg-violet-900/50 text-violet-400",
  PAYMENT: "bg-emerald-900/50 text-emerald-400",
  SUBSCRIPTION: "bg-cyan-900/50 text-cyan-400",
};

const formatMoney = (cents: number, currency: string) => {
  const symbol = currency.toUpperCase() === "USD" ? "$" : `${currency.toUpperCase()} `;
  return `${symbol}${(cents / 100).toFixed(2)}`;
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const formatLogTime = (d: string) =>
  new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

const logActionColors: Record<string, string> = {
  LOGIN: "bg-emerald-900/50 text-emerald-400",
  LOGOUT: "bg-zinc-800 text-zinc-400",
  SIGNUP: "bg-indigo-900/50 text-indigo-400",
  PROFILE_UPDATE: "bg-sky-900/50 text-sky-400",
  PASSWORD_CHANGE: "bg-amber-900/50 text-amber-400",
  PAYMENT: "bg-emerald-900/50 text-emerald-400",
  SUBSCRIPTION_CREATED: "bg-violet-900/50 text-violet-400",
  PLAN_CHANGE: "bg-fuchsia-900/50 text-fuchsia-400",
  FILE_UPLOAD: "bg-cyan-900/50 text-cyan-400",
  ADMIN_ACTION: "bg-rose-900/50 text-rose-400",
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

function SubscriptionStatusBadge({ status }: { status?: string | null }) {
  if (!status || status === "ACTIVE") return null;
  if (status === "INCOMPLETE") {
    return (
      <span className="text-xs px-2 py-1 bg-amber-900/50 text-amber-400 rounded-full font-bold">
        PAYMENT PENDING
      </span>
    );
  }
  return (
    <span className="text-xs px-2 py-1 bg-zinc-800 text-zinc-400 rounded-full font-bold">
      {status}
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
  const [tab, setTab] = useState<"stats" | "tenants" | "users" | "billing" | "logs">("stats");
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [planModal, setPlanModal] = useState<Tenant | null>(null);
  const [newPlan, setNewPlan] = useState<Plan>("FREE");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // ── Logs tab state (scrolling pagination) ─────────────────────────
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [logsPage, setLogsPage] = useState(1);
  const [logsSearch, setLogsSearch] = useState("");
  const [logsAction, setLogsAction] = useState("");
  const [logsStatus, setLogsStatus] = useState("");
  const [totalLogs, setTotalLogs] = useState(0);
  const logsSentinelRef = useRef<HTMLDivElement | null>(null);

  const logsParams = new URLSearchParams({
    page: String(logsPage),
    limit: "20",
  });
  if (logsSearch) logsParams.set("search", logsSearch);
  if (logsAction) logsParams.set("action", logsAction);
  if (logsStatus) logsParams.set("status", logsStatus);

  const {
    data: logsData,
    isFetching: logsFetching,
    isError: logsError,
  } = useGetAuditLogsQuery(logsParams.toString(), { skip: tab !== "logs" });

  // Reset + reload page 1 whenever the tab or a log filter changes.
  useEffect(() => {
    if (tab === "logs") {
      setLogs([]);
      setLogsPage(1);
      setTotalLogs(0);
    }
  }, [tab, logsSearch, logsAction, logsStatus]);

  // Merge incoming pages into the list (replace on page 1, dedupe on append).
  useEffect(() => {
    if (tab !== "logs" || !logsData?.data) return;
    const incoming = logsData.data as AuditLogEntry[];
    setLogs((prev) => {
      if (logsPage === 1) return incoming;
      const seen = new Set(prev.map((l) => l._id));
      return [...prev, ...incoming.filter((l) => !seen.has(l._id))];
    });
    setTotalLogs(logsData.meta?.total ?? 0);
  }, [logsData, logsPage, tab]);

  const totalLogPages = logsData?.meta?.pages ?? 1;

  // Infinite scroll: load the next page when the sentinel scrolls into view.
  useEffect(() => {
    if (tab !== "logs") return;
    const el = logsSentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting);
        if (visible && !logsFetching && logsPage < totalLogPages) {
          setLogsPage((p) => p + 1);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [tab, logsFetching, logsPage, totalLogPages]);

  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useGetStatsQuery(undefined, { skip: tab !== "stats" });
  const { data: tenantsData, isLoading: tenantsLoading, refetch: refetchTenants } = useGetAllTenantsQuery(undefined, { skip: tab !== "tenants" });
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useGetAllUsersQuery(undefined, { skip: tab !== "users" });
  const { data: billingData, isLoading: billingLoading, refetch: refetchBilling } = useGetAllBillingQuery(undefined, { skip: tab !== "billing" });

  const [toggleBanTenant] = useToggleBanTenantMutation();
  const [changeTenantPlan] = useChangeTenantPlanMutation();

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (tab === "stats") refetchStats();
    if (tab === "tenants") refetchTenants();
    if (tab === "users") refetchUsers();
    if (tab === "billing") refetchBilling();
  }, [tab]);

  const stats: Stats | null = (statsData?.data as Stats) ?? null;
  const tenants: Tenant[] = (tenantsData?.data as Tenant[]) ?? [];
  const users: User[] = (usersData?.data as User[]) ?? [];
  const billing: BillingRecord[] = (billingData?.data?.records as BillingRecord[]) ?? [];
  const billingSummary: BillingSummary | null = (billingData?.data?.summary as BillingSummary) ?? null;
  const loading = statsLoading || tenantsLoading || usersLoading || billingLoading;

  const handleBanToggle = async (id: string) => {
    try {
      const d = await toggleBanTenant(id).unwrap();
      showToast(d.message);
      refetchTenants();
      setSelectedTenant(null);
    } catch { showToast("Failed to update ban status", "error"); }
  };

  const handlePlanChange = async () => {
    if (!planModal) return;
    try {
      const d = await changeTenantPlan({ id: planModal.id, plan: newPlan }).unwrap();
      if (d.success) {
        showToast("Plan updated successfully");
        refetchTenants();
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
    { id: "billing", label: "Billing", icon: "¢" },
    { id: "logs", label: "Logs", icon: "≋" },
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
                    <SubscriptionStatusBadge status={t.subscriptionStatus} />
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
                    {u.tenant && <SubscriptionStatusBadge status={u.tenant.subscriptionStatus} />}
                  </div>
                </div>
              ))}

              {filteredUsers.length === 0 && (
                <div className="text-center py-16 text-zinc-600">No users found</div>
              )}
            </div>
          </div>
        )}

        {/* ── BILLING TAB ──────────────────────────────────── */}
        {!loading && tab === "billing" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>Billing Ledger</h1>
              <p className="text-zinc-600 text-sm mt-1">Every checkout, payment and subscription event</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
              <StatCard label="Total Records" value={billingSummary?.totalRecords ?? 0} accent="bg-violet-500" />
              <StatCard label="Revenue (PAID)" value={formatMoney(billingSummary?.totalRevenue ?? 0, "USD")} accent="bg-emerald-500" />
              <StatCard label="Successful Payments" value={billingSummary?.paidPayments ?? 0} accent="bg-emerald-500" />
              <StatCard label="Active Subs" value={billingSummary?.activeSubscriptions ?? 0} accent="bg-indigo-500" />
              <StatCard label="Failed Payments" value={billingSummary?.failedPayments ?? 0} accent="bg-red-500" />
              <StatCard label="Pending Checkouts" value={billingSummary?.pendingCheckouts ?? 0} accent="bg-amber-500" />
            </div>

            <div className="rounded-2xl bg-[#0f0f13] border border-white/5 overflow-x-auto">
              <table className="w-full text-sm min-w-[760px]">
                <thead>
                  <tr className="border-b border-white/5 text-zinc-600 text-left">
                    <th className="px-4 py-3 font-semibold">Tenant</th>
                    <th className="px-4 py-3 font-semibold">Plan</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Amount</th>
                    <th className="px-4 py-3 font-semibold">Description</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {billing.map(b => (
                    <tr key={b.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="px-4 py-3 text-white">{b.tenantName || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${planColors[b.plan]}`}>{b.plan}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${billingTypeColors[b.type]}`}>{b.type}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${billingStatusColors[b.status]}`}>{b.status}</span>
                      </td>
                      <td className="px-4 py-3 text-white">{formatMoney(b.amount, b.currency)}</td>
                      <td className="px-4 py-3 text-zinc-400">{b.description}</td>
                      <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">{formatDate(b.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {billing.length === 0 && (
                <div className="text-center py-16 text-zinc-600">No billing activity yet</div>
              )}
            </div>
          </div>
        )}

        {/* ── LOGS TAB ─────────────────────────────────────── */}
        {!loading && tab === "logs" && (
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>Activity Logs</h1>
            <p className="text-zinc-600 text-sm mt-1">{totalLogs} events recorded</p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <input
              value={logsSearch}
              onChange={(e) => setLogsSearch(e.target.value)}
              placeholder="Search actor, action, resource, IP..."
              className="bg-[#0f0f13] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 w-full sm:w-72"
            />
            <select
              value={logsAction}
              onChange={(e) => setLogsAction(e.target.value)}
              className="bg-[#0f0f13] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Actions</option>
              {(logsData?.meta?.actions ?? []).map((a: string) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <select
              value={logsStatus}
              onChange={(e) => setLogsStatus(e.target.value)}
              className="bg-[#0f0f13] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="FAILURE">FAILURE</option>
            </select>
            {(logsSearch || logsAction || logsStatus) && (
              <button
                onClick={() => { setLogsSearch(""); setLogsAction(""); setLogsStatus(""); }}
                className="text-xs px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-zinc-400 hover:text-white hover:border-white/20 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Scrollable feed (infinite scroll pagination) */}
          <div className="max-h-[560px] overflow-y-auto rounded-2xl bg-[#0f0f13] border border-white/5 divide-y divide-white/5">
            {logs.length === 0 && !logsFetching && (
              <div className="text-center py-16 text-zinc-600">
                {logsError ? "Failed to load logs" : "No activity logs found"}
              </div>
            )}

            {logs.map((entry) => (
              <div key={entry._id} className="px-5 py-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <span className="text-zinc-600 text-xs whitespace-nowrap">{formatLogTime(entry.createdAt)}</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${logActionColors[entry.action] ?? "bg-zinc-800 text-zinc-300"}`}>
                    {entry.action}
                  </span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                    entry.status === "SUCCESS" ? "bg-emerald-900/50 text-emerald-400" : "bg-red-900/50 text-red-400"
                  }`}>
                    {entry.status}
                  </span>
                  <span className="text-zinc-500 text-xs">{entry.resource}{entry.resourceId ? ` · ${entry.resourceId.slice(0, 12)}` : ""}</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                  <span className="text-white font-medium">{entry.actorEmail}</span>
                  <span className="text-zinc-600">{entry.actorRole}</span>
                  {entry.tenantId && <span className="text-zinc-600">tenant: {entry.tenantId.slice(0, 12)}…</span>}
                  <span className="text-zinc-600">IP: {entry.ipAddress || "—"}</span>
                </div>
                {entry.details && Object.keys(entry.details).length > 0 && (
                  <pre className="mt-2 text-[11px] text-zinc-500 bg-black/30 border border-white/5 rounded-lg px-3 py-2 overflow-x-auto">
                    {JSON.stringify(entry.details, null, 2)}
                  </pre>
                )}
              </div>
            ))}

            {logsFetching && (
              <div className="flex items-center justify-center py-6">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!logsFetching && logs.length > 0 && logsPage >= totalLogPages && (
              <div className="text-center py-6 text-zinc-600 text-xs">End of logs</div>
            )}

            <div ref={logsSentinelRef} />
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
                { label: "Subscription", value: <span className="text-white text-sm">{selectedTenant.subscriptionStatus ?? "—"}</span> },
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
