import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getCategories, createCategory, getAthletes, addAthleteToCategory, removeAthleteFromCategory, generateBracket, getTournamentById, deleteCategory, updateCategoryDuration } from '../api';
import { format, parseISO, addMinutes } from 'date-fns';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import clsx from 'clsx';

const TournamentDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { user } = useAuth();
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
        setLoading(true);
        loadData();
    }, [id]);

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        await createCategory({ ...newCat, tournamentId: id });
        setShowAddCat(false);
        loadData();
    };

    const handleAddAthlete = async (catId: string, athleteId: string) => {
        if (!athleteId) return;
        await addAthleteToCategory(catId, athleteId);
        loadData();
    };

    const handleRemoveAthlete = async (catId: string, athleteId: string) => {
        if (!confirm(t('detail.removeAthleteConfirm') || '¿Estás seguro de quitar a este atleta?')) return;
        try {
            await removeAthleteFromCategory(catId, athleteId);
            loadData();
        } catch (e) {
            alert(t('common.error'));
        }
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

    const handleUpdateDuration = async (catId: string, minutes: number) => {
        try {
            await updateCategoryDuration(catId, minutes * 60);
            setCategories(prev => prev.map(c => c._id === catId ? { ...c, durationSeconds: minutes * 60 } : c));
        } catch (e) {
            alert(t('common.error'));
        }
    };

    if (loading) return <div className="text-3xl text-center p-20 font-black animate-pulse">Loading...</div>;

    const durations = [3, 5, 6, 7];

    return (
        <div className="p-8 h-full flex flex-col bg-[#0f172a] text-slate-100">
            <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white mb-6 w-fit flex items-center gap-2 font-bold uppercase tracking-widest text-xs">
                &larr; Back
            </button>
            
            <div className="flex justify-between items-start mb-10">
                <div className="space-y-1">
                    <h1 className="text-5xl font-black italic tracking-tighter text-white uppercase">{tournament?.name || t('detail.title')}</h1>
                    {tournament && (
                        <div className="flex flex-col gap-2">
                            <p className="text-slate-400 font-mono text-sm">
                                {tournament.date ? format(addMinutes(parseISO(tournament.date), new Date().getTimezoneOffset()), 'PP') : ''} • {tournament.location}
                            </p>
                            <div className="flex gap-2">
                                <span className="px-2 py-0.5 rounded bg-blue-600/20 border border-blue-500/30 text-blue-400 text-[10px] font-black uppercase tracking-widest">
                                    {tournament.status}
                                </span>
                                {tournament.type === 'Custom' && (
                                    <span className="px-2 py-0.5 rounded bg-purple-600/20 border border-purple-500/30 text-purple-400 text-[10px] font-black uppercase tracking-widest">
                                        Custom Rules
                                    </span>
                                )}
                            </div>
                            {tournament.customRules && (
                                <div className="max-w-xl p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-slate-300">
                                    <span className="text-slate-500 font-bold uppercase text-[10px] block mb-1">Custom Rules Description</span>
                                    {tournament.customRules}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                {user?.role === 'admin' && (
                    <div className="flex gap-3">
                        <Link to={`/tournaments/${id}/edit`} className="bg-slate-800 text-slate-300 border border-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-700 transition-all shadow-lg text-sm">
                            {t('detail.edit')}
                        </Link>
                        <button onClick={() => setShowAddCat(!showAddCat)} className="bg-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20 text-sm flex items-center gap-2">
                            {showAddCat ? t('common.cancel') : (
                                <>
                                    <span className="text-xl">+</span> {t('detail.addCategory')}
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>

            {showAddCat && (
                <div className="bg-slate-800/50 backdrop-blur-sm p-8 rounded-2xl mb-10 border border-slate-700 shadow-2xl animate-fadeIn">
                    <form onSubmit={handleCreateCategory} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t('category.form.name')}</label>
                            <input className="w-full bg-slate-900/80 p-3 rounded-xl border border-slate-700 focus:border-blue-500 outline-none transition-all" value={newCat.name} onChange={e => setNewCat({ ...newCat, name: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Gender</label>
                            <select className="w-full bg-slate-900/80 p-3 rounded-xl border border-slate-700 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer" value={newCat.gender} onChange={e => setNewCat({ ...newCat, gender: e.target.value })}>
                                {['Male', 'Female'].map(x => <option key={x} value={x}>{x}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Belt</label>
                            <select className="w-full bg-slate-900/80 p-3 rounded-xl border border-slate-700 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer" value={newCat.belt} onChange={e => setNewCat({ ...newCat, belt: e.target.value })}>
                                {['White', 'Blue', 'Purple', 'Brown', 'Black'].map(x => <option key={x} value={x}>{x}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Age Class</label>
                            <select className="w-full bg-slate-900/80 p-3 rounded-xl border border-slate-700 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer" value={newCat.ageClass} onChange={e => setNewCat({ ...newCat, ageClass: e.target.value })}>
                                {['Juvenile', 'Adult', 'Master 1', 'Master 2'].map(x => <option key={x} value={x}>{x}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Weight</label>
                            <input className="w-full bg-slate-900/80 p-3 rounded-xl border border-slate-700 focus:border-blue-500 outline-none transition-all" placeholder={t('category.form.weightClass')} value={newCat.weightClass} onChange={e => setNewCat({ ...newCat, weightClass: e.target.value })} />
                        </div>
                        <button className="bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20 h-[50px]">{t('category.form.create')}</button>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 overflow-auto pb-20 pr-2 custom-scrollbar">
                {categories.map(cat => (
                    <div key={cat._id} className="group bg-slate-800/40 hover:bg-slate-800/60 p-8 rounded-3xl border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 flex flex-col shadow-2xl relative overflow-hidden">
                        {/* Background subtle indicator */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-[80px] -z-10 group-hover:bg-blue-600/10 transition-all"></div>
                        
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-1">{cat.name}</h3>
                                <div className="flex gap-2 items-center">
                                    <span className="text-slate-500 font-mono text-[10px] uppercase tracking-widest">{cat.gender} • {cat.belt} • {cat.weightClass}</span>
                                </div>
                            </div>
                            
                            {/* Duration Buttons */}
                            {user?.role === 'admin' && (
                                <div className="flex flex-col items-end gap-2">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Match Duration</span>
                                    <div className="flex gap-1 bg-black/20 p-1 rounded-xl border border-slate-700/30">
                                        {durations.map(min => (
                                            <button 
                                                key={min}
                                                onClick={() => handleUpdateDuration(cat._id, min)}
                                                className={clsx(
                                                    "px-2 py-1 rounded-lg text-[10px] font-bold transition-all",
                                                    (cat.durationSeconds || (tournament?.ruleSetId?.durationSeconds || 300)) === min * 60
                                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20 scale-105"
                                                        : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                                                )}
                                            >
                                                {min}m
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 flex flex-col min-h-0 mb-8">
                            <h4 className="font-bold mb-4 text-xs text-slate-400 flex justify-between items-center uppercase tracking-widest">
                                {t('detail.athletes')} 
                                <span className="bg-slate-900/80 px-3 py-1 rounded-full text-[10px] text-blue-400 border border-blue-500/20">{cat.athleteIds?.length || 0} Atletas</span>
                            </h4>
                            
                            <div className="flex-1 bg-slate-900/30 rounded-2xl border border-slate-700/30 overflow-hidden flex flex-col">
                                <ul className="flex-1 overflow-y-auto p-4 space-y-2 max-h-56 scrollbar-thin scrollbar-thumb-slate-700">
                                    {(cat.athleteIds || []).length > 0 ? (
                                        (cat.athleteIds || []).map((aid: string) => {
                                            const a = athletes.find(x => x._id === aid);
                                            return (
                                                <li key={aid} className="group/item flex items-center justify-between text-sm bg-slate-800/30 hover:bg-slate-800/80 px-4 py-3 rounded-xl border border-slate-700/20 hover:border-slate-600/50 transition-all">
                                                    <span className="text-slate-300 font-medium">{a?.name || aid}</span>
                                                    {user?.role === 'admin' && (
                                                        <button 
                                                            onClick={() => handleRemoveAthlete(cat._id, aid)}
                                                            className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover/item:opacity-100 p-1"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </li>
                                            );
                                        })
                                    ) : (
                                        <li className="text-xs text-slate-600 text-center py-8 italic uppercase tracking-widest">No hay atletas inscritos</li>
                                    )}
                                </ul>

                                {user?.role === 'admin' && (
                                    <div className="p-3 border-t border-slate-700/30 bg-black/10">
                                        <select className="w-full bg-slate-800/50 text-slate-300 p-3 text-xs rounded-xl border border-slate-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer"
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    handleAddAthlete(cat._id, e.target.value);
                                                    e.target.value = '';
                                                }
                                            }}
                                            value=""
                                        >
                                            <option value="" disabled>{t('category.form.addAthlete')}</option>
                                            {athletes
                                                .filter(a => !(cat.athleteIds || []).includes(a._id))
                                                .sort((a, b) => a.name.localeCompare(b.name))
                                                .map(a => (
                                                    <option key={a._id} value={a._id}>{a.name}</option>
                                                ))
                                            }
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-6 border-t border-slate-700/50">
                            {user?.role === 'admin' && (
                                <button onClick={() => handleGenerate(cat._id)} className="flex-[2] bg-purple-600 hover:bg-purple-500 text-white text-xs py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-purple-900/20">
                                    {t('detail.generateBracket')}
                                </button>
                            )}
                            <Link to={`/bracket/${cat._id}`} className="flex-[2] bg-slate-700 hover:bg-slate-600 text-white text-center text-xs py-4 rounded-2xl font-black uppercase tracking-widest transition-all">
                                {t('detail.viewBracket')}
                            </Link>
                            {user?.role === 'admin' && (
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
                                    className="bg-red-900/10 hover:bg-red-600/20 text-red-500/50 hover:text-red-500 px-5 py-4 rounded-2xl font-bold transition-all border border-red-900/20 hover:border-red-500/50"
                                >
                                    🗑️
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div >
    );
};

export default TournamentDetail;
