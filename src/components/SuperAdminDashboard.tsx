import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  FiBarChart2,
  FiUsers,
  FiUser,
  FiCreditCard,
  FiActivity,
  FiHome,
  FiLogOut,
  FiRefreshCw,
  FiSearch,
  FiFilter,
} from "react-icons/fi";
import {
  useGetStatsQuery,
  useGetAllTenantsQuery,
  useToggleBanTenantMutation,
  useChangeTenantPlanMutation,
  useGetAllUsersQuery,
  useGetAllBillingQuery,
  useGetAuditLogsQuery,
} from "../Redux/adminApi";
import {
  AreaChart,
  BarChart,
  DonutChart,
  PLAN_CHART_COLORS,
  CHART_COLORS,
} from "./dashboard/Charts";
import Select from "./Select";

type Plan = "FREE" | "SILVER" | "GOLD" | "DIAMOND";
type TabId = "overview" | "tenants" | "users" | "billing" | "logs";

type Stats = {
  totalTenants: number;
  activeTenants: number;
  bannedTenants: number;
  totalUsers: number;
  totalFiles: number;
  totalStorage: number;
  mrr: number;
  totalRevenue: number;
  paidPayments: number;
  activeSubscriptions: number;
  failedPayments: number;
  pendingCheckouts: number;
  signupsLast7: number;
  signupsLast30: number;
  planBreakdown: { plan: Plan; count: number }[];
  roleBreakdown: { role: string; count: number }[];
  revenueByPlan: { plan: Plan; amount: number }[];
  signupTrend: { date: string; value: number }[];
  revenueTrend: { date: string; value: number }[];
  recentSignups: {
    id: string;
    name: string;
    plan: Plan;
    subscriptionStatus: string | null;
    isBanned: boolean;
    createdAt: string;
  }[];
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

type BillingType = "CHECKOUT" | "PAYMENT" | "SUBSCRIPTION";
type BillingStatus = "PENDING" | "PAID" | "ACTIVE" | "COMPLETED" | "FAILED" | "CANCELED";
type BillingRecord = {
  id: string;
  tenantName: string | null;
  plan: Plan;
  type: BillingType;
  status: BillingStatus;
  amount: number;
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
};

// ── Visual helpers ───────────────────────────────────────────────────────────
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

const roleColors: Record<string, string> = {
  OWNER: "bg-indigo-900/50 text-indigo-400",
  ADMIN: "bg-amber-900/50 text-amber-400",
  MEMBER: "bg-zinc-800 text-zinc-400",
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

const formatMoney = (cents: number, currency: string) => {
  const symbol = currency?.toUpperCase() === "USD" ? "$" : `${currency?.toUpperCase() ?? ""} `;
  return `${symbol}${(cents / 100).toFixed(2)}`;
};

const formatStorage = (mb: number) =>
  mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${Math.round(mb)} MB`;

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

// ── Small building blocks ────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon?: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-5 bg-[#0f0f13] border border-white/5">
      <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full blur-3xl opacity-20 ${accent}`} />
      <div className="flex items-start justify-between mb-3">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-500">{label}</p>
        {icon && <span className="text-zinc-600">{icon}</span>}
      </div>
      <p className="text-3xl font-black text-white truncate">{value}</p>
      {sub && <p className="text-[11px] text-zinc-600 mt-1">{sub}</p>}
    </div>
  );
}

