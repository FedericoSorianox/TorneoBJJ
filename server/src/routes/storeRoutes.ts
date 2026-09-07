import { Router } from 'express';
import * as StoreController from '../controllers/StoreController';
import { protect, admin } from '../middleware/authMiddleware';

const router = Router();

router.get('/products', StoreController.getProducts);
router.post('/products', protect, admin, StoreController.createProduct);
router.put('/products/:id', protect, admin, StoreController.updateProduct);
router.delete('/products/:id', protect, admin, StoreController.deleteProduct);
router.post('/redeem', protect, admin, StoreController.redeemProduct);
router.get('/redemptions/:athleteId', protect, StoreController.getAthleteRedemptions);

export default router;
