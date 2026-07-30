import { createHash, randomInt, randomUUID } from 'node:crypto';
import type { MatchRecord, Principal, QueueEntry, QueueMode, ReadyCheck, Room } from './domain.js';
import { compatibleGroups, makePartyGroup } from './matchmakingPolicy.js';
import { GAME_ID, SEASON_ID } from './domain.js';
import type { Repository } from './repository.js';

export class ServiceError extends Error { constructor(readonly code: string, message: string) { super(message); } }

export class QueueService {
  readonly readyChecks = new Map<string, ReadyCheck>();
  constructor(private repository: Repository, private now = () => new Date()) {}
  async recoverStaleActivity(principalId:string){
    const activity=await this.repository.getActivity(principalId);
    if(!activity)return;
    let stale=false;
    if(activity.kind==='queue') stale=!Boolean(await this.repository.getQueue(principalId));
    if(activity.kind==='ready_check'){
      const proposal=await this.repository.getProposal(activity.referenceId);
      stale=!proposal || this.now().getTime()>=new Date(proposal.deadline).getTime();
    }
    if(activity.kind==='room'){
      const room=await this.repository.getRoom(activity.referenceId);
      stale=!room || room.status==='closed';
    }
    if(activity.kind==='match'){
      const match=await this.repository.getMatch(activity.referenceId);
      stale=!match || match.status!=='playing';
    }
    if(stale)await this.repository.releaseActivity(principalId,activity.referenceId);
  }
  async join(principal: Principal, mode: QueueMode) {
    await this.recoverStaleActivity(principal.id);
    if (mode === 'ranked' && principal.guest) throw new ServiceError('REGISTERED_REQUIRED', '游客不能参加天梯模式');
    const rating = principal.accountId ? (await this.repository.getRating(principal.accountId, SEASON_ID)).elo : 1000;
    const entry: QueueEntry = { id: randomUUID(), principal, mode, rating, joinedAt: this.now() };
    if (!await this.repository.claimActivity({ principalId: principal.id, kind: 'queue', referenceId: entry.id })) throw new ServiceError('ACTIVE_ACTIVITY', '已有进行中的活动');
    await this.repository.saveQueue(entry);
    return entry;
  }
  async current(principalId: string) {
    await this.expireReadyChecks();
    const activity = await this.repository.getActivity(principalId);
    if (!activity) return { status: 'idle' as const };
    if (activity.kind === 'queue') {
      const entry = await this.repository.getQueue(principalId);
      if (entry) return { status: 'searching' as const, queueId: entry.id, joinedAt: entry.joinedAt, estimatedWaitSeconds: 10 };
      await this.repository.releaseActivity(principalId, activity.referenceId);
      return { status: 'idle' as const };
    }
    if (activity.kind === 'ready_check') {
      let check = this.readyChecks.get(activity.referenceId);
      if (!check) { const persisted = await this.repository.getProposal(activity.referenceId); if (persisted) { check = { matchId: persisted.matchId, entries: persisted.entries.map(entry => ({ ...entry, joinedAt: new Date(entry.joinedAt) })) as [QueueEntry, QueueEntry], accepted: new Set(persisted.accepted), deadline: new Date(persisted.deadline), version: persisted.version, retainedGroupId: persisted.retainedGroupId }; this.readyChecks.set(activity.referenceId, check); } }
      if (!check) {
        await this.repository.releaseActivity(principalId, activity.referenceId);
        return { status: 'idle' as const };
      }
      return { status: 'ready_check' as const, matchId: check.matchId, accepted: check.accepted.has(principalId), deadline: check.deadline };
    }
    if (activity.kind === 'match') {
      const match = await this.repository.getMatch(activity.referenceId);
      const participant = match?.participants.find(item => item.principal.id === principalId);
      if (match && participant) return { status: 'playing' as const, matchId: match.id, side: participant.side };
      await this.repository.releaseActivity(principalId, activity.referenceId);
      return { status: 'idle' as const };
    }
    await this.repository.releaseActivity(principalId, activity.referenceId);
    return { status: 'idle' as const };
  }
  async leave(principalId: string) {
    const entry = await this.repository.getQueue(principalId);
    if (entry) {
      await this.repository.deleteQueue(principalId);
      await this.repository.releaseActivity(principalId, entry.id);
    }
  }
  searchRange(entry: QueueEntry, at = this.now()) { return Math.min(500, 100 + Math.floor(Math.max(0, at.getTime()-entry.joinedAt.getTime())/10_000)*50); }
  async match(mode: QueueMode) {
    const entries = await this.repository.listQueues(mode);
    for (let i=0;i<entries.length;i+=1) for(let j=i+1;j<entries.length;j+=1){const a=entries[i],b=entries[j];if(!compatibleGroups(makePartyGroup([a]),makePartyGroup([b]),this.now()))continue;const matchId=randomUUID();const check:ReadyCheck={matchId,entries:[a,b],accepted:new Set(),deadline:new Date(this.now().getTime()+15_000),version:1};this.readyChecks.set(matchId,check);await this.repository.saveProposal({matchId,entries:[a,b],accepted:[],deadline:check.deadline,version:1});for(const entry of [a,b]){await this.repository.deleteQueue(entry.principal.id);await this.repository.releaseActivity(entry.principal.id,entry.id);await this.repository.claimActivity({principalId:entry.principal.id,kind:'ready_check',referenceId:matchId});}return check;}return null;
  }
  async accept(matchId:string,principalId:string){let check=this.readyChecks.get(matchId);if(!check){const persisted=await this.repository.getProposal(matchId);if(persisted){check={matchId:persisted.matchId,entries:persisted.entries.map(entry=>({...entry,joinedAt:new Date(entry.joinedAt)})) as [QueueEntry,QueueEntry],accepted:new Set(persisted.accepted),deadline:new Date(persisted.deadline),version:persisted.version,retainedGroupId:persisted.retainedGroupId};this.readyChecks.set(matchId,check);}}if(!check||this.now().getTime()>=check.deadline.getTime())throw new ServiceError('READY_EXPIRED','匹配确认已过期');if(!check.entries.some(entry=>entry.principal.id===principalId))throw new ServiceError('NOT_PARTICIPANT','不是该匹配参与者');if (check.accepted.has(principalId)) return this.current(principalId);check.accepted.add(principalId);check.version+=1;await this.repository.saveProposal({matchId,entries:check.entries,accepted:[...check.accepted],deadline:check.deadline,version:check.version,retainedGroupId:check.retainedGroupId});if(check.accepted.size<2)return this.current(principalId);this.readyChecks.delete(matchId);await this.repository.deleteProposal(matchId);const [first,second]=check.entries;const swap=Number.parseInt(createHash('sha256').update(matchId).digest('hex').slice(0, 2), 16)%2===1;const participants: MatchRecord['participants']=swap?[{principal:first.principal,side:'t'},{principal:second.principal,side:'ct'}]:[{principal:first.principal,side:'ct'},{principal:second.principal,side:'t'}];const match:MatchRecord={id:matchId,mode:first.mode,status:'playing',seed:createHash('sha256').update(`${matchId}:cs-push-v2`).digest('hex'),rulesVersion:'cs-push-v2',participants};await this.repository.saveMatch(match);for(const entry of check.entries){await this.repository.releaseActivity(entry.principal.id,matchId);await this.repository.claimActivity({principalId:entry.principal.id,kind:'match',referenceId:matchId});}return this.current(principalId);}
  async expireReadyChecks(){const due=await this.repository.listDueProposals(this.now());for(const persisted of due)if(!this.readyChecks.has(persisted.matchId)){this.readyChecks.set(persisted.matchId,{matchId:persisted.matchId,entries:persisted.entries as [QueueEntry,QueueEntry],accepted:new Set(persisted.accepted),deadline:persisted.deadline,version:persisted.version,retainedGroupId:persisted.retainedGroupId});}for(const [id,check] of this.readyChecks)if(this.now().getTime()>=check.deadline.getTime()){this.readyChecks.delete(id);await this.repository.deleteProposal(id);for(const entry of check.entries){await this.repository.releaseActivity(entry.principal.id,id);if(check.accepted.has(entry.principal.id))await this.join(entry.principal,entry.mode);}}}
  async matchAll(){await this.match('casual');await this.match('ranked');}
  async rematch(matchId:string, principalId:string){
    const previous=await this.repository.getMatch(matchId);
    if(!previous||previous.status!=='finished')throw new ServiceError('REMATCH_UNAVAILABLE','当前对局尚未结束或已失效');
    if(!previous.participants.some(participant=>participant.principal.id===principalId))throw new ServiceError('NOT_PARTICIPANT','不是该对局参与者');
    const nextId=randomUUID();
    const swap=Number.parseInt(createHash('sha256').update(`${nextId}:side`).digest('hex').slice(0,2),16)%2===1;
    const [first,second]=previous.participants;
    const participants:MatchRecord['participants']=swap?[{principal:first.principal,side:'t'},{principal:second.principal,side:'ct'}]:[{principal:first.principal,side:'ct'},{principal:second.principal,side:'t'}];
    const next:MatchRecord={id:nextId,mode:previous.mode,status:'playing',seed:createHash('sha256').update(`${nextId}:cs-push-v2`).digest('hex'),rulesVersion:'cs-push-v2',participants};
    for(const participant of participants){
      await this.repository.releaseActivity(participant.principal.id,matchId);
      if(!await this.repository.claimActivity({principalId:participant.principal.id,kind:'match',referenceId:nextId}))throw new ServiceError('ACTIVE_ACTIVITY','玩家仍有进行中的活动');
    }
    await this.repository.saveMatch(next);
    return next;
  }
}

