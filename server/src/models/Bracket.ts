import mongoose, { Document, Schema } from 'mongoose';

export interface IBracket extends Document {
    categoryId: mongoose.Types.ObjectId;
    type: 'SingleElimination' | 'DoubleElimination' | 'RoundRobin';
    matches: mongoose.Types.ObjectId[]; // Array of Match IDs
    winnerId?: mongoose.Types.ObjectId;
}

const BracketSchema: Schema = new Schema({
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    type: { type: String, enum: ['SingleElimination', 'DoubleElimination', 'RoundRobin'], required: true },
    matches: [{ type: Schema.Types.ObjectId, ref: 'Match' }],
    winnerId: { type: Schema.Types.ObjectId, ref: 'Athlete' }
}, { timestamps: true });

export default mongoose.model<IBracket>('Bracket', BracketSchema);
