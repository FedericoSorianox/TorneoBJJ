import { Request, Response } from 'express';
import Product from '../models/Product';
import Redemption from '../models/Redemption';
import Athlete from '../models/Athlete';

export const getProducts = async (req: Request, res: Response) => {
    try {
        const includeAll = req.query.all === 'true';
        const filter = includeAll ? {} : { isActive: true, stock: { $gt: 0 } };
        const products = await Product.find(filter).sort({ createdAt: -1 });
        res.json(products);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createProduct = async (req: Request, res: Response) => {
    try {
        const product = new Product(req.body);
        await product.save();
        res.status(201).json(product);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const updateProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const product = await Product.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
        res.json(product);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const deleteProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const product = await Product.findByIdAndDelete(id);
        if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
        res.json({ message: 'Producto eliminado correctamente' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};


export const redeemProduct = async (req: Request, res: Response) => {
    try {
        const { athleteId, productId } = req.body;
        const quantity = Math.max(1, parseInt(req.body.quantity, 10) || 1);

        // 1. Fetch both documents first and validate BEFORE any mutation
        const [athlete, product] = await Promise.all([
            Athlete.findById(athleteId),
            Product.findById(productId)
        ]);

        if (!athlete) return res.status(404).json({ error: 'Atleta no encontrado' });
        if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

        const totalPointsCost = product.pointsCost * quantity;

        if (product.stock < quantity) {
            return res.status(400).json({ error: `Stock insuficiente. Stock disponible: ${product.stock}, solicitado: ${quantity}` });
        }
        if (athlete.balance < totalPointsCost) {
            return res.status(400).json({ 
                error: `Puntos insuficientes. Tiene ${athlete.balance} pts, necesita ${totalPointsCost} pts.` 
            });
        }

        // 2. Deduct stock atomically using $inc + conditions to prevent race conditions
        const updatedProduct = await Product.findOneAndUpdate(
            { _id: productId, stock: { $gte: quantity } }, // Guard: stock >= quantity
            { $inc: { stock: -quantity } },
            { new: true }
        );

        if (!updatedProduct) {
            return res.status(400).json({ error: 'El stock disponible cambió justo ahora. Intenta de nuevo.' });
        }

        // 3. Deduct points atomically using $inc + condition guard
        const updatedAthlete = await Athlete.findOneAndUpdate(
            { _id: athleteId, balance: { $gte: totalPointsCost } }, // Guard: balance >= totalPointsCost
            { $inc: { balance: -totalPointsCost } },
            { new: true }
        );

        if (!updatedAthlete) {
            // Rollback stock if points deduction failed
            await Product.findByIdAndUpdate(productId, { $inc: { stock: quantity } });
            return res.status(400).json({ error: 'Error al descontar puntos. Operación revertida.' });
        }

        // 4. Register redemption record
        await Redemption.create({
            athleteId,
            productId,
            quantity,
            pointsSpent: totalPointsCost,
            status: 'pending'
        });

        res.json({ 
            message: 'Canje realizado con éxito', 
            balance: updatedAthlete.balance 
        });

    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getAthleteRedemptions = async (req: Request, res: Response) => {
    try {
        const { athleteId } = req.params;
        const redemptions = await Redemption.find({ athleteId }).populate('productId');
        res.json(redemptions);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
