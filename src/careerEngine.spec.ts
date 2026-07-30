import { describe, expect, it } from 'vitest';
import { advanceTournament, becomeStreamer, CareerState, continueFromReport, createCareer, generateAnnualTop20, getCurrentCareerScore, loadCareer, previewDecisionOutcome, resolveCareerChoice, resolveEmergency, saveCareer, startSeason, type HonorAward, type SeasonRecord, type TournamentResult } from './careerEngine';
import { TOURNAMENTS } from './careerData';
import { ALL_CAREER_EVENTS, EVENT_CATALOG_SIZE, TOTAL_EVENT_COUNT } from './careerEventCatalog';
import { MAJOR_CITIES } from './careerData';
import { getHistoricalPlayerBaseline } from './historicalTop20';
import { applyRosterChange, createRosterChangeEvent, rosterChangePlan, shouldTriggerRosterChange } from './rosterChangeSystem';
import { instantiateEvent, isEventEligible, parseEventPack, pickEvent } from './careerEventSystem';
import type { CareerEventContext, CareerEventDefinition } from './careerEventTypes';
import { applyWorldlineTransition, eligibleWorldlines, parseWorldlinePack } from './careerWorldlineSystem';
import { CAREER_WORLDLINES } from './careerWorldlines';
import { CAREER_CONTENT_VERSION, CAREER_REVIEW_QUOTES, CAREER_TITLE_CONFIGS, formatTop20Review, ORIGIN_CONFIGS, TALENT_CONFIGS } from './careerContentSystem';

const create = (seed: string, role: 'entry' | 'igl' = 'entry') => createCareer({ seed, name: 'Spec', pace: 'hardcore', originId: 'overseas', role, iglArchetype: role === 'igl' ? 'brain' : undefined });
const storage = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', { value: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key) } });

