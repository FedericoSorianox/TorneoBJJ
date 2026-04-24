import { useEffect, useState } from 'react';
import { getAthletes, createAthlete, deleteAthlete, updateAthlete, redeemPoints, addPoints, SOCKET_URL } from '../api';
import clsx from 'clsx';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import AthleteDetailModal from '../components/AthleteDetailModal';
import type { AthleteData } from '../components/AthleteDetailModal';

interface Athlete {
    _id: string;
    name: string;
    academy: string;
    belt: string;
    weight: number;
    gender: string;
    age: number;
    photo?: string;
    balance?: number;
    birthDate?: string;
}

const BELTS: [string, string][] = [
    ['White', 'Blanco'],
    ['Blue', 'Azul'],
    ['Purple', 'Violeta'],
    ['Brown', 'Marrón'],
    ['Black', 'Negro'],
];

const GENDERS: [string, string][] = [
    ['Male', 'Masculino'],
    ['Female', 'Femenino'],
];

const AthleteManager = () => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [athletes, setAthletes] = useState<Athlete[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({
        name: '',
        academy: '',
        belt: 'White',
        weight: 76,
        gender: 'Male',
        age: 25,
        birthDate: '',
        wins: 0,
        submissions: 0
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState({
        search: '',
        belt: '',
        weight: ''
    });

    const load = () => {
        getAthletes(filters).then(setAthletes).finally(() => setLoading(false));
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            load();
        }, 500);
        return () => clearTimeout(timer);
    }, [filters]);

    useEffect(() => {
        if (form.birthDate) {
            const parts = form.birthDate.split('-');
            if (parts.length === 3) {
                const birthYear = parseInt(parts[0]);
                const birthMonth = parseInt(parts[1]) - 1;
                const birthDay = parseInt(parts[2]);

                const today = new Date();
                let age = today.getFullYear() - birthYear;
                const m = today.getMonth() - birthMonth;
                if (m < 0 || (m === 0 && today.getDate() < birthDay)) {
                    age--;
                }
                setForm(f => ({ ...f, age: age >= 0 ? age : 0 }));
            }
        }
    }, [form.birthDate]);

    const validateForm = () => {
        const errors: string[] = [];

        if (form.weight <= 0) {
            errors.push(t('common.error'));
        }

        if (form.age < 5 || form.age > 100) {
            errors.push(t('common.error'));
        }

        if (!form.name.trim()) {
            errors.push(t('common.error'));
        }

        return errors;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const errors = validateForm();

        if (errors.length > 0) {
            toast.error(errors.join('\n'));
            return;
        }

        const formData = new FormData();
        formData.append('name', form.name);
        formData.append('academy', form.academy);
        formData.append('belt', form.belt);
        formData.append('weight', String(form.weight));
        formData.append('gender', form.gender);
        formData.append('age', String(form.age));
        if (form.birthDate) formData.append('birthDate', form.birthDate);
        formData.append('stats.wins', String(form.wins));
        formData.append('stats.submissions', String(form.submissions));

        if (selectedFile) {
            formData.append('photo', selectedFile);
        }

        try {
            if (editingId) {
                await updateAthlete(editingId, formData);
            } else {
                await createAthlete(formData);
                toast.success(t('common.save'));
            }
            resetForm();
            load();
        } catch (error) {
            console.error('Failed to save athlete', error);
            toast.error(t('common.error'));
        }
    };

    const handleEdit = (athlete: Athlete) => {
        setEditingId(athlete._id);
        const stats = (athlete as any).stats || {};

        setForm({
            name: athlete.name,
            academy: athlete.academy,
            belt: athlete.belt,
            weight: athlete.weight,
            gender: athlete.gender,
            age: athlete.age,
            birthDate: athlete.birthDate ? new Date(athlete.birthDate).toISOString().split('T')[0] : '',
            wins: stats.wins || 0,
            submissions: stats.submissions || 0
        });
        setSelectedFile(null);
    };

    const resetForm = () => {
        setEditingId(null);
        setForm({
            name: '',
            academy: '',
            belt: 'White',
            weight: 76,
            gender: 'Male',
            age: 25,
            birthDate: '',
            wins: 0,
            submissions: 0
        });
        setSelectedFile(null);
    };

    const handleDelete = async (id: string, e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (!id) return;
        if (!window.confirm(t('athletes.deleteConfirm'))) return;

        try {
            await deleteAthlete(id);
            toast.success(t('common.delete'));
            load();
        } catch (error) {
            console.error(error);
            toast.error(t('common.error'));
        }
    };

    const [selectedAthlete, setSelectedAthlete] = useState<AthleteData | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleViewAthlete = (athlete: Athlete) => {
        const data: AthleteData = {
            ...athlete,
            role: 'athlete'
        } as unknown as AthleteData;

        setSelectedAthlete(data);
        setIsModalOpen(true);
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <Link to="/" className="text-slate-400 hover:text-white mb-4 w-fit">&larr; {t('common.backHome')}</Link>
            <div className="flex gap-8 h-full overflow-hidden">
                {/* List */}
                <div className="flex-1 bg-slate-800 rounded p-6 overflow-auto">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <h2 className="text-3xl font-bold">{t('athletes.title')}</h2>
                        <div className="flex flex-wrap gap-2 w-full md:w-auto">
                            <input
                                type="text"
                                placeholder={t('common.search')}
                                className="bg-slate-900 border border-slate-700 rounded px-3 py-1 text-sm focus:border-blue-500 outline-none w-full md:w-48"
                                value={filters.search}
                                onChange={e => setFilters({ ...filters, search: e.target.value })}
                            />
                            <select
                                className="bg-slate-900 border border-slate-700 rounded px-3 py-1 text-sm focus:border-blue-500 outline-none"
                                value={filters.belt}
                                onChange={e => setFilters({ ...filters, belt: e.target.value })}
                            >
                                <option value="">{t('athletes.form.belt')}: {t('common.all')}</option>
                                {BELTS.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                            </select>
                            <input
                                type="number"
                                placeholder={t('athletes.filter.maxWeight')}
                                className="bg-slate-900 border border-slate-700 rounded px-3 py-1 text-sm focus:border-blue-500 outline-none w-28"
                                value={filters.weight}
                                onChange={e => setFilters({ ...filters, weight: e.target.value })}
                            />
                            {(filters.search || filters.belt || filters.weight) && (
                                <button
                                    onClick={() => setFilters({ search: '', belt: '', weight: '' })}
                                    className="text-slate-400 hover:text-white text-sm"
                                >
                                    {t('common.clear')}
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="space-y-4">
                        {(Array.isArray(athletes) ? athletes : []).map(a => (
                            <div
                                key={a._id}
                                className="flex justify-between items-center bg-slate-900 p-4 rounded border border-slate-700 hover:bg-slate-850 transition cursor-pointer group"
                                onClick={() => handleViewAthlete(a)}
                            >
                                <div className="flex items-center gap-4">
                                    {a.photo ? (
                                        <img src={`${SOCKET_URL}${a.photo}`} alt={a.name} className="w-12 h-12 rounded-full object-cover border border-slate-600" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-slate-500 font-bold">
                                            {a.name.charAt(0)}
                                        </div>
                                    )}
                                    <div>
                                        <div className="font-bold text-xl group-hover:text-blue-400 transition">{a.name}</div>
                                        <div className="text-slate-400 text-sm">{a.academy} • {a.belt} • {a.weight}kg</div>
                                        <div className="text-yellow-500 text-xs font-bold mt-1">🟡 {a.balance || 0} pts</div>
                                    </div>
                                </div>
                                {user?.role === 'admin' && (
                                    <div className="flex gap-4" onClick={(e) => e.stopPropagation()}>
                                        <button onClick={async () => {
                                            const amount = prompt(t('athletes.prompts.redeem'));
                                            if (amount && !isNaN(Number(amount))) {
                                                try {
                                                    await redeemPoints(a._id, Number(amount));
                                                    toast.success(t('athletes.toasts.redeemed'));
                                                    load();
                                                } catch (e) {
                                                    alert(t('athletes.errors.insufficient'));
                                                }
                                            }
                                        }} className="text-green-400 hover:text-green-300 font-bold" title={t('athletes.prompts.redeem')}>🎁</button>
                                        <button onClick={async () => {
                                            const amount = prompt(t('athletes.prompts.award'));
                                            if (amount && !isNaN(Number(amount))) {
                                                try {
                                                    await addPoints(a._id, Number(amount));
                                                    toast.success(t('athletes.toasts.awarded'));
                                                    load();
                                                } catch (e) {
                                                    alert(t('athletes.errors.awardFailed'));
                                                }
                                            }
                                        }} className="text-yellow-400 hover:text-yellow-300 font-bold" title={t('athletes.prompts.award')}>💰</button>
                                        <button onClick={() => handleEdit(a)} className="text-blue-400 hover:text-blue-300 font-bold">{t('common.edit')}</button>
                                        <button onClick={(e) => handleDelete(a._id, e)} className="text-red-500 hover:text-red-400">{t('common.delete')}</button>
                                    </div>
                                )}
                            </div>
                        ))}
                        {(!Array.isArray(athletes) || athletes.length === 0) && !loading && <div className="text-slate-500">{t('athletes.noAthletes')}</div>}
                    </div>
                </div>

                {/* Create/Edit Form */}
                {user?.role === 'admin' && (
                    <div className="w-1/3 bg-slate-800 rounded p-6 h-fit border border-slate-700">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">{editingId ? t('athletes.edit') : t('athletes.new')}</h2>
                            {editingId && <button onClick={resetForm} className="text-sm text-slate-400 hover:text-white">{t('common.cancel')}</button>}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="flex justify-center mb-4">
                                <div className="relative w-24 h-24 bg-slate-700 rounded-full flex items-center justify-center overflow-hidden border-2 border-slate-600 hover:border-blue-500 transition cursor-pointer">
                                    {selectedFile ? (
                                        <img src={URL.createObjectURL(selectedFile)} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-2xl text-slate-500">📷</span>
                                    )}
                                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-400 text-sm">{t('athletes.form.name')}</label>
                                <input className="w-full p-2 bg-slate-900 rounded border border-slate-700 focus:border-blue-500 outline-none"
                                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                            </div>
                            <div>
                                <label className="block text-slate-400 text-sm">{t('athletes.form.academy')}</label>
                                <input className="w-full p-2 bg-slate-900 rounded border border-slate-700 focus:border-blue-500 outline-none"
                                    value={form.academy} onChange={e => setForm({ ...form, academy: e.target.value })} required />
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="block text-slate-400 text-sm">{t('athletes.form.belt')}</label>
                                    <select className="w-full p-2 bg-slate-900 rounded border border-slate-700 focus:border-blue-500 outline-none"
                                        value={form.belt} onChange={e => setForm({ ...form, belt: e.target.value })}>
                                        {BELTS.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-slate-400 text-sm">{t('athletes.form.gender')}</label>
                                    <select className="w-full p-2 bg-slate-900 rounded border border-slate-700 focus:border-blue-500 outline-none"
                                        value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                                        {GENDERS.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="block text-slate-400 text-sm">{t('athletes.form.weight')}</label>
                                    <input type="number" className="w-full p-2 bg-slate-900 rounded border border-slate-700 focus:border-blue-500 outline-none"
                                        value={form.weight} onChange={e => setForm({ ...form, weight: Number(e.target.value) })} required />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="block text-slate-400 text-sm">{t('athletes.form.birthDate')}</label>
                                    <input type="date" className="w-full p-2 bg-slate-900 rounded border border-slate-700 focus:border-blue-500 outline-none"
                                        value={form.birthDate} onChange={e => setForm({ ...form, birthDate: e.target.value })} />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-slate-400 text-sm">{t('athletes.form.age')}</label>
                                    <input type="number"
                                        className={clsx("w-full p-2 rounded border border-slate-700 focus:border-blue-500 outline-none",
                                            form.birthDate ? "bg-slate-800 text-slate-500" : "bg-slate-900 text-white")}
                                        value={form.age}
                                        onChange={e => setForm({ ...form, age: Number(e.target.value) })}
                                        readOnly={!!form.birthDate}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="block text-slate-400 text-sm">{t('athletes.form.wins')}</label>
                                    <input type="number" className="w-full p-2 bg-slate-900 rounded border border-slate-700 focus:border-blue-500 outline-none"
                                        value={form.wins} onChange={e => setForm({ ...form, wins: Number(e.target.value) })} />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-slate-400 text-sm">{t('athletes.form.submissions')}</label>
                                    <input type="number" className="w-full p-2 bg-slate-900 rounded border border-slate-700 focus:border-blue-500 outline-none"
                                        value={form.submissions} onChange={e => setForm({ ...form, submissions: Number(e.target.value) })} />
                                </div>
                            </div>
                            <button className={clsx("w-full py-3 rounded font-bold mt-4 transition",
                                editingId ? "bg-yellow-600 hover:bg-yellow-500" : "bg-blue-600 hover:bg-blue-500")}>
                                {editingId ? t('athletes.form.updateBtn') : t('athletes.form.addBtn')}
                            </button>
                        </form>
                    </div>
                )}
            </div>

            <AthleteDetailModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                athlete={selectedAthlete}
            />
        </div>
    );
};

export default AthleteManager;
