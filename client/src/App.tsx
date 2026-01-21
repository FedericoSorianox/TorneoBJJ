import { Routes, Route, Link } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import ErrorBoundary from './components/ErrorBoundary'
import TournamentList from './pages/TournamentList'
import TournamentCreate from './pages/TournamentCreate'
import TournamentEdit from './pages/TournamentEdit'
import TournamentDetail from './pages/TournamentDetail'
import ControlTable from './pages/ControlTable'
import AthleteManager from './pages/AthleteManager'
import BracketView from './pages/BracketView'
import Leaderboard from './pages/Leaderboard'
import Login from './pages/Login'
import UserCreate from './pages/UserCreate'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import { AuthProvider } from './contexts/AuthContext'
import { useLanguage } from './contexts/LanguageContext';

const Home = () => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-8 relative">
      <h1 className="text-6xl font-black tracking-tighter text-blue-500">{t('app.title')}</h1>
      <div className="flex gap-4">
        <Link to="/tournaments" className="px-8 py-4 text-2xl font-bold bg-blue-600 rounded hover:bg-blue-700 transition">{t('nav.tournaments')}</Link>
        <Link to="/athletes" className="px-8 py-4 text-2xl font-bold bg-slate-700 rounded hover:bg-slate-600 transition">{t('nav.athletes')}</Link>
        <Link to="/leaderboard" className="px-8 py-4 text-2xl font-bold bg-yellow-600 rounded hover:bg-yellow-700 transition">{t('nav.rankings')}</Link>
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <div className="h-full w-full bg-slate-900 text-white flex flex-col">
        <Toaster position="top-right" />
        <ErrorBoundary>
          <Navbar />
          <div className="flex-grow overflow-auto">
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Home />} />
                <Route path="/tournaments" element={<TournamentList />} />
                <Route path="/tournaments/new" element={<TournamentCreate />} />
                <Route path="/tournaments/:id/edit" element={<TournamentEdit />} />
                <Route path="/tournaments/:id" element={<TournamentDetail />} />
                <Route path="/match/:id" element={<ControlTable />} />
                <Route path="/athletes" element={<AthleteManager />} />
                <Route path="/bracket/:id" element={<BracketView />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/users/new" element={<UserCreate />} />
              </Route>
            </Routes>
          </div>
        </ErrorBoundary>
      </div>
    </AuthProvider>
  )
}

export default App
