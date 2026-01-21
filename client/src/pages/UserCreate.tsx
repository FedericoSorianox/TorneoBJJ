import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../api';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';

const UserCreate = () => {
    // const { t } = useLanguage();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        username: '',
        password: '',
        role: 'user'
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await registerUser(form);
            toast.success('User created successfully');
            navigate('/');
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 flex justify-center">
            <div className="w-full max-w-md bg-slate-800 p-8 rounded-lg border border-slate-700">
                <h2 className="text-2xl font-bold mb-6">Create New User</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-slate-400 text-sm mb-1">Username</label>
                        <input
                            type="text"
                            required
                            className="w-full p-2 bg-slate-900 rounded border border-slate-600 focus:border-blue-500 outline-none"
                            value={form.username}
                            onChange={e => setForm({ ...form, username: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-slate-400 text-sm mb-1">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full p-2 bg-slate-900 rounded border border-slate-600 focus:border-blue-500 outline-none"
                            value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-slate-400 text-sm mb-1">Role</label>
                        <select
                            className="w-full p-2 bg-slate-900 rounded border border-slate-600 focus:border-blue-500 outline-none"
                            value={form.role}
                            onChange={e => setForm({ ...form, role: e.target.value })}
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded font-bold transition disabled:opacity-50"
                    >
                        {loading ? 'Creating...' : 'Create User'}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="w-full py-2 text-slate-400 hover:text-white transition"
                    >
                        Cancel
                    </button>
                </form>
            </div>
        </div>
    );
};

export default UserCreate;
