import { useRef, useEffect } from 'react';
import clsx from 'clsx';


export interface AthleteData {
    _id: string;
    name: string;
    nickname?: string;
    academy: string;
    belt: string;
    weight: number;
    gender?: string;
    age?: number;
    photo?: string;
    stats?: {
        wins: number;
        losses: number;
        submissions: number;
        pointsScored: number;
    };
    rankingPoints?: number;
    balance?: number;
}

interface AthleteDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    athlete: AthleteData | null;
}

const AthleteDetailModal = ({ isOpen, onClose, athlete }: AthleteDetailModalProps) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen || !athlete) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div
                ref={modalRef}
                className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with Photo Background effect */}
                <div className="relative h-32 bg-gradient-to-r from-blue-900 to-slate-900 overflow-visible">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-10 bg-slate-900/50 hover:bg-slate-800 text-white rounded-full p-2 transition backdrop-blur-md"
                    >
                        ✕
                    </button>

                    <div className="absolute -bottom-16 left-8 flex items-end drop-shadow-lg">
                        {athlete.photo ? (
                            <img
                                src={`http://localhost:5001${athlete.photo}`}
                                alt={athlete.name}
                                className="w-32 h-32 rounded-full border-4 border-slate-900 object-cover bg-slate-800"
                            />
                        ) : (
                            <div className="w-32 h-32 rounded-full border-4 border-slate-900 bg-slate-700 flex items-center justify-center text-4xl text-slate-500 font-bold shadow-inner">
                                {athlete.name.charAt(0)}
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-20 px-8 pb-8 overflow-y-auto custom-scrollbar">
                    {/* Name & Academy */}
                    <div className="mb-6">
                        <h2 className="text-3xl font-bold text-white leading-tight">{athlete.name}</h2>
                        {athlete.nickname && <p className="text-slate-400 italic">"{athlete.nickname}"</p>}
                        <div className="flex items-center gap-2 mt-2 text-blue-400 font-medium">
                            <span>🥋 {athlete.academy}</span>
                        </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                            <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Belt</div>
                            <div className={clsx("text-lg font-bold capitalize",
                                athlete.belt === 'White' && 'text-slate-200',
                                athlete.belt === 'Blue' && 'text-blue-400',
                                athlete.belt === 'Purple' && 'text-purple-400',
                                athlete.belt === 'Brown' && 'text-amber-700',
                                athlete.belt === 'Black' && 'text-red-500' // Usually black belt text is white or specific, but red is high contrast
                            )}>
                                {athlete.belt}
                            </div>
                        </div>
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                            <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Weight</div>
                            <div className="text-lg font-bold text-white">{athlete.weight} kg</div>
                        </div>
                        {athlete.age && (
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                                <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Age</div>
                                <div className="text-lg font-bold text-white">{athlete.age}</div>
                            </div>
                        )}
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                            <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Gender</div>
                            <div className="text-lg font-bold text-white">{athlete.gender || '-'}</div>
                        </div>
                    </div>

                    {/* Performance Stats */}
                    {athlete.stats && (
                        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
                            <h3 className="text-slate-300 font-semibold mb-4 border-b border-slate-700 pb-2">Performance Stats</h3>
                            <div className="grid grid-cols-4 gap-2 text-center">
                                <div>
                                    <div className="text-2xl font-bold text-green-400">{athlete.stats.wins}</div>
                                    <div className="text-xs text-slate-500 uppercase">Wins</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-red-400">{athlete.stats.losses}</div>
                                    <div className="text-xs text-slate-500 uppercase">Loss</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-purple-400">{athlete.stats.submissions}</div>
                                    <div className="text-xs text-slate-500 uppercase">Subs</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-yellow-400">{athlete.stats.pointsScored}</div>
                                    <div className="text-xs text-slate-500 uppercase">Pts</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer / Balance */}
                    <div className="mt-6 flex justify-between items-center bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                        <div className="text-slate-400 text-sm">Ranking Points</div>
                        <div className="text-xl font-mono text-yellow-500 font-bold">{athlete.rankingPoints || 0}</div>
                    </div>
                </div>
            </div>

            {/* Click outside backdrop close */}
            <div className="absolute inset-0 -z-10" onClick={onClose}></div>
        </div>
    );
};

export default AthleteDetailModal;
