import { Request, Response } from 'express';
import User from '../models/User';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Generate JWT
const generateToken = (id: string, role: string) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET || 'default_secret_123', {
        expiresIn: '30d'
    });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Private/Admin
export const registerUser = async (req: Request, res: Response): Promise<void> => {
    const { username, password, role } = req.body;

    if (!username || !password) {
        res.status(400).json({ message: 'Please add all fields' });
        return;
    }

    // Check if user exists
    const userExists = await User.findOne({ username });

    if (userExists) {
        res.status(400).json({ message: 'User already exists' });
        return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
        username,
        password: hashedPassword,
        role: role || 'user'
    });

    if (user) {
        res.status(201).json({
            _id: user.id,
            username: user.username,
            role: user.role,
            token: generateToken(user.id, user.role)
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req: Request, res: Response): Promise<void> => {
    const { username, password } = req.body;

    // Check for user email
    const user = await User.findOne({ username });

    if (user && (await bcrypt.compare(password, user.password))) {
        res.json({
            _id: user.id,
            username: user.username,
            role: user.role,
            token: generateToken(user.id, user.role)
        });
    } else {
        res.status(400).json({ message: 'Invalid credentials' });
    }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req: Request & { user?: any }, res: Response): Promise<void> => {
    if (!req.user) {
        res.status(401).json({ message: 'Not authorized' });
        return;
    }

    const { _id, username, role } = await User.findById(req.user.id) as any;

    res.status(200).json({
        id: _id,
        username,
        role,
    });
};
