import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useForgotPasswordMutation } from "../Redux/authApi";
import { FiMail, FiLock, FiCheckCircle } from "react-icons/fi";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email");

    try {
      await forgotPassword({ email }).unwrap();
      setSent(true);
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || "Something went wrong");
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
              Forgot password
            </h1>
            <p className="text-zinc-600 text-sm">
              Enter your account email and we'll send you a password reset code.
            </p>
          </div>

          {sent ? (
            <div className="text-center py-4">
              <FiCheckCircle className="mx-auto text-emerald-400 mb-3" size={40} />
              <p className="text-white text-sm mb-1">Reset code sent!</p>
              <p className="text-zinc-600 text-sm mb-6">
                If an account exists for <strong className="text-white">{email}</strong>, a 6-digit code is on its way.
              </p>
              <button
                onClick={() => navigate("/reset-password", { state: { email } })}
                className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold py-3.5 rounded-xl text-sm transition-all"
              >
                Enter the Code →
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-zinc-500 text-xs font-medium tracking-widest uppercase block mb-2">
                  Email
                </label>
                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder="you@company.com"
                    className="w-full bg-white/5 border border-white/10 focus:border-violet-500/50 rounded-xl pl-11 pr-4 py-3 text-white text-sm placeholder-zinc-700 outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-violet-500/20 mt-2"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : "Send Reset Code →"}
              </button>
            </form>
          )}

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

export default ForgotPassword;
