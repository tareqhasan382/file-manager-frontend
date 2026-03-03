import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const Cancel = () => {
  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
  }, []);

  return (
    <div
      className="min-h-screen bg-[#05050a] flex items-center justify-center px-4 overflow-hidden relative"
      style={{ fontFamily: "'DM Mono', monospace" }}
    >
      <style>{`
        @keyframes ringPop {
          0%   { transform: scale(0.6); opacity: 0; }
          60%  { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes xDraw {
          0%   { stroke-dashoffset: 30; opacity: 0; }
          100% { stroke-dashoffset: 0;  opacity: 1; }
        }
        @keyframes slideUp {
          0%   { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Ambient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, #f97316 0%, transparent 70%)",
          filter: "blur(80px)",
          opacity: visible ? 0.1 : 0,
          transition: "opacity 1.2s ease",
        }}
      />

      <div className="w-full max-w-sm text-center relative z-10">

        {/* Ring + X */}
        <div
          className="mx-auto mb-8 w-24 h-24 rounded-full border border-orange-500/30 bg-orange-500/10 flex items-center justify-center"
          style={{
            opacity: 0,
            animation: visible
              ? "ringPop 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.1s forwards"
              : "none",
          }}
        >
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <path
              d="M11 11 L25 25"
              stroke="#f97316"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="30"
              strokeDashoffset="30"
              style={{
                animation: visible ? "xDraw 0.35s ease 0.5s forwards" : "none",
              }}
            />
            <path
              d="M25 11 L11 25"
              stroke="#f97316"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="30"
              strokeDashoffset="30"
              style={{
                animation: visible ? "xDraw 0.35s ease 0.65s forwards" : "none",
              }}
            />
          </svg>
        </div>

        {/* Heading */}
        <div
          style={{
            opacity: 0,
            animation: visible ? "slideUp 0.5s ease 0.35s forwards" : "none",
          }}
        >
          <p className="text-orange-400 text-xs uppercase tracking-widest mb-3">
            {"Payment Cancelled"}
          </p>
          <h1
            className="text-white text-3xl sm:text-4xl font-black mb-3"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            {"No charge made."}
          </h1>
          <p className="text-zinc-500 text-sm leading-relaxed mb-8">
            {"You cancelled before completing payment. Your current plan is still active — no changes were made to your account."}
          </p>
        </div>

        {/* Buttons */}
        <div
          className="space-y-3"
          style={{
            opacity: 0,
            animation: visible ? "slideUp 0.5s ease 0.5s forwards" : "none",
          }}
        >
          <Link
            to="/billing"
            className="block w-full py-3.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:opacity-90 text-white font-bold rounded-2xl text-sm transition-opacity"
          >
            {"Try Again →"}
          </Link>
          <Link
            to="/dashboard"
            className="block w-full py-3.5 border border-white/10 hover:border-white/20 text-zinc-500 hover:text-zinc-300 rounded-2xl text-sm transition-all"
          >
            {"Back to Dashboard"}
          </Link>
        </div>

        {/* Help note */}
      </div>
    </div>
  );
};

export default Cancel;