import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { MemoryRepository } from '../src/memoryRepository.js';

const apps: Array<Awaited<ReturnType<typeof buildApp>>> = [];

const makeApp = async () => {
  const app = await buildApp({ repository: new MemoryRepository(), cookieSecret: 'test-cookie-secret-at-least-32-characters' });
  apps.push(app);
  return app;
};

const guestCookie = async (app: Awaited<ReturnType<typeof buildApp>>) => {
  const response = await app.inject({ method: 'POST', url: '/api/auth/guest' });
  expect(response.statusCode).toBe(200);
  const cookie = response.cookies.find(item => item.name === 'cs_push_session');
  expect(cookie?.value).toBeTruthy();
  return `cs_push_session=${cookie!.value}`;
};

const json = <T>(response: { json(): unknown }) => response.json() as T;

afterEach(async () => {
  await Promise.all(apps.splice(0).map(app => app.close()));
});

describe('online lobby HTTP contract', () => {
  it('matches two browser sessions and requires both players to accept', async () => {
    const app = await makeApp();
    const firstCookie = await guestCookie(app);
    const secondCookie = await guestCookie(app);
    const payload = { gameId: 'cs-push', seasonId: 'season-v1', mode: 'casual' };

    const firstJoin = await app.inject({ method: 'POST', url: '/api/queues', headers: { cookie: firstCookie }, payload });
    expect(firstJoin.statusCode).toBe(200);
    expect(json<{ status: string }>(firstJoin).status).toBe('searching');

    const secondJoin = await app.inject({ method: 'POST', url: '/api/queues', headers: { cookie: secondCookie }, payload });
    expect(secondJoin.statusCode).toBe(200);
    const secondReady = json<{ status: string; matchId: string }>(secondJoin);
    expect(secondReady.status).toBe('ready_check');

    const firstStatus = await app.inject({ method: 'GET', url: '/api/queues/current', headers: { cookie: firstCookie } });
    expect(json<{ status: string; matchId: string }>(firstStatus)).toMatchObject({ status: 'ready_check', matchId: secondReady.matchId });

    const firstAccept = await app.inject({ method: 'POST', url: `/api/matches/${secondReady.matchId}/accept`, headers: { cookie: firstCookie } });
    expect(json<{ status: string; accepted: boolean }>(firstAccept)).toMatchObject({ status: 'ready_check', accepted: true });

    const secondAccept = await app.inject({ method: 'POST', url: `/api/matches/${secondReady.matchId}/accept`, headers: { cookie: secondCookie } });
    expect(json<{ status: string; side: string }>(secondAccept).status).toBe('playing');

    const firstPlaying = await app.inject({ method: 'GET', url: '/api/queues/current', headers: { cookie: firstCookie } });
    const secondPlaying = await app.inject({ method: 'GET', url: '/api/queues/current', headers: { cookie: secondCookie } });
    const firstState = json<{ status: string; side: string }>(firstPlaying);
    const secondState = json<{ status: string; side: string }>(secondPlaying);
    expect(firstState.status).toBe('playing');
    expect(new Set([firstState.side, secondState.side])).toEqual(new Set(['ct', 't']));
  });

  it('accepts bounded CS Career feedback from a signed session',async()=>{const app=await makeApp();const cookie=await guestCookie(app);const response=await app.inject({method:'POST',url:'/api/feedback',headers:{cookie},payload:{gameId:'cs-career',category:'balance',message:'Major 冠军过于容易获得',phase:'report',saveVersion:17,rulesVersion:'test'}});expect(response.statusCode).toBe(201);});

  it('lets another browser join a private room by its six digit code', async () => {
    const app = await makeApp();
    const hostCookie = await guestCookie(app);
    const visitorCookie = await guestCookie(app);

    const create = await app.inject({ method: 'POST', url: '/api/rooms', headers: { cookie: hostCookie }, payload: {} });
    expect(create.statusCode).toBe(200);
    const room = json<{ id: string; inviteCode: string; members: unknown[] }>(create);
    expect(room.inviteCode).toMatch(/^\d{6}$/);
    expect(room.members).toHaveLength(1);

    const join = await app.inject({ method: 'POST', url: '/api/rooms/join', headers: { cookie: visitorCookie }, payload: { inviteCode: room.inviteCode } });
    expect(join.statusCode).toBe(200);
    expect(json<{ members: unknown[] }>(join).members).toHaveLength(2);

    const ready = await app.inject({ method: 'PATCH', url: `/api/rooms/${room.id}/ready`, headers: { cookie: visitorCookie }, payload: { ready: true } });
    expect(ready.statusCode).toBe(200);

    const start = await app.inject({ method: 'POST', url: `/api/rooms/${room.id}/start`, headers: { cookie: hostCookie }, payload: {} });
    const started = json<{ matchId: string; side: 'ct' | 't' }>(start);
    expect(start.statusCode).toBe(200);
    expect(started.matchId).toBeTruthy();

    const visitorStatus = await app.inject({ method: 'GET', url: `/api/rooms/${room.id}`, headers: { cookie: visitorCookie } });
    expect(json<{ match: { matchId: string; side: 'ct' | 't' } }>(visitorStatus).match.matchId).toBe(started.matchId);
  });
});
