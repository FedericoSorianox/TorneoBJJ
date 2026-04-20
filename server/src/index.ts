import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';

import athleteRoutes from './routes/athleteRoutes';
import tournamentRoutes from './routes/tournamentRoutes';
import matchRoutes from './routes/matchRoutes';
import categoryRoutes from './routes/categoryRoutes';
import authRoutes from './routes/authRoutes';
import { registerMatchHandlers } from './handlers/matchHandler';
import { seedAdmin } from './utils/seedAdmin';

dotenv.config();

const app = express();
const server = http.createServer(app);

// CORS Configuration
const getAllowedOrigins = () => {
    const envOrigins = process.env.ALLOWED_ORIGINS;
    if (envOrigins) {
        return envOrigins.split(',').map(origin => origin.trim());
    }
    return [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "https://torneobjj.netlify.app"
    ];
};

const allowedOrigins = getAllowedOrigins();

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
});

app.use(cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
    optionsSuccessStatus: 200
}));

app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Health check endpoint (No DB required)
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Routes
app.use('/api/athletes', athleteRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/auth', authRoutes);

// Legacy/Compat routes
app.get('/api/leaderboard', (req, res) => {
    res.redirect('/api/athletes/leaderboard');
});

app.get('/', (req, res) => {
    res.send('BJJ Tournament Manager API');
});

// Socket.io
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    registerMatchHandlers(io, socket);

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(`[Error] ${err.stack || err.message}`);
    const statusCode = err.status || 500;
    res.status(statusCode).json({
        error: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
});

const PORT = process.env.PORT || 5001;

// Startup Function
const startServer = async () => {
    try {
        await connectDB();
        console.log('✅ MongoDB Connected successfully');
        
        await seedAdmin();
        
        server.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log("CORS Configured with allowed origins:", allowedOrigins);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
