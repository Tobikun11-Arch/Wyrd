import cors from 'cors'
import express from 'express';
import helmet from 'helmet';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json());

app.get('/', async (req, res) => {
  res.send('test production!');
});

app.listen(5000, () => {
  console.log('Server listening on port 5000');
});