function Panel({ title, subtitle, children, className = "" }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-[#0f0f13] border border-white/5 p-5 ${className}`}>
      <div className="mb-4">
        <h3 className="text-white font-bold text-sm">{title}</h3>
        {subtitle && <p className="text-zinc-600 text-xs mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function PlanBadge({ plan }: { plan: Plan }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${planColors[plan]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${planDot[plan]}`} />
      {plan}
    </span>
  );
}

function SubscriptionStatusBadge({ status }: { status?: string | null }) {
  if (!status || status === "ACTIVE") return null;
  if (status === "INCOMPLETE") {
    return (
      <span className="text-xs px-2 py-1 bg-amber-900/50 text-amber-400 rounded-full font-bold whitespace-nowrap">
        PAYMENT PENDING
      </span>
    );
  }
  return (
    <span className="text-xs px-2 py-1 bg-zinc-800 text-zinc-400 rounded-full font-bold whitespace-nowrap">
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

function EmptyState({ message }: { message: string }) {
  return <div className="text-center py-16 text-zinc-600 text-sm">{message}</div>;
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function SuperAdminDashboard() {
  const [tab, setTab] = useState<TabId>("overview");
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [planModal, setPlanModal] = useState<Tenant | null>(null);
  const [newPlan, setNewPlan] = useState<Plan>("FREE");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Logs tab state (scrolling pagination)
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [logsPage, setLogsPage] = useState(1);
  const [logsSearch, setLogsSearch] = useState("");
  const [logsAction, setLogsAction] = useState("");
  const [logsStatus, setLogsStatus] = useState("");
  const [totalLogs, setTotalLogs] = useState(0);
  const logsSentinelRef = useRef<HTMLDivElement | null>(null);

  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useGetStatsQuery(undefined, { skip: tab !== "overview" });
  const { data: tenantsData, isLoading: tenantsLoading, refetch: refetchTenants } = useGetAllTenantsQuery(undefined, { skip: tab !== "tenants" });
  const { data: usersData, isLoading: usersLoading } = useGetAllUsersQuery(undefined, { skip: tab !== "users" });
  const { data: billingData, isLoading: billingLoading } = useGetAllBillingQuery(undefined, { skip: tab !== "billing" });

  const [toggleBanTenant] = useToggleBanTenantMutation();
  const [changeTenantPlan] = useChangeTenantPlanMutation();

  const stats: Stats | null = (statsData?.data as Stats) ?? null;
  const tenants: Tenant[] = (tenantsData?.data as Tenant[]) ?? [];
  const users: User[] = (usersData?.data as User[]) ?? [];
  const billing: BillingRecord[] = (billingData?.data?.records as BillingRecord[]) ?? [];
  const billingSummary: BillingSummary | null = (billingData?.data?.summary as BillingSummary) ?? null;

  const loading = tab === "overview" ? statsLoading
    : tab === "tenants" ? tenantsLoading
    : tab === "users" ? usersLoading
    : billingLoading;

  // ── Logs: pagination + filters ─────────────────────────────────────────
  const logsParams = new URLSearchParams({ page: String(logsPage), limit: "20" });
  if (logsSearch) logsParams.set("search", logsSearch);
  if (logsAction) logsParams.set("action", logsAction);
  if (logsStatus) logsParams.set("status", logsStatus);

  const { data: logsData, isFetching: logsFetching, isError: logsError } = useGetAuditLogsQuery(logsParams.toString(), { skip: tab !== "logs" });

  useEffect(() => {
    if (tab === "logs") {
      setLogs([]);
      setLogsPage(1);
      setTotalLogs(0);
    }
  }, [tab, logsSearch, logsAction, logsStatus]);

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

  // ── Actions ─────────────────────────────────────────────────────────────
  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleBanToggle = async (id: string) => {
    try {
      const d = await toggleBanTenant(id).unwrap();
      showToast(d.message);
      refetchTenants();
      setSelectedTenant(null);
    } catch {
      showToast("Failed to update ban status", "error");
    }
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
    } catch {
      showToast("Failed to update plan", "error");
    }
  };

  const filteredTenants = tenants.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));
  const filteredUsers = users.filter((u) => u.email.toLowerCase().includes(search.toLowerCase()));

  const NAV: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <FiBarChart2 /> },
    { id: "tenants", label: "Tenants", icon: <FiUsers /> },
    { id: "users", label: "Users", icon: <FiUser /> },
    { id: "billing", label: "Billing", icon: <FiCreditCard /> },
    { id: "logs", label: "Audit Logs", icon: <FiActivity /> },
  ];

  return (
    <div className="min-h-screen bg-[#080809] text-white flex" style={{ fontFamily: "'DM Mono', monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@700;800&display=swap');
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0f0f13; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
        .nav-active { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; }
      `}</style>

      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-2xl transition-all
          ${toast.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
          {toast.msg}
        </div>
      )}

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="hidden lg:flex w-60 flex-col border-r border-white/5 bg-[#0a0a0f] sticky top-0 h-screen flex-shrink-0">
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-sm font-bold">F</div>
          <div>
            <p className="text-white font-bold text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>FileVault</p>
            <p className="text-zinc-600 text-[11px]">Super Admin Console</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => { setTab(item.id); setSearch(""); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                ${tab === item.id ? "nav-active shadow-lg" : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5"}`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-white/5 space-y-1">
          <Link to="/" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-all">
            <FiHome /> View site
          </Link>
          <Link to="/login" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-zinc-500 hover:text-red-400 hover:bg-white/5 transition-all">
            <FiLogOut /> Sign out
          </Link>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden border-b border-white/5 bg-[#0a0a0f] px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold">F</div>
            <p className="text-white font-bold text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>FileVault Admin</p>
          </div>
          <Link to="/" className="text-zinc-500 text-xs">View site</Link>
        </div>
        <div className="lg:hidden flex gap-1 px-3 py-2 overflow-x-auto border-b border-white/5 bg-[#0a0a0f] sticky top-[57px] z-30">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all
                ${tab === item.id ? "nav-active" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        <main className="max-w-[1200px] mx-auto px-4 md:px-8 py-6">
          {loading && tab !== "logs" && (
            <div className="flex items-center justify-center py-24">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* ── OVERVIEW ─────────────────────────────────────────── */}
          {!loading && tab === "overview" && stats && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>Platform Overview</h1>
                  <p className="text-zinc-600 text-sm mt-1">Real-time analytics across tenants, users, files and revenue</p>
                </div>
                <button
                  onClick={() => refetchStats()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-zinc-300 hover:border-white/20 hover:text-white transition-colors"
                >
                  <FiRefreshCw /> Refresh
                </button>
              </div>

              {/* KPI row */}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                <KpiCard label="MRR" value={formatMoney(stats.mrr, "USD")} accent="bg-emerald-500" icon={<FiCreditCard />} />
                <KpiCard label="Total Revenue" value={formatMoney(stats.totalRevenue, "USD")} sub={`${stats.paidPayments} payments`} accent="bg-indigo-500" />
                <KpiCard label="Active Subs" value={stats.activeSubscriptions} accent="bg-violet-500" />
                <KpiCard label="Tenants" value={stats.totalTenants} sub={`${stats.activeTenants} active · ${stats.bannedTenants} banned`} accent="bg-cyan-500" />
                <KpiCard label="Users" value={stats.totalUsers} accent="bg-fuchsia-500" />
                <KpiCard label="Files" value={stats.totalFiles.toLocaleString()} accent="bg-amber-500" />
                <KpiCard label="Storage Used" value={formatStorage(stats.totalStorage)} accent="bg-emerald-500" />
                <KpiCard label="New Signups (30d)" value={stats.signupsLast30} sub={`${stats.signupsLast7} in last 7 days`} accent="bg-sky-500" />
                <KpiCard label="Pending Checkouts" value={stats.pendingCheckouts} accent="bg-amber-500" />
                <KpiCard label="Failed Payments" value={stats.failedPayments} accent="bg-red-500" />
              </div>

              {/* Trend charts */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <Panel title="Revenue" subtitle="Daily collected revenue — last 30 days" className="xl:col-span-2">
                  {stats.revenueTrend.length ? (
                    <AreaChart data={stats.revenueTrend.map((d) => ({ label: d.date, value: d.value }))} color="#10b981" />
                  ) : <EmptyState message="No revenue in the last 30 days" />}
                </Panel>
                <Panel title="New Signups" subtitle="Daily tenant signups — last 30 days">
                  {stats.signupTrend.length ? (
                    <BarChart data={stats.signupTrend.map((d) => ({ label: d.date, value: d.value }))} color="#6366f1" />
                  ) : <EmptyState message="No signups in the last 30 days" />}
                </Panel>
              </div>

              {/* Distribution charts */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Panel title="Plan Distribution" subtitle="Tenants by plan">
                  <DonutChart
                    segments={["FREE", "SILVER", "GOLD", "DIAMOND"].map((p) => ({
                      label: p,
                      value: stats.planBreakdown.find((x) => x.plan === p)?.count ?? 0,
                      color: PLAN_CHART_COLORS[p],
                    }))}
                  />
                </Panel>
                <Panel title="Revenue by Plan" subtitle="Collected revenue per plan (USD)">
                  {stats.revenueByPlan.length ? (
                    <div className="space-y-3">
                      {stats.revenueByPlan.map((p, i) => (
                        <div key={p.plan} className="flex items-center gap-3">
                          <PlanBadge plan={p.plan} />
                          <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                                width: `${(p.amount / Math.max(...stats.revenueByPlan.map((x) => x.amount), 1)) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-white font-bold text-xs w-16 text-right">{formatMoney(p.amount, "USD")}</span>
                        </div>
                      ))}
                    </div>
                  ) : <EmptyState message="No revenue recorded yet" />}
                </Panel>
                <Panel title="Users by Role">
                  <div className="space-y-3">
                    {stats.roleBreakdown.length ? (
                      stats.roleBreakdown.map((r, i) => (
                        <div key={r.role} className="flex items-center gap-3">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${roleColors[r.role] ?? "bg-zinc-800 text-zinc-400"}`}>{r.role}</span>
                          <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                                width: `${(r.count / Math.max(...stats.roleBreakdown.map((x) => x.count), 1)) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-white font-bold text-xs w-8 text-right">{r.count}</span>
                        </div>
                      ))
                    ) : <EmptyState message="No users yet" />}
                  </div>
                </Panel>
              </div>

              {/* Recent signups */}
              <Panel title="Recent Signups" subtitle="Newest organizations on the platform">
                <div className="divide-y divide-white/5">
                  {stats.recentSignups.map((t) => (
                    <div key={t.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-indigo-900/50 text-indigo-400 flex items-center justify-center text-sm font-black flex-shrink-0">
                          {t.name[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium truncate">{t.name}</p>
                          <p className="text-zinc-600 text-xs">{formatDate(t.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <PlanBadge plan={t.plan} />
                        {t.isBanned && <span className="text-xs px-2 py-1 bg-red-900/50 text-red-400 rounded-full font-bold">BANNED</span>}
                      </div>
                    </div>
                  ))}
                  {stats.recentSignups.length === 0 && <EmptyState message="No signups yet" />}
                </div>
              </Panel>
            </div>
          )}

          {/* ── TENANTS ─────────────────────────────────────────── */}
          {!loading && tab === "tenants" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>Tenants</h1>
                  <p className="text-zinc-600 text-sm">{tenants.length} registered organizations</p>
                </div>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search tenants..."
                    className="bg-[#0f0f13] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 w-full sm:w-64"
                  />
                </div>
              </div>

              <div className="space-y-2">
                {filteredTenants.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTenant(t)}
                    className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all hover:border-white/20
                      ${t.isBanned ? "bg-red-950/20 border-red-900/30" : "bg-[#0f0f13] border-white/5"}`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0
                        ${t.isBanned ? "bg-red-900/50 text-red-400" : "bg-indigo-900/50 text-indigo-400"}`}>
                        {t.name[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-medium text-sm truncate">{t.name}</p>
                        <p className="text-zinc-600 text-xs">{t._count.users} users · {t._count.files} files · {formatStorage(t.storageUsed)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                      <PlanBadge plan={t.plan} />
                      <SubscriptionStatusBadge status={t.subscriptionStatus} />
                      {t.isBanned && <span className="text-xs px-2 py-1 bg-red-900/50 text-red-400 rounded-full font-bold">BANNED</span>}
                      <span className="text-zinc-600 text-lg">›</span>
                    </div>
                  </div>
                ))}
                {filteredTenants.length === 0 && <EmptyState message="No tenants found" />}
              </div>
            </div>
          )}

          {/* ── USERS ───────────────────────────────────────────── */}
          {!loading && tab === "users" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>Users</h1>
                  <p className="text-zinc-600 text-sm">{users.length} registered users</p>
                </div>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search users..."
                    className="bg-[#0f0f13] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 w-full sm:w-64"
                  />
                </div>
              </div>

              <div className="space-y-2">
                {filteredUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-4 rounded-xl bg-[#0f0f13] border border-white/5">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-violet-900/50 text-violet-400 flex items-center justify-center text-sm font-black flex-shrink-0">
                        {u.email[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-sm truncate">{u.email}</p>
                        <p className="text-zinc-600 text-xs">{u.tenant?.name || "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${roleColors[u.role] ?? "bg-zinc-800 text-zinc-400"}`}>{u.role}</span>
                      {u.tenant && <PlanBadge plan={u.tenant.plan} />}
                      {u.tenant && <SubscriptionStatusBadge status={u.tenant.subscriptionStatus} />}
                    </div>
                  </div>
                ))}
                {filteredUsers.length === 0 && <EmptyState message="No users found" />}
              </div>
            </div>
          )}

          {/* ── BILLING ─────────────────────────────────────────── */}
          {!loading && tab === "billing" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>Billing Ledger</h1>
                <p className="text-zinc-600 text-sm mt-1">Every checkout, payment and subscription event</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                <KpiCard label="Total Records" value={billingSummary?.totalRecords ?? 0} accent="bg-violet-500" />
                <KpiCard label="Revenue" value={formatMoney(billingSummary?.totalRevenue ?? 0, "USD")} accent="bg-emerald-500" />
                <KpiCard label="Successful" value={billingSummary?.paidPayments ?? 0} accent="bg-emerald-500" />
                <KpiCard label="Active Subs" value={billingSummary?.activeSubscriptions ?? 0} accent="bg-indigo-500" />
                <KpiCard label="Failed" value={billingSummary?.failedPayments ?? 0} accent="bg-red-500" />
                <KpiCard label="Pending" value={billingSummary?.pendingCheckouts ?? 0} accent="bg-amber-500" />
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
                    {billing.map((b) => (
                      <tr key={b.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="px-4 py-3 text-white">{b.tenantName || "—"}</td>
                        <td className="px-4 py-3"><PlanBadge plan={b.plan} /></td>
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
                {billing.length === 0 && <EmptyState message="No billing activity yet" />}
              </div>
            </div>
          )}

          {/* ── LOGS ────────────────────────────────────────────── */}
          {tab === "logs" && (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>Activity Logs</h1>
                <p className="text-zinc-600 text-sm mt-1">{totalLogs} events recorded</p>
              </div>

              <div className="flex flex-wrap gap-3 items-center">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                  <input
                    value={logsSearch}
                    onChange={(e) => setLogsSearch(e.target.value)}
                    placeholder="Search actor, action, resource, IP..."
                    className="bg-[#0f0f13] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 w-full sm:w-72"
                  />
                </div>
                <Select
                  value={logsAction}
                  onChange={setLogsAction}
                  placeholder="All Actions"
                  icon={<FiFilter />}
                  options={(logsData?.meta?.actions ?? []).map((a: string) => ({ value: a, label: a }))}
                  className="pl-3 pr-3"
                />
                <Select
                  value={logsStatus}
                  onChange={setLogsStatus}
                  placeholder="All Statuses"
                  options={[
                    { value: "SUCCESS", label: "SUCCESS" },
                    { value: "FAILURE", label: "FAILURE" },
                  ]}
                  className="pl-3 pr-3"
                />
                {(logsSearch || logsAction || logsStatus) && (
                  <button
                    onClick={() => { setLogsSearch(""); setLogsAction(""); setLogsStatus(""); }}
                    className="text-xs px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-zinc-400 hover:text-white hover:border-white/20 transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>

              <div className="max-h-[calc(100vh-320px)] overflow-y-auto rounded-2xl bg-[#0f0f13] border border-white/5 divide-y divide-white/5">
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
        </main>
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
                { label: "Storage", value: <span className="text-white text-sm">{formatStorage(selectedTenant.storageUsed)}</span> },
                { label: "Folders", value: <span className="text-white text-sm">{selectedTenant._count.folders}</span> },
              ].map((item) => (
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
              {(["FREE", "SILVER", "GOLD", "DIAMOND"] as Plan[]).map((p) => (
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
