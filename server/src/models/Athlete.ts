import mongoose, { Document, Schema } from 'mongoose';

export interface IAthlete extends Document {
    name: string;
    nickname?: string;
    academy: string;
    belt: 'White' | 'Blue' | 'Purple' | 'Brown' | 'Black';
    weight: number; // in kg
    gender: 'Male' | 'Female';
    birthDate?: Date;
    age: number;
    photo?: string;
    globalId?: string; // For persistent tracking across tournaments
    stats: {
        wins: number;
        losses: number;
        submissions: number;
        pointsScored: number;
    };
    rankingPoints: number;
    balance: number;
}

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
    stats: {
        wins: { type: Number, default: 0 },
        losses: { type: Number, default: 0 },
        submissions: { type: Number, default: 0 },
        pointsScored: { type: Number, default: 0 }
    },
    rankingPoints: { type: Number, default: 0 },
    balance: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model<IAthlete>('Athlete', AthleteSchema);
