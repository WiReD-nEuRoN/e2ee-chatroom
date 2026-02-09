import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { setupSocketHandlers } from './socket/handlers.js';
import { initSupabase } from './services/supabaseClient.js';

dotenv.config();

// Initialize Supabase
try {
  initSupabase();
} catch (error) {
  console.error('⚠️  Supabase initialization warning:', error);
  console.log('💾 Using fallback in-memory storage');
}

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'E2EE Chatroom Server is running!',
    features: [
      'Express server',
      'Socket.io ready',
      'Security middleware (Helmet, CORS, Rate Limiting)',
      'JSON body parsing'
    ]
  });
});

// Socket.io connection handler
setupSocketHandlers(io);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

server.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('🚀 E2EE Chatroom Server');
  console.log('='.repeat(50));
  console.log(`📡 Server running on port: ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 Security: Helmet, CORS, Rate Limiting enabled`);
  console.log(`⚡ Socket.io: Ready for connections`);
  console.log('='.repeat(50));
  console.log(`Test endpoints:`);
  console.log(`  Health: http://localhost:${PORT}/api/health`);
  console.log(`  Test:   http://localhost:${PORT}/api/test`);
  console.log('='.repeat(50));
});

export { app, io };
