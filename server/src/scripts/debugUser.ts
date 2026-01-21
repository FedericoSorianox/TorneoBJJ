import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db';

dotenv.config();

const checkAdmin = async () => {
    try {
        await connectDB();

        const admin = await User.findOne({ username: 'admin' });

        if (!admin) {
            console.log('❌ Admin user NOT found in DB');
        } else {
            console.log('✅ Admin user found in DB');
            console.log('Role:', admin.role);
            console.log('Stored Password Hash:', admin.password);

            const isMatch = await bcrypt.compare('admin123', admin.password);
            if (isMatch) {
                console.log('✅ Password Match: OK');
            } else {
                console.log('❌ Password Match: FAILED');
            }
        }
        process.exit(0);
    } catch (error) {
        console.error('Error checking admin:', error);
        process.exit(1);
    }
};

checkAdmin();
