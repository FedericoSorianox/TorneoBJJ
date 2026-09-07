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

        // 1. Fetch both documents first and validate BEFORE any mutation
        const [athlete, product] = await Promise.all([
            Athlete.findById(athleteId),
            Product.findById(productId)
        ]);

        if (!athlete) return res.status(404).json({ error: 'Atleta no encontrado' });
        if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
        if (product.stock <= 0) return res.status(400).json({ error: 'Producto sin stock' });
        if (athlete.balance < product.pointsCost) {
            return res.status(400).json({ 
                error: `Puntos insuficientes. Tiene ${athlete.balance} pts, necesita ${product.pointsCost} pts.` 
            });
        }

        // 2. Deduct stock atomically using $inc + conditions to prevent race conditions
        const updatedProduct = await Product.findOneAndUpdate(
            { _id: productId, stock: { $gt: 0 } }, // Guard: only if stock > 0
            { $inc: { stock: -1 } },
            { new: true }
        );

        if (!updatedProduct) {
            return res.status(400).json({ error: 'El producto se agotó justo ahora. Intenta de nuevo.' });
        }

        // 3. Deduct points atomically using $inc + condition guard
        const updatedAthlete = await Athlete.findOneAndUpdate(
            { _id: athleteId, balance: { $gte: product.pointsCost } }, // Guard: only if enough balance
            { $inc: { balance: -product.pointsCost } },
            { new: true }
        );

        if (!updatedAthlete) {
            // Rollback stock if points deduction failed
            await Product.findByIdAndUpdate(productId, { $inc: { stock: 1 } });
            return res.status(400).json({ error: 'Error al descontar puntos. Operación revertida.' });
        }

        // 4. Register redemption record
        await Redemption.create({
            athleteId,
            productId,
            pointsSpent: product.pointsCost,
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
