import { IMatchEvent } from '../models/Match';
import { IPointsConfig } from '../models/RuleSet';

export interface IMatchScore {
    p1: number;
    p2: number;
    p1Adv: number;
    p2Adv: number;
    p1Pen: number;
    p2Pen: number;
}

export class RulesEngine {
    static calculateScore(events: IMatchEvent[], pointsConfig: IPointsConfig): IMatchScore {
        const score: IMatchScore = {
            p1: 0,
            p2: 0,
            p1Adv: 0,
            p2Adv: 0,
            p1Pen: 0,
            p2Pen: 0
        };

        // Sort events by timestamp just in case, though they should be appended in order
        const sortedEvents = [...events].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        for (const event of sortedEvents) {
            if (event.type === 'undo') continue; // Undos shouldn't be in the log if we recalculate from filtered log, OR we filter them out before calling this. 
            // Actually, if we use a "hard undo" (pop event), we don't see it. 
            // If we use "soft undo" (add undo event), we need to know WHAT to undo. 
            // Simplest: The "State" is derived from the "Effective Log". 
            // If the API handles undo by removing the last event, this function just recalculates.

            this.applyEvent(score, event, pointsConfig);
        }

        return score;
    }

    static applyEvent(score: IMatchScore, event: IMatchEvent, config: IPointsConfig) {
        const isP1 = event.athleteId === 'p1' || event.athleteId === 'athlete1';

        // Points Config lookup
        let points = 0;

        switch (event.type) {
            case 'takedown': points = config.takedown; break;
            case 'sub_takedown': points = -config.takedown; break;
            case 'sweep': points = config.sweep; break;
            case 'sub_sweep': points = -config.sweep; break;
            case 'kneeOnBelly': points = config.kneeOnBelly; break;
            case 'sub_kneeOnBelly': points = -config.kneeOnBelly; break;
            case 'guardPass': points = config.guardPass; break;
            case 'sub_guardPass': points = -config.guardPass; break;
            case 'mount': points = config.mount; break;
            case 'sub_mount': points = -config.mount; break;
            case 'backTake': points = config.backTake; break;
            case 'sub_backTake': points = -config.backTake; break;
            case 'points': points = event.points || 0; break;
            case 'sub_points': points = -(event.points || 0); break;

            case 'advantage':
                if (isP1) score.p1Adv++; else score.p2Adv++;
                return;
            case 'sub_advantage':
                if (isP1) score.p1Adv = Math.max(0, score.p1Adv - 1); else score.p2Adv = Math.max(0, score.p2Adv - 1);
                return;
            case 'penalty':
                if (isP1) score.p1Pen++; else score.p2Pen++;
                return;
            case 'sub_penalty':
                if (isP1) score.p1Pen = Math.max(0, score.p1Pen - 1); else score.p2Pen = Math.max(0, score.p2Pen - 1);
                return;
        }

        if (isP1) {
            score.p1 = Math.max(0, score.p1 + points);
        } else {
            score.p2 = Math.max(0, score.p2 + points);
        }
    }
}
