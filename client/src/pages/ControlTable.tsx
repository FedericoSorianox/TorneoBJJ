import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import io from 'socket.io-client';
import { getMatch, SOCKET_URL, SOCKET_CONNECTION_URL } from '../api';
import clsx from 'clsx';
import { useLanguage } from '../contexts/LanguageContext';

interface MatchScore {
    p1: number; p2: number;
    p1Adv: number; p2Adv: number;
    p1Pen: number; p2Pen: number;
}
interface Match {
    _id: string;
    athlete1Id: { name: string; academy: string; _id?: string };
    athlete2Id: { name: string; academy: string; _id?: string };
    score: MatchScore;
    status: string;
    eventLog: any[];
    tournamentId: {
        ruleSetId: {
            name: string;
            durationSeconds: number;
        }
    }
}

// Socket is now managed inside the component

// ─── ScoreCard ────────────────────────────────────────────────────────────────
const ScoreCard = ({
    name, academy, score, isP1, sendEvent, isSubOnly
}: {
    name: string; academy: string; score: MatchScore;
    isP1: boolean;
    sendEvent: (type: string, side: string, pts?: number) => void;
    isSubOnly: boolean;
}) => {
    const side   = isP1 ? 'p1' : 'p2';
    const points = isP1 ? score.p1    : score.p2;
    const adv    = isP1 ? score.p1Adv : score.p2Adv;
    const pen    = isP1 ? score.p1Pen : score.p2Pen;

    const Counter = ({
        value, color, onAdd, onSub, label,
    }: { value: number; color: string; label: string;
         onAdd: () => void; onSub: () => void }) => (
        <div className="flex flex-col items-center gap-[0.3vh]">
            <span className="font-bold text-slate-500 uppercase tracking-widest"
                  style={{ fontSize: 'clamp(8px, 1.2vh, 14px)' }}>
                {label}
            </span>
            <div className="flex items-center gap-[1vw]">
                <button onClick={onSub}
                    className="flex items-center justify-center rounded-lg bg-slate-800 border border-slate-600 text-slate-400 hover:bg-slate-700 hover:text-white transition active:scale-90 font-bold"
                    style={{ width: 'clamp(26px,3.5vw,48px)', height: 'clamp(26px,3.5vw,48px)', fontSize: 'clamp(12px,1.6vw,22px)' }}>
                    –
                </button>
                <span className={clsx('font-black leading-none select-none text-center', color)}
                      style={{ fontSize: 'clamp(1.4rem,4vw,3.5rem)', minWidth: '1.2em' }}>
                    {value}
                </span>
                <button onClick={onAdd}
                    className={clsx(
                        'flex items-center justify-center rounded-lg border transition active:scale-90 font-bold',
                        color === 'text-emerald-500'
                            ? 'bg-emerald-950 border-emerald-800 text-emerald-400 hover:bg-emerald-800'
                            : 'bg-rose-950 border-rose-800 text-rose-400 hover:bg-rose-800'
                    )}
                    style={{ width: 'clamp(26px,3.5vw,48px)', height: 'clamp(26px,3.5vw,48px)', fontSize: 'clamp(12px,1.6vw,22px)' }}>
                    +
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Part: Name and Main Score (Colored) */}
            <div className={clsx(
                "flex flex-col transition-colors duration-500 pt-[2vh]",
                isP1 ? 'bg-slate-100 text-slate-950' : 'bg-blue-700 text-white shadow-[inset_0_0_100px_rgba(0,0,0,0.2)]'
            )} style={{ height: '48%' }}>
                {/* Name / academy */}
                <div className="flex flex-col items-center justify-center text-center px-2 border-b border-black/5"
                     style={{ height: '30%' }}>
                    <h2 className={clsx("font-black uppercase tracking-tight leading-none truncate w-full", isP1 ? "text-slate-900" : "text-white")}
                        style={{ fontSize: 'clamp(1rem, 3.5vw, 3rem)' }}>
                        {name}
                    </h2>
                    <p className={clsx("font-semibold uppercase tracking-widest", isP1 ? "text-slate-500" : "text-blue-200")}
                       style={{ fontSize: 'clamp(0.55rem, 1.2vw, 1rem)' }}>
                        {academy}
                    </p>
                </div>

                {/* Score number */}
                <div className="flex-1 flex items-center justify-center">
                    {!isSubOnly ? (
                        <span className="font-black leading-none select-none text-black"
                            style={{ 
                                fontSize: 'clamp(4rem, 18vw, 24vh)',
                                textShadow: '2px 2px 0 #fff, -2px -2px 0 #fff, 2px -2px 0 #fff, -2px 2px 0 #fff, 0 2px 0 #fff, 0 -2px 0 #fff, 2px 0 0 #fff, -2px 0 0 #fff'
                            }}>
                            {points}
                        </span>
                    ) : (
                        <div className="flex flex-col items-center gap-2 opacity-20">
                            <div className={clsx("w-16 h-16 border-4 rounded-full border-t-transparent animate-spin", isP1 ? "border-slate-300" : "border-blue-400")} />
                            <span className="text-xs font-bold tracking-[0.3em]">SUB ONLY</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Part: Controls (Dark) */}
            <div className="flex-1 flex flex-col bg-slate-950 border-t border-white/5" style={{ height: '52%' }}>
                {/* ADV / PEN */}
                <div className={clsx("flex items-center justify-center gap-[8vw] px-4", isSubOnly && "opacity-0 pointer-events-none")}
                     style={{ height: '35%' }}>
                    <Counter label="ADV" value={adv} color="text-yellow-500"
                        onAdd={() => sendEvent('advantage',     side)}
                        onSub={() => sendEvent('sub_advantage', side)} />
                    <Counter label="PEN" value={pen} color="text-rose-500"
                        onAdd={() => sendEvent('penalty',     side)}
                        onSub={() => sendEvent('sub_penalty', side)} />
                </div>

                {/* Point buttons */}
                <div className={clsx("flex flex-col gap-[1vh] px-4 pb-4 transition-all", isSubOnly ? "opacity-0 pointer-events-none translate-y-10" : "opacity-100")} style={{ height: '40%' }}>
                    <div className="grid grid-cols-3 gap-[1.5vw] flex-1" style={{ flex: '1 1 0' }}>
                        {[
                            { pts: 2, cls: 'bg-emerald-700 hover:bg-emerald-600 border-emerald-500/30' },
                            { pts: 3, cls: 'bg-emerald-800 hover:bg-emerald-700 border-emerald-600/30' },
                            { pts: 4, cls: 'bg-emerald-900 hover:bg-emerald-800 border-emerald-700/30' },
                        ].map(({ pts, cls }) => (
                            <button key={pts}
                                onClick={() => sendEvent('points', side, pts)}
                                className={clsx(
                                    'w-full h-full rounded-2xl font-black text-white transition active:scale-95 flex items-center justify-center border-2 shadow-lg shadow-emerald-950/20',
                                    cls
                                )}
                                style={{ fontSize: 'clamp(1rem, 3vh, 2.5rem)' }}>
                                +{pts}
                            </button>
                        ))}
                    </div>
                    <div className="grid grid-cols-3 gap-[1vw]" style={{ flex: '1 1 0' }}>
                        {[2, 3, 4].map(pts => (
                            <button key={pts}
                                onClick={() => sendEvent('sub_points', side, pts)}
                                className="w-full h-full rounded-lg font-black text-slate-400 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition active:scale-95 flex items-center justify-center"
                                style={{ fontSize: 'clamp(0.75rem, 2vw, 1.25rem)' }}>
                                -{pts}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── End-match modal ──────────────────────────────────────────────────────────
const EndMatchModal = ({ match, t, onClose, onConfirm }: {
    match: Match; t: any;
    onClose: () => void;
    onConfirm: (winnerId: string | null, method: string) => void;
}) => {
    const [selectedWinner, setSelectedWinner] = useState<string | null>(null);
    const [method, setMethod] = useState('Points');

    const p1 = match.athlete1Id || { name: 'P1', academy: '' };
    const p2 = match.athlete2Id || { name: 'P2', academy: '' };
    const isSubOnly = match.tournamentId?.ruleSetId?.name === 'Submission Only';

    const methods = [
        { value: 'Submission',       label: t('modal.submission') },
        { value: 'Points',           label: t('modal.points'), disabled: isSubOnly },
        { value: 'Referee Decision', label: t('modal.decision')   },
        { value: 'Disqualification', label: t('modal.dq')         },
        { value: 'Walkover',         label: t('modal.walkover')   },
        { value: 'Advantage',        label: t('modal.advantage'), disabled: isSubOnly },
    ];

    useEffect(() => {
        if (isSubOnly) {
            setMethod('Submission');
            return;
        }
        const s = match.score;
        if (s.p1 > s.p2 || s.p1Adv > s.p2Adv || s.p1Pen < s.p2Pen)
            setSelectedWinner(match.athlete1Id?._id || null);
        else if (s.p2 > s.p1 || s.p2Adv > s.p1Adv || s.p2Pen < s.p1Pen)
            setSelectedWinner(match.athlete2Id?._id || null);
    }, []);

    return (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg p-5 flex flex-col gap-5 shadow-2xl">
                <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tighter text-center">
                    {t('modal.finalize')}
                </h2>

                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('modal.selectWinner')}</label>
                    <div className="grid grid-cols-2 gap-3">
                        {[{ a: p1, id: match.athlete1Id?._id }, { a: p2, id: match.athlete2Id?._id }].map(({ a, id }) => (
                            <button key={id} onClick={() => setSelectedWinner(id || null)}
                                className={clsx(
                                    'p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-1',
                                    selectedWinner === id
                                        ? 'bg-blue-600 border-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.3)]'
                                        : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
                                )}>
                                <span className="text-base sm:text-xl font-black text-white uppercase text-center">{a.name}</span>
                                <span className="text-xs font-bold text-blue-200/70 uppercase tracking-widest">{a.academy}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('modal.method')}</label>
                    <div className="grid grid-cols-3 gap-2">
                        {methods.map(m => (
                            <button 
                                key={m.value} 
                                onClick={() => !m.disabled && setMethod(m.value)}
                                disabled={m.disabled}
                                className={clsx(
                                    'px-2 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all',
                                    method === m.value
                                        ? 'bg-emerald-600 text-white scale-105'
                                        : m.disabled 
                                            ? 'bg-slate-800/50 text-slate-700 cursor-not-allowed'
                                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                                )}>
                                {m.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex gap-3">
                    <button onClick={onClose}
                        className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold uppercase tracking-widest rounded-xl transition text-sm">
                        {t('modal.cancel')}
                    </button>
                    <button onClick={() => onConfirm(selectedWinner, method)} disabled={!selectedWinner}
                        className={clsx(
                            'flex-1 py-3 font-black uppercase tracking-widest rounded-xl transition text-sm',
                            !selectedWinner
                                ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg'
                        )}>
                        {t('modal.confirm')}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ControlTable = () => {
    const { id }   = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t }    = useLanguage();

    const [match, setMatch]         = useState<any | null>(null);
    const [timer, setTimer]         = useState(300);
    const [running, setRunning]     = useState(false);
    const [showModal, setShowModal] = useState(false);
    
    const socketRef = useRef<any>(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const el = document.createElement('meta');
        el.name = 'viewport';
        el.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0';
        document.head.appendChild(el);
        return () => { document.head.removeChild(el); };
    }, []);

    useEffect(() => {
        if (!id) return;
        
        console.log('🔌 Connecting to socket at:', SOCKET_CONNECTION_URL, 'with path: /torneobjj/socket.io');
        const socket = io(SOCKET_CONNECTION_URL, { 
            path: '/torneobjj/socket.io',
            reconnectionAttempts: 5,
            timeout: 10000
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('✅ Socket connected:', socket.id);
            setConnected(true);
            socket.emit('join_match', id);
        });

        socket.on('connect_error', (err) => {
            console.error('❌ Socket connection error:', err);
            setConnected(false);
        });

        socket.on('disconnect', (reason) => {
            console.warn('⚠️ Socket disconnected:', reason);
            setConnected(false);
        });

        socket.on('match_update', (updatedMatch: any) => {
            console.log('Match updated:', updatedMatch);
            setMatch(updatedMatch);
        });

        socket.on('timer_update', ({ action, timer: rt }: { action: string, timer: number }) => {
            if (action === 'start')     setRunning(true);
            else if (action === 'stop') { setRunning(false); setTimer(rt); }
            else if (action === 'sync') setTimer(rt);
        });

        socket.on('error', (err: any) => {
            console.error('Socket error event:', err);
            alert(err.message || 'Error en el servidor');
        });

        getMatch(id).then(m => {
            setMatch(m);
            const catDuration = (m.categoryId as any)?.durationSeconds;
            const ruleDuration = m.tournamentId?.ruleSetId?.durationSeconds;
            if (catDuration) {
                setTimer(catDuration);
            } else if (ruleDuration) {
                setTimer(ruleDuration);
            }
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [id]);

    useEffect(() => {
        if (!running || timer <= 0) return;
        const iv = setInterval(() =>
            setTimer(v => { const n = v - 1; if (n <= 0) setRunning(false); return n; }),
        1000);
        return () => clearInterval(iv);
    }, [running, timer]);

    const toggleTimer = () => {
        const next = !running;
        setRunning(next);
        if (socketRef.current) {
            socketRef.current.emit('timer_action', { matchId: id, action: next ? 'start' : 'stop', timer });
        }
    };

    const sendEvent = (type: string, athleteId: string, points?: number) => {
        if (!id || !socketRef.current) return;
        console.log('Sending event:', type, athleteId, points);
        socketRef.current.emit('send_event', { matchId: id, event: { type, athleteId, points, timestamp: new Date() } });
    };

    const endMatch = (winnerId: string | null, method: string) => {
        if (!id || !socketRef.current) return;
        console.log('Ending match:', winnerId, method);
        socketRef.current.emit('end_match', { matchId: id, winnerId, method });
        setShowModal(false);
        navigate(-1);
    };

    const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

    if (!match) return (
        <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center text-2xl font-bold text-slate-600 animate-pulse font-mono">
            {t('scoreboard.loading')}
        </div>
    );

    const p1 = match.athlete1Id || { name: 'P1', academy: '' };
    const p2 = match.athlete2Id || { name: 'P2', academy: '' };
    const isSubOnly = match.tournamentId?.ruleSetId?.name === 'Submission Only';
    const NAV_VH = 22; // Massive header for the timer

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col overflow-hidden font-sans">
            {showModal && (
                <EndMatchModal match={match} t={t}
                    onClose={() => setShowModal(false)}
                    onConfirm={endMatch} />
            )}

            <div className="shrink-0 flex items-center bg-slate-900 border-b border-white/10 z-10 px-3 sm:px-6 md:px-10" style={{ height: `${NAV_VH}vh` }}>
                <div className="flex-1">
                    <button onClick={() => navigate(-1)} className="group flex items-center gap-1 sm:gap-2 text-slate-400 hover:text-white transition font-bold uppercase tracking-widest" style={{ fontSize: 'clamp(0.7rem, 1.6vh, 1.1rem)' }}>
                        <span className="transition group-hover:-translate-x-1">←</span>
                        <span className="hidden sm:inline">{t('scoreboard.back')}</span>
                    </button>
                </div>
                <div className="flex-1 flex justify-center">
                    <div onClick={toggleTimer} 
                        className={clsx(
                            'font-mono font-black cursor-pointer select-none rounded-[2vh] transition-all duration-300 flex items-center justify-center border-2', 
                            running 
                                ? 'bg-slate-950 text-white border-white/20 shadow-[inset_0_0_40px_rgba(0,0,0,0.8)]' 
                                : 'bg-yellow-500 text-black border-yellow-300 shadow-[0_0_60px_rgba(234,179,8,0.5)] animate-pulse'
                        )} 
                        style={{ 
                            fontSize: 'clamp(3rem, 16vh, 14rem)', 
                            padding: '0 clamp(30px, 6vw, 120px)',
                            height: '90%',
                            minWidth: '2.8em'
                        }}>
                        {fmt(timer)}
                    </div>
                </div>
                <div className="flex-1 flex justify-end">
                    <button onClick={() => setShowModal(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest transition active:scale-95 rounded-lg sm:rounded-xl shadow-[0_0_16px_rgba(16,185,129,0.25)]" style={{ fontSize: 'clamp(0.65rem, 1.5vh, 1rem)', padding: 'clamp(4px, 1vh, 14px) clamp(8px, 2vw, 32px)' }}>
                        <span className="sm:hidden">FIN</span>
                        <span className="hidden sm:inline">{t('scoreboard.endMatch')}</span>
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden" style={{ height: `${100 - NAV_VH}vh` }}>
                <ScoreCard name={p1.name} academy={p1.academy} score={match.score} isP1={true}  sendEvent={sendEvent} isSubOnly={isSubOnly} />
                <div className="w-px bg-white/5 shrink-0" />
                <ScoreCard name={p2.name} academy={p2.academy} score={match.score} isP1={false} sendEvent={sendEvent} isSubOnly={isSubOnly} />
            </div>
        </div>
    );
};

export default ControlTable;
