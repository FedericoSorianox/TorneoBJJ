import mongoose, { Document, Schema } from 'mongoose';

export type BeltType = 'White' | 'Blue' | 'Purple' | 'Brown' | 'Black';

export interface IBeltStats {
    wins: number;
    losses: number;
    submissions: number;
    pointsScored: number;
}

export interface IAthlete extends Document {
    name: string;
    nickname?: string;
    academy: string;
    belt: BeltType;
    weight: number; // in kg
    gender: 'Male' | 'Female';
    birthDate?: Date;
    age: number;
    photo?: string;
    globalId?: string; // For persistent tracking across tournaments
    stats: IBeltStats;
    beltStats: {
        White: IBeltStats;
        Blue: IBeltStats;
        Purple: IBeltStats;
        Brown: IBeltStats;
        Black: IBeltStats;
    };
    rankingPoints: number;
    balance: number;
}

const BeltStatsSchema = new Schema({
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    submissions: { type: Number, default: 0 },
    pointsScored: { type: Number, default: 0 }
}, { _id: false });

const AthleteSchema: Schema = new Schema({
    name: { type: String, required: true },
    nickname: { type: String },
    academy: { type: String, required: true },
    belt: { type: String, enum: ['White', 'Blue', 'Purple', 'Brown', 'Black'], required: true },
    weight: { type: Number, required: true },
    gender: { type: String, enum: ['Male', 'Female'], required: true },
    birthDate: { type: Date },
    age: { type: Number, required: true },
    photo: { type: String },
    globalId: { type: String, unique: true, sparse: true },
    stats: { type: BeltStatsSchema, default: () => ({}) },
    beltStats: {
        White: { type: BeltStatsSchema, default: () => ({}) },
        Blue: { type: BeltStatsSchema, default: () => ({}) },
        Purple: { type: BeltStatsSchema, default: () => ({}) },
        Brown: { type: BeltStatsSchema, default: () => ({}) },
        Black: { type: BeltStatsSchema, default: () => ({}) }
    },
    rankingPoints: { type: Number, default: 0 },
    balance: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model<IAthlete>('Athlete', AthleteSchema);
