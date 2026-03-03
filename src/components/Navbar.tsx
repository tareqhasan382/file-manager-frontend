import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [location]);

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "About", href: "#about" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 bg-[#05050a]/95 ${
        scrolled
          ? "bg-[#05050a]/95 backdrop-blur-xl border-b border-white/5 py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-violet-500/25 group-hover:scale-105 transition-transform">
            F
          </div>
          <span className="text-white font-black text-lg tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
            File<span className="text-violet-400">Vault</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-zinc-400 hover:text-white text-sm font-medium transition-colors tracking-wide"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            className="text-zinc-400 hover:text-white text-sm font-medium transition-colors px-4 py-2"
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5"
        >
          <span className={`w-5 h-0.5 bg-white transition-all ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`w-5 h-0.5 bg-white transition-all ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`w-5 h-0.5 bg-white transition-all ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden transition-all duration-300 bg-[#05050a] overflow-hidden ${menuOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="px-4 pb-4 pt-2 border-t border-white/5 mt-3 space-y-1">
          {navLinks.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="block text-zinc-400 hover:text-white text-sm font-medium py-2.5 px-3 rounded-lg hover:bg-white/5 transition-colors"
            >
              {l.label}
            </a>
          ))}
          <div className="pt-2 flex flex-col gap-2">
            <Link to="/login" className="text-center text-zinc-400 text-sm py-2.5 px-3 rounded-lg border border-white/10 hover:border-white/20 transition-colors">
              Sign in
            </Link>
            <Link to="/signup" className="text-center bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-bold py-2.5 px-3 rounded-xl">
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;