import axios from 'axios';

// Environment-aware configuration
const isProd = import.meta.env.PROD;

// If VITE_API_URL is provided, use it. 
// Otherwise, default to relative path in production, and localhost in development.
export const API_BASE_URL = import.meta.env.VITE_API_URL || (isProd ? '/torneobjj/api' : 'http://localhost:5001/api');

// The socket and image base URL is the root (one level up from /api)
export const SOCKET_URL = API_BASE_URL.replace(/\/api$/, '');

const api = axios.create({
    baseURL: API_BASE_URL
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Tournaments
export const getTournaments = () => api.get('/tournaments').then(res => res.data);
export const getTournamentById = (id: string) => api.get(`/tournaments/${id}`).then(res => res.data);
export const deleteTournament = (id: string) => api.delete(`/tournaments/${id}`).then(res => res.data);
export const getRuleSets = () => api.get('/rulesets').then(res => res.data);
export const createTournament = (data: any) => api.post('/tournaments', data).then(res => res.data);
export const updateTournament = (id: string, data: any) => api.put(`/tournaments/${id}`, data).then(res => res.data);

// Matches
export const getMatch = (id: string) => api.get(`/matches/${id}`).then(res => res.data);
export const updateMatchAthletes = (id: string, data: any) => api.put(`/matches/${id}/athletes`, data).then(res => res.data);

// Athletes
export const getAthletes = (params: any = {}) => api.get('/athletes', { params }).then(res => res.data.data || res.data);
export const createAthlete = (data: any) => api.post('/athletes', data).then(res => res.data);
export const updateAthlete = (id: string, data: any) => api.put(`/athletes/${id}`, data).then(res => res.data);
export const deleteAthlete = (id: string) => api.delete(`/athletes/${id}`).then(res => res.data);
export const redeemPoints = (id: string, amount: number) => api.post(`/athletes/${id}/redeem`, { amount }).then(res => res.data);
export const addPoints = (id: string, amount: number) => api.post(`/athletes/${id}/award`, { amount }).then(res => res.data);
export const getLeaderboard = () => api.get('/athletes/leaderboard').then(res => res.data);

// Categories
export const getCategories = (tournamentId: string) => api.get(`/categories/tournament/${tournamentId}`).then(res => res.data);
export const getCategoryById = (id: string) => api.get(`/categories/${id}`).then(res => res.data);
export const createCategory = (data: any) => api.post('/categories', data).then(res => res.data);
export const deleteCategory = (id: string) => api.delete(`/categories/${id}`).then(res => res.data);
export const addAthleteToCategory = (catId: string, athleteId: string) => api.post(`/categories/${catId}/athletes`, { athleteId }).then(res => res.data);
export const removeAthleteFromCategory = (categoryId: string, athleteId: string) => api.delete(`/categories/${categoryId}/athletes/${athleteId}`).then(res => res.data);
export const updateCategoryDuration = (categoryId: string, durationSeconds: number) => api.put(`/categories/${categoryId}/duration`, { durationSeconds }).then(res => res.data);
export const generateBracket = (categoryId: string) => api.post(`/categories/${categoryId}/bracket`).then(res => res.data);
export const getBracket = (catId: string) => api.get(`/categories/${catId}/bracket`).then(res => res.data);
export const finalizeBracket = (catId: string) => api.post(`/categories/${catId}/finalize`, {}).then(res => res.data);

// Auth
export const registerUser = (data: any) => api.post('/auth/register', data).then(res => res.data);

export default api;
