import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { RootState } from "./Redux/store";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
export const BASE_URL = import.meta.env.VITE_APP_BASE_URL;
const plans = [
  {
    name: "Free",
    price: "$0",
    desc: "Perfect to get started",
    features: ["2 Files", "2 Folders", "10 MB Storage", "2 Folder Levels"],
    cta: "Start Free",
    highlight: false,
  },
  {
    name: "Silver",
    price: "$5",
    desc: "For small teams",
    features: ["4 Files", "4 Folders", "100 MB Storage", "4 Folder Levels", "Email Support"],
    cta: "Get Silver",
    highlight: true,
  },
  {
    name: "Gold",
    price: "$15",
    desc: "For growing teams",
    features: ["20 Files", "20 Folders", "500 MB Storage", "6 Folder Levels", "Priority Support"],
    cta: "Get Gold",
    highlight: false,
  },
  {
    name: "Diamond",
    price: "$49",
    desc: "Unlimited everything",
    features: ["Unlimited Files", "Unlimited Folders", "Unlimited Storage", "Unlimited Levels", "24/7 Support"],
    cta: "Get Diamond",
    highlight: false,
  },
];

const features = [
  { icon: "◈", title: "Multi-tenant Architecture", desc: "Complete data isolation between organizations. Your files, your rules." },
  { icon: "⬡", title: "Role-based Access", desc: "Owner, Admin, Member roles with granular permissions per organization." },
  { icon: "◎", title: "Stripe Billing", desc: "Seamless subscription management with automatic plan enforcement." },
  { icon: "△", title: "Cloudinary Storage", desc: "Fast, reliable file delivery with global CDN and auto-optimization." },
  { icon: "◇", title: "Email Notifications", desc: "Automated emails for billing events, invites, and account changes." },
  { icon: "□", title: "Plan Enforcement", desc: "Automatic storage and file limits enforced at the API level." },
];

function FloatingOrb({ className }: { className: string }) {
  return <div className={`absolute rounded-full blur-3xl pointer-events-none ${className}`} />;
}

