import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useResetPasswordMutation } from "../Redux/authApi";
import { FiLock, FiEye, FiEyeOff } from "react-icons/fi";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as { email?: string }) || {};

  const [email, setEmail] = useState(state.email || "");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);

  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email");
    if (code.length !== 6) return toast.error("Enter the 6-digit code");
    if (newPassword.length < 6) return toast.error("Password must be at least 6 characters");
    if (newPassword !== confirm) return toast.error("Passwords do not match");

    try {
      await resetPassword({ email, code, newPassword }).unwrap();
      toast.success("Password reset! Please sign in with your new password 🎉");
      navigate("/login");
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || "Reset failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#05050a] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute w-96 h-96 bg-violet-600/10 rounded-full blur-3xl top-0 right-0 pointer-events-none" />
      <div className="absolute w-72 h-72 bg-fuchsia-600/8 rounded-full blur-3xl bottom-0 left-0 pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="bg-[#0d0d15] border border-white/8 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white mb-4 mx-auto shadow-lg shadow-violet-500/25">
              <FiLock size={22} />
            </div>
            <h1 className="text-2xl font-black text-white mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>
              Set new password
            </h1>
            <p className="text-zinc-600 text-sm">Enter the reset code and your new password.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-zinc-500 text-xs font-medium tracking-widest uppercase block mb-2">
                Email
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="you@company.com"
                className="w-full bg-white/5 border border-white/10 focus:border-violet-500/50 rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-700 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-zinc-500 text-xs font-medium tracking-widest uppercase block mb-2">
                Reset Code
              </label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                maxLength={6}
                placeholder="6-digit code"
                className="w-full bg-white/5 border border-white/10 focus:border-violet-500/50 rounded-xl px-4 py-3 text-center text-xl font-black tracking-[0.4em] text-white placeholder-zinc-700 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-zinc-500 text-xs font-medium tracking-widest uppercase block mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  type={show ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  className="w-full bg-white/5 border border-white/10 focus:border-violet-500/50 rounded-xl px-4 pr-12 py-3 text-white text-sm placeholder-zinc-700 outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute top-1/2 right-4 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {show ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-zinc-500 text-xs font-medium tracking-widest uppercase block mb-2">
                Confirm Password
              </label>
              <input
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                type={show ? "text" : "password"}
                placeholder="Re-enter new password"
                className="w-full bg-white/5 border border-white/10 focus:border-violet-500/50 rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-700 outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-violet-500/20 mt-2"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Resetting...
                </span>
              ) : "Reset Password →"}
            </button>
          </form>

          <p className="text-center text-zinc-600 text-sm mt-6">
            <Link to="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
              Back to Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
