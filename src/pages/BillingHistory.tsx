import { useState, useEffect } from "react";
import { useAppSelector } from "../Redux/hooks";
import { FiSearch, FiDownload, FiCreditCard } from "react-icons/fi";
import { useGetSubscriptionQuery } from "../Redux/billingApi";
import { BASE_URL } from "../config";
import Select from "../components/Select";

const API = `${BASE_URL}/api/v1`;

type Plan = "FREE" | "SILVER" | "GOLD" | "DIAMOND";
type BillingType = "CHECKOUT" | "PAYMENT" | "SUBSCRIPTION";
type BillingStatus = "PENDING" | "PAID" | "ACTIVE" | "COMPLETED" | "FAILED" | "CANCELED";

type BillingRecord = {
  id: string;
  tenantId: string;
  plan: Plan;
  previousPlan: Plan | null;
  type: BillingType;
  status: BillingStatus;
  amount: number;
  currency: string;
  description: string;
  stripeSubscriptionId: string | null;
  stripeCheckoutId: string | null;
  stripeInvoiceId: string | null;
  transactionId: string | null;
  invoiceUrl: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

const planColors: Record<Plan, string> = {
  FREE: "bg-slate-700 text-slate-300",
  SILVER: "bg-zinc-600 text-zinc-200",
  GOLD: "bg-amber-900/50 text-amber-300",
  DIAMOND: "bg-cyan-900/50 text-cyan-300",
};

const statusColors: Record<BillingStatus, string> = {
  PENDING: "bg-amber-900/50 text-amber-400",
  PAID: "bg-emerald-900/50 text-emerald-400",
  ACTIVE: "bg-indigo-900/50 text-indigo-400",
  COMPLETED: "bg-emerald-900/50 text-emerald-400",
  FAILED: "bg-red-900/50 text-red-400",
  CANCELED: "bg-zinc-800 text-zinc-400",
};

const typeColors: Record<BillingType, string> = {
  CHECKOUT: "bg-violet-900/50 text-violet-400",
  PAYMENT: "bg-emerald-900/50 text-emerald-400",
  SUBSCRIPTION: "bg-cyan-900/50 text-cyan-400",
};

const formatMoney = (cents: number, currency: string) => {
  const symbol = currency.toUpperCase() === "USD" ? "$" : `${currency.toUpperCase()} `;
  return `${symbol}${(cents / 100).toFixed(2)}`;
};

const formatDate = (d: string | null) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-medium transition-all
      ${type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}
    >
      <span>{type === "success" ? "✓" : "✕"}</span>
      {msg}
    </div>
  );
}

