import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import io from 'socket.io-client';
import { getMatch } from '../api';
import clsx from 'clsx';
import { useLanguage } from '../contexts/LanguageContext';

// Types
interface MatchScore {
    p1: number; p2: number;
    p1Adv: number; p2Adv: number;
    p1Pen: number; p2Pen: number;
}
interface Match {
    _id: string;
    athlete1Id: { name: string, academy: string };
    athlete2Id: { name: string, academy: string };
    score: MatchScore;
    status: string;
    eventLog: any[];
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const SOCKET_URL = API_URL.replace(/\/api$/, '');
const socket = io(SOCKET_URL);

const ControlTable = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [match, setMatch] = useState<Match | null>(null);
    const [timer, setTimer] = useState(300);
    const [running, setRunning] = useState(false);
    const [showEndModal, setShowEndModal] = useState(false);

    // Force viewport to prevent zooming and ensure fit
    useEffect(() => {
        const meta = document.createElement('meta');
        meta.name = 'viewport';
        meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0';
        document.getElementsByTagName('head')[0].appendChild(meta);
        return () => {
            document.getElementsByTagName('head')[0].removeChild(meta);
        };
    }, []);

    useEffect(() => {
        if (!id) return;
        getMatch(id).then(setMatch);
        socket.emit('join_match', id);
        socket.on('match_update', setMatch);
        return () => { socket.off('match_update'); };
    }, [id]);

    useEffect(() => {
        socket.on('timer_update', ({ action, timer: remoteTimer }) => {
            if (action === 'start') setRunning(true);
            else if (action === 'stop') { setRunning(false); setTimer(remoteTimer); }
            else if (action === 'sync') setTimer(remoteTimer);
        });
        return () => { socket.off('timer_update'); };
    }, []);

