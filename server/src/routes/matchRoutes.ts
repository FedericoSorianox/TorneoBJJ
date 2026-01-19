import express from 'express';
import { getMatchById, getMatchesByTournament } from '../controllers/MatchController';

const router = express.Router();

router.get('/:id', getMatchById);
router.get('/tournament/:tournamentId', getMatchesByTournament);

export default router;
