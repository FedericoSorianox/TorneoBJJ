import { useEffect, useState } from 'react';
import { getLeaderboard } from '../api';
import clsx from 'clsx';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

interface AthleteStats {
    wins: number;
    losses: number;
    submissions: number;
    pointsScored: number;
}

interface Athlete {
    _id: string;
    name: string;
    academy: string;
    belt: string;
    weight: number;
    stats: AthleteStats;
}

const Leaderboard = () => {
    const { t } = useLanguage();
    const [athletes, setAthletes] = useState<Athlete[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getLeaderboard()
            .then(setAthletes)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-10 text-2xl">{t('leaderboard.loading')}</div>;

    return (
        <div className="h-full flex flex-col p-8 bg-slate-900 overflow-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                    {t('leaderboard.title')}
                </h1>
                <Link to="/" className="text-slate-400 hover:text-white transition">{t('common.backHome')}</Link>
            </div>

            <div className="bg-slate-800 rounded-xl overflow-hidden shadow-xl border border-slate-700">
                <table className="w-full text-left">
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
                            <tr key={athlete._id} className="border-b border-slate-700 hover:bg-slate-750 transition last:border-0">
                                <td className="p-4 text-center font-mono text-slate-500">
                                    {index + 1}
                                </td>
                                <td className="p-4">
                                    <div className="font-bold text-lg text-white">{athlete.name}</div>
                                </td>
                                <td className="p-4 text-slate-300">{athlete.academy}</td>
                                <td className="p-4 text-center">
                                    <span className="bg-green-900 text-green-300 py-1 px-3 rounded font-mono font-bold">
                                        {athlete.stats?.wins || 0}
                                    </span>
                                </td>
                                <td className="p-4 text-center">
                                    <span className="bg-purple-900 text-purple-300 py-1 px-3 rounded font-mono font-bold">
                                        {athlete.stats?.submissions || 0}
                                    </span>
                                </td>
                                <td className="p-4 text-center font-mono text-slate-400">
                                    {athlete.stats?.pointsScored || 0}
                                </td>
                                <td className="p-4 text-center">
                                    <span className={clsx("inline-block w-3 h-3 rounded-full mr-2",
                                        athlete.belt.toLowerCase())}
                                    />
                                    <span className="capitalize text-slate-400">{athlete.belt}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Leaderboard;
