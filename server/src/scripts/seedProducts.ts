import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Product from '../models/Product';
import { connectDB } from '../config/db';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const products = [
    {
        name: 'Camiseta de la Academia',
        description: 'Algodón premium con el logo oficial de The Badgers.',
        pointsCost: 500,
        stock: 20,
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format\u0026fit=crop\u0026q=80\u0026w=500'
    },
    {
        name: 'Parche Oficial',
        description: 'Parche bordado para tu Gi.',
        pointsCost: 150,
        stock: 50,
        image: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format\u0026fit=crop\u0026q=80\u0026w=500'
    },
    {
        name: 'Seminario Especial',
        description: 'Pase libre para el próximo seminario de técnicas avanzadas.',
        pointsCost: 1000,
        stock: 10,
        image: 'https://images.unsplash.com/photo-1552072092-7f9b8d63efcb?auto=format\u0026fit=crop\u0026q=80\u0026w=500'
    },
    {
        name: 'Gorra Badgers',
        description: 'Gorra estilo trucker con logo bordado.',
        pointsCost: 350,
        stock: 15,
        image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format\u0026fit=crop\u0026q=80\u0026w=500'
    }
];

const seedProducts = async () => {
    try {
        await connectDB();
        await Product.deleteMany({});
        await Product.insertMany(products);
        console.log('✅ Products seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding products:', error);
        process.exit(1);
    }
};

seedProducts();