function AnimatedCounter({ end, duration = 2000 }: { end: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        let start = 0;
        const step = end / (duration / 16);
        const timer = setInterval(() => {
          start += step;
          if (start >= end) { setCount(end); clearInterval(timer); }
          else setCount(Math.floor(start));
        }, 16);
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
}

function App() {
  const navigate = useNavigate();
  const auth = useSelector((state: RootState) => state.auth);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  const handleSubscribe = async (plan: string) => {
    if (!auth?.accessToken) {
      //toast.error("Please login first");
      return navigate("/login");
    }

    setSubscribing(plan);
    try {
      const res = await fetch(`${BASE_URL}/api/v1/billing/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: auth.accessToken,
        },
        body: JSON.stringify({ plan: plan.toUpperCase() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      if (data.data?.url) {
        // Paid plan → Stripe checkout এ redirect
        window.location.href = data.data.url;
      } else {
        // FREE plan
        toast.success("Free plan activated!");
      }
    } catch (err: any) {
      toast.error(err.message || "Subscription failed");
    }
    setSubscribing(null);
  };

  return (
    <div className="bg-[#05050a] text-white overflow-x-hidden mt-10" style={{ fontFamily: "'DM Mono', monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800;900&display=swap');
        .gradient-text { background: linear-gradient(135deg, #a78bfa, #f0abfc, #67e8f9); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .card-glow:hover { box-shadow: 0 0 40px rgba(139,92,246,0.15); }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes grid-move { 0%{transform:translateY(0)} 100%{transform:translateY(40px)} }
        .float { animation: float 6s ease-in-out infinite; }
        .grid-bg {
          background-image: linear-gradient(rgba(139,92,246,0.06) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(139,92,246,0.06) 1px, transparent 1px);
          background-size: 40px 40px;
          animation: grid-move 8s linear infinite;
        }
      `}</style>

      {/* ── HERO ───────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 text-center overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <FloatingOrb className="w-[600px] h-[600px] bg-violet-600/15 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <FloatingOrb className="w-96 h-96 bg-fuchsia-600/10 top-0 right-0" />
        <FloatingOrb className="w-72 h-72 bg-cyan-500/8 bottom-0 left-0" />

        <div className="relative z-10 max-w-5xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-2 mb-8">
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-violet-300 text-xs font-medium tracking-widest uppercase">Multi-tenant SaaS</span>
          </div>

          {/* Headline */}
          <h1
            className="text-5xl sm:text-6xl md:text-8xl font-black leading-none mb-6 tracking-tight"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Manage Files.<br />
            <span className="gradient-text">Own Your Data.</span>
          </h1>

          <p className="text-zinc-400 text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            Enterprise-grade file management with multi-tenant isolation, role-based access, and seamless billing — built for SaaS teams.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold px-8 py-4 rounded-2xl text-sm transition-all shadow-2xl shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5"
            >
              Start for Free →
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto border border-white/10 hover:border-white/20 text-zinc-300 font-medium px-8 py-4 rounded-2xl text-sm transition-all hover:bg-white/5"
            >
              Sign In
            </Link>
          </div>

          {/* Hero Visual */}
          <div className="mt-16 float relative">
            <div className="bg-[#0d0d15] border border-white/10 rounded-2xl p-6 max-w-2xl mx-auto shadow-2xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
                <div className="flex-1 bg-white/5 rounded-md h-5 mx-2" />
              </div>
              <div className="space-y-3">
                {[
                  { icon: "📁", name: "Documents", size: "24 files", color: "text-violet-400" },
                  { icon: "🖼️", name: "Images", size: "156 MB", color: "text-fuchsia-400" },
                  { icon: "📊", name: "Reports", size: "8 files", color: "text-cyan-400" },
                ].map((f) => (
                  <div key={f.name} className="flex items-center justify-between bg-white/3 hover:bg-white/5 rounded-xl p-3 transition-colors group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{f.icon}</span>
                      <div>
                        <p className={`text-sm font-medium ${f.color}`}>{f.name}</p>
                        <p className="text-zinc-600 text-xs">{f.size}</p>
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <span className="text-zinc-600 text-xs px-2 py-1 bg-white/5 rounded-lg">Open</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ──────────────────────────────────────────────── */}
      <section className="py-16 border-y border-white/5 bg-[#08080f]">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: 1200, suffix: "+", label: "Active Teams" },
            { value: 99, suffix: ".9%", label: "Uptime SLA" },
            { value: 50, suffix: "M+", label: "Files Stored" },
            { value: 4, suffix: " Plans", label: "Pricing Tiers" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-3xl md:text-4xl font-black text-white mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>
                <AnimatedCounter end={s.value} />{s.suffix}
              </p>
              <p className="text-zinc-600 text-xs tracking-widest uppercase">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────── */}
      <section id="features" className="py-24 px-4 relative">
        <FloatingOrb className="w-96 h-96 bg-violet-600/8 top-1/2 left-0 -translate-y-1/2" />
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-violet-400 text-xs font-bold tracking-widest uppercase mb-4">Platform Features</p>
            <h2 className="text-4xl md:text-5xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
              Everything you need.<br /><span className="gradient-text">Nothing you don't.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="card-glow bg-[#0d0d15] border border-white/5 hover:border-violet-500/20 rounded-2xl p-6 transition-all group"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 text-lg mb-4 group-hover:bg-violet-500/20 transition-colors">
                  {f.icon}
                </div>
                <h3 className="text-white font-bold text-sm mb-2">{f.title}</h3>
                <p className="text-zinc-600 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-4 bg-[#08080f] relative overflow-hidden">
        <FloatingOrb className="w-[500px] h-[500px] bg-fuchsia-600/8 top-1/2 right-0 -translate-y-1/2" />
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-fuchsia-400 text-xs font-bold tracking-widest uppercase mb-4">Pricing</p>
            <h2 className="text-4xl md:text-5xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
              Simple, <span className="gradient-text">transparent</span> pricing.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`relative rounded-2xl p-6 flex flex-col transition-all card-glow
                  ${p.highlight
                    ? "bg-gradient-to-b from-violet-600/20 to-fuchsia-600/10 border border-violet-500/40 shadow-2xl shadow-violet-500/20"
                    : "bg-[#0d0d15] border border-white/5 hover:border-white/10"
                  }`}
              >
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <p className="text-zinc-400 text-xs font-bold tracking-widest uppercase mb-1">{p.name}</p>
                  <p className="text-3xl font-black text-white mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>
                    {p.price}<span className="text-zinc-600 text-sm font-normal">/mo</span>
                  </p>
                  <p className="text-zinc-600 text-xs">{p.desc}</p>
                </div>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-zinc-400">
                      <span className="text-violet-400 text-xs">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                {/* <Link
                  to="/signup"
                  className={`text-center py-3 rounded-xl text-sm font-bold transition-all
                    ${p.highlight
                      ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:opacity-90"
                      : "border border-white/10 text-zinc-400 hover:border-white/20 hover:text-white"
                    }`}
                >
                  {p.cta}
                </Link> */}
                <button
                  onClick={() => handleSubscribe(p.name.toUpperCase())}
                  disabled={subscribing === p.name.toUpperCase()}
                  className={`w-full text-center py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50
    ${p.highlight
                      ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:opacity-90"
                      : "border border-white/10 text-zinc-400 hover:border-white/20 hover:text-white"
                    }`}
                >
                  {subscribing === p.name.toUpperCase() ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : p.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────── */}
      <section className="py-24 px-4 relative overflow-hidden">
        <FloatingOrb className="w-[600px] h-[600px] bg-violet-600/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
            Ready to take<br /><span className="gradient-text">control?</span>
          </h2>
          <p className="text-zinc-500 text-base mb-10 max-w-xl mx-auto">
            Join thousands of teams who trust FileVault for secure, organized file management.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold px-10 py-4 rounded-2xl text-sm transition-all shadow-2xl shadow-violet-500/30 hover:-translate-y-0.5"
          >
            Start for Free
            <span>→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

export default App;