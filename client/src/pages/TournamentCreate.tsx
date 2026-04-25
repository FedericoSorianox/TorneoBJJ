import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTournament, getRuleSets } from '../api';
import toast from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';
import clsx from 'clsx';

const TournamentCreate = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [ruleSets, setRuleSets] = useState<any[]>([]);
    const [loadingRules, setLoadingRules] = useState(true);
    const [form, setForm] = useState({
        name: '',
        date: '',
        location: '',
        defaultElimination: 'SingleElimination',
        ruleSetId: '',
        type: 'Standard' as 'Standard' | 'Custom',
        customRules: ''
    });

    useEffect(() => {
        getRuleSets().then(sets => {
            setRuleSets(sets);
            if (sets.length > 0) {
                const standard = sets.find((s: any) => s.name.includes('Standard')) || sets[0];
                setForm(prev => ({ ...prev, ruleSetId: standard._id }));
            }
            setLoadingRules(false);
        }).catch(err => {
            console.error(err);
            setLoadingRules(false);
        });
    }, []);

    const validateForm = () => {
        const errors: string[] = [];
        if (!form.name.trim()) errors.push(t('common.error'));
        if (!form.date) errors.push(t('common.error'));
        if (!form.ruleSetId) errors.push("Please select a ruleset");
        return errors;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const errors = validateForm();
        if (errors.length > 0) {
            toast.error(errors.join('\n'));
            return;
        }
        try {
            await createTournament(form);
            toast.success(t('common.save'));
            navigate('/tournaments');
        } catch (error) {
            console.error(error);
            toast.error(t('common.error'));
        }
    };

    return (
        <div className="p-8 flex justify-center items-center h-full relative">
            <button onClick={() => navigate(-1)} className="absolute top-8 left-8 text-slate-400 hover:text-white transition-colors">
                &larr; {t('common.back')}
            </button>

            <form onSubmit={handleSubmit} className="w-full max-w-lg bg-slate-800 p-8 rounded-2xl border border-slate-700 space-y-6 shadow-2xl">
                <div>
                    <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                        {t('tournament.create.title')}
                    </h1>
                    <p className="text-slate-400 text-sm">{t('tournament.create.subtitle')}</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">{t('tournament.form.name')}</label>
                        <input
                            autoFocus
                            className="w-full p-4 bg-slate-900/50 rounded-xl border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                            placeholder={t('tournament.form.placeholder.name')}
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
                                className="w-full p-4 bg-slate-900/50 rounded-xl border border-slate-700 focus:border-blue-500 outline-none transition-all"
                                value={form.date}
                                onChange={e => setForm({ ...form, date: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">{t('tournament.form.system')}</label>
                            <select
                                className="w-full p-4 bg-slate-900/50 rounded-xl border border-slate-700 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
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
                            className="w-full p-4 bg-slate-900/50 rounded-xl border border-slate-700 focus:border-blue-500 outline-none transition-all"
                            placeholder={t('tournament.form.placeholder.location')}
                            value={form.location}
                            onChange={e => setForm({ ...form, location: e.target.value })}
                            required
                        />
                    </div>

                    <div className="pt-4 border-t border-slate-700">
                        <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Reglamento (RuleSet)</label>
                        <div className="grid grid-cols-1 gap-3">
                            {loadingRules ? (
                                <div className="text-slate-500 text-sm animate-pulse">Cargando reglamentos...</div>
                            ) : (
                                ruleSets.map(rs => (
                                    <div 
                                        key={rs._id}
                                        onClick={() => setForm({ ...form, ruleSetId: rs._id, type: rs.name === 'Submission Only' ? 'Custom' : 'Standard' })}
                                        className={clsx(
                                            "p-4 rounded-xl border cursor-pointer transition-all flex justify-between items-center",
                                            form.ruleSetId === rs._id 
                                                ? "bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-900/20" 
                                                : "bg-slate-900/50 border-slate-700 hover:border-slate-500"
                                        )}
                                    >
                                        <div>
                                            <div className="font-bold text-white">{rs.name}</div>
                                            <div className="text-[10px] text-slate-400 uppercase tracking-widest">
                                                {rs.durationSeconds / 60} MIN • {rs.name === 'Submission Only' ? 'NO POINTS' : 'POINTS ENABLED'}
                                            </div>
                                        </div>
                                        {form.ruleSetId === rs._id && (
                                            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-[10px]">✓</div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <button className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-xl font-bold text-lg mt-4 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all">
                    {t('tournament.form.createBtn')}
                </button>
            </form>
        </div>
    );
};

export default TournamentCreate;
