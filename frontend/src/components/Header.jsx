import React from "react";
import { Search, RefreshCw, Mountain } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const ZONE_OPTIONS = [
    { value: "all", label: "Tutte le zone" },
    { value: "A", label: "A · Spinale-Grostè" },
    { value: "B", label: "B · 5 Laghi-Pradalago" },
    { value: "Z", label: "Z · Varie" },
    { value: "ABS", label: "Assenti / Riposo" },
];

function formatLastSync(iso) {
    if (!iso) return "in attesa…";
    const d = new Date(iso);
    return d.toLocaleTimeString("it-IT", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function Header({
    search,
    onSearchChange,
    filter,
    onFilterChange,
    sync,
    onSync,
    syncing,
    matchesCount,
}) {
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

                <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center lg:justify-end">
                    <div className="relative flex-1 sm:max-w-md">
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

                    <Select value={filter} onValueChange={onFilterChange}>
                        <SelectTrigger
                            data-testid="zone-filter"
                            className="h-10 w-full border-slate-700/70 bg-slate-900/60 text-sm text-slate-100 sm:w-56"
                        >
                            <SelectValue placeholder="Filtra zona" />
                        </SelectTrigger>
                        <SelectContent className="border-slate-700 bg-slate-950/95 text-slate-100 backdrop-blur-xl">
                            {ZONE_OPTIONS.map((o) => (
                                <SelectItem
                                    key={o.value}
                                    value={o.value}
                                    className="focus:bg-slate-800 focus:text-cyan-300"
                                    data-testid={`zone-option-${o.value}`}
                                >
                                    {o.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div
                        data-testid="sync-indicator"
                        className="flex items-center gap-2 rounded-lg border border-slate-700/70 bg-slate-900/60 px-3 py-2"
                    >
                        <span
                            className={`pulse-dot h-2 w-2 rounded-full ${sync?.last_error ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.9)]" : "bg-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.9)]"}`}
                        />
                        <div className="flex flex-col leading-tight">
                            <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
                                Ultimo agg.
                            </span>
                            <span className="font-mono text-xs font-semibold text-slate-100">
                                {formatLastSync(sync?.last_sync)}
                            </span>
                        </div>
                        <Button
                            data-testid="sync-button"
                            variant="ghost"
                            size="icon"
                            onClick={onSync}
                            disabled={syncing}
                            className="ml-1 h-7 w-7 text-slate-300 hover:bg-slate-800 hover:text-cyan-300"
                            title="Sincronizza ora"
                        >
                            <RefreshCw
                                className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`}
                            />
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    );
}
