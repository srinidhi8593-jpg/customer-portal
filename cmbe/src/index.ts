import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import forumRoutes from './routes/forum';
import resourcesRoutes from './routes/resources';
import usersRoutes from './routes/users';
import accountRoutes from './routes/account';
import aiRoutes from './routes/ai';

dotenv.config();

const app = express();

// CORS - allow frontend origin
const allowedOrigins = process.env.FRONTEND_URL
    ? [process.env.FRONTEND_URL, 'http://localhost:3000']
    : ['http://localhost:3000'];
app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));
app.use(express.json());

// Serve admin backoffice at /admin
// Works from both src/ (dev) and dist/ (production)
const publicDir = path.join(__dirname, '..', 'public', 'admin');
app.use('/admin', express.static(publicDir));

// Serve uploaded files statically at /uploads
const uploadsDir = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Main Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/ai', aiRoutes);

// Healthcheck
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
