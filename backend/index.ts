import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';

import onboardingRoutes from './api/routes/onboarding';

dotenv.config();

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:8081',
      'http://localhost:19006'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json());

app.use('/api/onboarding', onboardingRoutes);

app.get('/', async (req, res) => {
  res.send('test production!');
});

app.listen(5000, () => {
  console.log('Server listening on port 5000');
});
