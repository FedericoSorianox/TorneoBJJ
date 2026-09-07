import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
    name: string;
    description: string;
    pointsCost: number;
    stock: number;
    image?: string;
    isActive: boolean;
}

const ProductSchema: Schema = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    pointsCost: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, default: 0 },
    image: { type: String },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model<IProduct>('Product', ProductSchema);
