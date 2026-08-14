import React from "react";

/**
 * PersonnelPill:
 *  - click number → activates this pill (shows name below). Only one pill is active at a time (controlled by parent).
 *  - click name → opens the details dialog.
 */
export default function PersonnelPill({
    code,
    name,
    highlight = false,
    active = false,
    onActivate,
    onOpenDetails,
}) {
    return (
        <span className="relative inline-flex flex-col items-start">
            <button
                type="button"
                data-testid={`personnel-pill-${code}`}
                onClick={() => onActivate(active ? null : code)}
                className={`group relative inline-flex h-8 min-w-[3rem] items-center justify-center rounded-md border font-mono text-xs font-semibold tracking-wider outline-none transition-[transform,border-color,color,box-shadow] duration-200 ease-out focus-visible:ring-2 focus-visible:ring-cyan-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 hover:-translate-y-0.5 ${
                    highlight
                        ? "border-fuchsia-400/60 bg-fuchsia-400/10 text-fuchsia-200 shadow-[0_0_12px_rgba(217,70,239,0.35)]"
                        : active
                          ? "border-cyan-400/80 bg-cyan-400/10 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.35)]"
                          : "border-slate-700/70 bg-slate-800/70 text-slate-200 hover:border-cyan-400/70 hover:text-cyan-300"
                }`}
            >
                <span className="px-2">{code}</span>
            </button>

            {active && (
                <button
                    type="button"
                    data-testid={`personnel-name-${code}`}
                    onClick={() => onOpenDetails({ code, name })}
                    className="animate-fade-in mt-1 max-w-[180px] truncate rounded-md border border-cyan-400/40 bg-slate-900/80 px-2 py-0.5 text-[11px] font-medium text-cyan-200 shadow-[0_0_10px_rgba(34,211,238,0.25)] transition-colors hover:border-fuchsia-400/70 hover:text-fuchsia-200"
                >
                    {name || (
                        <span className="italic text-slate-400">
                            Non associato
                        </span>
                    )}
                </button>
            )}
        </span>
    );
}
