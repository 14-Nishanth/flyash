import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import { Database } from './database/db';
import apiRouter from './routes/api';
import webRouter from './routes/web';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Template engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Mount API & Web Routes
app.use('/api', apiRouter);
app.use('/', webRouter);

// Initialize DB and launch server
async function startServer() {
  try {
    await Database.init();
    console.log('✅ SQLite Database initialized successfully with all tables and seeds.');

    app.listen(PORT, () => {
      console.log(`🚀 Fly Ash Manager (TypeScript) is running at: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
    process.exit(1);
  }
}

startServer();
