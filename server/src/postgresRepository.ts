import { randomUUID } from 'node:crypto';
import { Pool, type PoolClient } from 'pg';
import type { Account, Activity, ChatMessage, CommandLog, MatchRecord, PersistedProposal, Principal, QueueEntry, Rating, RatingSettlement, Room, Session } from './domain.js';
import type { Repository } from './repository.js';
import { defaultGlickoRating, settleGlicko2 } from './glicko2.js';

const principalFromRow = (row: Record<string, unknown>): Principal => ({ id: String(row.principal_id), accountId: row.account_id ? String(row.account_id) : null, username: row.username ? String(row.username) : null, guest: Boolean(row.guest) });

export class PostgresRepository implements Repository {
  readonly pool: Pool;
  constructor(connectionString: string) { this.pool = new Pool({ connectionString }); }
  async migrate(name: string, sql: string) {
    await this.pool.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
    const applied = await this.pool.query('SELECT 1 FROM schema_migrations WHERE name=$1', [name]);
    if (applied.rowCount) return;

    // 兼容在迁移记录表加入前已经初始化过的旧数据库：
    // 001 是完整初始 schema，只要 accounts 已存在，就把它登记为已完成。
    if (name === '001_initial.sql') {
      const existing = await this.pool.query("SELECT to_regclass('public.accounts') AS table_name");
      if (existing.rows[0]?.table_name) {
        await this.pool.query('INSERT INTO schema_migrations(name) VALUES($1) ON CONFLICT DO NOTHING', [name]);
        return;
      }
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations(name) VALUES($1)', [name]);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  async createAccount(username: string, usernameNormalized: string, passwordHash: string) {
    const id = randomUUID();
    const { rows } = await this.pool.query('INSERT INTO accounts(id,username,username_normalized,password_hash) VALUES($1,$2,$3,$4) RETURNING *', [id, username, usernameNormalized, passwordHash]);
    return { id, username: rows[0].username, usernameNormalized: rows[0].username_normalized, passwordHash: rows[0].password_hash };
  }
  async findAccountByNormalizedUsername(value: string) {
    const { rows } = await this.pool.query('SELECT * FROM accounts WHERE username_normalized=$1', [value]);
    return rows[0] ? { id: rows[0].id, username: rows[0].username, usernameNormalized: rows[0].username_normalized, passwordHash: rows[0].password_hash } as Account : null;
  }
  async createSession(principal: Principal, tokenHash: string, expiresAt: Date) {
    await this.pool.query('INSERT INTO sessions(token_hash,principal_id,account_id,username,guest,expires_at) VALUES($1,$2,$3,$4,$5,$6)', [tokenHash, principal.id, principal.accountId, principal.username, principal.guest, expiresAt]);
    return { ...principal, tokenHash, expiresAt };
  }
  async findSession(tokenHash: string, now: Date) {
    const { rows } = await this.pool.query('SELECT * FROM sessions WHERE token_hash=$1 AND expires_at>$2', [tokenHash, now]);
    return rows[0] ? { ...principalFromRow(rows[0]), tokenHash, expiresAt: rows[0].expires_at } as Session : null;
  }
  async deleteSession(tokenHash: string) { await this.pool.query('DELETE FROM sessions WHERE token_hash=$1', [tokenHash]); }
  async getActivity(principalId: string) { const { rows } = await this.pool.query('SELECT principal_id,kind,reference_id FROM active_activities WHERE principal_id=$1', [principalId]); return rows[0] ? { principalId: String(rows[0].principal_id), kind: rows[0].kind, referenceId: String(rows[0].reference_id) } as Activity : null; }
  async claimActivity(activity: Activity) { const result = await this.pool.query('INSERT INTO active_activities(principal_id,kind,reference_id) VALUES($1,$2,$3) ON CONFLICT DO NOTHING', [activity.principalId, activity.kind, activity.referenceId]); return result.rowCount === 1; }
  async releaseActivity(principalId: string, referenceId?: string) { await this.pool.query(`DELETE FROM active_activities WHERE principal_id=$1${referenceId ? ' AND reference_id=$2' : ''}`, referenceId ? [principalId, referenceId] : [principalId]); }
  async saveQueue(entry: QueueEntry) { await this.pool.query('INSERT INTO queues(id,principal_id,account_id,username,guest,game_id,season_id,mode,rating,joined_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT(principal_id) DO UPDATE SET mode=excluded.mode,rating=excluded.rating,joined_at=excluded.joined_at', [entry.id, entry.principal.id, entry.principal.accountId, entry.principal.username, entry.principal.guest, 'cs-push', 'season-v1', entry.mode, entry.rating, entry.joinedAt]); }
  async getQueue(principalId: string) { const { rows } = await this.pool.query('SELECT * FROM queues WHERE principal_id=$1', [principalId]); return rows[0] ? this.queue(rows[0]) : null; }
  async listQueues(mode: 'casual'|'ranked') { const { rows } = await this.pool.query("SELECT * FROM queues WHERE game_id='cs-push' AND season_id='season-v1' AND mode=$1 ORDER BY joined_at", [mode]); return rows.map(row => this.queue(row)); }
  private queue(row: Record<string, unknown>): QueueEntry { return { id: String(row.id), principal: principalFromRow(row), mode: row.mode as 'casual'|'ranked', rating: Number(row.rating), joinedAt: new Date(String(row.joined_at)) }; }
  async deleteQueue(principalId: string) { await this.pool.query('DELETE FROM queues WHERE principal_id=$1', [principalId]); }
  async saveProposal(proposal: PersistedProposal) { await this.pool.query('INSERT INTO match_proposals(match_id,entries,accepted,deadline,version,retained_group_id) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(match_id) DO UPDATE SET entries=excluded.entries,accepted=excluded.accepted,deadline=excluded.deadline,version=excluded.version,retained_group_id=excluded.retained_group_id',[proposal.matchId,JSON.stringify(proposal.entries),proposal.accepted,proposal.deadline,proposal.version,proposal.retainedGroupId ?? null]); }
  async getProposal(matchId: string) { const { rows } = await this.pool.query('SELECT * FROM match_proposals WHERE match_id=$1',[matchId]); return rows[0] ? this.proposal(rows[0]) : null; }
  async listDueProposals(now: Date) { const { rows } = await this.pool.query('SELECT * FROM match_proposals WHERE deadline <= $1 ORDER BY deadline FOR UPDATE SKIP LOCKED',[now]); return rows.map(row => this.proposal(row)); }
  async deleteProposal(matchId: string) { await this.pool.query('DELETE FROM match_proposals WHERE match_id=$1',[matchId]); }
  private proposal(row: Record<string, unknown>): PersistedProposal { return { matchId: String(row.match_id), entries: row.entries as QueueEntry[], accepted: (row.accepted as string[]) ?? [], deadline: new Date(String(row.deadline)), version: Number(row.version), retainedGroupId: row.retained_group_id ? String(row.retained_group_id) : undefined }; }
  async saveRoom(room: Room, expectedVersion?: number) {
    const client = await this.pool.connect(); try { await client.query('BEGIN'); const result = await client.query(expectedVersion === undefined ? 'INSERT INTO rooms(id,invite_code,owner_principal_id,status,room_type,version) VALUES($1,$2,$3,$4,$5,1) ON CONFLICT(id) DO UPDATE SET status=excluded.status,owner_principal_id=excluded.owner_principal_id,room_type=excluded.room_type,version=rooms.version+1' : 'UPDATE rooms SET status=$4,owner_principal_id=$3,room_type=$5,version=version+1 WHERE id=$1 AND version=$2',[room.id,expectedVersion === undefined ? room.inviteCode : expectedVersion,room.ownerPrincipalId,room.status,room.type ?? 'Private']); if (!result.rowCount) { await client.query('ROLLBACK'); return false; } await client.query('DELETE FROM room_members WHERE room_id=$1',[room.id]); for (const member of room.members) await client.query('INSERT INTO room_members(room_id,principal_id,account_id,username,guest,ready,joined_at) VALUES($1,$2,$3,$4,$5,$6,$7)',[room.id,member.principal.id,member.principal.accountId,member.principal.username,member.principal.guest,member.ready,member.joinedAt]); await client.query('COMMIT'); return true; } catch(error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }
  async getRoom(roomId: string) { return this.loadRoom('r.id=$1', roomId); }
  async appendChatMessage(message: ChatMessage) { await this.pool.query('INSERT INTO room_chat(id,room_id,principal_id,text,created_at) VALUES($1,$2,$3,$4,$5)',[message.id,message.roomId,message.principalId,message.text,message.createdAt]); }
  async listChatMessages(roomId: string, limit = 50) { const { rows } = await this.pool.query('SELECT * FROM room_chat WHERE room_id=$1 ORDER BY created_at DESC LIMIT $2',[roomId,limit]); return rows.reverse().map(row => ({ id:String(row.id),roomId:String(row.room_id),principalId:String(row.principal_id),text:String(row.text),createdAt:new Date(String(row.created_at)) })); }
  async getRoomByCode(code: string) { return this.loadRoom('r.invite_code=$1', code); }
  private async loadRoom(where: string, value: string) { const { rows }=await this.pool.query(`SELECT r.*,m.principal_id,m.account_id,m.username,m.guest,m.ready,m.joined_at FROM rooms r LEFT JOIN room_members m ON m.room_id=r.id WHERE ${where} ORDER BY m.joined_at`,[value]); if(!rows[0]) return null; return {id:rows[0].id,inviteCode:rows[0].invite_code.trim(),ownerPrincipalId:rows[0].owner_principal_id,status:rows[0].status,type:rows[0].room_type,version:Number(rows[0].version ?? 1),members:rows.filter(row=>row.principal_id).map(row=>({principal:principalFromRow(row),ready:row.ready,joinedAt:row.joined_at}))} as Room; }
  async saveMatch(match: MatchRecord) { const client=await this.pool.connect(); try { await client.query('BEGIN'); await client.query("INSERT INTO matches(id,game_id,season_id,mode,status,seed,rules_version,result,finished_at) VALUES($1,'cs-push','season-v1',$2,$3,$4,$5,$6,$7) ON CONFLICT(id) DO UPDATE SET status=excluded.status,result=excluded.result,finished_at=excluded.finished_at",[match.id,match.mode,match.status,match.seed,match.rulesVersion,match.result??null,match.result?.finishedAt??null]); for(const participant of match.participants) await client.query('INSERT INTO match_players(match_id,principal_id,account_id,username,guest,side) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(match_id,principal_id) DO NOTHING',[match.id,participant.principal.id,participant.principal.accountId,participant.principal.username,participant.principal.guest,participant.side]); await client.query('COMMIT'); } catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();} }
  async getMatch(matchId: string) { const {rows}=await this.pool.query('SELECT m.*,p.principal_id,p.account_id,p.username,p.guest,p.side FROM matches m JOIN match_players p ON p.match_id=m.id WHERE m.id=$1 ORDER BY p.side',[matchId]); if(rows.length!==2)return null; return {id:rows[0].id,mode:rows[0].mode,status:rows[0].status,seed:rows[0].seed,rulesVersion:rows[0].rules_version,result:rows[0].result??undefined,participants:rows.map(row=>({principal:principalFromRow(row),side:row.side}))} as MatchRecord; }
  async appendCommand(command: CommandLog){const result=await this.pool.query('INSERT INTO match_commands(match_id,principal_id,command_id,sequence,command,accepted_at) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(match_id,command_id) DO NOTHING',[command.matchId,command.principalId,command.commandId,command.sequence,command.command,command.acceptedAt]);return result.rowCount===1;}
  async getCommand(matchId:string,commandId:string){const {rows}=await this.pool.query('SELECT * FROM match_commands WHERE match_id=$1 AND command_id=$2',[matchId,commandId]);return rows[0]?{matchId:rows[0].match_id,principalId:rows[0].principal_id,commandId:rows[0].command_id,sequence:Number(rows[0].sequence),command:rows[0].command,acceptedAt:rows[0].accepted_at}:null;}
  async getRating(accountId:string,seasonId:string){const {rows}=await this.pool.query('INSERT INTO ratings(account_id,season_id) VALUES($1,$2) ON CONFLICT(account_id,season_id) DO UPDATE SET account_id=excluded.account_id RETURNING *',[accountId,seasonId]);const row=rows[0];const fallback=defaultGlickoRating(accountId,seasonId);return {accountId:String(row.account_id),seasonId:String(row.season_id),elo:Number(row.elo ?? fallback.elo),rating:Number(row.rating ?? fallback.rating),deviation:Number(row.deviation ?? fallback.deviation),volatility:Number(row.volatility ?? fallback.volatility),periods:Number(row.periods ?? fallback.periods),wins:Number(row.wins),losses:Number(row.losses),draws:Number(row.draws)} as Rating;}
  async settleRanked(matchId:string,winner:string|null,ids:[string,string],seasonId:string){const client=await this.pool.connect();try{await client.query('BEGIN');const existing=await client.query('SELECT * FROM match_rating_settlements WHERE match_id=$1 ORDER BY account_id',[matchId]);if(existing.rows.length){await client.query('COMMIT');return existing.rows.map(this.settlement);}for(const id of ids)await client.query('INSERT INTO ratings(account_id,season_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[id,seasonId]);const {rows}=await client.query('SELECT * FROM ratings WHERE account_id=ANY($1) AND season_id=$2 ORDER BY account_id FOR UPDATE',[ids,seasonId]);const make=(row:Record<string,unknown>):Rating=>({accountId:String(row.account_id),seasonId,elo:Number(row.elo),rating:Number(row.rating ?? 1500),deviation:Number(row.deviation ?? 350),volatility:Number(row.volatility ?? .06),periods:Number(row.periods ?? 0),wins:Number(row.wins),losses:Number(row.losses),draws:Number(row.draws)});const a=make(rows.find(row=>row.account_id===ids[0])!),b=make(rows.find(row=>row.account_id===ids[1])!);const score=(winner===null?.5:winner===a.accountId?1:0) as 0|.5|1;const [nextA,nextB,settlements]=settleGlicko2(a,b,score);for(const next of [nextA,nextB])await client.query('UPDATE ratings SET elo=$3,rating=$4,deviation=$5,volatility=$6,periods=$7,wins=$8,losses=$9,draws=$10 WHERE account_id=$1 AND season_id=$2',[next.accountId,seasonId,next.elo,next.rating,next.deviation,next.volatility,next.periods,next.wins,next.losses,next.draws]);for(const settlement of settlements){settlement.matchId=matchId;await client.query('INSERT INTO match_rating_settlements(match_id,account_id,old_elo,new_elo,old_rating,new_rating) VALUES($1,$2,$3,$4,$5,$6)',[matchId,settlement.accountId,settlement.oldElo,settlement.newElo,settlement.oldRating,settlement.newRating]);}await client.query('COMMIT');return settlements;}catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}}
  private settlement(row:Record<string,unknown>):RatingSettlement{return {matchId:String(row.match_id),accountId:String(row.account_id),oldElo:Number(row.old_elo),newElo:Number(row.new_elo),oldRating:row.old_rating === null ? undefined : Number(row.old_rating),newRating:row.new_rating === null ? undefined : Number(row.new_rating)};}
  async deleteCommandsBefore(before:Date){const result=await this.pool.query('DELETE FROM match_commands WHERE accepted_at<$1',[before]);return result.rowCount??0;}
  async close(){await this.pool.end();}
}

export const withTransaction = async <T>(client: PoolClient, work: () => Promise<T>) => { await client.query('BEGIN'); try { const result=await work(); await client.query('COMMIT'); return result; } catch(error) { await client.query('ROLLBACK'); throw error; } };
