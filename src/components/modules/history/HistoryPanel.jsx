import React, { useState } from 'react';
import { History, Trash2, Filter, Bird, Rabbit, PawPrint, User, UserCheck, ShieldAlert } from 'lucide-react';
import Panel from '../../common/Panel';

const TYPE_CONFIG = {
    bird:       { icon: Bird,      color: 'text-sky-400',    bg: 'bg-sky-500/10',    border: 'border-sky-500/20',    dot: 'bg-sky-400',    label: 'Ave',         threat: 'MÍNIMO',  threatColor: 'text-sky-400'    },
    rabbit:     { icon: Rabbit,    color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20', dot: 'bg-violet-400', label: 'Conejo',      threat: 'MÍNIMO',  threatColor: 'text-violet-400' },
    animal:     { icon: PawPrint,  color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20',  dot: 'bg-amber-400',  label: 'Animal',      threat: 'BAJO',    threatColor: 'text-emerald-400'},
    adolescent: { icon: User,      color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', dot: 'bg-orange-400', label: 'Adolescente', threat: 'MEDIO',   threatColor: 'text-orange-400' },
    adult:      { icon: UserCheck, color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20',    dot: 'bg-red-400',    label: 'Adulto',      threat: 'ALTO',    threatColor: 'text-red-400'    },
};

const FILTERS = [
    { id: 'todos',      label: 'Todos'       },
    { id: 'adult',      label: 'Adulto'      },
    { id: 'adolescent', label: 'Adolescente' },
    { id: 'animal',     label: 'Animal'      },
    { id: 'bird',       label: 'Ave'         },
    { id: 'rabbit',     label: 'Conejo'      },
];

const fmtDate = (ts) =>
    new Date(ts).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
const fmtTime = (ts) =>
    new Date(ts).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

const HistoryPanel = ({ history = [], onClear, isDark }) => {
    const [filter, setFilter] = useState('todos');
    const [confirmClear, setConfirmClear] = useState(false);

    const filtered = filter === 'todos' ? history : history.filter(d => d.type === filter);

    const stats = {
        total:   history.length,
        threats: history.filter(d => d.type === 'adult' || d.type === 'adolescent').length,
        animals: history.filter(d => ['bird', 'rabbit', 'animal'].includes(d.type)).length,
    };

    const handleClear = () => {
        onClear?.();
        setConfirmClear(false);
    };

    return (
        <Panel title="Historial Privado" icon={History} isDark={isDark} className="flex-1 min-h-0">
            <div className="flex flex-col gap-2.5 h-full overflow-hidden">

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 flex-shrink-0">
                    {[
                        { label: 'Total',    value: stats.total,   color: isDark ? 'text-slate-200' : 'text-slate-800' },
                        { label: 'Amenazas', value: stats.threats, color: 'text-red-400'  },
                        { label: 'Animales', value: stats.animals, color: 'text-amber-400'},
                    ].map(({ label, value, color }) => (
                        <div key={label} className={`rounded-lg p-2 text-center ${isDark ? 'bg-slate-800/50 border border-slate-700/30' : 'bg-slate-50 border border-slate-200'}`}>
                            <div className={`text-base font-black font-mono ${color}`}>{value}</div>
                            <div className={`text-[7px] uppercase tracking-widest mt-0.5 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>{label}</div>
                        </div>
                    ))}
                </div>

                {/* Filter + clear */}
                <div className="flex items-center gap-1.5 flex-shrink-0 overflow-x-auto scrollbar-none pb-0.5">
                    <Filter className={`w-3 h-3 flex-shrink-0 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                    {FILTERS.map(({ id, label }) => {
                        const cfg = id !== 'todos' ? TYPE_CONFIG[id] : null;
                        const active = filter === id;
                        return (
                            <button
                                key={id}
                                onClick={() => setFilter(id)}
                                className={`px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wide flex-shrink-0 transition-all border ${
                                    active
                                        ? (cfg
                                            ? `${cfg.bg} ${cfg.border} ${cfg.color}`
                                            : (isDark ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400' : 'bg-cyan-50 border-cyan-300 text-cyan-600'))
                                        : (isDark ? 'border-slate-700/50 text-slate-600 hover:text-slate-400' : 'border-slate-200 text-slate-400 hover:text-slate-600')
                                }`}
                            >
                                {label}
                            </button>
                        );
                    })}
                    <button
                        onClick={() => setConfirmClear(v => !v)}
                        title="Limpiar historial"
                        className={`ml-auto flex-shrink-0 p-1 rounded-md transition-all ${isDark ? 'text-slate-700 hover:text-red-400' : 'text-slate-300 hover:text-red-500'}`}
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>
                </div>

                {/* Confirm clear */}
                {confirmClear && (
                    <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg flex-shrink-0 ${isDark ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-200'}`}>
                        <div className="flex items-center gap-1.5">
                            <ShieldAlert className="w-3 h-3 text-red-400" />
                            <span className={`text-[9px] font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>¿Borrar todo el historial?</span>
                        </div>
                        <div className="flex gap-1.5">
                            <button onClick={handleClear} className="text-[8px] px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold border border-red-500/30 hover:bg-red-500/30 transition-colors">Sí</button>
                            <button onClick={() => setConfirmClear(false)} className={`text-[8px] px-2 py-0.5 rounded font-bold border transition-colors ${isDark ? 'border-slate-700 text-slate-500 hover:text-slate-400' : 'border-slate-200 text-slate-400 hover:text-slate-600'}`}>No</button>
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {filtered.length === 0 && (
                    <div className={`flex-1 flex items-center justify-center text-center ${isDark ? 'text-slate-700' : 'text-slate-300'}`}>
                        <div>
                            <History className="w-6 h-6 mx-auto mb-2 opacity-30" />
                            <p className="text-[9px] uppercase tracking-widest">
                                {history.length === 0 ? 'Sin registros guardados' : 'Sin resultados para este filtro'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Detection list */}
                {filtered.length > 0 && (
                    <div className="overflow-y-auto flex-1 space-y-[3px] scrollbar-thin pr-0.5">
                        {filtered.map((det, i) => {
                            const cfg = TYPE_CONFIG[det.type];
                            const Icon = cfg.icon;
                            const isFirst = i === 0;
                            return (
                                <div
                                    key={det.timestamp + i}
                                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all ${
                                        isFirst && filter === 'todos'
                                            ? (isDark ? `${cfg.bg} border ${cfg.border}` : `${cfg.bg} border ${cfg.border}`)
                                            : (isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50')
                                    }`}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                                    <Icon className={`w-3 h-3 flex-shrink-0 ${cfg.color}`} />
                                    <div className="flex-1 min-w-0">
                                        <span className={`text-[9px] font-bold ${cfg.color}`}>{det.label}</span>
                                        <span className={`text-[8px] font-mono ml-1.5 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                                            {det.height}m · {det.distanceM}m
                                        </span>
                                        <span className={`ml-1.5 text-[7px] px-1 py-0.5 rounded font-bold ${cfg.bg} ${cfg.border} border ${cfg.threatColor}`}>
                                            {cfg.threat}
                                        </span>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <div className={`text-[8px] font-mono ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>{fmtTime(det.timestamp)}</div>
                                        <div className={`text-[7px] ${isDark ? 'text-slate-700' : 'text-slate-300'}`}>{fmtDate(det.timestamp)}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

            </div>
        </Panel>
    );
};

export default HistoryPanel;
