import { Request, Response } from 'express';
import RuleSet from '../models/RuleSet';

export const getRuleSets = async (req: Request, res: Response) => {
    try {
        // Ensure default rulesets exist
        const defaultRulesets = [
            { name: 'IBJJF Standard', durationSeconds: 300, points: { takedown: 2, sweep: 2, kneeOnBelly: 2, guardPass: 3, mount: 4, backTake: 4, advantage: 0, penalty: 0 } },
            { name: 'Submission Only', durationSeconds: 600, points: { takedown: 0, sweep: 0, kneeOnBelly: 0, guardPass: 0, mount: 0, backTake: 0, advantage: 0, penalty: 0 } },
            { name: 'ADCC Rules', durationSeconds: 360, points: { takedown: 2, sweep: 2, kneeOnBelly: 2, guardPass: 3, mount: 2, backTake: 3, advantage: 0, penalty: 0 } }
        ];

        for (const rs of defaultRulesets) {
            const exists = await RuleSet.findOne({ name: rs.name });
            if (!exists) {
                await RuleSet.create(rs);
            }
        }

        const ruleSets = await RuleSet.find();
        res.json(ruleSets);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};
