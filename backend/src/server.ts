import 'dotenv/config';
import { createApp } from './app.js';
import { prisma } from './prisma/client.js';

const PORT = Number(process.env.PORT) || 3001;

const app = createApp();

async function start() {
  try {
    await prisma.$connect();
    app.listen(PORT, () => {
      console.log(`DGA API server listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
