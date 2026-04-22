import { Request, Response } from 'express';
import Athlete from '../models/Athlete';
import { asyncHandler } from '../utils/asyncHandler';
import fs from 'fs';
import path from 'path';

// Helper to delete photo
const deletePhoto = (photoPath?: string) => {
    if (!photoPath) return;
    const fullPath = path.join(process.cwd(), photoPath);
    if (fs.existsSync(fullPath)) {
        try {
            fs.unlinkSync(fullPath);
            console.log(`[File] Deleted: ${fullPath}`);
        } catch (err) {
            console.error(`[File] Error deleting ${fullPath}:`, err);
        }
    }
};

export const createAthlete = asyncHandler(async (req: Request, res: Response) => {
    if (req.file) {
        req.body.photo = '/uploads/' + req.file.filename;
    }
    const athlete = new Athlete(req.body);
    await athlete.save();
    res.status(201).json(athlete);
});

export const getAthletes = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 1000;
    const search = req.query.search as string || '';

    const query: any = {};
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { academy: { $regex: search, $options: 'i' } }
        ];
    }

    const total = await Athlete.countDocuments(query);
    const athletes = await Athlete.find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ name: 1 });

    res.json({
        data: athletes,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    });
});

export const getAthleteById = asyncHandler(async (req: Request, res: Response) => {
    const athlete = await Athlete.findById(req.params.id);
    if (!athlete) return res.status(404).json({ error: 'Athlete not found' });
    res.json(athlete);
});

export const updateAthlete = asyncHandler(async (req: Request, res: Response) => {
    console.log(`[updateAthlete] Request to update ID: ${req.params.id}`);
    
    const existingAthlete = await Athlete.findById(req.params.id);
    if (!existingAthlete) {
        return res.status(404).json({ error: 'Athlete not found' });
    }

    if (req.file) {
        // Delete old photo if exists
        if (existingAthlete.photo) {
            deletePhoto(existingAthlete.photo);
        }
        req.body.photo = '/uploads/' + req.file.filename;
    }

    const athlete = await Athlete.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(athlete);
});

export const getLeaderboard = asyncHandler(async (req: Request, res: Response) => {
    const athletes = await Athlete.find().sort({
        rankingPoints: -1,
        'stats.wins': -1,
        'stats.submissions': -1,
        'stats.pointsScored': -1
    });
    res.json(athletes);
});

export const redeemPoints = asyncHandler(async (req: Request, res: Response) => {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

    const athlete = await Athlete.findById(req.params.id);
    if (!athlete) return res.status(404).json({ error: 'Athlete not found' });

    if ((athlete.balance || 0) < amount) {
        return res.status(400).json({ error: 'Insufficient balance' });
    }

    athlete.balance = (athlete.balance || 0) - amount;
    await athlete.save();
    res.json(athlete);
});

export const addPoints = asyncHandler(async (req: Request, res: Response) => {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

    const athlete = await Athlete.findById(req.params.id);
    if (!athlete) return res.status(404).json({ error: 'Athlete not found' });

    athlete.balance = (athlete.balance || 0) + amount;
    athlete.rankingPoints = (athlete.rankingPoints || 0) + amount;

    await athlete.save();
    res.json(athlete);
});

export const deleteAthlete = asyncHandler(async (req: Request, res: Response) => {
    const athlete = await Athlete.findById(req.params.id);
    if (!athlete) return res.status(404).json({ error: 'Athlete not found' });

    // Delete photo if exists
    if (athlete.photo) {
        deletePhoto(athlete.photo);
    }

    await Athlete.findByIdAndDelete(req.params.id);
    res.json({ message: 'Athlete deleted' });
});

