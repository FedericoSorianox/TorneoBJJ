import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
    tournamentId: mongoose.Types.ObjectId;
    name: string; // e.g., "Male Adult Blue Middle"
    gender: 'Male' | 'Female';
    belt: 'White' | 'Blue' | 'Purple' | 'Brown' | 'Black';
    ageClass: 'Juvenile' | 'Adult' | 'Master 1' | 'Master 2'; // Simplified
    weightClass: string; // e.g. "Middle", "Light"
    athleteIds: mongoose.Types.ObjectId[];
}

const CategorySchema: Schema = new Schema({
    tournamentId: { type: Schema.Types.ObjectId, ref: 'Tournament', required: true },
    name: { type: String, required: true },
    gender: { type: String, enum: ['Male', 'Female'], required: true },
    belt: { type: String, enum: ['White', 'Blue', 'Purple', 'Brown', 'Black'], required: true },
    ageClass: { type: String, required: true },
    weightClass: { type: String, required: true },
    athleteIds: [{ type: Schema.Types.ObjectId, ref: 'Athlete' }]
}, { timestamps: true });

export default mongoose.model<ICategory>('Category', CategorySchema);
