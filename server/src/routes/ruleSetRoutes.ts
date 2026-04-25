import express from 'express';
import { getRuleSets } from '../controllers/RuleSetController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', protect, getRuleSets);

export default router;
