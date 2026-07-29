import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { PostgresRepository } from './postgresRepository.js';

const config=loadConfig();
const repository=new PostgresRepository(config.DATABASE_URL);
const migration=await readFile(fileURLToPath(new URL('../migrations/001_initial.sql',import.meta.url)),'utf8');
await repository.migrate(migration);
const app=await buildApp({repository,cookieSecret:config.COOKIE_SECRET,sessionDays:config.SESSION_DAYS,rateLimitMax:config.RATE_LIMIT_MAX});
await app.listen({host:config.HOST,port:config.PORT});
