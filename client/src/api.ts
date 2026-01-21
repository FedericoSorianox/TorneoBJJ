import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
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

export const getTournaments = () => api.get('/tournaments').then(res => res.data);
// export const getTournament = (id: string) => api.get(`/tournaments/${id}`).then(res => res.data); // keeping old one or replacing? user said 'export const getTournamentById'
// I'll add it alongside or replace if unused. Since the user wants to use getTournamentById in the page, I will add it.
export const getTournament = (id: string) => api.get(`/tournaments/${id}`).then(res => res.data);
export const getTournamentById = (id: string) => api.get(`/tournaments/${id}`).then(res => res.data);
export const deleteTournament = (id: string) => api.delete(`/tournaments/${id}`).then(res => res.data);
export const createTournament = (data: any) => api.post('/tournaments', data).then(res => res.data);
export const updateTournament = (id: string, data: any) => api.put(`/tournaments/${id}`, data).then(res => res.data);
export const getMatch = (id: string) => api.get(`/matches/${id}`).then(res => res.data);

export const getAthletes = (params: any = {}) => api.get('/athletes', { params }).then(res => res.data.data || res.data);
export const createAthlete = (data: any) => api.post('/athletes', data).then(res => res.data);
export const updateAthlete = (id: string, data: any) => api.put(`/athletes/${id}`, data).then(res => res.data);
export const deleteAthlete = (id: string) => api.delete(`/athletes/${id}`).then(res => res.data);
export const redeemPoints = (id: string, amount: number) => api.post(`/athletes/${id}/redeem`, { amount }).then(res => res.data);
export const addPoints = (id: string, amount: number) => api.post(`/athletes/${id}/award`, { amount }).then(res => res.data);

export const getCategories = (tournamentId: string) => api.get(`/categories/tournament/${tournamentId}`).then(res => res.data);
export const getCategoryById = (id: string) => api.get(`/categories/${id}`).then(res => res.data);
export const createCategory = (data: any) => api.post('/categories', data).then(res => res.data);
export const deleteCategory = (id: string) => api.delete(`/categories/${id}`).then(res => res.data);
export const addAthleteToCategory = (catId: string, athleteId: string) => api.post(`/categories/${catId}/athletes`, { athleteId }).then(res => res.data);
export const generateBracket = (catId: string) => api.post(`/categories/${catId}/bracket`, {}).then(res => res.data);
export const getBracket = (catId: string) => api.get(`/categories/${catId}/bracket`).then(res => res.data);
export const getLeaderboard = () => api.get('/athletes/leaderboard').then(res => res.data);
export const registerUser = (data: any) => api.post('/auth/register', data).then(res => res.data);

export default api;
