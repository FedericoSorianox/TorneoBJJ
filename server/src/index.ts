import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
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
        "https://torneobjj.netlify.app",
        "https://the-badgers.com"
    ];
};

const allowedOrigins = getAllowedOrigins();

const io = new Server(server, {
    path: '/torneobjj/socket.io',
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

// API Routes
const apiRouter = express.Router();
apiRouter.use('/athletes', athleteRoutes);
apiRouter.use('/tournaments', tournamentRoutes);
apiRouter.use('/matches', matchRoutes);
apiRouter.use('/categories', categoryRoutes);
apiRouter.use('/auth', authRoutes);

apiRouter.get('/leaderboard', (req, res) => {
    res.redirect('/api/athletes/leaderboard');
});

// Health check endpoint (No DB required)
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Mount API routes under both /api and /torneobjj/api for compatibility
app.use('/api', apiRouter);
app.use('/torneobjj/api', apiRouter);

// Serve Static Files from Client
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use('/torneobjj', express.static(clientDistPath));

// Initial Redirect from /torneobjj to /torneobjj/ (Vite needs the trailing slash sometimes)
app.get('/torneobjj', (req, res, next) => {
    if (!req.url.endsWith('/')) {
        return res.redirect(301, '/torneobjj/');
    }
    next();
});

// SPA Fallback: Serve index.html for any sub-route of /torneobjj
app.get('/torneobjj/*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Root catch-all
app.get('/', (req, res) => {
    res.send('BJJ Tournament Manager API - Visit /torneobjj for the app');
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
            console.log("Serving client from:", clientDistPath);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