    useEffect(() => {
        let interval: any;
        if (running && timer > 0) {
            interval = setInterval(() => {
                setTimer(t_val => {
                    const newVal = t_val - 1;
                    if (newVal === 0) setRunning(false);
                    return newVal;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [running, timer]);

    const toggleTimer = () => {
        const newRunning = !running;
        setRunning(newRunning);
        socket.emit('timer_action', { matchId: id, action: newRunning ? 'start' : 'stop', timer });
    };

    const sendEvent = (type: string, athleteId: string, points?: number) => {
        if (!id) return;
        socket.emit('send_event', {
            matchId: id,
            event: { type, athleteId, points, timestamp: new Date() }
        });
    };

    const endMatch = (winnerId: string | null, method: string) => {
        if (!id) return;
        socket.emit('end_match', { matchId: id, winnerId, method });
        setShowEndModal(false);
        navigate(-1); // Or stay? Ideally go back to brackets or show winner screen.
    };

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    if (!match) return <div className="h-screen w-screen bg-slate-950 flex items-center justify-center text-3xl font-bold text-slate-700 animate-pulse font-mono tracking-tighter">{t('scoreboard.loading')}</div>;

    const p1 = match.athlete1Id || { name: 'P1', academy: 'Academy A' };
    const p2 = match.athlete2Id || { name: 'P2', academy: 'Academy B' };

    const ScoreCard = ({ name, academy, score, isP1 }: { name: string, academy: string, score: MatchScore, isP1: boolean }) => {
        const athleteSide = isP1 ? 'p1' : 'p2';
        const points = isP1 ? score.p1 : score.p2;
        const adv = isP1 ? score.p1Adv : score.p2Adv;
        const pen = isP1 ? score.p1Pen : score.p2Pen;

        return (
            <div className={clsx("flex-1 flex flex-col items-center justify-between p-4 overflow-hidden", isP1 ? "bg-slate-950" : "bg-slate-900")}>
                {/* Header */}
                <div className="w-full text-center space-y-0">
                    <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tight text-white leading-tight whitespace-nowrap overflow-hidden text-ellipsis px-2">{name}</h2>
                    <p className="text-lg lg:text-xl font-semibold text-slate-500 uppercase tracking-[0.2em]">{academy}</p>
                </div>

                {/* Score Section */}
                <div className="flex flex-col items-center justify-center w-full flex-1 min-h-0">
                    {/* Points */}
                    <div className="relative group">
                        <div className="text-[25vh] font-black leading-none text-yellow-500 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] transition duration-500 select-none">
                            {points}
                        </div>
                    </div>

                    {/* ADV & PEN */}
                    <div className="grid grid-cols-2 gap-8 lg:gap-16 w-full px-6">
                        {/* ADV */}
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-sm lg:text-base font-bold text-slate-600 uppercase tracking-widest">ADV</span>
                            <div className="flex items-center gap-2 lg:gap-4">
                                <button onClick={() => sendEvent('sub_advantage', athleteSide)} className="size-10 lg:size-12 rounded-xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-2xl font-bold text-slate-400 hover:bg-slate-700 hover:text-white transition shadow-lg active:scale-95">–</button>
                                <span className="text-[8vh] font-black text-emerald-500 leading-none select-none min-w-[1.2em] text-center">{adv}</span>
                                <button onClick={() => sendEvent('advantage', athleteSide)} className="size-10 lg:size-12 rounded-xl bg-emerald-950 border-2 border-emerald-800 flex items-center justify-center text-2xl font-bold text-emerald-400 hover:bg-emerald-800 hover:text-emerald-200 transition shadow-lg active:scale-95">+</button>
                            </div>
                        </div>

                        {/* PEN */}
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-sm lg:text-base font-bold text-slate-600 uppercase tracking-widest">PEN</span>
                            <div className="flex items-center gap-2 lg:gap-4">
                                <button onClick={() => sendEvent('sub_penalty', athleteSide)} className="size-10 lg:size-12 rounded-xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-2xl font-bold text-slate-400 hover:bg-slate-700 hover:text-white transition shadow-lg active:scale-95">–</button>
                                <span className="text-[8vh] font-black text-rose-600 leading-none select-none min-w-[1.2em] text-center">{pen}</span>
                                <button onClick={() => sendEvent('penalty', athleteSide)} className="size-10 lg:size-12 rounded-xl bg-rose-950 border-2 border-rose-800 flex items-center justify-center text-2xl font-bold text-rose-400 hover:bg-rose-800 hover:text-rose-200 transition shadow-lg active:scale-95">+</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Score Controls */}
                <div className="w-full flex flex-col gap-2 mt-2 bg-black/30 p-3 rounded-2xl border border-white/5">
                    {/* Addition Buttons */}
                    <div className="grid grid-cols-3 gap-3 h-[10vh]">
                        <button onClick={() => sendEvent('points', athleteSide, 2)} className="h-full rounded-xl bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-3xl font-black text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] transition active:scale-95">+2</button>
                        <button onClick={() => sendEvent('points', athleteSide, 3)} className="h-full rounded-xl bg-purple-600 hover:bg-purple-500 flex items-center justify-center text-3xl font-black text-white shadow-[0_0_20px_rgba(147,51,234,0.4)] transition active:scale-95">+3</button>
                        <button onClick={() => sendEvent('points', athleteSide, 4)} className="h-full rounded-xl bg-orange-600 hover:bg-orange-500 flex items-center justify-center text-3xl font-black text-white shadow-[0_0_20_rgba(234,88,12,0.4)] transition active:scale-95">+4</button>
                    </div>
                    {/* Subtraction Buttons */}
                    <div className="grid grid-cols-3 gap-3 h-[6vh]">
                        <button onClick={() => sendEvent('sub_points', athleteSide, 2)} className="h-full rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-xl font-black text-slate-400 border border-slate-700 transition active:scale-95">-2</button>
                        <button onClick={() => sendEvent('sub_points', athleteSide, 3)} className="h-full rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-xl font-black text-slate-400 border border-slate-700 transition active:scale-95">-3</button>
                        <button onClick={() => sendEvent('sub_points', athleteSide, 4)} className="h-full rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-xl font-black text-slate-400 border border-slate-700 transition active:scale-95">-4</button>
                    </div>
                </div>
            </div>
        );
    };

    const EndMatchModal = () => {
        const [selectedWinner, setSelectedWinner] = useState<string | null>(null);
        const [method, setMethod] = useState('Points');

        const methods = [
            { value: 'Points', label: t('modal.points') },
            { value: 'Submission', label: t('modal.submission') },
            { value: 'Referee Decision', label: t('modal.decision') },
            { value: 'Disqualification', label: t('modal.dq') },
            { value: 'Walkover', label: t('modal.walkover') },
            { value: 'Advantage', label: t('modal.advantage') }
        ];

        const suggestWinner = () => {
            if (match!.score.p1 > match!.score.p2) return 'p1';
            if (match!.score.p2 > match!.score.p1) return 'p2';
            if (match!.score.p1Adv > match!.score.p2Adv) return 'p1';
            if (match!.score.p2Adv > match!.score.p1Adv) return 'p2';
            if (match!.score.p1Pen < match!.score.p2Pen) return 'p1';
            if (match!.score.p2Pen < match!.score.p1Pen) return 'p2';
            return null;
        };

        useEffect(() => {
            const suggestion = suggestWinner();
            if (suggestion === 'p1') setSelectedWinner((match?.athlete1Id as any)?._id);
            if (suggestion === 'p2') setSelectedWinner((match?.athlete2Id as any)?._id);
        }, []);

        return (
            <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-2xl p-8 flex flex-col gap-8 shadow-2xl">
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter text-center">{t('modal.finalize')}</h2>

                    <div className="flex flex-col gap-4">
                        <label className="text-sm font-bold text-slate-500 uppercase tracking-widest">{t('modal.selectWinner')}</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setSelectedWinner((match?.athlete1Id as any)?._id)}
                                className={clsx(
                                    "p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-2",
                                    selectedWinner === (match?.athlete1Id as any)?._id
                                        ? "bg-blue-600 border-blue-400 shadow-[0_0_30px_rgba(37,99,235,0.3)]"
                                        : "bg-slate-800 border-slate-700 hover:bg-slate-700"
                                )}
                            >
                                <span className="text-2xl font-black text-white uppercase text-center">{p1.name}</span>
                                <span className="text-sm font-bold text-blue-200 opacity-70 uppercase tracking-widest">{p1.academy}</span>
                            </button>

                            <button
                                onClick={() => setSelectedWinner((match?.athlete2Id as any)?._id)}
                                className={clsx(
                                    "p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-2",
                                    selectedWinner === (match?.athlete2Id as any)?._id
                                        ? "bg-blue-600 border-blue-400 shadow-[0_0_30px_rgba(37,99,235,0.3)]"
                                        : "bg-slate-800 border-slate-700 hover:bg-slate-700"
                                )}
                            >
                                <span className="text-2xl font-black text-white uppercase text-center">{p2.name}</span>
                                <span className="text-sm font-bold text-blue-200 opacity-70 uppercase tracking-widest">{p2.academy}</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <label className="text-sm font-bold text-slate-500 uppercase tracking-widest">{t('modal.method')}</label>
                        <div className="grid grid-cols-3 gap-3">
                            {methods.map(m => (
                                <button
                                    key={m.value}
                                    onClick={() => setMethod(m.value)}
                                    className={clsx(
                                        "px-4 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all",
                                        method === m.value
                                            ? "bg-emerald-600 text-white shadow-lg scale-105"
                                            : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                                    )}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-4 mt-4">
                        <button
                            onClick={() => setShowEndModal(false)}
                            className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold uppercase tracking-widest rounded-xl transition"
                        >
                            {t('modal.cancel')}
                        </button>
                        <button
                            onClick={() => endMatch(selectedWinner, method)}
                            disabled={!selectedWinner}
                            className={clsx(
                                "flex-1 py-4 font-black uppercase tracking-widest rounded-xl transition shadow-lg",
                                !selectedWinner
                                    ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                                    : "bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20"
                            )}
                        >
                            {t('modal.confirm')}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="h-screen w-screen flex flex-col bg-black overflow-hidden font-sans selection:bg-yellow-500 selection:text-black">
            {showEndModal && <EndMatchModal />}

            {/* Nav Bar */}
            <div className="h-20 lg:h-24 flex items-center px-8 lg:px-12 bg-slate-900 border-b border-white/5 z-50 shrink-0">
                <div className="flex-1">
                    <button onClick={() => navigate(-1)} className="group flex items-center gap-3 text-slate-500 hover:text-white transition font-bold text-lg lg:text-xl uppercase tracking-widest">
                        <span className="text-2xl transition group-hover:-translate-x-1">←</span> {t('scoreboard.back')}
                    </button>
                </div>

                <div className="flex-1 flex justify-center">
                    <div
                        onClick={toggleTimer}
                        className={clsx(
                            "text-5xl lg:text-7xl font-mono font-black px-8 lg:px-12 py-2 lg:py-3 rounded-2xl cursor-pointer select-none transition-all duration-300",
                            running
                                ? "bg-slate-950 text-white shadow-[inset_0_2px_10px_rgba(0,0,0,1)] border border-white/5"
                                : "bg-yellow-500 text-black shadow-[0_0_30px_rgba(234,179,8,0.3)] animate-pulse"
                        )}
                    >
                        {formatTime(timer)}
                    </div>
                </div>

                <div className="flex-1 flex justify-end">
                    <button
                        onClick={() => setShowEndModal(true)}
                        className="px-6 py-3 lg:px-10 lg:py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl lg:rounded-2xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] font-black uppercase text-lg lg:text-xl tracking-widest active:scale-95"
                    >
                        {t('scoreboard.endMatch')}
                    </button>
                </div>
            </div>

            {/* Scoreboard Area */}
            <div className="flex-1 flex min-h-0 overflow-hidden">
                <ScoreCard name={p1.name} academy={p1.academy} score={match.score} isP1={true} />
                <div className="w-1 bg-white/5 h-full opacity-50" />
                <ScoreCard name={p2.name} academy={p2.academy} score={match.score} isP1={false} />
            </div>
        </div>
    );
};

export default ControlTable;
