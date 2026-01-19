import mongoose, { Document, Schema } from 'mongoose';

export interface ITournament extends Document {
    name: string;
    date: Date;
    location: string;
    status: 'Planning' | 'Registration' | 'Active' | 'Completed';
    ruleSetId: mongoose.Types.ObjectId;
    adminIds: string[]; // For ownership
    defaultElimination: 'SingleElimination' | 'DoubleElimination' | 'RoundRobin';
}

const TournamentSchema: Schema = new Schema({
    name: { type: String, required: true },
    date: { type: Date, required: true },
    location: { type: String, required: true },
    status: { type: String, enum: ['Planning', 'Registration', 'Active', 'Completed'], default: 'Planning' },
    ruleSetId: { type: Schema.Types.ObjectId, ref: 'RuleSet', required: true },
    adminIds: [{ type: String }],
    defaultElimination: { type: String, enum: ['SingleElimination', 'DoubleElimination', 'RoundRobin'], default: 'SingleElimination' }
}, { timestamps: true });

export default mongoose.model<ITournament>('Tournament', TournamentSchema);
