import express from 'express';
import { createCategory, getCategoriesByTournament, addAthleteToCategory, generateBracketEndpoint, getBracketEndpoint, deleteCategory, getCategoryById } from '../controllers/CategoryController';

const router = express.Router();

router.post('/', createCategory);
router.get('/tournament/:tournamentId', getCategoriesByTournament);
router.post('/:id/athletes', addAthleteToCategory);
router.post('/:id/bracket', generateBracketEndpoint);
router.get('/:id/bracket', getBracketEndpoint);
router.get('/:id', getCategoryById);
router.delete('/:id', deleteCategory);

export default router;
