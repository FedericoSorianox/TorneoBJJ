import express from 'express';
import { getMatchById, getMatchesByTournament } from '../controllers/MatchController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/:id', protect, getMatchById);
router.get('/tournament/:tournamentId', protect, getMatchesByTournament);

export default router;
