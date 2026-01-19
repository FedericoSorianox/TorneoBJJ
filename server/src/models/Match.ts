import mongoose, { Document, Schema } from 'mongoose';

export interface IMatchEvent {
    type: 'takedown' | 'sweep' | 'guardPass' | 'kneeOnBelly' | 'mount' | 'backTake' | 'advantage' | 'penalty' | 'undo' |
    'sub_takedown' | 'sub_sweep' | 'sub_guardPass' | 'sub_kneeOnBelly' | 'sub_mount' | 'sub_backTake' |
    'sub_advantage' | 'sub_penalty' | 'points' | 'sub_points';
    athleteId: string; // "p1" or "p2" or actual ID
    timestamp: Date;
    points?: number;
}

export interface IMatch extends Document {
    tournamentId: mongoose.Types.ObjectId;
    categoryId: mongoose.Types.ObjectId;
    bracketId?: mongoose.Types.ObjectId;
    athlete1Id?: mongoose.Types.ObjectId; // Null if placeholder
    athlete2Id?: mongoose.Types.ObjectId;
    winnerId?: mongoose.Types.ObjectId;
    status: 'Scheduled' | 'Ongoing' | 'Finished';
    startTime?: Date;
    endTime?: Date;
    score: {
        p1: number;
        p2: number;
        p1Adv: number;
        p2Adv: number;
        p1Pen: number;
        p2Pen: number;
    };
    eventLog: IMatchEvent[];
    round?: number; // For brackets
    matchNumber?: number;
    nextMatchId?: mongoose.Types.ObjectId;
    nextMatchPosition?: 'p1' | 'p2';
    loserNextMatchId?: mongoose.Types.ObjectId;
    loserNextMatchPosition?: 'p1' | 'p2';
    bracketType?: 'Winner' | 'Loser' | 'Final';
}

const MatchSchema: Schema = new Schema({
    tournamentId: { type: Schema.Types.ObjectId, ref: 'Tournament', required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    bracketId: { type: Schema.Types.ObjectId, ref: 'Bracket' },
    athlete1Id: { type: Schema.Types.ObjectId, ref: 'Athlete' },
    athlete2Id: { type: Schema.Types.ObjectId, ref: 'Athlete' },
    winnerId: { type: Schema.Types.ObjectId, ref: 'Athlete' },
    status: { type: String, enum: ['Scheduled', 'Ongoing', 'Finished'], default: 'Scheduled' },
    startTime: { type: Date },
    endTime: { type: Date },
    score: {
        p1: { type: Number, default: 0 },
        p2: { type: Number, default: 0 },
        p1Adv: { type: Number, default: 0 },
        p2Adv: { type: Number, default: 0 },
        p1Pen: { type: Number, default: 0 },
        p2Pen: { type: Number, default: 0 }
    },
    eventLog: [{
        type: { type: String, required: true },
        athleteId: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        points: { type: Number }
    }],
    round: { type: Number },
    matchNumber: { type: Number },
    nextMatchId: { type: Schema.Types.ObjectId, ref: 'Match' },
    nextMatchPosition: { type: String, enum: ['p1', 'p2'] },
    loserNextMatchId: { type: Schema.Types.ObjectId, ref: 'Match' },
    loserNextMatchPosition: { type: String, enum: ['p1', 'p2'] },
    bracketType: { type: String, enum: ['Winner', 'Loser', 'Final'] }
}, { timestamps: true });

export default mongoose.model<IMatch>('Match', MatchSchema);
