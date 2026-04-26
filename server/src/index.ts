import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { connectDB } from './config/db';

import athleteRoutes from './routes/athleteRoutes';
import tournamentRoutes from './routes/tournamentRoutes';
import matchRoutes from './routes/matchRoutes';
import categoryRoutes from './routes/categoryRoutes';
import authRoutes from './routes/authRoutes';
import ruleSetRoutes from './routes/ruleSetRoutes';
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
app.use('/torneobjj/uploads', express.static('uploads'));

// API Routes
const apiRouter = express.Router();
apiRouter.use('/athletes', athleteRoutes);
apiRouter.use('/tournaments', tournamentRoutes);
apiRouter.use('/matches', matchRoutes);
apiRouter.use('/categories', categoryRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/rulesets', ruleSetRoutes);

apiRouter.get('/leaderboard', (req, res) => {
    res.redirect('/athletes/leaderboard');
});

// Health check function
const healthCheck = (req: Request, res: Response) => {
    res.status(200).json({ 
        status: 'ok', 
        uptime: process.uptime(),
        timestamp: new Date(),
        version: '1.0.1'
    });
};

// Mount health check under multiple paths to ensure it's reachable
app.get('/health', healthCheck);
app.get('/torneobjj/health', healthCheck);

// Mount API routes under both /api and /torneobjj/api for compatibility
app.use('/api', apiRouter);
app.use('/torneobjj/api', apiRouter);

// Serve Static Files from Client
// We try multiple potential paths to be robust in different build environments
const potentialPaths = [
    path.join(__dirname, '../../client/dist'),
    path.join(process.cwd(), 'client/dist'),
    path.join(process.cwd(), 'server/client/dist'),
    path.join(process.cwd(), '../client/dist')
];

let clientDistPath = potentialPaths[0];
console.log('🔍 Checking potential static file paths...');
for (const p of potentialPaths) {
    const exists = fs.existsSync(p);
    console.log(`   - ${p}: ${exists ? '✅ FOUND' : '❌ NOT FOUND'}`);
    if (exists) {
        clientDistPath = p;
        break;
    }
}

app.use('/torneobjj', express.static(clientDistPath));

// Initial Redirect from /torneobjj to /torneobjj/ (Vite needs the trailing slash)
app.get('/torneobjj', (req, res, next) => {
    if (!req.url.endsWith('/')) {
        console.log('🔄 Redirecting /torneobjj to /torneobjj/');
        return res.redirect(301, '/torneobjj/');
    }
    next();
});

// SPA Fallback: Serve index.html for any sub-route of /torneobjj
app.get('/torneobjj/*splat', (req, res) => {
    const indexPath = path.join(clientDistPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        console.error(`❌ SPA Fallback failing: index.html not found at ${indexPath}`);
        res.status(404).send('App (index.html) not found in client/dist. Path checked: ' + indexPath);
    }
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

// Robust port detection (both uppercase and lowercase)
const PORT = Number(process.env.PORT || process.env.port || 5001);

// Startup Function
const startServer = async () => {
    try {
        console.log(`Starting server on port ${PORT}...`);
        await connectDB();
        console.log('✅ MongoDB Process handled');
        
        await seedAdmin();
        
        // Explicitly listen on 0.0.0.0 for Docker/Dokploy
        server.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
            console.log("CORS Configured with allowed origins:", allowedOrigins);
            console.log("Serving client from:", clientDistPath);
            if (!fs.existsSync(clientDistPath)) {
                console.warn("⚠️  WARNING: client/dist directory NOT found!");
            }
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
