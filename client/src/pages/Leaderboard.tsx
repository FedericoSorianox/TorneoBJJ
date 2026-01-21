import { useEffect, useState } from 'react';
import { getLeaderboard } from '../api';
import clsx from 'clsx';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import AthleteDetailModal from '../components/AthleteDetailModal';
import type { AthleteData } from '../components/AthleteDetailModal';

// Extend or adapt local interface to match API response and Modal props if needed
// The API getLeaderboard likely returns objects compatible with AthleteData
// But let's check the local interface first.

interface AthleteStats {
    wins: number;
    losses: number;
    submissions: number;
    pointsScored: number;
}

interface Athlete {
    _id: string;
    name: string;
    nickname?: string;
    academy: string;
    belt: string;
    weight: number;
    stats: AthleteStats;
    photo?: string;
    rankingPoints?: number;
    // Add other fields that might be coming from API but weren't in previous interface
    gender?: string;
    age?: number;
}

const Leaderboard = () => {
    const { t } = useLanguage();
    const [athletes, setAthletes] = useState<Athlete[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAthlete, setSelectedAthlete] = useState<AthleteData | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        getLeaderboard()
            .then(setAthletes)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleAthleteClick = (athlete: Athlete) => {
        // Adapt to AthleteData if needed, but it seems compatible enough for the modal
        setSelectedAthlete(athlete as unknown as AthleteData);
        setIsModalOpen(true);
    };

    if (loading) return <div className="p-10 text-2xl center-content text-slate-400 animate-pulse">{t('leaderboard.loading')}</div>;

    return (
        <div className="h-full flex flex-col p-8 bg-slate-900 overflow-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                    {t('leaderboard.title')}
                </h1>
                <Link to="/" className="text-slate-400 hover:text-white transition">{t('common.backHome')}</Link>
            </div>

            <div className="bg-slate-800 rounded-xl overflow-hidden shadow-xl border border-slate-700">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-900 border-b border-slate-700">
                        <tr>
                            <th className="p-4 font-bold text-slate-400 w-16 text-center">#</th>
                            <th className="p-4 font-bold text-slate-400">{t('leaderboard.athlete')}</th>
                            <th className="p-4 font-bold text-slate-400">{t('leaderboard.academy')}</th>
                            <th className="p-4 font-bold text-slate-400 text-center">{t('leaderboard.wins')}</th>
                            <th className="p-4 font-bold text-slate-400 text-center">{t('leaderboard.subs')}</th>
                            <th className="p-4 font-bold text-slate-400 text-center">{t('leaderboard.points')}</th>
                            <th className="p-4 font-bold text-slate-400 text-center">{t('leaderboard.belt')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {athletes.map((athlete, index) => (
                            <tr
                                key={athlete._id}
                                className="border-b border-slate-700 hover:bg-slate-750 transition last:border-0 cursor-pointer group"
                                onClick={() => handleAthleteClick(athlete)}
                            >
                                <td className="p-4 text-center font-mono text-slate-500 group-hover:text-white transition">
                                    {index + 1}
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        {athlete.photo ? (
                                            <img src={`http://localhost:5001${athlete.photo}`} alt={athlete.name} className="w-10 h-10 rounded-full object-cover border border-slate-600" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-500 font-bold text-sm">
                                                {athlete.name.charAt(0)}
                                            </div>
                                        )}
                                        <div className="font-bold text-lg text-white group-hover:text-blue-400 transition">{athlete.name}</div>
                                    </div>
                                </td>
                                <td className="p-4 text-slate-300 group-hover:text-white transition">{athlete.academy}</td>
                                <td className="p-4 text-center">
                                    <span className="bg-green-900/50 text-green-300 py-1 px-3 rounded font-mono font-bold">
                                        {athlete.stats?.wins || 0}
                                    </span>
                                </td>
                                <td className="p-4 text-center">
                                    <span className="bg-purple-900/50 text-purple-300 py-1 px-3 rounded font-mono font-bold">
                                        {athlete.stats?.submissions || 0}
                                    </span>
                                </td>
                                <td className="p-4 text-center font-mono text-slate-400 group-hover:text-yellow-400 transition">
                                    {athlete.stats?.pointsScored || 0}
                                </td>
                                <td className="p-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <span className={clsx("w-3 h-3 rounded-full shadow-sm",
                                            athlete.belt.toLowerCase() === 'white' && 'bg-slate-100',
                                            athlete.belt.toLowerCase() === 'blue' && 'bg-blue-500',
                                            athlete.belt.toLowerCase() === 'purple' && 'bg-purple-500',
                                            athlete.belt.toLowerCase() === 'brown' && 'bg-amber-800',
                                            athlete.belt.toLowerCase() === 'black' && 'bg-black border border-slate-600'
                                        )}
                                        />
                                        <span className="capitalize text-slate-400 text-sm">{athlete.belt}</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <AthleteDetailModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                athlete={selectedAthlete}
            />
        </div>
    );
};

export default Leaderboard;
