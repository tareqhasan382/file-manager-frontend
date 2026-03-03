import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
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
        @keyframes slideUp {
          0%   { opacity: 0; transform: translateY(24px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes glitch1 {
          0%, 100% { clip-path: inset(0 0 95% 0); transform: translate(-4px, 0); }
          25%       { clip-path: inset(30% 0 50% 0); transform: translate(4px, 0); }
          50%       { clip-path: inset(60% 0 20% 0); transform: translate(-2px, 0); }
          75%       { clip-path: inset(80% 0 5%  0); transform: translate(3px,  0); }
        }
        @keyframes glitch2 {
          0%, 100% { clip-path: inset(50% 0 30% 0); transform: translate(4px,  0); }
          25%       { clip-path: inset(10% 0 70% 0); transform: translate(-4px, 0); }
          50%       { clip-path: inset(75% 0 10% 0); transform: translate(2px,  0); }
          75%       { clip-path: inset(20% 0 60% 0); transform: translate(-3px, 0); }
        }
        @keyframes flicker {
          0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { opacity: 1; }
          20%, 22%, 24%, 55%                       { opacity: 0.4; }
        }
      `}</style>

      {/* Ambient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)",
          filter: "blur(100px)",
          opacity: visible ? 0.12 : 0,
          transition: "opacity 1.2s ease",
        }}
      />

      {/* Grid lines background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="w-full max-w-lg text-center relative z-10">

        {/* 404 glitch */}
        <div
          className="relative inline-block mb-6"
          style={{
            opacity: 0,
            animation: visible ? "slideUp 0.6s ease 0.1s forwards" : "none",
          }}
        >
          {/* base */}
          <h1
            className="text-[120px] sm:text-[160px] font-black leading-none text-white select-none"
            style={{
              fontFamily: "'Syne', sans-serif",
              animation: visible ? "flicker 4s infinite 1s" : "none",
            }}
          >
            {"404"}
          </h1>
          {/* glitch layer 1 */}
          <h1
            className="absolute inset-0 text-[120px] sm:text-[160px] font-black leading-none select-none"
            style={{
              fontFamily: "'Syne', sans-serif",
              color: "#f97316",
              animation: visible ? "glitch1 2.5s infinite 0.5s" : "none",
              pointerEvents: "none",
            }}
            aria-hidden="true"
          >
            {"404"}
          </h1>
          {/* glitch layer 2 */}
          <h1
            className="absolute inset-0 text-[120px] sm:text-[160px] font-black leading-none select-none"
            style={{
              fontFamily: "'Syne', sans-serif",
              color: "#06b6d4",
              animation: visible ? "glitch2 2.5s infinite 0.8s" : "none",
              pointerEvents: "none",
            }}
            aria-hidden="true"
          >
            {"404"}
          </h1>
        </div>

        {/* Text */}
        <div
          style={{
            opacity: 0,
            animation: visible ? "slideUp 0.5s ease 0.3s forwards" : "none",
          }}
        >
          <p className="text-violet-400 text-xs uppercase tracking-widest mb-3">
            {"Page Not Found"}
          </p>
          <p className="text-zinc-500 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
            {"The page you requested doesn't exist or has been moved. Let's get you back on track."}
          </p>
        </div>

        {/* Buttons */}
        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
          style={{
            opacity: 0,
            animation: visible ? "slideUp 0.5s ease 0.45s forwards" : "none",
          }}
        >
          <Link
            to="/"
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 text-white font-bold rounded-2xl text-sm transition-opacity"
          >
            {"Go Home →"}
          </Link>
          
        </div>

        {/* Bottom hint */}
        <p
          className="text-zinc-800 text-xs mt-10"
          style={{
            opacity: 0,
            animation: visible ? "slideUp 0.5s ease 0.6s forwards" : "none",
          }}
        >
          {"Error code: 404 · Page not found"}
        </p>
      </div>
    </div>
  );
};

export default NotFound;