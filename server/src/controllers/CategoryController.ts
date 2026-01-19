import { Request, Response } from 'express';
import Category from '../models/Category';
import Bracket from '../models/Bracket';

export const createCategory = async (req: Request, res: Response) => {
    try {
        const category = new Category(req.body);
        await category.save();
        res.status(201).json(category);
    } catch (error) {
        res.status(400).json({ error: (error as Error).message });
    }
};

export const getCategoriesByTournament = async (req: Request, res: Response) => {
    try {
        const categories = await Category.find({ tournamentId: req.params.tournamentId });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const getCategoryById = async (req: Request, res: Response) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ error: 'Category not found' });
        res.json(category);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

// This is just a metadata update. Real registration implies adding to a list?
// Wait, Category Schema doesn't have "athletes" list. 
// Standard BJJ System: There is a "Registration" object linking Athlete <-> Category <-> Tournament.
// OR Category has an array of athlete IDs.
// Let's modify Category Schema to include registered athletes.

import mongoose from 'mongoose';

// We need to extend the Schema first if we want to store athletes here.
// For now, let's assume we update the logic to store athletes in Category or create a Registration.
// Simpler for MVP: Category has `athleteIds`.

export const addAthleteToCategory = async (req: Request, res: Response) => {
    try {
        const { athleteId } = req.body;
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ error: 'Category not found' });

        // Check if using an array in schema. If not, we need to add it.
        // Assuming we will add it now.
        // @ts-ignore
        if (!category.athleteIds) category.athleteIds = [];
        // @ts-ignore
        if (!category.athleteIds.includes(athleteId)) {
            // @ts-ignore
            category.athleteIds.push(athleteId);
            await category.save();
        }
        res.json(category);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

import { BracketGen } from '../engine/BracketGen';
import Match from '../models/Match';

export const generateBracketEndpoint = async (req: Request, res: Response) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ error: 'Category not found' });

        // @ts-ignore
        const athletes = category.athleteIds || [];
        if (athletes.length < 2) return res.status(400).json({ error: 'Not enough athletes' });

        const tournament = await mongoose.model('Tournament').findById(category.tournamentId);
        const { eliminationType = tournament?.defaultElimination || 'SingleElimination' } = req.body;

        const athleteIds = athletes.map((id: any) => id.toString());
        let structure: any[];

        if (eliminationType === 'DoubleElimination') {
            structure = BracketGen.generateDoubleElimination(athleteIds);
        } else if (eliminationType === 'SingleElimination') {
            structure = BracketGen.generateSingleElimination(athleteIds);
        } else {
            return res.status(400).json({ error: 'Unsupported elimination type' });
        }

        await Match.deleteMany({ categoryId: category._id });
        await Bracket.deleteMany({ categoryId: category._id });

        const bracket = new Bracket({
            categoryId: category._id,
            type: eliminationType,
            matches: []
        });

        const matchMap = new Map<number, any>();
        const matchDocs: any[] = [];

        for (const m of structure) {
            const matchDoc = new Match({
                tournamentId: category.tournamentId,
                categoryId: category._id,
                bracketId: bracket._id,
                athlete1Id: mongoose.Types.ObjectId.isValid(m.p1) ? m.p1 : null,
                athlete2Id: mongoose.Types.ObjectId.isValid(m.p2) ? m.p2 : null,
                status: 'Scheduled',
                matchNumber: m.matchNumber,
                round: m.round,
                bracketType: m.bracketType
            });
            matchMap.set(m.matchNumber, matchDoc);
            matchDocs.push(matchDoc);
        }

        // Link Matches based on structure
        for (const m of structure) {
            const currentDoc = matchMap.get(m.matchNumber);
            if (!currentDoc) continue;

            if (m.nextMatchNumber) {
                const nextDoc = matchMap.get(m.nextMatchNumber);
                if (nextDoc) {
                    currentDoc.nextMatchId = nextDoc._id;
                    currentDoc.nextMatchPosition = m.nextMatchPosition;
                }
            }
            if (m.loserNextMatchNumber) {
                const nextDoc = matchMap.get(m.loserNextMatchNumber);
                if (nextDoc) {
                    currentDoc.loserNextMatchId = nextDoc._id;
                    currentDoc.loserNextMatchPosition = m.loserNextMatchPosition;
                }
            }
        }

        for (const doc of matchDocs) {
            await doc.save();
            bracket.matches.push(doc._id);
        }

        await bracket.save();
        res.json(bracket);

    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
}
export const getBracketEndpoint = async (req: Request, res: Response) => {
    try {
        const bracket = await Bracket.findOne({ categoryId: req.params.id }).populate({
            path: 'matches',
            populate: ['athlete1Id', 'athlete2Id']
        });
        res.json(bracket);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
}

export const deleteCategory = async (req: Request, res: Response) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // Clean up associated data
        await Match.deleteMany({ categoryId: req.params.id });
        await Bracket.deleteMany({ categoryId: req.params.id });

        res.json({ message: 'Category deleted' });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};
