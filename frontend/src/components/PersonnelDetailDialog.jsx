import React from "react";
import {
    Dialog,
    DialogContent,
    DialogClose,
} from "@/components/ui/dialog";
import { X, MapPin, CalendarDays, Bed, UserX, User2 } from "lucide-react";

const DAY_LABELS = { oggi: "Oggi", domani: "Domani", dopodomani: "Dopodomani" };

function collectAssignments(code, days) {
    if (!days || !code) return [];
    const result = [];
    for (const day of days) {
        const items = [];
        for (const section of day.sections || []) {
            for (const zone of section.zones || []) {
                if ((zone.personnel || []).some((p) => p.code === code)) {
                    items.push({
                        zone_code: zone.code,
                        zone_description: zone.description,
                    });
                }
            }
        }
        const absent = (day.absent?.assenti || []).some((p) => p.code === code);
        const rest = (day.absent?.riposo || []).some((p) => p.code === code);
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
}

export default function PersonnelDetailDialog({ open, onOpenChange, info, days }) {
    const code = info?.code || "";
    const name = info?.name || null;
    const assignments = open ? collectAssignments(code, days) : [];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                data-testid="personnel-dialog"
                className="max-w-md border-slate-700/80 bg-slate-950/95 p-0 text-slate-100 shadow-2xl backdrop-blur-xl"
            >
                <DialogClose
                    data-testid="personnel-dialog-close"
                    className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 bg-slate-900 text-slate-300 transition-colors hover:border-fuchsia-400/60 hover:text-fuchsia-300"
                >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Chiudi</span>
                </DialogClose>

                <div className="border-b border-slate-800 bg-gradient-to-r from-cyan-500/15 via-transparent to-fuchsia-500/15 px-5 py-4 pr-14">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                        Dettaglio Personale
                    </p>
                    <div className="mt-2 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="truncate text-xl font-bold leading-tight text-white">
                                {name || (
                                    <span className="italic text-slate-400">
                                        Non associato
                                    </span>
                                )}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-500">
                                Numero d'elenco
                            </p>
                        </div>
                        <span className="font-mono text-2xl font-bold tracking-wider text-cyan-300">
                            {code}
                        </span>
                    </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-4">
                    <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                        <CalendarDays className="h-3 w-3" />
                        Zone assegnate nei 3 giorni
                    </p>
                    <ul className="space-y-2">
                        {assignments.map((a) => (
                            <li
                                key={a.date}
                                className="rounded-lg border border-slate-800 bg-slate-900/60 p-3"
                            >
                                <div className="flex items-baseline justify-between gap-2">
                                    <span className="text-sm font-semibold text-white">
                                        {DAY_LABELS[a.day_label] || a.day_label}
                                    </span>
                                    <span className="font-mono text-[10px] text-slate-500">
                                        {a.date_label || a.date}
                                    </span>
                                </div>
                                {a.items.length > 0 ? (
                                    <ul className="mt-2 space-y-1.5">
                                        {a.items.map((it, idx) => (
                                            <li
                                                key={`${a.date}-${it.zone_code}-${idx}`}
                                                className="flex items-start gap-2 text-xs text-slate-300"
                                            >
                                                <MapPin className="mt-0.5 h-3 w-3 flex-shrink-0 text-cyan-400" />
                                                <span className="flex-1">
                                                    <span className="font-mono font-semibold text-cyan-300">
                                                        {it.zone_code}
                                                    </span>
                                                    <span className="text-slate-500">
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
                                    <p className="mt-2 flex items-center gap-1.5 text-xs italic text-rose-300">
                                        <UserX className="h-3 w-3" /> Assente
                                    </p>
                                ) : a.rest ? (
                                    <p className="mt-2 flex items-center gap-1.5 text-xs italic text-amber-300">
                                        <Bed className="h-3 w-3" /> A riposo
                                    </p>
                                ) : (
                                    <p className="mt-2 flex items-center gap-1.5 text-xs italic text-slate-500">
                                        <User2 className="h-3 w-3" /> Nessuna
                                        assegnazione
                                    </p>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            </DialogContent>
        </Dialog>
    );
}
