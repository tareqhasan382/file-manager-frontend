import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useVerifyOtpMutation, useResendOtpMutation } from "../Redux/authApi";
import { subscribeToPlan } from "../utils/subscribe";
import { FiMail, FiShield, FiClock } from "react-icons/fi";

const RESEND_COOLDOWN = 60;

const VerifyOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as { email?: string; plan?: string }) || {};

  const [email, setEmail] = useState(state.email || "");
  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(0);

  const [verifyOtp, { isLoading: verifying }] = useVerifyOtpMutation();
  const [resendOtp, { isLoading: resending }] = useResendOtpMutation();

  // Countdown for the resend button
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const handleVerify = async () => {
    if (!email) return toast.error("Please enter your email");
    if (code.length !== 6) return toast.error("Enter the 6-digit code");

    try {
      await verifyOtp({ email, code }).unwrap();
      toast.success("Email verified! Welcome aboard 🎉");

      const plan = state.plan?.toUpperCase();
      if (plan && plan !== "FREE") {
        const url = await subscribeToPlan(plan);
        if (url) {
          window.location.assign(url);
          return;
        }
      }

      navigate("/files");
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || "Verification failed");
    }
  };

  const handleResend = async () => {
    if (!email) return toast.error("Please enter your email");
    if (countdown > 0) return;

    try {
      await resendOtp({ email }).unwrap();
      toast.success("New verification code sent!");
      setCountdown(RESEND_COOLDOWN);
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || "Could not resend code";
      toast.error(msg);
      const seconds = parseInt(msg.match(/\d+/)?.[0] || "");
      if (!isNaN(seconds) && seconds > 0) setCountdown(seconds);
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
              <FiShield size={22} />
            </div>
            <h1 className="text-2xl font-black text-white mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>
              Verify your email
            </h1>
            <p className="text-zinc-600 text-sm">
              We sent a 6-digit code to your inbox. Enter it below to activate your account.
            </p>
          </div>

          <div className="space-y-4">
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

            <div>
              <label className="text-zinc-500 text-xs font-medium tracking-widest uppercase block mb-2">
                Verification Code
              </label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                maxLength={6}
                placeholder="••••••"
                className="w-full bg-white/5 border border-white/10 focus:border-violet-500/50 rounded-xl px-4 py-3 text-center text-2xl font-black tracking-[0.5em] text-white placeholder-zinc-700 outline-none transition-colors"
              />
            </div>

            <button
              onClick={handleVerify}
              disabled={verifying || code.length !== 6}
              className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-violet-500/20 mt-2"
            >
              {verifying ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying...
                </span>
              ) : "Verify & Activate Account →"}
            </button>

            <button
              onClick={handleResend}
              disabled={resending || countdown > 0}
              className="w-full flex items-center justify-center gap-2 text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors disabled:text-zinc-600 py-2"
            >
              <FiClock size={14} />
              {countdown > 0
                ? `Resend code in ${countdown}s`
                : resending
                ? "Sending..."
                : "Didn't receive the code? Resend"}
            </button>
          </div>

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

export default VerifyOtp;
