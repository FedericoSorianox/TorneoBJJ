import { Request, Response } from 'express';
import Match from '../models/Match';

export const getMatchById = async (req: Request, res: Response) => {
    try {
        const match = await Match.findById(req.params.id)
            .populate('athlete1Id')
            .populate('athlete2Id')
            .populate('categoryId')
            .populate({
                path: 'tournamentId',
                populate: { path: 'ruleSetId' }
            });

        if (!match) return res.status(404).json({ error: 'Match not found' });
        res.json(match);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const getMatchesByTournament = async (req: Request, res: Response) => {
    try {
        const matches = await Match.find({ tournamentId: req.params.tournamentId })
            .populate('athlete1Id')
            .populate('athlete2Id');
        res.json(matches);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const updateMatchAthletes = async (req: Request, res: Response) => {
    try {
        const { athlete1Id, athlete2Id } = req.body;
        const match = await Match.findById(req.params.id);
        if (!match) return res.status(404).json({ error: 'Match not found' });

        // Check if any match in the bracket has started
        const bracketMatches = await Match.find({ bracketId: match.bracketId });
        const hasStarted = bracketMatches.some(m => m.status !== 'Scheduled');

        if (hasStarted) {
            return res.status(400).json({ error: 'Cannot edit matches once the bracket has started' });
        }

        match.athlete1Id = athlete1Id || undefined;
        match.athlete2Id = athlete2Id || undefined;
        await match.save();

        const updatedMatch = await Match.findById(match._id)
            .populate('athlete1Id')
            .populate('athlete2Id');

        res.json(updatedMatch);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};
