import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBracket, getCategoryById, finalizeBracket, updateMatchAthletes, getAthletes } from '../api';
import clsx from 'clsx';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

const BracketView = () => {
    const { id } = useParams<{ id: string }>();
    const categoryId = id;
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { user } = useAuth();
    const [bracket, setBracket] = useState<any>(null);
    const [category, setCategory] = useState<any>(null);
    const [athletes, setAthletes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFinalizing, setIsFinalizing] = useState(false);
    const [finalized, setFinalized] = useState(false);
    
    // Editing state
    const [editingMatch, setEditingMatch] = useState<any>(null);

    useEffect(() => {
        if (bracket) setFinalized(!!bracket.winnerId);
    }, [bracket]);

    const processBracket = (bracketData: any) => {
        if (!bracketData || !bracketData.matches) return bracketData;

        const matches = bracketData.matches;
        const roundsMap = new Map<number, any[]>();
        const consolationMap = new Map<number, any[]>();

        matches.forEach((m: any) => {
            const matchFormatted = {
                id: m._id,
                winnerId: m.winnerId,
                nextMatchId: m.nextMatchId,
                status: m.status,
                p1: {
                    id: m.athlete1Id?._id,
                    name: m.athlete1Id?.name
                },
                p2: {
                    id: m.athlete2Id?._id,
                    name: m.athlete2Id?.name
                },
                round: m.round,
                matchNumber: m.matchNumber || 0,
                bracketType: m.bracketType
            };

            const targetMap = (m.bracketType === 'Loser') ? consolationMap : roundsMap;
            const r = m.round || 1;

            if (!targetMap.has(r)) targetMap.set(r, []);
            targetMap.get(r)!.push(matchFormatted);
        });

        const rounds = Array.from(roundsMap.keys())
            .sort((a, b) => a - b)
            .map(key => roundsMap.get(key)!.sort((a, b) => a.matchNumber - b.matchNumber));

        const consolationRounds = Array.from(consolationMap.keys())
            .sort((a, b) => a - b)
            .map(key => consolationMap.get(key)!.sort((a, b) => a.matchNumber - b.matchNumber));

        return {
            ...bracketData,
            rounds,
            consolationRounds
        };
    };

    const loadData = async () => {
        if (!categoryId) return;
        try {
            const [b, c, allAthletes] = await Promise.all([
                getBracket(categoryId),
                getCategoryById(categoryId),
                getAthletes()
            ]);
            
            setBracket(processBracket(b));
            setCategory(c);
            // Filter athletes to only those in the category
            const categoryAthletes = allAthletes.filter((a: any) => (c.athleteIds || []).includes(a._id));
            setAthletes(categoryAthletes);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [categoryId]);

    const isBracketStarted = () => {
        if (!bracket || !bracket.matches) return false;
        // Solo consideramos empezada si alguna lucha NO está Scheduled
        return bracket.matches.some((m: any) => m.status && m.status !== 'Scheduled');
    };

    const handleUpdateMatch = async (matchId: string, p1Id: string, p2Id: string) => {
        try {
            await updateMatchAthletes(matchId, { athlete1Id: p1Id, athlete2Id: p2Id });
            setEditingMatch(null);
            loadData();
        } catch (e: any) {
            alert(e.response?.data?.error || "Error updating match");
        }
    };

    if (loading) return <div className="text-3xl text-center p-20 font-black animate-pulse">{t('brackets.loading')}</div>;

    if (!bracket) return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <h2 className="text-4xl font-bold mb-4">{t('brackets.notFound')}</h2>
            <p className="text-slate-400 mb-8 max-w-md">{t('brackets.notFoundDesc')}</p>
            <button onClick={() => navigate(-1)} className="px-6 py-3 bg-slate-700 rounded font-bold hover:bg-slate-600 transition">
                {t('brackets.goBack')}
            </button>
        </div>
    );

    const renderMatch = (match: any) => {
        const isFinal = !match.nextMatchId;
        const winnerId = match.winnerId;
        const editable = !isBracketStarted() && user?.role === 'admin';

        return (
            <div key={match.id} className="relative group">
                <div 
                    onClick={() => {
                        if (finalized) {
                            alert("Esta categoría ya ha sido finalizada y no permite más cambios.");
                            return;
                        }
                        navigate(`/match/${match.id}`);
                    }}
                    className={clsx(
                        "relative flex flex-col w-64 bg-slate-800 rounded-lg border-2 shadow-xl transition-all mb-4 shrink-0 cursor-pointer",
                        finalized ? "opacity-75 cursor-not-allowed border-slate-700" : "hover:scale-[1.02]",
                        winnerId ? "border-green-600/50" : "border-slate-700",
                        isFinal && "border-yellow-500/50 ring-1 ring-yellow-500/20"
                    )}>
                    {/* Header */}
                    <div className="flex justify-between items-center px-3 py-1 bg-black/20 text-[10px] text-slate-400 font-mono tracking-wider border-b border-slate-700/50">
                        <span>M#{match.id.slice(-4)}</span>
                        <span>{isFinal ? '🏆 FINAL' : 'ELIMINATION'}</span>
                    </div>

                    {/* Athlete 1 */}
                    <div className={clsx(
                        "flex flex-col px-4 py-3 transition-colors",
                        winnerId && match.p1.id && winnerId === match.p1.id ? "bg-green-900/10" : "bg-transparent",
                        !match.p1.name && "opacity-50"
                    )}>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                            {match.p1.name ? 'Red Corner' : 'TBD'}
                        </span>
                        <div className="flex justify-between items-center">
                            <span className={clsx("text-sm font-bold truncate", winnerId && match.p1.id && winnerId === match.p1.id && "text-green-400")}>
                                {match.p1.name || t('common.tbd')}
                            </span>
                            {winnerId && match.p1.id && winnerId === match.p1.id && <span className="text-green-500 text-[10px] font-black uppercase">Win</span>}
                        </div>
                    </div>

                    {/* VS Divider */}
                    <div className="flex items-center px-4">
                        <div className="flex-1 h-[1px] bg-slate-700/30"></div>
                        <div className="mx-2 px-2 py-0.5 rounded-full bg-slate-900/50 border border-slate-700/50 text-[9px] font-black text-slate-500 tracking-tighter">
                            VS
                        </div>
                        <div className="flex-1 h-[1px] bg-slate-700/30"></div>
                    </div>

                    {/* Athlete 2 */}
                    <div className={clsx(
                        "flex flex-col px-4 py-3 transition-colors",
                        winnerId && match.p2.id && winnerId === match.p2.id ? "bg-green-900/10" : "bg-transparent",
                        !match.p2.name && "opacity-50"
                    )}>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                            {match.p2.name ? 'Blue Corner' : 'TBD'}
                        </span>
                        <div className="flex justify-between items-center">
                            <span className={clsx("text-sm font-bold truncate", winnerId && match.p2.id && winnerId === match.p2.id && "text-green-400")}>
                                {match.p2.name || t('common.tbd')}
                            </span>
                            {winnerId && match.p2.id && winnerId === match.p2.id && <span className="text-green-500 text-[10px] font-black uppercase">Win</span>}
                        </div>
                    </div>
                </div>

                {/* Edit Button */}
                {editable && (
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setEditingMatch(match);
                        }}
                        className="absolute -right-2 -top-2 w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg border border-slate-900 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-20 hover:bg-blue-500"
                        title="Editar lucha"
                    >
                        <span className="text-[10px]">✏️</span>
                    </button>
                )}
            </div>
        );
    };

    const handleFinalize = async () => {
        if (!categoryId || isFinalizing) return;
        if (!window.confirm("¿Estás seguro de que quieres finalizar esta categoría? Se asignarán puntos de ranking a los ganadores.")) return;

        setIsFinalizing(true);
        try {
            await finalizeBracket(categoryId);
            setFinalized(true);
            const b = await getBracket(categoryId);
            setBracket(processBracket(b));
            alert("Categoría finalizada y puntos asignados.");
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.error || "Error al finalizar la categoría");
        } finally {
            setIsFinalizing(false);
        }
    };

    const isBracketComplete = () => {
        if (!bracket || !bracket.rounds) return false;
        const lastRound = bracket.rounds[bracket.rounds.length - 1];
        if (!lastRound || lastRound.length === 0) return false;
        return !!lastRound[0].winnerId;
    };

    const rounds = bracket.rounds || [];
    const consolationRounds = bracket.consolationRounds || [];

    return (
        <div className="h-full flex flex-col bg-[#0f172a] overflow-hidden">
            {/* Edit Match Modal */}
            {editingMatch && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold mb-6 text-white uppercase tracking-tight">Editar Lucha M#{editingMatch.id.slice(-4)}</h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Red Corner</label>
                                <select 
                                    className="w-full bg-slate-800 text-white p-3 rounded-lg border border-slate-700"
                                    defaultValue={editingMatch.p1.id || ''}
                                    onChange={(e) => editingMatch.p1.id = e.target.value}
                                >
                                    <option value="">{t('common.tbd')}</option>
                                    {athletes.map(a => (
                                        <option key={a._id} value={a._id}>{a.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Blue Corner</label>
                                <select 
                                    className="w-full bg-slate-800 text-white p-3 rounded-lg border border-slate-700"
                                    defaultValue={editingMatch.p2.id || ''}
                                    onChange={(e) => editingMatch.p2.id = e.target.value}
                                >
                                    <option value="">{t('common.tbd')}</option>
                                    {athletes.map(a => (
                                        <option key={a._id} value={a._id}>{a.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button 
                                onClick={() => setEditingMatch(null)}
                                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold rounded-xl transition"
                            >
                                {t('common.cancel')}
                            </button>
                            <button 
                                onClick={() => handleUpdateMatch(editingMatch.id, editingMatch.p1.id, editingMatch.p2.id)}
                                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition shadow-lg shadow-blue-900/20"
                            >
                                {t('common.save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="shrink-0 p-6 bg-slate-900/50 border-b border-slate-800 flex justify-between items-center backdrop-blur-sm sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition">
                        &larr; {t('common.back')}
                    </button>
                    <div>
                        <h1 className="text-2xl font-black italic tracking-tighter text-slate-100 uppercase">
                            {t('brackets.title')}
                        </h1>
                        <p className="text-slate-400 text-xs font-mono">
                            {category?.name} • <span className="text-blue-400">{rounds.length} Rounds</span>
                        </p>
                    </div>
                </div>
                <div className="flex gap-4">
                    {finalized ? (
                        <div className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-lg text-sm font-black uppercase tracking-widest flex items-center gap-2">
                             🏆 CATEGORY FINALIZED
                        </div>
                    ) : isBracketComplete() && (
                        <button
                            onClick={handleFinalize}
                            disabled={isFinalizing}
                            className={clsx(
                                "px-6 py-2 rounded-lg font-black uppercase tracking-widest text-sm transition-all shadow-lg",
                                isFinalizing 
                                    ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                                    : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20 scale-105"
                            )}
                        >
                            {isFinalizing ? "Finalizando..." : "Finalizar Categoría"}
                        </button>
                    )}
                    <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 rounded text-xs font-bold uppercase tracking-wider flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                        Live Updates
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-8 custom-scrollbar">
                <div className="min-w-fit space-y-12 pb-12">
                    {/* Main Bracket */}
                    <div className="flex gap-16">
                        <div className="absolute left-8 top-32 text-8xl font-black text-slate-800 -z-10 opacity-20 pointer-events-none select-none">
                            {t('brackets.main')}
                        </div>

                        {rounds.map((round: any[], rIndex: number) => (
                            <div key={rIndex} className="flex flex-col justify-around relative min-w-[16rem]">
                                <div className="absolute -top-12 left-0 w-full text-center pb-4 border-b border-slate-800/50">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">{t('brackets.round')} {rIndex + 1}</span>
                                </div>
                                {round.map((match: any) => renderMatch(match))}
                            </div>
                        ))}
                    </div>

                    {/* Consolation Bracket */}
                    {consolationRounds.length > 0 && (
                        <div className="mt-24 pt-12 border-t border-slate-800/50 relative">
                            <h3 className="text-xl font-bold text-slate-500 mb-8 px-8 uppercase tracking-widest">{t('brackets.consolation')}</h3>
                            <div className="flex gap-16 px-8">
                                {consolationRounds.map((round: any[], rIndex: number) => (
                                    <div key={'c' + rIndex} className="flex flex-col justify-around gap-8 min-w-[16rem]">
                                        {round.map((match: any) => renderMatch(match))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BracketView;