describe('career weighted event contracts', () => {
  it('evaluates JSON trigger conditions and ability-driven outcome weights deterministically', () => {
    const definition:CareerEventDefinition={schemaVersion:'1.0',catalogId:'ai-major-clutch',revision:1,category:'赛事内关键局',kind:'field',timing:'in-season',title:'Major 决胜残局',briefing:'比赛进入最后一个高压残局。',eligibility:{op:'all',args:[{op:'eq',left:{var:'tournament.tier'},right:{const:'Major'}},{op:'gte',left:{var:'team.form'},right:{const:40}}]},triggerWeight:{op:'add',args:[{const:50},{var:'player.ability'}]},options:[{id:'take-duel',label:'主动对枪',changes:{},outcomes:[{id:'win',label:'对枪成功',weight:{op:'max',args:[{const:1},{op:'sub',left:{var:'player.ability'},right:{const:40}}]},changes:{fame:5}},{id:'lose',label:'对枪失败',weight:{op:'max',args:[{const:1},{op:'sub',left:{const:100},right:{var:'player.ability'}}]},changes:{ability:-2}}]},{id:'play-team',label:'等待队友',changes:{},outcomes:[{id:'sync',label:'配合成功',weight:60,changes:{connections:3}},{id:'late',label:'配合失败',weight:40,changes:{teamForm:-2}}]}]};
    const context=(ability:number,tier='Major'):CareerEventContext=>({career:{age:20,season:8,careerYear:4},player:{role:'entry',ability,connections:60,integrity:80,fame:50,health:75,positionFamiliarity:70,internationalAdaptation:50,highPressureChokingRisk:20},team:{form:60,rosterStability:70,globalRank:8,regionRank:2,negativeUpsetStreak:0,vrsActive:true,region:'Asia',tier:'一线赛场'},tournament:{tier,honorClass:'major',placement:'四强',rating:1.2,isMajor:tier==='Major',isPlayoff:true},hiddenFlags:{}});
    expect(isEventEligible(definition,context(80))).toBe(true);
    expect(isEventEligible(definition,context(80,'T1'))).toBe(false);
    const high=instantiateEvent(definition,'high',context(90));
    const low=instantiateEvent(definition,'low',context(50));
    expect(high.options[0].outcomes![0].probability).toBeGreaterThan(low.options[0].outcomes![0].probability);
    expect(high.options[0].outcomes!.reduce((sum,outcome)=>sum+outcome.probability,0)).toBe(100);
    expect(high).toEqual(instantiateEvent(definition,'high',context(90)));
    expect(pickEvent([definition],context(80),{kind:'field',timing:'in-season'},.5)?.catalogId).toBe(definition.catalogId);
  });

  it('rejects malformed AI event JSON before it reaches the engine', () => {
    const invalid={schemaVersion:'1.0',catalogId:'bad-event',revision:1,category:'合规风险',kind:'field',title:'坏事件',briefing:'这个事件含有非法效果。',options:[{id:'same',label:'选项一',changes:{hacked:99},outcomes:[{id:'only',label:'结果',probability:80,changes:{}}]},{id:'same',label:'选项二',changes:{},outcomes:[{id:'ok',label:'结果',probability:100,changes:{}}]}]};
    const parsed=parseEventPack([invalid]);
    expect(parsed.events).toHaveLength(0);
    expect(parsed.errors.join(' ')).toMatch(/不是允许的效果字段|重复|总和/);
  });

  it('loads worldlines from JSON and only accepts valid stage transitions', () => {
    const context:CareerEventContext={career:{age:20,season:8,careerYear:4},player:{role:'entry',ability:78,connections:55,integrity:75,fame:45,health:80,positionFamiliarity:70,internationalAdaptation:40,highPressureChokingRisk:20},team:{form:60,rosterStability:70,globalRank:20,regionRank:2,negativeUpsetStreak:0,vrsActive:true,region:'Asia',tier:'1.5 线赛场'},hiddenFlags:{},worldlines:{}};
    expect(CAREER_WORLDLINES.some(item=>item.worldlineId==='rising-star')).toBe(true);
    expect(eligibleWorldlines(CAREER_WORLDLINES,context).map(item=>item.worldlineId)).toContain('rising-star');
    const started=applyWorldlineTransition(CAREER_WORLDLINES,{}, {worldlineId:'rising-star',action:'start',toStage:'attention'},8);
    expect(started['rising-star']).toMatchObject({status:'active',stageId:'attention'});
    expect(applyWorldlineTransition(CAREER_WORLDLINES,started,{worldlineId:'rising-star',action:'advance',toStage:'missing-stage'},9)).toEqual(started);
    expect(parseWorldlinePack([{schemaVersion:'1.0',worldlineId:'broken',revision:1,title:'错误',description:'错误世界线',source:{type:'ai-generated',reviewStatus:'draft'},entry:{op:'eq',left:{const:1},right:{const:1}},initialStage:'none',stages:[]}]).errors.length).toBeGreaterThan(0);
  });

  it('loads origins, talents and review copy from versioned external configuration', () => {
    expect(CAREER_CONTENT_VERSION).toBe('career-content-v1');
    expect(ORIGIN_CONFIGS).toHaveLength(8);
    expect(new Set(ORIGIN_CONFIGS.map(origin=>origin.id)).size).toBe(8);
    expect(TALENT_CONFIGS.length).toBeGreaterThanOrEqual(8);
    expect(new Set(TALENT_CONFIGS.map(talent=>talent.id)).size).toBe(TALENT_CONFIGS.length);
    expect(CAREER_REVIEW_QUOTES.length).toBeGreaterThanOrEqual(100);
    expect(new Set(CAREER_REVIEW_QUOTES.map(quote=>quote.id)).size).toBe(CAREER_REVIEW_QUOTES.length);
    expect(CAREER_TITLE_CONFIGS.at(-1)?.conditions).toEqual([]);
    const review=formatTop20Review({playerName:'Spec',year:2026,rank:1,mvpCount:2,evpCount:1,vpCount:3,majorRating:1.3,eliteRating:1.25,playoffRating:1.28,arenaRating:1.24,finalRating:1.31,eliminationRating:1.27});
    expect(review).toContain('2 次 MVP');
    expect(review).toContain('最终位居榜首');
  });

  it('persists deterministic talent snapshots and configured initial values', () => {
    const first=createCareer({seed:'talent-config',name:'Spec',pace:'standard',originId:'academy',role:'entry'});
    const second=createCareer({seed:'talent-config',name:'Spec',pace:'standard',originId:'academy',role:'entry'});
    expect(first).toEqual(second);
    expect(first.contentVersion).toBe(CAREER_CONTENT_VERSION);
    expect(first.talents).toHaveLength(2);
    expect(first.talents.every(talent=>talent.id&&talent.name&&talent.revision===1)).toBe(true);
    expect(first.internationalAdaptation).toBeGreaterThanOrEqual(0);
    const variants=new Set(Array.from({length:20},(_,index)=>createCareer({seed:`talent-${index}`,name:'Spec',pace:'standard',originId:'academy',role:'entry'}).talents.map(talent=>talent.id).join(',')));
    expect(variants.size).toBeGreaterThan(1);
  });

  it('ships 315+ events across 15 categories with complete weighted outcomes', () => {
    expect(EVENT_CATALOG_SIZE).toBe(315);
    expect(TOTAL_EVENT_COUNT).toBeGreaterThanOrEqual(315);
    const coreEvents=ALL_CAREER_EVENTS.filter(event=>event.catalogId.startsWith('core-'));
    expect(new Set(coreEvents.map(event => event.catalogId)).size).toBe(315);
    expect(new Set(ALL_CAREER_EVENTS.map(event => event.category)).size).toBeGreaterThanOrEqual(15);
    for (const event of ALL_CAREER_EVENTS) {
      expect(event.catalogId).toBeTruthy();
      expect(event.title).toBeTruthy();
      expect(event.briefing).toBeTruthy();
      expect(event.options.length).toBeGreaterThanOrEqual(2);
      for (const option of event.options) {
        if (option.outcomes) {
          expect(option.outcomes.length).toBeGreaterThanOrEqual(2);
          const staticProbabilities=option.outcomes.map(outcome=>outcome.probability);
          if(staticProbabilities.every(probability=>probability!==undefined))expect(staticProbabilities.reduce((sum, probability) => sum + (probability??0), 0)).toBe(100);
        }
      }
    }
  });

  it('keeps hidden outcomes delayed for one to six seasons', () => {
    const hidden = ALL_CAREER_EVENTS.filter(event=>event.catalogId.startsWith('core-')).flatMap(event => event.options).flatMap(option => option.outcomes ?? []).filter(outcome => outcome.delayed);
    expect(hidden.length).toBeGreaterThan(0);
    expect(hidden.every(outcome => Object.keys(outcome.delayed!.changes).length > 0)).toBe(true);
    expect(hidden.every(outcome => outcome.delayed!.minSeasons >= 1 && outcome.delayed!.maxSeasons <= 6)).toBe(true);
  });

  it('previews outcomes deterministically and rejects a forged result', () => {
    let state = startSeason(create('weighted-preview'));
    for (let i = 0; i < 12 && state.phase !== 'emergency'; i += 1) state = advanceTournament(state);
    expect(state.phase).toBe('emergency');
    const decision = state.decision!;
    const option = decision.options[0];
    const preview = previewDecisionOutcome(state, decision, option.id)!;
    expect(preview).toEqual(previewDecisionOutcome(state, decision, option.id));
    expect(resolveEmergency(state, option.id, { ...preview, outcomeId: 'forged' }).phase).toBe('emergency');
  });

  it('does not allow dynasty caller as a selectable starting archetype', () => {
    const state=createCareer({seed:'no-direct-dynasty',name:'Caller',pace:'standard',originId:'academy',role:'igl',iglArchetype:'dynasty'});
    expect(state.iglArchetype).toBe('brain');
  });

  it('finishes the season after resolving an event attached to the final tournament', () => {
    let found:ReturnType<typeof create>|undefined;
    for(let index=0;index<500&&!found;index+=1){
      let state=startSeason(create(`last-event-${index}`));
      while(state.phase==='emergency'&&state.decision)state=resolveEmergency(state,state.decision.options[0].id);
      while(state.phase==='season'){
        state=advanceTournament(state);
        if(state.phase==='emergency'&&state.seasonProgress?.nextIndex===state.seasonProgress?.tournamentIds.length){found=state;break;}
        if(state.phase==='emergency'&&state.decision)state=resolveEmergency(state,state.decision.options[0].id);
      }
    }
    expect(found).toBeDefined();
    const resolved=resolveEmergency(found!,found!.decision!.options[0].id);
    expect(['report','retired']).toContain(resolved.phase);
  });

  it('keeps current career score within 0-100 and caps unproven careers', () => {
    const state=createCareer({seed:'score-cap',name:'Score',pace:'standard',originId:'academy',role:'entry'});
    const score=getCurrentCareerScore({...state,ability:100,fame:100,integrity:100});
    expect(score.score).toBeGreaterThanOrEqual(0);
    expect(score.score).toBeLessThanOrEqual(72);
  });

  it('keeps contracts stable at midyear and explains year-end management attitude', () => {
    const settle = (initial: ReturnType<typeof create>) => {
      let state=startSeason(initial);
      while(state.phase!=='report'&&state.phase!=='retired'){
        if(state.phase==='emergency'&&state.decision)state=resolveEmergency(state,state.decision.options[0].id);
        else if(state.phase==='season')state=advanceTournament(state);
      }
      return state;
    };
    const first=settle({...create('contract-term'),pace:'standard',contractHalfSeasonsRemaining:4});
    expect(first).toMatchObject({employmentStatus:'signed',contractHalfSeasonsRemaining:3});
    expect(first.renewalEvaluation).toBeUndefined();
    let choice=continueFromReport(first);
    while(choice.phase==='emergency'&&choice.decision)choice=resolveEmergency(choice,choice.decision.options[0].id);
    const secondReady=resolveCareerChoice(choice,choice.decision!.options[0].id);
    const second=settle(secondReady);
    expect(second.renewalEvaluation?.factors.length).toBeGreaterThan(3);
  });

  it('guarantees annual TOP1 for two distinct Major MVPs and keeps a full TOP20', () => {
    const state=createCareer({seed:'double-major',name:'Spec',pace:'fast',originId:'academy',role:'entry'});
    const context={major:1.31,elite:1.31,playoffs:1.31,arena:1.28,bigMatches:1.25,finals:1.30,elimination:1.28,vsTop5:1.20,vsTop10:1.22,vsTop20:1.24};
    const tournament=(id:string):TournamentResult=>({id,tournamentId:id,name:`${id} Major`,organizer:'虚构赛事方',city:'成都',tier:'Major',honorClass:'major',invited:true,qualified:true,invitationReason:'测试',placement:'冠军',matches:5,wins:5,maps:15,mapWins:10,teamPrize:100,playerPrize:13.6,salaryPaid:0,rating:1.31,rankingDelta:10,context});
    const record=(half:'first'|'second',result:TournamentResult):SeasonRecord=>{const mvp:HonorAward={id:`${result.id}-mvp`,season:half==='first'?1:2,tournamentName:result.name,kind:'MVP',honorClass:'major'};return {season:half==='first'?1:2,careerYear:1,half,age:16,team:state.team,tier:state.tier,rating:1.31,kd:1,adr:70,matches:5,winRate:50,placement:'冠军',teamPrize:100,playerPrize:13.6,salaryPaid:0,note:'测试',deltas:{ability:0,connections:0,integrity:0,fame:0,health:0,earnings:0},tournaments:[result],globalRank:10,regionRank:1,rankingDelta:10,honors:[mvp]};};
    const annual=generateAnnualTop20(state,[record('first',tournament('spring')),record('second',tournament('autumn'))]);
    expect(annual).toMatchObject({eligible:true,playerRank:1});
    expect(annual.entries).toHaveLength(20);
    expect(annual.entries.filter(entry=>entry.isPlayer)).toEqual([expect.objectContaining({rank:1,nick:'Spec'})]);
    const championRoster={...state,roster:state.roster.map((player,index)=>player.isPlayer?player:{...player,ability:92-index,seasonPerformances:[{season:1,careerYear:1,rating:1.18+index*.01,adr:78+index,maps:52,mvp:index===1?1:0,evp:2,vp:3,majorTitles:1,eliteTitles:2},{season:2,careerYear:1,rating:1.2+index*.01,adr:79+index,maps:54,mvp:0,evp:2,vp:3,majorTitles:1,eliteTitles:2}]})};
    const championAnnual=generateAnnualTop20(championRoster,[record('first',tournament('spring')),record('second',tournament('autumn'))]);
    const rankedTeammates=championAnnual.entries.filter(entry=>entry.isTeammate);
    expect(rankedTeammates.length).toBeGreaterThanOrEqual(2);
    expect(rankedTeammates.every(entry=>entry.rating&&entry.maps&&entry.score>0)).toBe(true);
    expect(getHistoricalPlayerBaseline('ZywOo',1)).toBeGreaterThan(getHistoricalPlayerBaseline('xertioN',1)!);
  });

  it('applies the announced deterministic roster plan and persists free agents', () => {
    const base=create('roster-integration');
    const troubled={...base,negativeUpsetStreak:3,teamForm:35,rosterStability:30,history:[{season:1,careerYear:1,half:'first' as const,age:16,team:base.team,tier:base.tier,rating:1,kd:1,adr:70,matches:5,winRate:20,placement:'首轮出局',teamPrize:0,playerPrize:0,salaryPaid:0,note:'低迷',deltas:{ability:0,connections:0,integrity:0,fame:0,health:0,earnings:0},tournaments:[],globalRank:base.globalRank,regionRank:base.regionRank,rankingDelta:-18,honors:[]}]};
    expect(shouldTriggerRosterChange(troubled)).toBe(true);
    const plan=rosterChangePlan(troubled);
    const decision=createRosterChangeEvent(troubled);
    const changed=applyRosterChange(troubled,decision,'stay-rebuild');
    expect(plan.leaving.every(player=>decision.briefing.includes(player.nick)&&!changed.roster.some(member=>member.nick===player.nick))).toBe(true);
    expect(changed.roster).toHaveLength(5);
    const freeAgent=applyRosterChange(troubled,decision,'leave-rebuild');
    saveCareer(freeAgent);
    expect(loadCareer()).toMatchObject({employmentStatus:'free-agent',team:'自由人',roster:[]});
  });

  it('enters a deterministic three-route streamer comeback window', () => {
    let state=startSeason(create('streamer-window'));
    while(state.phase!=='report'){
      if(state.phase==='emergency'&&state.decision)state=resolveEmergency(state,state.decision.options[0].id);
      else state=advanceTournament(state);
    }
    const streamer=becomeStreamer(state);
    expect(streamer).toMatchObject({employmentStatus:'streamer',phase:'choice'});
    expect(streamer.decision?.options.map(option=>option.id)).toEqual(['stream-focus','stream-train','stream-tryout']);
    expect(streamer.decision).toEqual(becomeStreamer(state).decision);
  });

  it('never offers match decisions before the first tournament starts', () => {
    for (const seed of ['pre-match-1','pre-match-2','pre-match-3','pre-match-4','pre-match-5']) {
      const state=startSeason(createCareer({seed,name:'Timing',pace:'hardcore',originId:'academy',role:'entry'}));
      if(state.phase==='emergency')expect(state.decision?.category).not.toMatch(/^赛事内/);
    }
  });

  it('protects the first rookie season from severe opening emergencies and guarantees growth', () => {
    const initial=createCareer({seed:'rookie-protection',name:'Rookie',pace:'hardcore',originId:'academy',role:'entry'});
    let state=startSeason(initial);
    expect(state.decision?.category).not.toBe('伤病健康');
    while(state.phase!=='report'){
      if(state.phase==='emergency'&&state.decision)state=resolveEmergency(state,state.decision.options[0].id);
      else state=advanceTournament(state);
    }
    expect(state.ability).toBeGreaterThanOrEqual(initial.ability+2);
  });

  it('ships thirty-six fictional dream events without historical source metadata', () => {
    const dreamEvents=ALL_CAREER_EVENTS.filter(event=>event.catalogId.startsWith('dream-'));
    expect(dreamEvents).toHaveLength(36);
    expect(dreamEvents.every(event=>!JSON.stringify(event).includes('hltv.org'))).toBe(true);
    expect(new Set(dreamEvents.map(event=>event.catalogId)).size).toBe(36);
  });

  it('schedules one named Major every half and preserves missed qualifiers', () => {
    const settle=(initial:ReturnType<typeof create>)=>{let state=startSeason(initial);while(state.phase!=='report'){if(state.phase==='emergency'&&state.decision)state=resolveEmergency(state,state.decision.options[0].id);else state=advanceTournament(state);}return state;};
    let state=settle({...create('major-calendar'),globalRank:100,regionRank:50,teamForm:20});
    const first=state.history[0].tournaments.filter(result=>result.tier==='Major');
    expect(first).toHaveLength(1);
    const superElite = TOURNAMENTS.filter(item => item.id === 'esi-katowice' || item.id === 'esi-cologne');
    expect(superElite.every(item => item.honorClass === 'super-elite' && item.tier !== 'Major')).toBe(true);
    expect(first[0].name).toMatch(/^(PJL|ESI|遮天电竞|BURST|NovaLadder) .+ Major$/);
    expect(MAJOR_CITIES).toContain(first[0].city);
    if(first[0].qualified===false)expect(first[0]).toMatchObject({placement:'预选出局',matches:0,teamPrize:0,playerPrize:0});
    if(first[0].qualified===false){expect(first[0].qualifierStage).toBeTruthy();expect(first[0].qualifierOpponent).toBeTruthy();expect(first[0].qualifierScore).toMatch(/^[01]:2$/);}
  });

  it('applies deterministic burnout penalties to low-health AWP callers', () => {
    const awpCaller=createCareer({seed:'awp-caller-burnout',name:'Caller',pace:'standard',originId:'academy',role:'igl',iglArchetype:'awp-caller'});
    const healthy={...awpCaller,health:90,globalRank:15,regionRank:5};
    const tired={...healthy,health:50};
    const settle=(initial:typeof healthy)=>{let state=startSeason(initial);while(state.phase!=='report'){if(state.phase==='emergency'&&state.decision)state=resolveEmergency(state,state.decision.options[0].id);else state=advanceTournament(state);}return state;};
    const healthyReport=settle(healthy).history[0];
    const tiredReport=settle(tired).history[0];
    expect(healthyReport.rating-tiredReport.rating).toBeGreaterThanOrEqual(.04);
  });

  it('triggers tactical fatigue after three consecutive top-three half seasons', () => {
    const state=createCareer({seed:'meta-shift',name:'Dynasty',pace:'standard',originId:'academy',role:'igl',iglArchetype:'brain'});
    let found:typeof state|undefined;
    for(let index=0;index<80&&!found;index+=1){
      let report=startSeason({...state,seed:state.seed+index,globalRank:1,regionRank:1,rankingPoints:2400,top3SeasonStreak:2,ability:100,teamForm:100,rosterStability:100});
      while(report.phase!=='report'){if(report.phase==='emergency'&&report.decision)report=resolveEmergency(report,report.decision.options[0].id);else report=advanceTournament(report);}
      if(report.tacticalFatigue)found=report;
    }
    expect(found?.tacticalFatigue).toBe(true);
    expect(found?.postReportEvent?.title).toBe('王朝危机：战术被摸透');
  });

  it('uses APS without a random nomination gate', () => {
    let state=createCareer({seed:'aps-awards',name:'APS',pace:'standard',originId:'academy',role:'entry'});
    state={...state,careerYear:4,season:8,half:'second',ability:100,teamForm:100,rosterStability:100,health:100};
    let report=startSeason(state);while(report.phase!=='report'){if(report.phase==='emergency'&&report.decision)report=resolveEmergency(report,report.decision.options[0].id);else report=advanceTournament(report);}
    let awards=continueFromReport(report);while(awards.phase==='emergency'&&awards.decision)awards=resolveEmergency(awards,awards.decision.options[0].id);
    expect(awards.top20History.at(-1)?.nominationChance).toBeGreaterThanOrEqual(0);
    expect(awards.top20History.at(-1)?.apsScore).toBeGreaterThanOrEqual(0);
  });

  it('settles only one tournament per engine step and records maps', () => {
    let state = startSeason(createCareer({ seed: 'one-step', name: 'Spec', pace: 'standard', originId: 'academy', role: 'entry' }));
    while(state.phase==='emergency'&&state.decision)state=resolveEmergency(state,state.decision.options[0].id);
    const before = state.seasonProgress!.nextIndex;
    state = advanceTournament(state);
    expect(state.seasonProgress!.nextIndex).toBe(before + 1);
    expect(state.seasonProgress!.results[0].maps).toBeGreaterThanOrEqual(state.seasonProgress!.results[0].matches);
  });

  it('becomeStreamer clears team and roster', () => {
    const initial = create('streamer-test');
    const mockState: CareerState = { ...initial, history: [initial.history[0] ?? { season: 1, careerYear: 1, half: 'first', tournaments: [], rating: 1.0, kd: 1.0, adr: 70, matches: 10, salaryPaid: 6, globalRank: 50, regionRank: 15, rankingDelta: 0 }], phase: 'report' };
    const streamer = becomeStreamer(mockState);
    expect(streamer.employmentStatus).toBe('streamer');
    expect(streamer.team).toBe('无所属战队');
    expect(streamer.team).not.toBe(initial.team);
    expect(streamer.roster).toEqual([]);
    expect(streamer.tier).toBe('未入榜');
    expect(streamer.globalRank).toBe(999);
    expect(streamer.vrsActive).toBe(false);
    expect(streamer.salary).toBe(0);
  });
});
