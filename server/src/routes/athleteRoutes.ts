import express from 'express';
import { createAthlete, getAthletes, getAthleteById, updateAthlete, deleteAthlete, getLeaderboard, redeemPoints, addPoints } from '../controllers/AthleteController';
import { protect, admin } from '../middleware/authMiddleware';
import { upload } from '../config/multer';

const router = express.Router();

router.post('/', protect, admin, upload.single('photo'), createAthlete);
router.get('/', protect, getAthletes);
router.get('/leaderboard', protect, getLeaderboard);
router.get('/:id', protect, getAthleteById);
router.put('/:id', protect, admin, upload.single('photo'), updateAthlete);
router.post('/:id/redeem', protect, admin, redeemPoints);
router.post('/:id/award', protect, admin, addPoints);
router.delete('/:id', protect, admin, deleteAthlete);

export default router;
