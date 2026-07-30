import { randomInt, randomUUID } from 'node:crypto';
import type { MatchRecord, Principal, QueueEntry, QueueMode, ReadyCheck, Room } from './domain.js';
import { GAME_ID, SEASON_ID } from './domain.js';
import type { Repository } from './repository.js';

export class ServiceError extends Error { constructor(readonly code: string, message: string) { super(message); } }

export class QueueService {
  readonly readyChecks = new Map<string, ReadyCheck>();
  constructor(private repository: Repository, private now = () => new Date()) {}
  async join(principal: Principal, mode: QueueMode) {
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
      return entry ? { status: 'searching' as const, queueId: entry.id, joinedAt: entry.joinedAt, estimatedWaitSeconds: 10 } : { status: 'idle' as const };
    }
    if (activity.kind === 'ready_check') {
      const check = this.readyChecks.get(activity.referenceId);
      if (!check) return { status: 'idle' as const };
      return { status: 'ready_check' as const, matchId: check.matchId, accepted: check.accepted.has(principalId), deadline: check.deadline };
    }
    if (activity.kind === 'match') {
      const match = await this.repository.getMatch(activity.referenceId);
      const participant = match?.participants.find(item => item.principal.id === principalId);
      return match && participant ? { status: 'playing' as const, matchId: match.id, side: participant.side } : { status: 'idle' as const };
    }
    return { status: 'idle' as const };
  }
  async leave(principalId: string) { const entry=await this.repository.getQueue(principalId); if(entry){await this.repository.deleteQueue(principalId);await this.repository.releaseActivity(principalId,entry.id);} }
  searchRange(entry: QueueEntry, at = this.now()) { return 100 + Math.floor(Math.max(0, at.getTime()-entry.joinedAt.getTime())/10_000)*50; }
  async match(mode: QueueMode) {
    const entries = await this.repository.listQueues(mode);
    for (let i=0;i<entries.length;i+=1) for(let j=i+1;j<entries.length;j+=1){const a=entries[i],b=entries[j];if(Math.abs(a.rating-b.rating)>Math.min(this.searchRange(a),this.searchRange(b)))continue;const matchId=randomUUID();const check:ReadyCheck={matchId,entries:[a,b],accepted:new Set(),deadline:new Date(this.now().getTime()+10_000)};this.readyChecks.set(matchId,check);for(const entry of [a,b]){await this.repository.deleteQueue(entry.principal.id);await this.repository.releaseActivity(entry.principal.id,entry.id);await this.repository.claimActivity({principalId:entry.principal.id,kind:'ready_check',referenceId:matchId});}return check;}return null;
  }
  async accept(matchId:string,principalId:string){const check=this.readyChecks.get(matchId);if(!check||this.now()>check.deadline)throw new ServiceError('READY_EXPIRED','匹配确认已过期');if(!check.entries.some(entry=>entry.principal.id===principalId))throw new ServiceError('NOT_PARTICIPANT','不是该匹配参与者');check.accepted.add(principalId);if(check.accepted.size<2)return this.current(principalId);this.readyChecks.delete(matchId);const [first,second]=check.entries;const swap=randomInt(2)===1;const participants: MatchRecord['participants']=swap?[{principal:first.principal,side:'t'},{principal:second.principal,side:'ct'}]:[{principal:first.principal,side:'ct'},{principal:second.principal,side:'t'}];const match:MatchRecord={id:matchId,mode:first.mode,status:'playing',seed:randomUUID(),rulesVersion:'cs-push-v1',participants};await this.repository.saveMatch(match);for(const entry of check.entries){await this.repository.releaseActivity(entry.principal.id,matchId);await this.repository.claimActivity({principalId:entry.principal.id,kind:'match',referenceId:matchId});}return this.current(principalId);}
  async expireReadyChecks(){for(const [id,check] of this.readyChecks)if(this.now()>check.deadline){this.readyChecks.delete(id);for(const entry of check.entries){await this.repository.releaseActivity(entry.principal.id,id);if(check.accepted.has(entry.principal.id))await this.join(entry.principal,entry.mode);}}}
}

