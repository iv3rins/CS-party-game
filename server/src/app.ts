import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import type { WebSocket } from 'ws';
import type { MatchCommand, Principal } from './domain.js';
import { AuthService } from './auth.js';
import { RuntimeRegistry } from './matchRuntime.js';
import type { Repository } from './repository.js';
import { QueueService, RoomService, ServiceError, validateGamePartition } from './services.js';

const COOKIE='cs_push_session';
const body=(request:FastifyRequest)=>request.body as Record<string,unknown>;
const fail=(reply:FastifyReply,error:unknown)=>{if(error instanceof ServiceError)return reply.code(400).send({error:error.code,message:error.message});requestError(error);};
const requestError=(error:unknown):never=>{throw error;};

export interface AppOptions{repository:Repository;cookieSecret:string;sessionDays?:number;rateLimitMax?:number;}
export const buildApp=async(options:AppOptions)=>{
  const app=Fastify({logger:false});const auth=new AuthService(options.repository,options.sessionDays);const queues=new QueueService(options.repository);const rooms=new RoomService(options.repository);const runtimes=new RuntimeRegistry(options.repository);
  await app.register(cookie,{secret:options.cookieSecret});await app.register(rateLimit,{global:true,max:options.rateLimitMax??120,timeWindow:'1 minute'});await app.register(websocket);
  const principal=async(request:FastifyRequest,reply:FastifyReply):Promise<Principal|null>=>{const session=await auth.authenticate(request.cookies[COOKIE]);if(!session){reply.code(401).send({error:'UNAUTHENTICATED',message:'请先登录'});return null;}return session;};
  const setSession=(reply:FastifyReply,result:Awaited<ReturnType<AuthService['guest']>>)=>{reply.setCookie(COOKIE,result.token,{httpOnly:true,secure:true,sameSite:'lax',path:'/',expires:result.expiresAt});return result.principal;};
  app.get('/api/health',async()=>({status:'ok'}));
  app.post('/api/auth/guest',async(_request,reply)=>setSession(reply,await auth.guest()));
  app.post('/api/auth/register',async(request,reply)=>{try{return setSession(reply,await auth.register(String(body(request).username??''),String(body(request).password??'')));}catch(error){return fail(reply,error);}});
  app.post('/api/auth/login',async(request,reply)=>{try{return setSession(reply,await auth.login(String(body(request).username??''),String(body(request).password??'')));}catch(error){return fail(reply,error);}});
  app.post('/api/auth/logout',async(request,reply)=>{await auth.logout(request.cookies[COOKIE]);reply.clearCookie(COOKIE,{path:'/'});return{ok:true};});
  app.get('/api/auth/me',async(request,reply)=>await principal(request,reply));
  app.post('/api/queues',async(request,reply)=>{const user=await principal(request,reply);if(!user)return;try{const data=body(request);validateGamePartition(String(data.gameId),String(data.seasonId));if(data.mode!=='casual'&&data.mode!=='ranked')throw new ServiceError('INVALID_MODE','模式无效');await queues.join(user,data.mode);await queues.match(data.mode);return await queues.current(user.id);}catch(error){return fail(reply,error);}});
  app.get('/api/queues/current',async(request,reply)=>{const user=await principal(request,reply);return user?await queues.current(user.id):undefined;});
  app.delete('/api/queues/current',async(request,reply)=>{const user=await principal(request,reply);if(user)await queues.leave(user.id);return{ok:Boolean(user)};});
  app.post('/api/matches/:matchId/accept',async(request,reply)=>{const user=await principal(request,reply);if(!user)return;try{return await queues.accept((request.params as {matchId:string}).matchId,user.id);}catch(error){return fail(reply,error);}});
  app.post('/api/rooms',async(request,reply)=>{const user=await principal(request,reply);if(!user)return;try{return await rooms.create(user);}catch(error){return fail(reply,error);}});
  app.post('/api/rooms/join',async(request,reply)=>{const user=await principal(request,reply);if(!user)return;try{return await rooms.join(user,String(body(request).inviteCode??''));}catch(error){return fail(reply,error);}});
  app.get('/api/rooms/:roomId',async(request,reply)=>{const user=await principal(request,reply);if(!user)return;try{return await rooms.status((request.params as {roomId:string}).roomId,user.id);}catch(error){return fail(reply,error);}});
  app.patch('/api/rooms/:roomId/ready',async(request,reply)=>{const user=await principal(request,reply);if(!user)return;try{return await rooms.ready((request.params as {roomId:string}).roomId,user.id,Boolean(body(request).ready));}catch(error){return fail(reply,error);}});
  app.post('/api/rooms/:roomId/start',async(request,reply)=>{const user=await principal(request,reply);if(!user)return;try{const match=await rooms.start((request.params as {roomId:string}).roomId,user.id);return {matchId:match.id,side:match.participants.find(item=>item.principal.id===user.id)?.side};}catch(error){return fail(reply,error);}});
  app.post('/api/rooms/:roomId/leave',async(request,reply)=>{const user=await principal(request,reply);if(!user)return;try{return await rooms.leave((request.params as {roomId:string}).roomId,user.id);}catch(error){return fail(reply,error);}});
  app.get('/ws',{websocket:true},async(socket:WebSocket,request)=>{const session=await auth.authenticate(request.cookies[COOKIE]);if(!session){socket.close(1008,'unauthenticated');return;}socket.send(JSON.stringify({type:'session.ready',accountId:session.accountId??session.id}));let active:{runtime:Awaited<ReturnType<RuntimeRegistry['get']>>;unsubscribe:()=>void}|null=null;socket.on('message',async raw=>{let message:Record<string,unknown>;try{message=JSON.parse(raw.toString()) as Record<string,unknown>;}catch{socket.send(JSON.stringify({type:'command.rejected',commandId:'',code:'INVALID_MESSAGE',message:'消息格式无效'}));return;}if(message.type==='ping'){socket.send(JSON.stringify({type:'pong',clientTime:message.clientTime,serverTime:Date.now()}));return;}try{if(message.type==='match.subscribe'){active?.unsubscribe();const runtime=await runtimes.get(String(message.matchId));runtime.connect(session.id);const unsubscribe=runtime.on(event=>{if(event.type==='snapshot')socket.send(JSON.stringify({type:'match.snapshot',sequence:event.snapshot.sequence,yourSide:runtime.match.participants.find(item=>item.principal.id===session.id)?.side,match:event.snapshot}));if(event.type==='finished')socket.send(JSON.stringify({type:'match.finished',result:event.result}));if(event.type==='connection')socket.send(JSON.stringify({type:'match.connection',playerId:event.principalId,connected:event.connected,reconnectDeadline:event.reconnectDeadline}));});active={runtime,unsubscribe};socket.send(JSON.stringify({type:'match.snapshot',sequence:runtime.snapshot().sequence,yourSide:runtime.match.participants.find(item=>item.principal.id===session.id)?.side,match:runtime.snapshot()}));return;}if(message.type==='match.command'){if(!active||active.runtime.match.id!==message.matchId)throw new ServiceError('NOT_SUBSCRIBED','尚未订阅该对局');const result=await active.runtime.command(session,String(message.commandId),message.command as MatchCommand);socket.send(JSON.stringify({type:'command.accepted',commandId:message.commandId,sequence:result.sequence}));return;}throw new ServiceError('INVALID_MESSAGE','消息类型无效');}catch(error){const failure=error instanceof ServiceError?error:new ServiceError('INTERNAL','服务器错误');socket.send(JSON.stringify({type:'command.rejected',commandId:String(message.commandId??''),code:failure.code,message:failure.message}));}});socket.on('close',()=>{if(active){active.runtime.disconnect(session.id);active.unsubscribe();}});});
  app.addHook('onClose',async()=>{runtimes.stopAll();await options.repository.close();});
  return app;
};
