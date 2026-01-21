import express from 'express';
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

dotenv.config();

const app = express();
const server = http.createServer(app);
const allowedOrigins = [
    process.env.CLIENT_URL || "http://localhost:5173",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
    "http://localhost:5176",
    "http://127.0.0.1:5176",
    "https://app.the-basgers.com", // Old Production URL
    "http://app.the-basgers.com",
    "https://torneobjj.netlify.app", // New Netlify URL
    "http://torneobjj.netlify.app"
];

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

console.log("CORS Configured with allowed origins:", allowedOrigins);

app.use(express.json());
app.use('/uploads', express.static('uploads'));

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

const PORT = process.env.PORT || 5001;

// Health check endpoint (No DB required)
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Start Server immediately
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    // Connect to DB after server is running
    connectDB().then(() => {
        console.log('MongoDB Connected successfully');
    }).catch(err => {
        console.error('MongoDB Connection Failed:', err);
    });
});
