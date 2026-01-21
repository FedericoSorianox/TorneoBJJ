import User from '../models/User';
import bcrypt from 'bcryptjs';

export const seedAdmin = async () => {
    try {
        const adminExists = await User.findOne({ role: 'admin' });

        if (adminExists) {
            console.log('ℹ️  Admin user checks out (exists).');
            return;
        }

        console.log('⚠️  Admin user not found. Creating initial admin...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        await User.create({
            username: 'admin',
            password: hashedPassword,
            role: 'admin'
        });

        console.log('✅  Admin user created: admin / admin123');
    } catch (error) {
        console.error('❌  Error seeding admin:', error);
    }
};
