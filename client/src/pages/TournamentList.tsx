import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO, addMinutes } from 'date-fns';
import { getTournaments, deleteTournament } from '../api';
import { useLanguage } from '../contexts/LanguageContext';

interface Tournament {
    _id: string;
    name: string;
    date: string;
    location: string;
    status: string;
}

const TournamentList = () => {
    const { t } = useLanguage();
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getTournaments().then(setTournaments).finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="text-2xl p-8">{t('common.loading')}</div>;

    return (
        <div className="p-8 h-full overflow-auto">
            <Link to="/" className="text-slate-400 hover:text-white mb-4 inline-block">&larr; {t('common.backHome')}</Link>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold">{t('tournaments.title')}</h1>
                <Link to="/tournaments/new" className="px-6 py-3 bg-blue-600 rounded font-bold hover:bg-blue-500">
                    {t('tournaments.new')}
                </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tournaments.map(tour => (
                    <div key={tour._id} className="relative group">
                        <Link to={`/tournaments/${tour._id}`} className="block p-6 bg-slate-800 rounded-lg hover:bg-slate-700 transition border border-slate-700">
                            <h2 className="text-2xl font-bold mb-2">{tour.name}</h2>
                            <div className="text-slate-400">
                                {tour.date ? format(addMinutes(parseISO(tour.date), new Date().getTimezoneOffset()), 'PP') : ''}
                            </div>
                            <div className="text-slate-400">{tour.location}</div>
                            <div className="mt-4 capitalize px-3 py-1 bg-slate-900 inline-block rounded text-sm text-slate-300 font-mono">
                                {tour.status}
                            </div>
                        </Link>
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link
                                to={`/tournaments/${tour._id}/edit`}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm transition-colors"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {t('common.edit')}
                            </Link>
                            <button
                                onClick={async (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (!window.confirm(t('tournaments.deleteConfirm'))) return;
                                    try {
                                        await deleteTournament(tour._id);
                                        setTournaments(prev => prev.filter(item => item._id !== tour._id));
                                    } catch (err) {
                                        alert('Failed to delete tournament');
                                        console.error(err);
                                    }
                                }}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                            >
                                {t('common.delete')}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TournamentList;
