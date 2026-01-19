import express from 'express';
import { createAthlete, getAthletes, getAthleteById, updateAthlete, deleteAthlete, getLeaderboard, redeemPoints, addPoints } from '../controllers/AthleteController';
import { upload } from '../config/multer';

const router = express.Router();

router.post('/', upload.single('photo'), createAthlete);
router.get('/', getAthletes);
router.get('/leaderboard', getLeaderboard);
router.get('/:id', getAthleteById);
router.put('/:id', upload.single('photo'), updateAthlete);
router.post('/:id/redeem', redeemPoints);
router.post('/:id/award', addPoints);
router.delete('/:id', deleteAthlete);

export default router;
