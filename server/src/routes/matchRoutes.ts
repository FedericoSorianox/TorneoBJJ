import express from 'express';
import { getMatchById, getMatchesByTournament, updateMatchAthletes } from '../controllers/MatchController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/:id', protect, getMatchById);
router.get('/tournament/:tournamentId', protect, getMatchesByTournament);
router.put('/:id/athletes', protect, updateMatchAthletes);

export default router;
