import { Request, Response } from 'express';
import Match from '../models/Match';

export const getMatchById = async (req: Request, res: Response) => {
    try {
        const match = await Match.findById(req.params.id)
            .populate('athlete1Id')
            .populate('athlete2Id')
            .populate('categoryId');

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
