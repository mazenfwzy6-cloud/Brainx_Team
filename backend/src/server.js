import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import taskRoutes from './routes/tasks.js';
import announcementRoutes from './routes/announcements.js';
import chatRoutes from './routes/chat.js';
import fileRoutes from './routes/files.js';
import dashboardRoutes from './routes/dashboard.js';
import notificationRoutes from './routes/notifications.js';
import { initializeDatabase } from './db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '..', 'uploads');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/uploads', express.static(uploadDir));

app.set('io', io);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-room', (room) => {
    socket.join(room);
  });

  socket.on('new-message', (message) => {
    io.emit('message-received', message);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Campus Team Flow backend is running.' });
});

const startServer = async () => {
  try {
    await initializeDatabase();
    const port = Number(process.env.PORT || 5000);
    server.listen(port, () => {
      console.log(`Backend running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
};

startServer();
