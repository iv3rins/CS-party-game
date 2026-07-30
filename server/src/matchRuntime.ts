import { deployUnit, PRODUCTS, createInitialState, tickGame, useItem, weightedProduct, type GameState, type ItemKind, type ProductKind, type Side, type WeaponKind } from '../../src/games/cs-push/engine.js';
import type { CommandLog, MatchCommand, MatchRecord, MatchResult, Principal } from './domain.js';
import { SEASON_ID } from './domain.js';
import type { Repository } from './repository.js';
import { createSeededRng, type SeededRng } from './rng.js';
import { ServiceError } from './services.js';

export interface RuntimeSnapshot { sequence:number; state:GameState; shops:Record<Side,ProductKind[]>; connected:Record<Side,boolean>; }
export type RuntimeEvent = {type:'snapshot';snapshot:RuntimeSnapshot}|{type:'finished';result:MatchResult}|{type:'connection';principalId:string;connected:boolean;reconnectDeadline?:string};

type Clock={now():number;setInterval(callback:()=>void,ms:number):ReturnType<typeof setInterval>;clearInterval(timer:ReturnType<typeof setInterval>):void};
const systemClock:Clock={now:Date.now,setInterval:(callback,ms)=>setInterval(callback,ms),clearInterval:timer=>clearInterval(timer)};

