import express from 'express';
import { createCategory, getCategoriesByTournament, addAthleteToCategory, generateBracketEndpoint, getBracketEndpoint, deleteCategory, getCategoryById, finalizeCategory, removeAthleteFromCategory, updateCategoryDuration } from '../controllers/CategoryController';

const router = express.Router();

router.post('/', createCategory);
router.get('/tournament/:tournamentId', getCategoriesByTournament);
router.post('/:id/athletes', addAthleteToCategory);
router.delete('/:id/athletes/:athleteId', removeAthleteFromCategory);
router.post('/:id/bracket', generateBracketEndpoint);
router.get('/:id/bracket', getBracketEndpoint);
router.post('/:id/finalize', finalizeCategory);
router.get('/:id', getCategoryById);
router.put('/:id/duration', updateCategoryDuration);
router.delete('/:id', deleteCategory);

export default router;
