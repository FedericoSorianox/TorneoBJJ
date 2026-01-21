import express from 'express';
import { createTournament, getTournaments, getTournamentById, updateTournament, deleteTournament } from '../controllers/TournamentController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/', protect, admin, createTournament);
router.get('/', protect, getTournaments);
router.get('/:id', protect, getTournamentById);
router.put('/:id', protect, admin, updateTournament);
router.delete('/:id', protect, admin, deleteTournament);

export default router;
