import mongoose, { Document, Schema } from 'mongoose';

export interface IRedemption extends Document {
    athleteId: mongoose.Types.ObjectId;
    productId: mongoose.Types.ObjectId;
    pointsSpent: number;
    status: 'pending' | 'delivered' | 'cancelled';
}

const RedemptionSchema: Schema = new Schema({
    athleteId: { type: Schema.Types.ObjectId, ref: 'Athlete', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    pointsSpent: { type: Number, required: true },
    status: { 
        type: String, 
        enum: ['pending', 'delivered', 'cancelled'], 
        default: 'pending' 
    }
}, { timestamps: true });

export default mongoose.model<IRedemption>('Redemption', RedemptionSchema);
