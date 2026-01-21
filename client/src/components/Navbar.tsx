import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { t, language, toggleLanguage } = useLanguage();
    const navigate = useNavigate();

    if (!user) return null;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-slate-800 border-b border-slate-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex-shrink-0">
                            <h1 className="text-xl font-bold text-blue-500">Torneos BJJ</h1>
                        </Link>
                        <div className="hidden md:block">
                            <div className="ml-10 flex items-baseline space-x-4">
                                <Link to="/tournaments" className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-slate-700">{t('nav.tournaments')}</Link>
                                <Link to="/athletes" className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-slate-700">{t('nav.athletes')}</Link>
                                <Link to="/leaderboard" className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-slate-700">{t('nav.rankings')}</Link>
                            </div>
                        </div>
                    </div>
                    <div className="hidden md:block">
                        <div className="ml-4 flex items-center md:ml-6">
                            <button
                                onClick={toggleLanguage}
                                className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-bold uppercase mr-4"
                            >
                                {language === 'en' ? 'ES' : 'EN'}
                            </button>
                            <span className="text-gray-300 text-sm mr-4">
                                {user.username} ({user.role})
                            </span>
                            {user.role === 'admin' && (
                                <span className="text-xs bg-red-600 text-white px-2 py-1 rounded mr-4">Admin</span>
                            )}
                            <button
                                onClick={handleLogout}
                                className="px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
