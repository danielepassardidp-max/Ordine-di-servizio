import React, { useMemo } from "react";
import PersonnelPill from "./PersonnelPill";
import { UserX, Bed, ChevronRight } from "lucide-react";

const DAY_TITLES = {
    oggi: "Oggi",
    domani: "Domani",
    dopodomani: "Dopodomani",
};

const SECTION_ACCENTS = {
    A: "from-cyan-400/70 to-cyan-500/10",
    B: "from-fuchsia-400/70 to-fuchsia-500/10",
    Z: "from-emerald-400/70 to-emerald-500/10",
};

function matchesSearch(zone, personnel, query) {
    if (!query) return true;
    const q = query.toLowerCase();
    if (zone.code.toLowerCase().includes(q)) return true;
    if ((zone.description || "").toLowerCase().includes(q)) return true;
    for (const p of personnel) {
        if (p.code.includes(q)) return true;
        if (p.name && p.name.toLowerCase().includes(q)) return true;
    }
    return false;
}

export default function DayColumn({ day, allDays, filter, search, highlightCodes }) {
    const filteredSections = useMemo(() => {
        return (day.sections || [])
            .filter((s) => filter === "all" || filter === s.id)
            .map((s) => ({
                ...s,
                zones: (s.zones || []).filter((z) =>
                    matchesSearch(z, z.personnel || [], search),
                ),
            }))
            .filter((s) => s.zones.length > 0);
    }, [day, filter, search]);

    const showAbsent = filter === "all" || filter === "ABS";

    const filteredAbsent = useMemo(() => {
        const s = (search || "").toLowerCase();
        const filterList = (list) =>
            !s
                ? list
                : list.filter(
                      (p) =>
                          p.code.includes(s) ||
                          (p.name && p.name.toLowerCase().includes(s)),
                  );
        return {
            assenti: filterList(day.absent?.assenti || []),
            riposo: filterList(day.absent?.riposo || []),
        };
    }, [day, search]);

    return (
        <section
            data-testid={`day-column-${day.label}`}
            className="animate-fade-in relative flex flex-col overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-sm"
        >
            {/* Top gradient bar */}
            <div className="h-1 w-full bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-cyan-400" />

            {/* Header */}
            <header className="flex items-baseline justify-between border-b border-slate-800/80 px-5 py-4">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-300/80">
                        {DAY_TITLES[day.label] || day.label}
                    </p>
                    <h2 className="font-mono text-lg font-bold text-white">
                        {day.date_label || day.date || "—"}
                    </h2>
                </div>
                {day.fetched_at && (
                    <span
                        title={`Sincronizzato: ${new Date(day.fetched_at).toLocaleString("it-IT")}`}
                        className="rounded-full border border-slate-700/70 bg-slate-800/60 px-2 py-0.5 font-mono text-[10px] tracking-wider text-slate-400"
                    >
                        SYNC OK
                    </span>
                )}
            </header>

            <div className="flex-1 space-y-5 overflow-y-auto p-4">
                {filteredSections.length === 0 &&
                    (!showAbsent ||
                        (filteredAbsent.assenti.length === 0 &&
                            filteredAbsent.riposo.length === 0)) && (
                        <div className="rounded-lg border border-dashed border-slate-800 bg-slate-950/40 p-6 text-center">
                            <p className="text-sm text-slate-400">
                                Nessun risultato per questo giorno
                            </p>
                        </div>
                    )}

                {filteredSections.map((section) => (
                    <div
                        key={section.id}
                        data-testid={`section-${section.id}-${day.label}`}
                        className="overflow-hidden rounded-xl border border-slate-800/70 bg-slate-950/60"
                    >
                        <div
                            className={`flex items-center gap-2 border-b border-slate-800/70 bg-gradient-to-r px-3 py-2 ${SECTION_ACCENTS[section.id] || "from-slate-500/40 to-slate-500/5"}`}
                        >
                            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-950/70 font-mono text-xs font-bold text-white">
                                {section.id}
                            </span>
                            <h3 className="text-xs font-semibold tracking-wide text-white">
                                {section.title}
                            </h3>
                        </div>
                        <ul className="divide-y divide-slate-800/60">
                            {section.zones.map((zone) => (
                                <li
                                    key={zone.code}
                                    className="grid grid-cols-[auto_1fr] items-start gap-3 px-3 py-2.5 transition-colors duration-150 hover:bg-slate-900/40"
                                >
                                    <div className="flex min-w-[68px] flex-col leading-tight">
                                        <span className="font-mono text-sm font-semibold text-cyan-300">
                                            {zone.code}
                                        </span>
                                        <span className="text-[11px] text-slate-400">
                                            {zone.description}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1.5 justify-self-end">
                                        {zone.personnel.length === 0 ? (
                                            <span className="text-[11px] italic text-slate-600">
                                                —
                                            </span>
                                        ) : (
                                            zone.personnel.map((p, idx) => (
                                                <PersonnelPill
                                                    key={`${zone.code}-${p.code}-${idx}`}
                                                    code={p.code}
                                                    name={p.name}
                                                    days={allDays}
                                                    highlight={highlightCodes?.has(
                                                        p.code,
                                                    )}
                                                />
                                            ))
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}

                {showAbsent &&
                    (filteredAbsent.assenti.length > 0 ||
                        filteredAbsent.riposo.length > 0) && (
                        <div className="overflow-hidden rounded-xl border border-slate-800/70 bg-slate-950/60">
                            <div className="flex items-center gap-2 border-b border-slate-800/70 bg-gradient-to-r from-rose-400/40 to-rose-500/5 px-3 py-2">
                                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-950/70">
                                    <UserX className="h-3.5 w-3.5 text-rose-300" />
                                </span>
                                <h3 className="text-xs font-semibold tracking-wide text-white">
                                    Assenti
                                </h3>
                            </div>
                            <div className="space-y-3 p-3">
                                {filteredAbsent.assenti.length > 0 && (
                                    <div>
                                        <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-rose-300/80">
                                            <ChevronRight className="h-3 w-3" />
                                            Assenti
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {filteredAbsent.assenti.map(
                                                (p, idx) => (
                                                    <PersonnelPill
                                                        key={`abs-${p.code}-${idx}`}
                                                        code={p.code}
                                                        name={p.name}
                                                        days={allDays}
                                                        highlight={highlightCodes?.has(
                                                            p.code,
                                                        )}
                                                    />
                                                ),
                                            )}
                                        </div>
                                    </div>
                                )}
                                {filteredAbsent.riposo.length > 0 && (
                                    <div>
                                        <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-amber-300/80">
                                            <Bed className="h-3 w-3" />
                                            Riposo
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {filteredAbsent.riposo.map(
                                                (p, idx) => (
                                                    <PersonnelPill
                                                        key={`rip-${p.code}-${idx}`}
                                                        code={p.code}
                                                        name={p.name}
                                                        days={allDays}
                                                        highlight={highlightCodes?.has(
                                                            p.code,
                                                        )}
                                                    />
                                                ),
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
            </div>
        </section>
    );
}
