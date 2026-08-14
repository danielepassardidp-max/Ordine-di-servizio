import React from "react";
import { Search, Mountain } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Header({ search, onSearchChange, matchesCount }) {
    return (
        <header className="ambient-glow sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
            <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:py-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700/70 bg-gradient-to-br from-cyan-500/20 to-fuchsia-500/20 shadow-lg">
                        <Mountain className="h-5 w-5 text-cyan-300" />
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                            Funivie Campiglio
                        </p>
                        <h1 className="text-lg font-bold leading-tight text-white sm:text-xl">
                            Ordine di{" "}
                            <span className="gradient-text">Servizio</span>
                        </h1>
                    </div>
                </div>

                <div className="relative w-full lg:max-w-md">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <Input
                        data-testid="search-input"
                        type="text"
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Cerca per nome, numero o zona…"
                        className="h-10 border-slate-700/70 bg-slate-900/60 pl-9 pr-16 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:ring-cyan-400/60"
                    />
                    {search && matchesCount !== undefined && (
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-slate-700 bg-slate-800/80 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
                            {matchesCount}
                        </span>
                    )}
                </div>
            </div>
        </header>
    );
}
