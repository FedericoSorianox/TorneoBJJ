import express from 'express';
import { createTournament, getTournaments, getTournamentById, updateTournament, deleteTournament } from '../controllers/TournamentController';

const router = express.Router();

router.post('/', createTournament);
router.get('/', getTournaments);
router.get('/:id', getTournamentById);
router.put('/:id', updateTournament);
router.delete('/:id', deleteTournament);

export default router;
