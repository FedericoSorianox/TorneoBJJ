import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getTournamentById, updateTournament } from '../api';
import toast from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';

const TournamentEdit = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({
        name: '',
        date: '',
        location: '',
        defaultElimination: 'SingleElimination',
        status: 'Planning',
        type: 'Standard',
        customRules: ''
    });

    useEffect(() => {
        if (id) {
            getTournamentById(id)
                .then(data => {
                    setForm({
                        name: data.name,
                        date: data.date ? new Date(data.date).toISOString().split('T')[0] : '',
                        location: data.location,
                        defaultElimination: data.defaultElimination || 'SingleElimination',
                        status: data.status || 'Planning',
                        type: data.type || 'Standard',
                        customRules: data.customRules || ''
                    });
                    setLoading(false);
                })
                .catch(() => {
                    toast.error(t('common.error'));
                    navigate('/tournaments');
                });
        }
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;

        try {
            await updateTournament(id, form);
            toast.success(t('common.save'));
            navigate(`/tournaments/${id}`);
        } catch (error) {
            toast.error(t('common.error'));
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-400">{t('common.loading')}</div>;

    return (
        <div className="p-8 flex justify-center items-center h-full relative">
            <button onClick={() => navigate(-1)} className="absolute top-8 left-8 text-slate-400 hover:text-white transition-colors">
                &larr; {t('common.back')}
            </button>

            <form onSubmit={handleSubmit} className="w-full max-w-lg bg-slate-800 p-8 rounded-2xl border border-slate-700 space-y-6 shadow-2xl">
                <div>
                    <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                        {t('tournament.edit.title')}
                    </h1>
                    <p className="text-slate-400 text-sm">{t('tournament.edit.subtitle')}</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">{t('tournament.form.name')}</label>
                        <input
                            className="w-full p-4 bg-slate-900/50 rounded-xl border border-slate-700 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all"
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">{t('tournament.form.date')}</label>
                            <input
                                type="date"
                                className="w-full p-4 bg-slate-900/50 rounded-xl border border-slate-700 focus:border-yellow-500 outline-none transition-all"
                                value={form.date}
                                onChange={e => setForm({ ...form, date: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">{t('tournament.form.status')}</label>
                            <select
                                className="w-full p-4 bg-slate-900/50 rounded-xl border border-slate-700 focus:border-yellow-500 outline-none transition-all appearance-none cursor-pointer"
                                value={form.status}
                                onChange={e => setForm({ ...form, status: e.target.value })}
                            >
                                <option value="Planning">Planning</option>
                                <option value="Registration">Registration</option>
                                <option value="Active">Active</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">{t('tournament.form.system')}</label>
                            <select
                                className="w-full p-4 bg-slate-900/50 rounded-xl border border-slate-700 focus:border-yellow-500 outline-none transition-all appearance-none cursor-pointer"
                                value={form.defaultElimination}
                                onChange={e => setForm({ ...form, defaultElimination: e.target.value })}
                            >
                                <option value="SingleElimination">Single Elimination</option>
                                <option value="DoubleElimination">Double Elimination</option>
                                <option value="RoundRobin" disabled>Round Robin (WIP)</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">{t('tournament.form.location')}</label>
                        <input
                            className="w-full p-4 bg-slate-900/50 rounded-xl border border-slate-700 focus:border-yellow-500 outline-none transition-all"
                            value={form.location}
                            onChange={e => setForm({ ...form, location: e.target.value })}
                            required
                        />
                    </div>

                    <div className="pt-4 border-t border-slate-700">
                        <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Tournament Type</label>
                        <div className="flex gap-4 mb-4">
                            <label className={`flex-1 p-4 rounded-xl border cursor-pointer transition-all ${form.type === 'Standard' ? 'bg-yellow-600/20 border-yellow-500' : 'bg-slate-900/50 border-slate-700 hover:border-slate-500'}`}>
                                <input
                                    type="radio"
                                    name="type"
                                    value="Standard"
                                    checked={form.type === 'Standard'}
                                    onChange={e => setForm({ ...form, type: e.target.value as any })}
                                    className="hidden"
                                />
                                <div className="font-bold text-lg mb-1">Standard</div>
                                <div className="text-xs text-slate-400">Regular IBJJF Rules</div>
                            </label>
                            <label className={`flex-1 p-4 rounded-xl border cursor-pointer transition-all ${form.type === 'Custom' ? 'bg-purple-600/20 border-purple-500' : 'bg-slate-900/50 border-slate-700 hover:border-slate-500'}`}>
                                <input
                                    type="radio"
                                    name="type"
                                    value="Custom"
                                    checked={form.type === 'Custom'}
                                    onChange={e => setForm({ ...form, type: e.target.value as any })}
                                    className="hidden"
                                />
                                <div className="font-bold text-lg mb-1">Random / Custom</div>
                                <div className="text-xs text-slate-400">Custom Rules & Format</div>
                            </label>
                        </div>

                        {form.type === 'Custom' && (
                            <div className="animate-fadeIn">
                                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Custom Rules Description</label>
                                <textarea
                                    className="w-full p-4 bg-slate-900/50 rounded-xl border border-slate-700 focus:border-purple-500 outline-none transition-all h-32"
                                    placeholder="Describe the custom rules for this event..."
                                    value={form.customRules || ''}
                                    onChange={e => setForm({ ...form, customRules: e.target.value })}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <button className="w-full py-4 bg-yellow-600 hover:bg-yellow-500 rounded-xl font-bold text-lg mt-4 shadow-lg shadow-yellow-500/20 active:scale-[0.98] transition-all">
                    {t('tournament.form.saveBtn')}
                </button>
            </form>
        </div>
    );
};

export default TournamentEdit;
