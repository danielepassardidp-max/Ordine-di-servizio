import React, { useMemo } from "react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { User2, MapPin, CalendarDays, Bed, UserX } from "lucide-react";

const DAY_LABELS = { oggi: "Oggi", domani: "Domani", dopodomani: "Dopodomani" };

/**
 * Personnel pill: shows the 3-digit code and opens a popover with the assigned
 * name plus every zone/day the person is present across the 3-day window.
 */
export default function PersonnelPill({ code, name, days, highlight = false }) {
    const assignments = useMemo(() => {
        if (!days) return [];
        const result = [];
        for (const day of days) {
            const items = [];
            for (const section of day.sections || []) {
                for (const zone of section.zones || []) {
                    if ((zone.personnel || []).some((p) => p.code === code)) {
                        items.push({
                            section_id: section.id,
                            section_title: section.title,
                            zone_code: zone.code,
                            zone_description: zone.description,
                        });
                    }
                }
            }
            const absent = (day.absent?.assenti || []).some(
                (p) => p.code === code,
            );
            const rest = (day.absent?.riposo || []).some(
                (p) => p.code === code,
            );
            result.push({
                day_label: day.label,
                date: day.date,
                date_label: day.date_label,
                items,
                absent,
                rest,
            });
        }
        return result;
    }, [code, days]);

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    data-testid={`personnel-pill-${code}`}
                    className={`group relative inline-flex h-8 min-w-[3.25rem] items-center justify-center rounded-md border font-mono text-xs font-semibold tracking-wider outline-none transition-[transform,border-color,color,box-shadow] duration-200 ease-out focus-visible:ring-2 focus-visible:ring-cyan-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 hover:-translate-y-0.5 ${
                        highlight
                            ? "border-fuchsia-400/60 bg-fuchsia-400/10 text-fuchsia-200 shadow-[0_0_12px_rgba(217,70,239,0.35)]"
                            : "border-slate-700/70 bg-slate-800/70 text-slate-200 hover:border-cyan-400/70 hover:text-cyan-300 hover:shadow-[0_0_12px_rgba(34,211,238,0.35)]"
                    }`}
                >
                    <span className="px-2">{code}</span>
                </button>
            </PopoverTrigger>
            <PopoverContent
                data-testid="personnel-popover"
                className="z-50 w-80 border-slate-700/80 bg-slate-950/95 p-0 text-slate-100 shadow-2xl backdrop-blur-xl"
                align="start"
                sideOffset={6}
            >
                <div className="border-b border-slate-800 bg-gradient-to-r from-cyan-500/15 via-transparent to-fuchsia-500/15 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400">
                                Personale
                            </p>
                            <p className="mt-0.5 truncate text-base font-semibold leading-tight text-white">
                                {name || (
                                    <span className="italic text-slate-400">
                                        Non associato
                                    </span>
                                )}
                            </p>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="font-mono text-lg font-bold tracking-wider text-cyan-300">
                                {code}
                            </span>
                            <span className="text-[10px] uppercase tracking-widest text-slate-500">
                                ID
                            </span>
                        </div>
                    </div>
                </div>
                <div className="max-h-72 overflow-y-auto p-3">
                    <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                        <CalendarDays className="h-3 w-3" />
                        Assegnazioni nei 3 giorni
                    </p>
                    <ul className="space-y-2">
                        {assignments.map((a) => (
                            <li
                                key={a.date}
                                className="rounded-md border border-slate-800 bg-slate-900/60 p-2"
                            >
                                <div className="flex items-baseline justify-between gap-2">
                                    <span className="text-xs font-semibold text-slate-200">
                                        {DAY_LABELS[a.day_label] || a.day_label}
                                    </span>
                                    <span className="font-mono text-[10px] text-slate-500">
                                        {a.date_label || a.date}
                                    </span>
                                </div>
                                {a.items.length > 0 ? (
                                    <ul className="mt-1.5 space-y-1">
                                        {a.items.map((it, idx) => (
                                            <li
                                                key={`${a.date}-${it.zone_code}-${idx}`}
                                                className="flex items-start gap-2 text-xs text-slate-300"
                                            >
                                                <MapPin className="mt-0.5 h-3 w-3 flex-shrink-0 text-cyan-400" />
                                                <span className="flex-1">
                                                    <span className="font-mono text-cyan-300">
                                                        {it.zone_code}
                                                    </span>
                                                    <span className="text-slate-400">
                                                        {" · "}
                                                    </span>
                                                    <span className="text-slate-200">
                                                        {it.zone_description}
                                                    </span>
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : a.absent ? (
                                    <p className="mt-1 flex items-center gap-1.5 text-xs italic text-rose-300">
                                        <UserX className="h-3 w-3" /> Assente
                                    </p>
                                ) : a.rest ? (
                                    <p className="mt-1 flex items-center gap-1.5 text-xs italic text-amber-300">
                                        <Bed className="h-3 w-3" /> A riposo
                                    </p>
                                ) : (
                                    <p className="mt-1 flex items-center gap-1.5 text-xs italic text-slate-500">
                                        <User2 className="h-3 w-3" /> Nessuna
                                        assegnazione
                                    </p>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            </PopoverContent>
        </Popover>
    );
}