export class RoomService {
  private chatRate = new Map<string, number[]>();
  constructor(private repository:Repository){}
  private code(){return randomInt(0,1_000_000).toString().padStart(6,'0');}
  async create(principal:Principal,type:'Private'|'Matchmade'|'PVE'='Private'){const activity=await this.repository.getActivity(principal.id);if(activity){const queueService=new QueueService(this.repository);await queueService.recoverStaleActivity(principal.id);}if(type==='Matchmade'&&principal.guest)throw new ServiceError('REGISTERED_REQUIRED','匹配房需要已注册账号');let inviteCode='';for(let i=0;i<10;i+=1){inviteCode=this.code();if(!await this.repository.getRoomByCode(inviteCode))break;}const room:Room={id:randomUUID(),inviteCode,ownerPrincipalId:principal.id,status:'open',type,version:0,createdAt:new Date(),members:[{principal,ready:true,joinedAt:new Date()}]};if(!await this.repository.claimActivity({principalId:principal.id,kind:'room',referenceId:room.id}))throw new ServiceError('ACTIVE_ACTIVITY','已有进行中的活动');await this.repository.saveRoom(room);return room;}
  async status(roomId:string,principalId:string){const room=await this.require(roomId,principalId);const activity=await this.repository.getActivity(principalId);if(activity?.kind==='match'){const match=await this.repository.getMatch(activity.referenceId);const side=match?.participants.find(item=>item.principal.id===principalId)?.side;return {room,match:match&&side?{matchId:match.id,side}:undefined};}return {room};}
  async join(principal:Principal,inviteCode:string){const staleQueue=new QueueService(this.repository);await staleQueue.recoverStaleActivity(principal.id);const room=await this.repository.getRoomByCode(inviteCode);if(!room||room.status!=='open')throw new ServiceError('ROOM_NOT_FOUND','房间不存在');if(room.type==='PVE')throw new ServiceError('ROOM_NOT_JOINABLE','PVE 房间由房主单人进行');if(room.members.length>=2)throw new ServiceError('ROOM_FULL','房间已满');if(!await this.repository.claimActivity({principalId:principal.id,kind:'room',referenceId:room.id}))throw new ServiceError('ACTIVE_ACTIVITY','已有进行中的活动');const version=room.version??1;room.members.push({principal,ready:false,joinedAt:new Date()});if(!await this.repository.saveRoom(room,version))throw new ServiceError('VERSION_CONFLICT','房间状态已更新，请刷新后重试');return room;}
  async ready(roomId:string,principalId:string,ready:boolean){const room=await this.require(roomId,principalId);const version=room.version??1;room.members.find(member=>member.principal.id===principalId)!.ready=ready;if(!await this.repository.saveRoom(room,version))throw new ServiceError('VERSION_CONFLICT','房间状态已更新，请刷新后重试');return room;}
  async start(roomId:string,principalId:string){const room=await this.require(roomId,principalId);if(room.ownerPrincipalId!==principalId)throw new ServiceError('OWNER_REQUIRED','只有房主可以开始');const isPve=room.type==='PVE';if((isPve ? room.members.length!==1 : room.members.length!==2)||!room.members.every(member=>member.ready))throw new ServiceError('NOT_READY',isPve?'PVE 房间尚未准备好':'双方必须准备');const version=room.version??1;room.status='started';if(!await this.repository.saveRoom(room,version))throw new ServiceError('VERSION_CONFLICT','房间状态已更新，请刷新后重试');const first=room.members[0];const second=isPve?{principal:{id:`${room.id}:ai`,accountId:null,username:'训练 AI',guest:true},ready:true,joinedAt:new Date()}:room.members[1];const swap=Number.parseInt(createHash('sha256').update(room.id).digest('hex').slice(0, 2), 16)%2===1;const participants:MatchRecord['participants']=swap?[{principal:first.principal,side:'t'},{principal:second.principal,side:'ct'}]:[{principal:first.principal,side:'ct'},{principal:second.principal,side:'t'}];const match:MatchRecord={id:randomUUID(),mode:'room',status:'playing',seed:createHash('sha256').update(`${room.id}:cs-push-v2`).digest('hex'),rulesVersion:'cs-push-v2',participants};await this.repository.saveMatch(match);for(const member of room.members){await this.repository.releaseActivity(member.principal.id,room.id);await this.repository.claimActivity({principalId:member.principal.id,kind:'match',referenceId:match.id});}return match;}
  async leave(roomId:string,principalId:string){const room=await this.require(roomId,principalId);const version=room.version??1;room.members=room.members.filter(member=>member.principal.id!==principalId);await this.repository.releaseActivity(principalId,room.id);if(room.members.length&&room.ownerPrincipalId===principalId)room.ownerPrincipalId=room.members[0].principal.id;if(!room.members.length)room.status='closed';if(!await this.repository.saveRoom(room,version))throw new ServiceError('VERSION_CONFLICT','房间状态已更新，请刷新后重试');return room;}
  async chat(roomId:string,principalId:string,text:string){const room=await this.require(roomId,principalId);const now=Date.now();const recent=(this.chatRate.get(principalId)??[]).filter(timestamp=>now-timestamp<10_000);if(recent.length>=8)throw new ServiceError('CHAT_RATE_LIMITED','聊天发送过于频繁');recent.push(now);this.chatRate.set(principalId,recent);const normalized=text.replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,240);if(!normalized)throw new ServiceError('INVALID_CHAT','消息不能为空');await this.repository.appendChatMessage({id:randomUUID(),roomId:room.id,principalId,text:normalized,createdAt:new Date()});return this.repository.listChatMessages(room.id);}
  private async require(roomId:string,principalId:string){const room=await this.repository.getRoom(roomId);if(!room||!room.members.some(member=>member.principal.id===principalId))throw new ServiceError('ROOM_NOT_FOUND','房间不存在');return room;}
}

export const validateGamePartition=(gameId:string,seasonId:string)=>{if(gameId!==GAME_ID||seasonId!==SEASON_ID)throw new ServiceError('INVALID_PARTITION','游戏或赛季无效');};
