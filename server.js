import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';

import formRoutes from './routes/formRoutes.js';
import newsletterRoutes from './routes/newsletterRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import analyticsRoute from './routes/analyticsRoute.js';

dotenv.config();
connectDB();

const app = express();

// ✅ Sadece CORS middleware kullan
const allowedOrigins = [
    'https://www.bagbahceyatirim.com.tr',
    'https://bagbahceyatirim.com.tr',
    'https://bagbahceyatirim.com',
    'https://www.bagbahceyatirim.com',
    'https://bagbahceyatirim.online',
    'https://www.bagbahceyatirim.online',
    'https://bagbahceyatirim.xyz',
    'https://www.bagbahceyatirim.xyz',
    'http://localhost:3000', 
    'http://localhost:5000'
];  // Allow only your frontend URL

// app.use(cors({
//     origin: [
//         'https://www.bagbahceyatirim.com.tr',
//         'https://bagbahceyatirim.com.tr',
//         'https://bagbahceyatirim.com',
//         'https://www.bagbahceyatirim.com',
//         'https://bagbahceyatirim.online',
//         'https://www.bagbahceyatirim.online',
//         'https://bagbahceyatirim.xyz',
//         'https://www.bagbahceyatirim.xyz',
//         'http://localhost:3000',
//     ],
//     credentials: true
// }));
app.use(cors({
    origin: allowedOrigins,  // Only allow requests from the allowed origins
    methods: ['GET', 'POST', 'DELETE', 'PUT'],  // You can add other HTTP methods if needed
    credentials: true, // <== BUNU EKLEMEN GEREKİYOR
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/form', formRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
