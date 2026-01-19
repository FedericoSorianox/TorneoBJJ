import { Request, Response } from 'express';
import Athlete from '../models/Athlete';

export const createAthlete = async (req: Request, res: Response) => {
    try {
        if (req.file) {
            req.body.photo = '/uploads/' + req.file.filename;
        }
        const athlete = new Athlete(req.body);
        await athlete.save();
        res.status(201).json(athlete);
    } catch (error) {
        res.status(400).json({ error: (error as Error).message });
    }
};

export const getAthletes = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
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
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const getAthleteById = async (req: Request, res: Response) => {
    try {
        const athlete = await Athlete.findById(req.params.id);
        if (!athlete) return res.status(404).json({ error: 'Athlete not found' });
        res.json(athlete);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const updateAthlete = async (req: Request, res: Response) => {
    console.log(`[updateAthlete] Request to update ID: ${req.params.id}`);
    console.log(`[updateAthlete] Body:`, req.body);
    try {
        if (req.file) {
            req.body.photo = '/uploads/' + req.file.filename;
        }
        const athlete = await Athlete.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!athlete) {
            console.log(`[updateAthlete] Athlete not found: ${req.params.id}`);
            return res.status(404).json({ error: 'Athlete not found' });
        }
        console.log(`[updateAthlete] Update successful:`, athlete);
        res.json(athlete);
    } catch (error) {
        console.error(`[updateAthlete] Error:`, error);
        res.status(400).json({ error: (error as Error).message });
    }
};


export const getLeaderboard = async (req: Request, res: Response) => {
    try {
        const athletes = await Athlete.find().sort({
            rankingPoints: -1,
            'stats.wins': -1,
            'stats.submissions': -1,
            'stats.pointsScored': -1
        });
        res.json(athletes);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const redeemPoints = async (req: Request, res: Response) => {
    try {
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
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const addPoints = async (req: Request, res: Response) => {
    try {
        const { amount } = req.body;
        if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

        const athlete = await Athlete.findById(req.params.id);
        if (!athlete) return res.status(404).json({ error: 'Athlete not found' });

        athlete.balance = (athlete.balance || 0) + amount;
        athlete.rankingPoints = (athlete.rankingPoints || 0) + amount;

        await athlete.save();
        res.json(athlete);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const deleteAthlete = async (req: Request, res: Response) => {
    try {
        const athlete = await Athlete.findByIdAndDelete(req.params.id);
        if (!athlete) return res.status(404).json({ error: 'Athlete not found' });
        res.json({ message: 'Athlete deleted' });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

