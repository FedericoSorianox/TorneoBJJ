import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async () => {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bjj-tournaments';
    console.log('Connecting to MongoDB...');
    
    try {
        const conn = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging
        });
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Failed: ${error}`);
        console.warn('⚠️ Server will continue without DB connection. Database operations will fail.');
    }
};
