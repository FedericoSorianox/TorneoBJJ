import { Request, Response } from 'express';
import Tournament from '../models/Tournament';
import RuleSet from '../models/RuleSet';
import Category from '../models/Category';

// Create Tournament (defaulting to standard IBJJF rules if not provided)
export const createTournament = async (req: Request, res: Response) => {
    try {
        // Check if RuleSet provided, else use default or create one
        let { ruleSetId, ...data } = req.body;

        if (!ruleSetId) {
            // Look for "IBJJF Standard" or create
            let defaultRules = await RuleSet.findOne({ name: 'IBJJF Standard' });
            if (!defaultRules) {
                defaultRules = await RuleSet.create({
                    name: 'IBJJF Standard',
                    durationSeconds: 300,
                    points: {
                        takedown: 2, sweep: 2, kneeOnBelly: 2, guardPass: 3, mount: 4, backTake: 4, advantage: 0, penalty: 0
                    }
                });
            }
            ruleSetId = defaultRules._id;
        }

        const tournament = new Tournament({ ...data, ruleSetId });
        await tournament.save();
        res.status(201).json(tournament);
    } catch (error) {
        res.status(400).json({ error: (error as Error).message });
    }
};

export const getTournaments = async (req: Request, res: Response) => {
    try {
        const tournaments = await Tournament.find().populate('ruleSetId');
        res.json(tournaments);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const getTournamentById = async (req: Request, res: Response) => {
    try {
        const tournament = await Tournament.findById(req.params.id).populate('ruleSetId');
        if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
        res.json(tournament);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const updateTournament = async (req: Request, res: Response) => {
    try {
        const tournament = await Tournament.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
        res.json(tournament);
    } catch (error) {
        res.status(400).json({ error: (error as Error).message });
    }
};

export const deleteTournament = async (req: Request, res: Response) => {
    try {
        const tournament = await Tournament.findByIdAndDelete(req.params.id);
        if (!tournament) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        // Also remove associated categories
        await Category.deleteMany({ tournamentId: req.params.id });

        res.json({ message: 'Tournament deleted' });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};
