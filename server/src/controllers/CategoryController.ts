import { Request, Response } from 'express';
import Category from '../models/Category';
import Bracket from '../models/Bracket';
import Athlete from '../models/Athlete';

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
        const { eliminationType = tournament?.defaultElimination || 'SingleElimination' } = req.body || {};

        // Shuffle athletes for random bracket placement
        const athleteIds = athletes.map((id: any) => id.toString())
            .sort(() => Math.random() - 0.5);

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

export const finalizeCategory = async (req: Request, res: Response) => {
    try {
        const categoryId = req.params.id;
        const bracket = await Bracket.findOne({ categoryId }).populate('matches');
        if (!bracket) return res.status(404).json({ error: 'Bracket not found' });

        // Check if already finalized to avoid double points
        if (bracket.winnerId) {
            return res.status(400).json({ error: 'Category is already finalized' });
        }

        const matches = await Match.find({ bracketId: bracket._id });
        // Simplified final check: No nextMatchId and either round is highest or bracketType is 'Final'
        const finalMatch = matches.find(m => m.bracketType === 'Final' || !m.nextMatchId);

        if (!finalMatch || finalMatch.status !== 'Finished' || !finalMatch.winnerId) {
            return res.status(400).json({ error: 'Final match is not finished or not found' });
        }

        const firstId = finalMatch.winnerId;
        const secondId = finalMatch.athlete1Id?.toString() === firstId.toString() ? finalMatch.athlete2Id : finalMatch.athlete1Id;

        // Podium points (High values centered around the 100-per-win base)
        const points = { first: 1000, second: 500, third: 200 };

        const assignments: any[] = [];

        // Award 1st
        await Athlete.findByIdAndUpdate(firstId, {
            $inc: { rankingPoints: points.first, balance: points.first }
        });
        assignments.push({ athleteId: firstId, place: 1, points: points.first });

        // Award 2nd
        if (secondId) {
            await Athlete.findByIdAndUpdate(secondId, {
                $inc: { rankingPoints: points.second, balance: points.second }
            });
            assignments.push({ athleteId: secondId, place: 2, points: points.second });
        }

        // Award 3rd places (Losers of Semi Finals)
        if (finalMatch.round && finalMatch.round > 1) {
            const semiFinals = matches.filter(m => m.round === finalMatch.round! - 1 && m.bracketType !== 'Loser');
            for (const sf of semiFinals) {
                const loserId = sf.athlete1Id?.toString() === sf.winnerId?.toString() ? sf.athlete2Id : sf.athlete1Id;
                if (loserId) {
                    await Athlete.findByIdAndUpdate(loserId, {
                        $inc: { rankingPoints: points.third, balance: points.third }
                    });
                    assignments.push({ athleteId: loserId, place: 3, points: points.third });
                }
            }
        }

        bracket.winnerId = firstId as any;
        await bracket.save();

        res.json({
            message: 'Category finalized successfully',
            assignments
        });

    } catch (error) {
        console.error("Finalize error:", error);
        res.status(500).json({ error: (error as Error).message });
    }
};

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