export class RoomService {
  constructor(private repository:Repository){}
  private code(){return randomInt(0,1_000_000).toString().padStart(6,'0');}
  async create(principal:Principal){let inviteCode='';for(let i=0;i<10;i+=1){inviteCode=this.code();if(!await this.repository.getRoomByCode(inviteCode))break;}const room:Room={id:randomUUID(),inviteCode,ownerPrincipalId:principal.id,status:'open',members:[{principal,ready:true,joinedAt:new Date()}]};if(!await this.repository.claimActivity({principalId:principal.id,kind:'room',referenceId:room.id}))throw new ServiceError('ACTIVE_ACTIVITY','已有进行中的活动');await this.repository.saveRoom(room);return room;}
  async status(roomId:string,principalId:string){const room=await this.require(roomId,principalId);const activity=await this.repository.getActivity(principalId);if(activity?.kind==='match'){const match=await this.repository.getMatch(activity.referenceId);const side=match?.participants.find(item=>item.principal.id===principalId)?.side;return {room,match:match&&side?{matchId:match.id,side}:undefined};}return {room};}
  async join(principal:Principal,inviteCode:string){const room=await this.repository.getRoomByCode(inviteCode);if(!room||room.status!=='open')throw new ServiceError('ROOM_NOT_FOUND','房间不存在');if(room.members.length>=2)throw new ServiceError('ROOM_FULL','房间已满');if(!await this.repository.claimActivity({principalId:principal.id,kind:'room',referenceId:room.id}))throw new ServiceError('ACTIVE_ACTIVITY','已有进行中的活动');room.members.push({principal,ready:false,joinedAt:new Date()});await this.repository.saveRoom(room);return room;}
  async ready(roomId:string,principalId:string,ready:boolean){const room=await this.require(roomId,principalId);room.members.find(member=>member.principal.id===principalId)!.ready=ready;await this.repository.saveRoom(room);return room;}
  async start(roomId:string,principalId:string){const room=await this.require(roomId,principalId);if(room.ownerPrincipalId!==principalId)throw new ServiceError('OWNER_REQUIRED','只有房主可以开始');if(room.members.length!==2||!room.members.every(member=>member.ready))throw new ServiceError('NOT_READY','双方必须准备');room.status='started';await this.repository.saveRoom(room);const swap=randomInt(2)===1;const [first,second]=room.members;const participants:MatchRecord['participants']=swap?[{principal:first.principal,side:'t'},{principal:second.principal,side:'ct'}]:[{principal:first.principal,side:'ct'},{principal:second.principal,side:'t'}];const match:MatchRecord={id:randomUUID(),mode:'room',status:'playing',seed:randomUUID(),rulesVersion:'cs-push-v1',participants};await this.repository.saveMatch(match);for(const member of room.members){await this.repository.releaseActivity(member.principal.id,room.id);await this.repository.claimActivity({principalId:member.principal.id,kind:'match',referenceId:match.id});}return match;}
  async leave(roomId:string,principalId:string){const room=await this.require(roomId,principalId);room.members=room.members.filter(member=>member.principal.id!==principalId);await this.repository.releaseActivity(principalId,room.id);if(room.members.length&&room.ownerPrincipalId===principalId)room.ownerPrincipalId=room.members[0].principal.id;await this.repository.saveRoom(room);return room;}
  private async require(roomId:string,principalId:string){const room=await this.repository.getRoom(roomId);if(!room||!room.members.some(member=>member.principal.id===principalId))throw new ServiceError('ROOM_NOT_FOUND','房间不存在');return room;}
}

export const validateGamePartition=(gameId:string,seasonId:string)=>{if(gameId!==GAME_ID||seasonId!==SEASON_ID)throw new ServiceError('INVALID_PARTITION','游戏或赛季无效');};
