import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BASE_URL } from "../App";

const API = `${BASE_URL}/api/v1`;

const Signup = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    companyName: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      localStorage.setItem("token", data.data.token);
      localStorage.setItem("role", data.data.user.role);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#05050a] flex items-center justify-center px-4 py-20 relative overflow-hidden">
      {/* Orbs */}
      <div className="absolute w-96 h-96 bg-fuchsia-600/10 rounded-full blur-3xl top-0 left-0 pointer-events-none" />
      <div className="absolute w-72 h-72 bg-violet-600/8 rounded-full blur-3xl bottom-0 right-0 pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="bg-[#0d0d15] border border-white/8 rounded-3xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2.5 mb-6">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-white font-black shadow-lg shadow-violet-500/25">
                F
              </div>
              <span className="text-white font-black text-xl tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
                File<span className="text-violet-400">Vault</span>
              </span>
            </div>
            <h1 className="text-2xl font-black text-white mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>
              Create account
            </h1>
            <p className="text-zinc-600 text-sm">Start managing files for your team</p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-6">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-zinc-500 text-xs font-medium tracking-widest uppercase block mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={form.fullName}
                  onChange={e => setForm({ ...form, fullName: e.target.value })}
                  placeholder="John Doe"
                  className="w-full bg-white/5 border border-white/10 focus:border-violet-500/50 rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-700 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-zinc-500 text-xs font-medium tracking-widest uppercase block mb-2">
                  Company
                </label>
                <input
                  type="text"
                  required
                  value={form.companyName}
                  onChange={e => setForm({ ...form, companyName: e.target.value })}
                  placeholder="Acme Inc."
                  className="w-full bg-white/5 border border-white/10 focus:border-violet-500/50 rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-700 outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-zinc-500 text-xs font-medium tracking-widest uppercase block mb-2">
                Email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="you@company.com"
                className="w-full bg-white/5 border border-white/10 focus:border-violet-500/50 rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-700 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-zinc-500 text-xs font-medium tracking-widest uppercase block mb-2">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Min. 6 characters"
                className="w-full bg-white/5 border border-white/10 focus:border-violet-500/50 rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-700 outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : "Create Account →"}
            </button>
          </form>

          <p className="text-center text-zinc-600 text-sm mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;