import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBracket, getCategoryById } from '../api';
import clsx from 'clsx';
import { useLanguage } from '../contexts/LanguageContext';

const BracketView = () => {
    const { id } = useParams<{ id: string }>();
    const categoryId = id;
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [bracket, setBracket] = useState<any>(null);
    const [category, setCategory] = useState<any>(null);
    const [loading, setLoading] = useState(true);

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
            targetMap.get(r).push(matchFormatted);
        });

        // Convert Maps to sorted Arrays
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

    useEffect(() => {
        if (categoryId) {
            Promise.all([
                getBracket(categoryId),
                getCategoryById(categoryId)
            ]).then(([b, c]) => {
                setBracket(processBracket(b));
                setCategory(c);
                setLoading(false);
            }).catch(e => {
                console.error(e);
                setLoading(false);
            });
        }
    }, [categoryId]);

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

        return (
            <div key={match.id} className={clsx(
                "relative flex flex-col w-64 bg-slate-800 rounded-lg border-2 shadow-xl transition-all hover:scale-[1.02] mb-4 shrink-0",
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
                    "flex flex-col px-4 py-2 border-b border-slate-700/50 transition-colors",
                    match.winnerId === match.p1.id ? "bg-green-900/10" : "bg-transparent",
                    !match.p1.name && "opacity-50"
                )}>
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">
                        {match.p1.name ? 'Red Corner' : 'TBD'}
                    </span>
                    <div className="flex justify-between items-center">
                        <span className={clsx("font-bold truncate", match.winnerId === match.p1.id && "text-green-400")}>
                            {match.p1.name || 'Waiter'}
                        </span>
                        {match.winnerId === match.p1.id && <span className="text-green-500 text-xs">Win</span>}
                    </div>
                </div>

                {/* Athlete 2 */}
                <div className={clsx(
                    "flex flex-col px-4 py-2 transition-colors",
                    match.winnerId === match.p2.id ? "bg-green-900/10" : "bg-transparent",
                    !match.p2.name && "opacity-50"
                )}>
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">
                        {match.p2.name ? 'Blue Corner' : 'TBD'}
                    </span>
                    <div className="flex justify-between items-center">
                        <span className={clsx("font-bold truncate", match.winnerId === match.p2.id && "text-green-400")}>
                            {match.p2.name || 'Waiter'}
                        </span>
                        {match.winnerId === match.p2.id && <span className="text-green-500 text-xs">Win</span>}
                    </div>
                </div>

                {/* VS Badge */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center text-[10px] font-black border border-slate-600 shadow-lg z-10">
                    VS
                </div>
            </div>
        );
    };

    const rounds = bracket.rounds || [];
    const consolationRounds = bracket.consolationRounds || [];

    return (
        <div className="h-full flex flex-col bg-[#0f172a] overflow-hidden">
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
                <div className="flex gap-2">
                    <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 rounded text-xs font-bold uppercase tracking-wider animate-pulse">
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
                                {/* Round Header */}
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