export default function BillingHistory() {
  const auth = useAppSelector((state) => state.auth);
  const [records, setRecords] = useState<BillingRecord[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const { data: subscription } = useGetSubscriptionQuery(undefined, {
    pollingInterval: 5000,
  });
  const currentPlan: Plan = subscription?.plan ?? "FREE";

  const showToast = (msg: string, type: "success" | "error" = "success") =>
    setToast({ msg, type });

  const getHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: auth.accessToken,
  });

  const fetchHistory = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(meta.limit),
      });
      if (statusFilter) params.append("status", statusFilter);
      if (typeFilter) params.append("type", typeFilter);

      const r = await fetch(`${API}/billing/history?${params}`, {
        headers: getHeaders(),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.message);
      setRecords(d.data || []);
      setMeta({
        page: d.meta?.page || 1,
        limit: d.meta?.limit || 20,
        total: d.meta?.total || 0,
        pages: d.meta?.pages || 0,
      });
    } catch (err: any) {
      showToast(err.message || "Failed to load billing history", "error");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory(1);
  }, [statusFilter, typeFilter]);

  const filtered = records.filter((r) => {
    const searchLower = search.toLowerCase();
    return (
      r.description?.toLowerCase().includes(searchLower) ||
      r.transactionId?.toLowerCase().includes(searchLower) ||
      r.stripeInvoiceId?.toLowerCase().includes(searchLower) ||
      r.plan?.toLowerCase().includes(searchLower)
    );
  });

  const loadPage = (page: number) => {
    if (page < 1 || page > meta.pages) return;
    fetchHistory(page);
  };

  const clearFilters = () => {
    setStatusFilter("");
    setTypeFilter("");
    setSearch("");
    fetchHistory(1);
  };

  return (
    <div className="min-h-screen bg-[#05050a] text-white" style={{ fontFamily: "'DM Mono', monospace" }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
              Billing History
            </h1>
            <p className="text-zinc-600 text-sm mt-1">
              {meta.total} record{meta.total !== 1 ? "s" : ""} • Total spent:{" "}
              <span className="text-emerald-400 font-bold">
                {formatMoney(
                  records
                    .filter((r) => r.status === "PAID" || r.status === "ACTIVE" || r.status === "COMPLETED")
                    .reduce((sum, r) => sum + r.amount, 0),
                  records[0]?.currency || "usd"
                )}
              </span>
            </p>
          </div>
        </div>

        {/* Subscription summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-[#0d0d15] border border-white/5 rounded-2xl p-5">
            <p className="text-zinc-600 text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
              <FiCreditCard className="w-3.5 h-3.5" /> Current Plan
            </p>
            <div className="flex items-center gap-2">
              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${planColors[currentPlan]}`}>
                {subscription?.plan ?? "—"}
              </span>
              {subscription?.pendingPlan && (
                <span className="text-zinc-500 text-xs">
                  → {subscription.pendingPlan} (pending)
                </span>
              )}
            </div>
          </div>

          <div className="bg-[#0d0d15] border border-white/5 rounded-2xl p-5">
            <p className="text-zinc-600 text-xs uppercase tracking-wider mb-2">Subscription Status</p>
            <span
              className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                subscription?.subscriptionStatus === "ACTIVE"
                  ? "bg-emerald-900/50 text-emerald-400"
                  : subscription?.subscriptionStatus === "PAST_DUE"
                    ? "bg-red-900/50 text-red-400"
                    : "bg-amber-900/50 text-amber-400"
              }`}
            >
              {subscription?.subscriptionStatus ?? "—"}
            </span>
          </div>

          <div className="bg-[#0d0d15] border border-white/5 rounded-2xl p-5">
            <p className="text-zinc-600 text-xs uppercase tracking-wider mb-2">Payment Method</p>
            <p className="text-zinc-400 text-sm">
              {subscription?.stripeCustomerId ? "Stripe (linked)" : "Not set up"}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[#0d0d15] border border-white/5 rounded-2xl p-4 mb-6">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 w-4 h-4" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by description, transaction ID, plan..."
                className="w-full bg-white/5 border border-white/10 focus:border-violet-500/40 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors"
              />
            </div>

            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="All Statuses"
              options={[
                { value: "PENDING", label: "Pending" },
                { value: "PAID", label: "Paid" },
                { value: "ACTIVE", label: "Active" },
                { value: "COMPLETED", label: "Completed" },
                { value: "FAILED", label: "Failed" },
                { value: "CANCELED", label: "Canceled" },
              ]}
              className="pl-4 pr-3"
            />

            <Select
              value={typeFilter}
              onChange={setTypeFilter}
              placeholder="All Types"
              options={[
                { value: "CHECKOUT", label: "Checkout" },
                { value: "PAYMENT", label: "Payment" },
                { value: "SUBSCRIPTION", label: "Subscription" },
              ]}
              className="pl-4 pr-3"
            />

            {(search || statusFilter || typeFilter) && (
              <button
                onClick={clearFilters}
                className="text-xs px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-zinc-400 hover:text-white hover:border-white/20 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Billing Table */}
        <div className="bg-[#0d0d15] border border-white/5 rounded-2xl overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-white/5 text-zinc-600 text-left">
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Description</th>
                <th className="px-4 py-3 font-semibold">Plan</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Transaction ID</th>
                <th className="px-4 py-3 font-semibold text-right">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-600">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-zinc-600">
                    <div className="flex flex-col items-center gap-3">
                      <span className="text-3xl">💳</span>
                      No billing records found
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-zinc-400 text-xs">
                      {formatDate(r.paidAt || r.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-white text-sm">{r.description || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${planColors[r.plan]}`}>
                        {r.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${typeColors[r.type]}`}>
                        {r.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${statusColors[r.status]}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white font-medium">
                      {formatMoney(r.amount, r.currency)}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs font-mono" title={r.transactionId || ""}>
                      {r.transactionId ? (
                        <span className="break-all">{r.transactionId.slice(0, 12)}...</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.invoiceUrl ? (
                        <a
                          href={r.invoiceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/20 transition-colors"
                        >
                          <FiDownload className="w-3 h-3" />
                          View
                        </a>
                      ) : (
                        <span className="text-zinc-600 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && meta.pages > 1 && (
          <div className="flex items-center justify-between mt-6 text-sm">
            <p className="text-zinc-500">
              Page {meta.page} of {meta.pages} ({meta.total} records)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => loadPage(meta.page - 1)}
                disabled={meta.page <= 1}
                className="px-4 py-2 bg-[#0f0f13] border border-white/10 rounded-xl text-zinc-400 hover:text-white hover:border-white/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(meta.pages, 5) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => loadPage(pageNum)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
                      ${
                        meta.page === pageNum
                          ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
                          : "bg-[#0f0f13] border border-white/10 text-zinc-400 hover:text-white hover:border-white/20"
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => loadPage(meta.page + 1)}
                disabled={meta.page >= meta.pages}
                className="px-4 py-2 bg-[#0f0f13] border border-white/10 rounded-xl text-zinc-400 hover:text-white hover:border-white/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
