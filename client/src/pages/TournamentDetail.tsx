
import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getCategories, createCategory, getAthletes, addAthleteToCategory, generateBracket, getTournamentById, deleteCategory } from '../api';
import { format, parseISO, addMinutes } from 'date-fns';
import { useLanguage } from '../contexts/LanguageContext';

const TournamentDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [categories, setCategories] = useState<any[]>([]);
    const [athletes, setAthletes] = useState<any[]>([]);
    const [tournament, setTournament] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showAddCat, setShowAddCat] = useState(false);

    // Form state
    const [newCat, setNewCat] = useState({
        name: 'Male Adult White Middle',
        gender: 'Male',
        belt: 'White',
        ageClass: 'Adult',
        weightClass: 'Middle'
    });


    const loadData = async () => {
        if (!id) return;
        try {
            const [tourney, cats, aths] = await Promise.all([
                getTournamentById(id),
                getCategories(id),
                getAthletes()
            ]);
            setTournament(tourney);
            setCategories(cats);
            setAthletes(aths);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initial load
        setLoading(true);
        loadData();
    }, [id]);

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        await createCategory({ ...newCat, tournamentId: id });
        setShowAddCat(false);
        // Reload data
        loadData();
    };

    const handleAddAthlete = async (catId: string, athleteId: string) => {
        if (!athleteId) return;
        await addAthleteToCategory(catId, athleteId);
        loadData();
    };

    const handleGenerate = async (catId: string) => {
        if (!confirm(t('detail.generateConfirm'))) return;
        try {
            await generateBracket(catId);
            alert(t('detail.generated'));
        } catch (e: any) {
            alert(t('common.error') + ': ' + e.message);
        }
    }

    if (loading) return <div>Loading...</div>;

    return (
        <div className="p-8 h-full flex flex-col">
            <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white mb-4 w-fit">
                &larr; Back
            </button>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-4xl font-bold">{tournament?.name || t('detail.title')}</h1>
                    {tournament && (
                        <div className="mt-2 text-slate-400">
                            <p>{tournament.date ? format(addMinutes(parseISO(tournament.date), new Date().getTimezoneOffset()), 'PP') : ''} • {tournament.location}</p>
                            <span className="inline-block mt-1 px-2 py-0.5 rounded bg-blue-900 text-blue-200 text-xs uppercase tracking-wider">
                                {tournament.status}
                            </span>
                        </div>
                    )}
                </div>
                <div className="flex gap-2">
                    <Link to={`/tournaments/${id}/edit`} className="bg-slate-700 px-4 py-2 rounded font-bold hover:bg-slate-600 transition-colors">
                        {t('detail.edit')}
                    </Link>
                    <button onClick={() => setShowAddCat(!showAddCat)} className="bg-blue-600 px-4 py-2 rounded font-bold hover:bg-blue-500 transition-colors">
                        {showAddCat ? t('common.cancel') : t('detail.addCategory')}
                    </button>
                </div>
            </div>

            {showAddCat && (
                <div className="bg-slate-800 p-6 rounded mb-8 border border-slate-700">
                    <form onSubmit={handleCreateCategory} className="grid grid-cols-2 gap-4">
                        <input className="bg-slate-900 p-2 rounded border border-slate-600" placeholder={t('category.form.name')} value={newCat.name} onChange={e => setNewCat({ ...newCat, name: e.target.value })} />
                        <select className="bg-slate-900 p-2 rounded border border-slate-600" value={newCat.gender} onChange={e => setNewCat({ ...newCat, gender: e.target.value })}>
                            {['Male', 'Female'].map(x => <option key={x}>{x}</option>)}
                        </select>
                        <select className="bg-slate-900 p-2 rounded border border-slate-600" value={newCat.belt} onChange={e => setNewCat({ ...newCat, belt: e.target.value })}>
                            {['White', 'Blue', 'Purple', 'Brown', 'Black'].map(x => <option key={x}>{x}</option>)}
                        </select>
                        <select className="bg-slate-900 p-2 rounded border border-slate-600" value={newCat.ageClass} onChange={e => setNewCat({ ...newCat, ageClass: e.target.value })}>
                            {['Juvenile', 'Adult', 'Master 1', 'Master 2'].map(x => <option key={x}>{x}</option>)}
                        </select>
                        <input className="bg-slate-900 p-2 rounded border border-slate-600" placeholder={t('category.form.weightClass')} value={newCat.weightClass} onChange={e => setNewCat({ ...newCat, weightClass: e.target.value })} />
                        <button className="bg-green-600 p-2 rounded font-bold">{t('category.form.create')}</button>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-auto pb-20">
                {categories.map(cat => (
                    <div key={cat._id} className="bg-slate-800 p-6 rounded border border-slate-700">
                        <h3 className="text-xl font-bold">{cat.name}</h3>
                        <p className="text-slate-400 text-sm mb-4">{cat.gender} • {cat.belt} • {cat.weightClass}</p>

                        <div className="mb-4">
                            <h4 className="font-bold mb-2 text-sm text-slate-300">{t('detail.athletes')} ({cat.athleteIds?.length || 0})</h4>
                            <ul className="space-y-1 mb-2 max-h-32 overflow-auto">
                                {(cat.athleteIds || []).map((aid: string) => {
                                    const a = athletes.find(x => x._id === aid);
                                    return <li key={aid} className="text-sm bg-slate-900 px-2 py-1 rounded">{a?.name || aid}</li>
                                })}
                            </ul>
                            <div className="flex gap-2">
                                <select className="flex-1 bg-slate-900 p-1 text-sm rounded border border-slate-600"
                                    onChange={(e) => handleAddAthlete(cat._id, e.target.value)} defaultValue="">
                                    <option value="" disabled>{t('category.form.addAthlete')}</option>
                                    {athletes.filter(a => !(cat.athleteIds || []).includes(a._id)).map(a => (
                                        <option key={a._id} value={a._id}>{a.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-700">
                            <button onClick={() => handleGenerate(cat._id)} className="flex-1 bg-purple-700 hover:bg-purple-600 text-sm py-2 rounded font-bold">
                                {t('detail.generateBracket')}
                            </button>
                            <Link to={`/bracket/${cat._id}`} className="flex-1 bg-slate-700 hover:bg-slate-600 text-center text-sm py-2 rounded font-bold">
                                {t('detail.viewBracket')}
                            </Link>
                            <button
                                onClick={async () => {
                                    if (!confirm(t('detail.deleteCategoryConfirm'))) return;
                                    try {
                                        await deleteCategory(cat._id);
                                        setCategories(prev => prev.filter(c => c._id !== cat._id));
                                    } catch (e) {
                                        alert(t('common.error'));
                                    }
                                }}
                                className="bg-red-700 hover:bg-red-800 text-white px-3 py-2 rounded font-bold"
                            >
                                🗑️
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TournamentDetail;