export class MatchRuntime {
  readonly match:MatchRecord;
  private rng: SeededRng;
  private state:GameState;
  private shops:Record<Side,ProductKind[]>;
  private sequence=0;
  private timer:ReturnType<typeof setInterval>|null=null;
  private listeners=new Set<(event:RuntimeEvent)=>void>();
  private connected:Record<Side,boolean>={player:false,ai:false};
  private disconnectedAt:Partial<Record<Side,number>>={};
  private lastCommandAt=new Map<string,number>();
  private finished=false;
  constructor(match:MatchRecord,private repository:Repository,private clock:Clock=systemClock){this.match=match;this.rng=createSeededRng(match.seed);const lanes=[0,1,2,3,4];for(let i=lanes.length-1;i>0;i--){const j=this.rng.integer(i+1);[lanes[i],lanes[j]]=[lanes[j],lanes[i]];}this.state=createInitialState(lanes.slice(0,2));this.shops={player:this.rollShop(),ai:this.rollShop()};}
  private rollShop(){return Array.from({length:5},()=>weightedProduct(()=>this.rng.next()));}
  snapshot():RuntimeSnapshot{return structuredClone({sequence:this.sequence,state:this.state,shops:this.shops,connected:this.connected});}
  projection(principalId:string):RuntimeSnapshot { const side=this.sideFor(principalId); const opponent=side==='player'?'ai':'player'; const state=structuredClone(this.state); state[opponent==='player'?'playerMoney':'aiMoney']=0; state[opponent==='player'?'playerItems':'aiItems']={flash:0,smoke:0,c4:0,defuse:0}; state[opponent==='player'?'playerDefuseCharges':'aiDefuseCharges']=0; return { sequence:this.sequence, state, shops:{ player:side==='player'?structuredClone(this.shops.player):[], ai:side==='ai'?structuredClone(this.shops.ai):[] }, connected:structuredClone(this.connected) }; }
  on(listener:(event:RuntimeEvent)=>void){this.listeners.add(listener);return()=>this.listeners.delete(listener);}
  private emit(event:RuntimeEvent){for(const listener of this.listeners)listener(event);}
  start(){if(!this.timer&&!this.finished)this.timer=this.clock.setInterval(()=>{void this.tick();},100);}
  stop(){if(this.timer){this.clock.clearInterval(this.timer);this.timer=null;}}
  sideFor(principalId:string):Side{const participant=this.match.participants.find(item=>item.principal.id===principalId);if(!participant)throw new ServiceError('NOT_PARTICIPANT','不是该对局参与者');return participant.side==='ct'?'player':'ai';}
  connect(principalId:string){const side=this.sideFor(principalId);this.connected[side]=true;delete this.disconnectedAt[side];this.emit({type:'connection',principalId,connected:true});}
  disconnect(principalId:string){const side=this.sideFor(principalId);this.connected[side]=false;this.disconnectedAt[side]=this.clock.now();this.emit({type:'connection',principalId,connected:false,reconnectDeadline:new Date(this.clock.now()+30_000).toISOString()});}
  async command(principal:Principal,commandId:string,command:MatchCommand){
    const side=this.sideFor(principal.id);
    const duplicate=await this.repository.getCommand(this.match.id,commandId);if(duplicate)return {sequence:duplicate.sequence,duplicate:true};
    if(this.finished||this.state.status!=='playing')throw new ServiceError('MATCH_FINISHED','对局已结束');if(!this.connected[side])throw new ServiceError('NOT_CONNECTED','当前连接未订阅对局');
    const now=this.clock.now(),last=this.lastCommandAt.get(principal.id)??-Infinity;if(now-last<50)throw new ServiceError('RATE_LIMITED','指令过于频繁');
    const next=this.apply(side,command,commandId);const sequence=this.sequence+1;const log:CommandLog={matchId:this.match.id,principalId:principal.id,commandId,sequence,command,acceptedAt:new Date(now)};
    if(!await this.repository.appendCommand(log)){const saved=await this.repository.getCommand(this.match.id,commandId);return {sequence:saved!.sequence,duplicate:true};}
    this.state=next.state;this.shops=next.shops;this.sequence=sequence;this.lastCommandAt.set(principal.id,now);
    if(command.type==='forfeit')await this.finish(side==='player'?'t':'ct','forfeit');
    return {sequence,duplicate:false};
  }
  private apply(side:Side,command:MatchCommand,commandId:string){const state=structuredClone(this.state),shops=structuredClone(this.shops);if(command.type==='forfeit')return{state,shops};if(!Number.isInteger(command.slot)||command.slot<0||command.slot>=5)throw new ServiceError('INVALID_SLOT','商店槽无效');if(!Number.isInteger(command.lane)||command.lane<0||command.lane>=5)throw new ServiceError('INVALID_LANE','路线无效');const kind=shops[side][command.slot],product=PRODUCTS[kind];const moneyKey=side==='player'?'playerMoney':'aiMoney';if(state[moneyKey]<product.price)throw new ServiceError('INSUFFICIENT_FUNDS','金币不足');if(command.type==='buy_deploy'){
      if(product.type!=='weapon')throw new ServiceError('NOT_WEAPON','该槽不是武器');const next=deployUnit(state,side,command.lane,kind as WeaponKind,`${this.match.id}:${commandId}`);if(next===state)throw new ServiceError('SPAWN_BLOCKED','出口被占用');next[moneyKey]-=product.price;shops[side][command.slot]=weightedProduct(()=>this.rng.next());return{state:next,shops};
    }
    if(product.type!=='item')throw new ServiceError('NOT_ITEM','该槽不是道具');const item=kind as ItemKind;if(item==='defuse'){state[moneyKey]-=product.price;if(side==='player')state.playerDefuseCharges+=1;else state.aiDefuseCharges+=1;}else{const next=useItem(state,side,command.lane,item);if(next===state)throw new ServiceError('INVALID_TARGET','当前路线没有有效目标');next[moneyKey]-=product.price;shops[side][command.slot]=weightedProduct(()=>this.rng.next());return{state:next,shops};}shops[side][command.slot]=weightedProduct(()=>this.rng.next());return{state,shops};
  }
  async tick(){if(this.finished)return;for(const side of ['player','ai'] as const){const disconnected=this.disconnectedAt[side];if(disconnected!==undefined&&this.clock.now()-disconnected>=30_000){await this.finish(side==='player'?'t':'ct','disconnect');return;}if(!this.connected[side])this.aiMove(side);}
    this.state=tickGame(this.state,.1,()=>this.rng.next());this.sequence+=1;
    const critical=this.sequence%5===0||this.state.status!=='playing';
    if(critical)this.emit({type:'snapshot',snapshot:this.snapshot()});
    if(this.state.status!=='playing'){const outcome=this.state.status==='draw'?'draw':this.state.status==='player-win'?'ct':'t';await this.finish(outcome,this.state.elapsed>=240?'time':'base');}
  }
  private aiMove(side:Side){const affordable=this.shops[side].map((kind,slot)=>({kind,slot,product:PRODUCTS[kind]})).filter(entry=>entry.product.price<=this.state[side==='player'?'playerMoney':'aiMoney']);if(!affordable.length||this.rng.next()>.08)return;const pick=affordable[this.rng.integer(affordable.length)],lane=this.rng.integer(5);try{const command:MatchCommand=pick.product.type==='weapon'?{type:'buy_deploy',slot:pick.slot,lane}:{type:'use_item',slot:pick.slot,lane};const next=this.apply(side,command,`ai-${this.sequence}`);this.state=next.state;this.shops=next.shops;}catch(error){if(!(error instanceof ServiceError))throw error;}}
  private async finish(outcome:'ct'|'t'|'draw',reason:MatchResult['reason']){if(this.finished)return;this.finished=true;this.stop();const result:MatchResult={matchId:this.match.id,outcome,reason,finishedAt:new Date(this.clock.now()).toISOString(),playerBase:this.state.playerBase,aiBase:this.state.aiBase};this.match.status='finished';this.match.result=result;await this.repository.saveMatch(this.match);for(const participant of this.match.participants)await this.repository.releaseActivity(participant.principal.id,this.match.id);if(this.match.mode==='ranked'){const accounts=this.match.participants.map(item=>item.principal.accountId);if(accounts[0]&&accounts[1]){const winner=outcome==='draw'?null:this.match.participants.find(item=>item.side===outcome)?.principal.accountId??null;await this.repository.settleRanked(this.match.id,winner,[accounts[0],accounts[1]],SEASON_ID);}}this.emit({type:'finished',result});}
}

export class RuntimeRegistry { private runtimes=new Map<string,MatchRuntime>();constructor(private repository:Repository){}async get(matchId:string){let runtime=this.runtimes.get(matchId);if(runtime)return runtime;const match=await this.repository.getMatch(matchId);if(!match||match.status!=='playing')throw new ServiceError('MATCH_NOT_FOUND','对局不存在');runtime=new MatchRuntime(match,this.repository);this.runtimes.set(matchId,runtime);runtime.start();return runtime;}stopAll(){for(const runtime of this.runtimes.values())runtime.stop();}}
