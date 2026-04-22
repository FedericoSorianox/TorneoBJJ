import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async () => {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bjj-tournaments';
    
    // Mask password in URI for logging
    const maskedUri = uri.replace(/\/\/.*:.*@/, '//****:****@');
    console.log(`Connecting to MongoDB with URI: ${maskedUri}`);
    
    try {
        const conn = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 10000,
        });
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error(`❌ MongoDB Connection Failed: ${error}`);
        if (process.env.NODE_ENV === 'production') {
            console.error('CRITICAL: Database connection is required in production. Exiting...');
            process.exit(1);
        }
        console.warn('⚠️ Server will continue without DB connection (Development mode). Database operations will fail.');
    }
};
