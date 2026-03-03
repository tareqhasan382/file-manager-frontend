import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

type Particle = {
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
};

const Success = () => {
  const [visible, setVisible] = useState<boolean>(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
    setParticles(
      Array.from({ length: 18 }, (): Particle => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 2,
        delay: Math.random() * 2,
        duration: Math.random() * 3 + 2,
      }))
    );
  }, []);

  return (
    <div
      className="min-h-screen bg-[#05050a] flex items-center justify-center px-4 overflow-hidden relative"
      style={{ fontFamily: "'DM Mono', monospace" }}
    >
      <style>{`
        @keyframes floatUp {
          0%   { opacity: 0; transform: translateY(0px) scale(0); }
          20%  { opacity: 0.5; transform: translateY(-20px) scale(1); }
          100% { opacity: 0; transform: translateY(-80px) scale(0.4); }
        }
        @keyframes checkDraw {
          0%   { stroke-dashoffset: 60; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes ringPop {
          0%   { transform: scale(0.6); opacity: 0; }
          60%  { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
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
          background: "radial-gradient(circle, #10b981 0%, transparent 70%)",
          filter: "blur(80px)",
          opacity: visible ? 0.15 : 0,
          transition: "opacity 1.2s ease",
        }}
      />

      {/* Floating particles */}
      {particles.map((p: Particle, i: number) => (
        <div
          key={i}
          className="absolute rounded-full bg-emerald-400"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: 0,
            animation: visible
              ? `floatUp ${p.duration}s ease-in ${p.delay}s forwards`
              : "none",
          }}
        />
      ))}

      <div className="w-full max-w-sm text-center relative z-10">
        {/* Ring + check */}
        <div
          className="mx-auto mb-8 w-24 h-24 rounded-full border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center"
          style={{
            opacity: 0,
            animation: visible
              ? "ringPop 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.1s forwards"
              : "none",
          }}
        >
          <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
            <path
              d="M11 21 L18 28 L31 13"
              stroke="#10b981"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="60"
              strokeDashoffset="60"
              style={{
                animation: visible
                  ? "checkDraw 0.45s ease 0.55s forwards"
                  : "none",
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
          <p className="text-emerald-400 text-xs uppercase tracking-widest mb-3">
            Payment Successful
          </p>
          <h1
            className="text-white text-3xl sm:text-4xl font-black mb-3"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            You're all set!
          </h1>
          <p className="text-zinc-500 text-sm leading-relaxed mb-8">
            Your plan is now active. Enjoy your new storage limits and start
            uploading files right away.
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
            to="/dashboard"
            className="block w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white font-bold rounded-2xl text-sm transition-opacity"
          >
            Go to Dashboard →
          </Link>
          <Link
            to="/"
            className="block w-full py-3.5 border border-white/10 hover:border-white/20 text-zinc-500 hover:text-zinc-300 rounded-2xl text-sm transition-all"
          >
            Back to Home
          </Link>
        </div>

        {/* Receipt note */}
        <p
          className="text-zinc-700 text-xs mt-6"
          style={{
            opacity: 0,
            animation: visible ? "slideUp 0.5s ease 0.65s forwards" : "none",
          }}
        >
          A receipt has been sent to your email address.
        </p>
      </div>
    </div>
  );
};

export default Success;