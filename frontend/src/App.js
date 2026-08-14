import React, { useEffect, useMemo, useState, useCallback } from "react";
import "@/App.css";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Toaster, toast } from "sonner";
import Header from "@/components/Header";
import DayColumn from "@/components/DayColumn";
import PersonnelDetailDialog from "@/components/PersonnelDetailDialog";
import { fetchDays } from "@/lib/api";

const POLL_INTERVAL_MS = 60_000; // frontend refresh every 60s

function extractHighlightCodes(days, search) {
    const q = (search || "").trim().toLowerCase();
    const codes = new Set();
    if (!q) return codes;
    for (const day of days) {
        for (const section of day.sections || []) {
            for (const zone of section.zones || []) {
                for (const p of zone.personnel || []) {
                    if (
                        p.code.includes(q) ||
                        (p.name && p.name.toLowerCase().includes(q))
                    ) {
                        codes.add(p.code);
                    }
                }
            }
        }
        for (const p of day.absent?.assenti || []) {
            if (
                p.code.includes(q) ||
                (p.name && p.name.toLowerCase().includes(q))
            )
                codes.add(p.code);
        }
        for (const p of day.absent?.riposo || []) {
            if (
                p.code.includes(q) ||
                (p.name && p.name.toLowerCase().includes(q))
            )
                codes.add(p.code);
        }
    }
    return codes;
}

export default function App() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const [mobileTab, setMobileTab] = useState("oggi");
    const [activeCode, setActiveCode] = useState(null);
    const [dialogInfo, setDialogInfo] = useState(null);

    const openDetails = useCallback((info) => setDialogInfo(info), []);
    const closeDialog = useCallback((open) => {
        if (!open) setDialogInfo(null);
    }, []);

    const loadData = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const d = await fetchDays();
            setData(d);
            setError(null);
        } catch (e) {
            console.error(e);
            setError(e.message || "Errore di caricamento");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
        const t = setInterval(() => loadData(true), POLL_INTERVAL_MS);
        return () => clearInterval(t);
    }, [loadData]);

    const days = data?.days || [];
    const sync = data?.sync;

    const highlightCodes = useMemo(
        () => extractHighlightCodes(days, search),
        [days, search],
    );

    // Auto-open dialog when search is a pure number that exactly matches a personnel code.
    useEffect(() => {
        const q = (search || "").trim();
        if (!q || !/^\d+$/.test(q)) return;
        // find first occurrence of exact code across days
        let found = null;
        for (const day of days) {
            const scan = (list) => {
                for (const p of list) {
                    if (p.code === q) return p;
                }
                return null;
            };
            for (const section of day.sections || []) {
                for (const zone of section.zones || []) {
                    const hit = scan(zone.personnel || []);
                    if (hit) {
                        found = hit;
                        break;
                    }
                }
                if (found) break;
            }
            if (!found) {
                found =
                    scan(day.absent?.assenti || []) ||
                    scan(day.absent?.riposo || []);
            }
            if (found) break;
        }
        if (found) {
            setDialogInfo({ code: found.code, name: found.name });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    return (
        <div className="App relative min-h-screen bg-slate-950">
            <Toaster
                position="top-right"
                theme="dark"
                toastOptions={{
                    style: {
                        background: "rgba(2, 6, 23, 0.95)",
                        border: "1px solid rgba(30,41,59,0.9)",
                        color: "#e2e8f0",
                    },
                }}
            />
            <Header
                search={search}
                onSearchChange={setSearch}
                matchesCount={search ? highlightCodes.size : undefined}
            />

            <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
                {loading && !data && (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {[0, 1, 2].map((i) => (
                            <div
                                key={i}
                                className="h-[70vh] animate-pulse rounded-2xl border border-slate-800 bg-slate-900/40"
                            />
                        ))}
                    </div>
                )}

                {error && !data && (
                    <div
                        data-testid="error-banner"
                        className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
                    >
                        {error}
                    </div>
                )}

                {data && (
                    <>
                        {/* Desktop: 3 columns visible simultaneously */}
                        <div
                            data-testid="days-grid-desktop"
                            className="hidden gap-6 lg:grid lg:grid-cols-3"
                        >
                            {days.map((day) => (
                                <DayColumn
                                    key={day.date}
                                    day={day}
                                    allDays={days}
                                    search={search}
                                    highlightCodes={highlightCodes}
                                    activeCode={activeCode}
                                    onActivate={setActiveCode}
                                    onOpenDetails={openDetails}
                                />
                            ))}
                        </div>

                        {/* Mobile: tabs */}
                        <div className="lg:hidden">
                            <Tabs
                                value={mobileTab}
                                onValueChange={setMobileTab}
                            >
                                <TabsList
                                    data-testid="mobile-tabs"
                                    className="mb-4 grid w-full grid-cols-3 rounded-xl border border-slate-800/80 bg-slate-900/60 p-1"
                                >
                                    {days.map((d) => (
                                        <TabsTrigger
                                            key={d.date}
                                            value={d.label}
                                            data-testid={`mobile-tab-${d.label}`}
                                            className="rounded-lg text-xs font-semibold uppercase tracking-wider text-slate-400 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/25 data-[state=active]:to-fuchsia-500/25 data-[state=active]:text-white"
                                        >
                                            {d.label === "oggi"
                                                ? "Oggi"
                                                : d.label === "domani"
                                                  ? "Domani"
                                                  : "Dopodomani"}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                                {days.map((day) => (
                                    <TabsContent
                                        key={day.date}
                                        value={day.label}
                                        className="mt-0"
                                    >
                                        <DayColumn
                                            day={day}
                                            allDays={days}
                                            search={search}
                                            highlightCodes={highlightCodes}
                                            activeCode={activeCode}
                                            onActivate={setActiveCode}
                                            onOpenDetails={openDetails}
                                        />
                                    </TabsContent>
                                ))}
                            </Tabs>
                        </div>

                        <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-4 text-xs text-slate-500">
                            <p>
                                Copia sincronizzata del sito originale ·
                                aggiornamento automatico ogni{" "}
                                {sync?.interval_minutes || 20} minuti
                            </p>
                            <p className="font-mono">
                                {days.length} giorni caricati
                            </p>
                        </footer>
                    </>
                )}
            </main>

            <PersonnelDetailDialog
                open={!!dialogInfo}
                onOpenChange={closeDialog}
                info={dialogInfo}
                days={days}
            />
        </div>
    );
}
