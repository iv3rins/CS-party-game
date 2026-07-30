import { describe, expect, it } from 'vitest';
import { advanceTournament, becomeStreamer, continueFromReport, createCareer, getCurrentCareerScore, previewDecisionOutcome, resolveCareerChoice, resolveEmergency, startSeason } from './careerEngine';
import { CAREER_EVENT_CATALOG, EVENT_CATALOG_SIZE } from './careerEventCatalog';

const create = (seed: string, role: 'entry' | 'igl' = 'entry') => createCareer({ seed, name: 'Spec', pace: 'hardcore', originId: 'overseas', role, iglArchetype: role === 'igl' ? 'brain' : undefined });

describe('career weighted event contracts', () => {
  it('ships 315 events across 15 categories with complete weighted outcomes', () => {
    expect(EVENT_CATALOG_SIZE).toBe(315);
    expect(new Set(CAREER_EVENT_CATALOG.map(event => event.catalogId)).size).toBe(315);
    expect(new Set(CAREER_EVENT_CATALOG.map(event => event.category)).size).toBe(15);
    for (const event of CAREER_EVENT_CATALOG) {
      expect(event.options.length).toBeGreaterThanOrEqual(2);
      for (const option of event.options) {
        expect(option.outcomes?.length).toBeGreaterThanOrEqual(2);
        expect(option.outcomes!.reduce((sum, outcome) => sum + outcome.probability, 0)).toBe(100);
      }
    }
  });

  it('keeps hidden outcomes delayed for one to six seasons', () => {
    const hidden = CAREER_EVENT_CATALOG.flatMap(event => event.options).flatMap(option => option.outcomes ?? []).filter(outcome => outcome.delayed);
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

  it('settles only one tournament per engine step and records maps', () => {
    let state = startSeason(createCareer({ seed: 'one-step', name: 'Spec', pace: 'standard', originId: 'academy', role: 'entry' }));
    while(state.phase==='emergency'&&state.decision)state=resolveEmergency(state,state.decision.options[0].id);
    const before = state.seasonProgress!.nextIndex;
    state = advanceTournament(state);
    expect(state.seasonProgress!.nextIndex).toBe(before + 1);
    expect(state.seasonProgress!.results[0].maps).toBeGreaterThanOrEqual(state.seasonProgress!.results[0].matches);
  });
});
