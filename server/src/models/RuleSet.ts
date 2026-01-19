import mongoose, { Document, Schema } from 'mongoose';

export interface IPointsConfig {
    takedown: number;
    sweep: number;
    kneeOnBelly: number;
    guardPass: number;
    mount: number;
    backTake: number;
    advantage: number; // purely for counting, usually 0 points but decides ties
    penalty: number; // usually 0 points but decides ties, or negative? IBJJF: penalties subtract or give opp adv? 
    // Customary: 1st-3rd penalty might just be recorded, 4th DQ. Logic handles this.
}

export interface IRuleSet extends Document {
    name: string;
    durationSeconds: number;
    points: IPointsConfig;
    description?: string;
}

const RuleSetSchema: Schema = new Schema({
    name: { type: String, required: true },
    durationSeconds: { type: Number, required: true, default: 300 }, // 5 mins default
    points: {
        takedown: { type: Number, default: 2 },
        sweep: { type: Number, default: 2 },
        kneeOnBelly: { type: Number, default: 2 },
        guardPass: { type: Number, default: 3 },
        mount: { type: Number, default: 4 },
        backTake: { type: Number, default: 4 },
        advantage: { type: Number, default: 0 },
        penalty: { type: Number, default: 0 }
    },
    description: { type: String }
}, { timestamps: true });

export default mongoose.model<IRuleSet>('RuleSet', RuleSetSchema);
