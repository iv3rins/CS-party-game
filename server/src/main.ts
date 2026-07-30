import 'dotenv/config';
import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { MemoryRepository } from './memoryRepository.js';
import { PostgresRepository } from './postgresRepository.js';

const config=loadConfig();
const repository=config.DATABASE_URL.startsWith('memory://')
  ?new MemoryRepository()
  :new PostgresRepository(config.DATABASE_URL);
if (repository instanceof PostgresRepository) {
  const { readFile } = await import('node:fs/promises');
  const migrations = ['001_initial.sql', '002_production_infrastructure.sql'];
  for (const migration of migrations) await repository.migrate(await readFile(new URL(`../migrations/${migration}`, import.meta.url), 'utf8'));
}
const app=await buildApp({repository,cookieSecret:config.COOKIE_SECRET,sessionDays:config.SESSION_DAYS,rateLimitMax:config.RATE_LIMIT_MAX,workerIntervalMs:config.WORKER_INTERVAL_MS});
await app.listen({host:config.HOST,port:config.PORT});
