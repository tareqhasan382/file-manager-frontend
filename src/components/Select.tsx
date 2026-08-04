import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { FiCheck, FiChevronDown } from "react-icons/fi";

export type SelectOption = { value: string; label: string };

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  icon?: ReactNode;
  className?: string;
}

export default function Select({
  value,
  onChange,
  options,
  placeholder = "Select...",
  icon,
  className = "",
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);
  const label = selected?.label ?? (value || placeholder);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (!open) return;
    setHighlight(options.findIndex((o) => o.value === value));
  }, [open, options, value]);

  const move = (dir: 1 | -1) => {
    if (options.length === 0) return;
    setHighlight((h) => (h + dir + options.length) % options.length);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      else move(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) setOpen(true);
      else move(-1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (open) {
        if (highlight >= 0 && options[highlight]) onChange(options[highlight].value);
        setOpen(false);
      } else {
        setOpen(true);
      }
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <style>{`
        .select-menu::-webkit-scrollbar { width: 4px; }
        .select-menu::-webkit-scrollbar-track { background: transparent; }
        .select-menu::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
      `}</style>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        className={`flex items-center gap-2 bg-[#0f0f13] border rounded-xl py-2.5 text-sm text-white outline-none transition-colors ${
          open
            ? "border-violet-500/60"
            : "border-white/10 hover:border-white/25"
        } ${className}`}
      >
        {icon && <span className="text-zinc-600 shrink-0">{icon}</span>}
        <span
          className={`flex-1 text-left truncate ${
            value ? "text-white" : "text-zinc-600"
          }`}
        >
          {label}
        </span>
        <FiChevronDown
          className={`text-zinc-500 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="select-menu absolute z-30 mt-2 w-full min-w-[10rem] max-h-60 overflow-y-auto bg-[#0d0d15] border border-white/10 rounded-xl py-1.5 shadow-2xl shadow-black/60"
        >
          {options.length === 0 ? (
            <p className="px-3.5 py-2 text-sm text-zinc-600">No options</p>
          ) : (
            options.map((o, i) => {
              const active = o.value === value;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-3.5 py-2 text-sm text-left transition-colors ${
                    i === highlight
                      ? "bg-violet-600/20 text-white"
                      : active
                        ? "text-violet-300"
                        : "text-zinc-300 hover:bg-white/5"
                  }`}
                >
                  <span className="truncate">{o.label}</span>
                  {active && <FiCheck className="text-violet-400 shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
