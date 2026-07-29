import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ChevronRight, FastForward, Play, RotateCcw, ShieldCheck, Trophy, X, Zap } from 'lucide-react';
import { advanceTournament, CareerState, CareerTrophy, clearCareer, continueFromAwards, continueFromReport, continueTournament, createCareer, emergencyProgress, getCareerSummary, loadCareer, ORIGINS, OriginId, Pace, Role, resolveCareerChoice, resolveEmergency, retireCareer, saveCareer, seasonLabel, startSeason } from '../../careerEngine';
import { platform } from '../../platform';
import { RoleIcon } from '../../shared/icons';

const ORIGIN_TRAITS: Record<OriginId, string[]> = {
  northeast: ['身体对抗强', '线下经验足', '心理稳健'],
  academy: ['圈内资源多', '试训机会早', '竞争压力大'],
  campus: ['退路有保障', '学习适应快', '道德底线高'],
  overseas: ['国际视野宽', '语言压力大', '名气起点高'],
  southwest: ['团队意识强', '地区赛底蕴深', '耐压能力好'],
  south: ['商业资源丰', '赛圈人脉广', '圈子生态复杂'],
  central: ['战术理解深', '理论基础实', '规则意识强'],
  northwest: ['起步较晚', '韧性出众', '逆境经验多'],
};

const roles: Array<{ id: Role; name: string; note: string }> = [
  { id: 'entry', name: '突破手', note: '第一个进点，吃最多火力。' },
  { id: 'awper', name: '狙击手', note: '用第一枪决定回合的边界。' },
  { id: 'igl', name: '指挥', note: '读局、调度，也承担失利。' },
  { id: 'support', name: '辅助', note: '把每个队友送进更好的位置。' },
];
const paceOptions: Array<{ id: Pace; name: string; freq: string; note: string }> = [
  { id: 'hardcore', name: '硬核', freq: '每个休赛期选择', note: '每赛季还可能穿插 0–2 次战队解散、强制转会或伤病等突发事件。' },
  { id: 'standard', name: '普通', freq: '每个休赛期选择', note: '没有突发事件，上、下半年赛季结束后各做一次正常选择。' },
  { id: 'fast', name: '快进', freq: '每年年末选择', note: '没有突发事件，上半年直接进入下半年，年末做一次年度大选择。' },
];
const paceLabels: Record<Pace, string> = { hardcore: '硬核 / 突发事件开启', standard: '普通 / 每休赛期', fast: '快进 / 每年年末' };
const siteLabels = { a:'主守 A 区', b:'主守 B 区', rotator:'游走补位' } as const;
const trackLabels = { ability: '能力', connections: '关系', integrity: '清白', fame: '名气' } as const;
type WizardStep = 0 | 1 | 2 | 3;
const wizardTitles: Record<WizardStep, string> = { 0: '选择难度', 1: '填写姓名', 2: '选择出身', 3: '选择定位' };
const wizardLabels: Record<WizardStep, string> = { 0: '难度', 1: '姓名', 2: '出身', 3: '定位' };

function WizardNav({ step, onBack }: { step: WizardStep; onBack: () => void }) {
  return (
    <div className="wizard-nav">
      <button className="wizard-back" onClick={onBack} aria-label="上一步"><ArrowLeft /></button>
      <div className="wizard-steps" role="list">
        {([0, 1, 2, 3] as WizardStep[]).map(s => (
          <div key={s} className={`wizard-step ${s < step ? 'done' : s === step ? 'active' : ''}`} role="listitem">
            <span>{s < step ? '✓' : s + 1}</span>{wizardLabels[s]}
          </div>
        ))}
      </div>
    </div>
  );
}

function Track({ name, value, tone }: { name: string; value: number; tone: string }) {
  return (
    <div className="career-track">
      <div><span>{name}</span><b>{value}</b></div>
      <i><em className={tone} style={{ width: `${value}%` }} /></i>
    </div>
  );
}

function Entry({ onStart }: { onStart: (state: CareerState) => void }) {
  const [step, setStep] = useState<WizardStep>(0);
  const [pace, setPace] = useState<Pace>('standard');
  const [name, setName] = useState('');
  const [originId, setOriginId] = useState<OriginId>('northeast');
  const [role, setRole] = useState<Role>('entry');
  const origin = ORIGINS.find(item => item.id === originId)!;
  const canAdvanceFromName = name.trim().length > 0;

  const goBack = () => {
    if (step === 0) platform.leaveToLobby();
    else setStep((step - 1) as WizardStep);
  };

  const goNext = () => setStep((step + 1) as WizardStep);

  const panels: Record<WizardStep, React.ReactNode> = {
    0: (
      <div className="wizard-panel" key="pace">
        <div className="panel-heading"><p className="eyebrow">STEP 01 / DIFFICULTY</p><h2>{wizardTitles[0]}</h2></div>
        <div className="pace-cards">
          {paceOptions.map(item => (
            <button key={item.id} className={`pace-card ${pace === item.id ? 'selected' : ''}`} onClick={() => setPace(item.id)}>
              <span className="pace-name">{item.name}</span>
              <span className="pace-freq">{item.freq}</span>
              <span className="pace-note">{item.note}</span>
            </button>
          ))}
        </div>
        <button className="career-primary" onClick={goNext}>下一步：填写姓名 <ChevronRight /></button>
      </div>
    ),
    1: (
      <div className="wizard-panel" key="name">
        <div className="panel-heading"><p className="eyebrow">STEP 02 / PLAYER NAME</p><h2>{wizardTitles[1]}</h2></div>
        <p className="panel-copy">填写你的选手名字，这将出现在所有赛季记录和最终履历中。</p>
        <label className="name-field">
          <span>选手名字</span>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={16}
            placeholder="例如：SkyFall"
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter' && canAdvanceFromName) goNext(); }}
          />
          <small>{name.trim().length} / 16</small>
        </label>
        <button className="career-primary" onClick={goNext} disabled={!canAdvanceFromName}>
          下一步：选择出身 <ChevronRight />
        </button>
      </div>
    ),
    2: (
      <div className="wizard-panel" key="origin">
        <div className="panel-heading"><p className="eyebrow">STEP 03 / ORIGIN</p><h2>{wizardTitles[2]}</h2><small>{origin.place}</small></div>
        <div className="origin-cards">
          {ORIGINS.map(item => (
            <button key={item.id} className={`origin-card ${originId === item.id ? 'selected' : ''}`} onClick={() => setOriginId(item.id)}>
              <b>{item.name}</b>
              <span>{item.description}</span>
              <div className="origin-traits">
                {ORIGIN_TRAITS[item.id]?.map(trait => (
                  <span key={trait} className="origin-trait-tag">{trait}</span>
                ))}
              </div>
            </button>
          ))}
        </div>
        <button className="career-primary" onClick={goNext}>下一步：选择定位 <ChevronRight /></button>
      </div>
    ),
    3: (
      <div className="wizard-panel" key="role">
        <div className="panel-heading"><p className="eyebrow">STEP 04 / ROLE</p><h2>{wizardTitles[3]}</h2></div>
        <div className="role-cards">
          {roles.map(item => (
            <button key={item.id} className={`role-card ${role === item.id ? 'selected' : ''}`} onClick={() => setRole(item.id)}>
              <RoleIcon role={item.id} />
              <b>{item.name}</b>
              <span>{item.note}</span>
            </button>
          ))}
        </div>
        <button className="career-primary" onClick={() => onStart(createCareer({ seed: '', name, pace, originId, role }))}>
          建立档案，开始生涯 <ChevronRight />
        </button>
      </div>
    ),
  };

  return (
    <main className="career-entry">
      <div className="career-entry-map" aria-hidden="true">
        <span>NORTH / B-17</span><b>16</b><i />
      </div>
      <section className="career-cover">
        <p className="eyebrow">CS CAREER / FICTIONAL PLAYER DOSSIER</p>
        <h1>CS 选手<br /><em>职业生涯</em></h1>
        <p className="entry-copy">从第一场试训打到最后一份合同。你的选择会留下成绩，也会留下记录。</p>
        <div className="entry-meta"><span>16 岁起步</span><span>单人存档</span><span>随时退役</span></div>
      </section>
      <section className="career-setup">
        <WizardNav step={step} onBack={goBack} />
        {panels[step]}
      </section>
    </main>
  );
}

function TrophyIcon({ trophy }: { trophy: CareerTrophy }) {
  const shape = trophy.honorClass === 'major' ? <><path d="M20 9h24v9c0 14-5 22-12 22s-12-8-12-22z"/><path d="M14 13H7v7c0 8 5 12 12 13M50 13h7v7c0 8-5 12-12 13" fill="none"/><path d="M28 40h8v8h11v7H17v-7h11z"/></> : trophy.honorClass === 'super-elite' ? <><path d="m32 6 8 16 18 3-13 13 3 18-16-8-16 8 3-18L6 25l18-3z"/><circle cx="32" cy="31" r="8" className="trophy-cut"/></> : trophy.honorClass === 'elite' ? <><path d="M12 10h40l-7 30H19z"/><path d="M26 40h12v9h10v6H16v-6h10z"/><path d="m25 25 5 5 10-11" fill="none" className="trophy-cut"/></> : trophy.honorClass === 'large' ? <><path d="M18 8h28v28c-3 7-8 10-14 10S21 43 18 36z"/><path d="M28 45h8v7h10v5H18v-5h10z"/></> : <><path d="M16 14 32 6l16 8v26l-16 12-16-12z"/><circle cx="32" cy="29" r="9" className="trophy-cut"/></>;
  return <svg className={`career-trophy-icon trophy-${trophy.honorClass}`} viewBox="0 0 64 64" aria-hidden="true">{shape}</svg>;
}

function Retired({ state, onRestart }: { state: CareerState; onRestart: () => void }) {
  const [selected, setSelected] = useState<CareerTrophy | null>(null);
  const summary = getCareerSummary(state);
  return <main className="retirement-page"><header className="retirement-header"><button onClick={() => platform.leaveToLobby()}><ArrowLeft/>返回大厅</button><div><p className="eyebrow">CAREER COMPLETE / FINAL DOSSIER</p><strong>{state.name}</strong></div><button onClick={onRestart}><RotateCcw/>新建档案</button></header><section className="retirement-hero"><div><span className="legacy-badge">{summary.legacy}</span><h1>{summary.title}</h1><p>{state.origin.name}出身 · {state.age - 16} 年职业旅程 · {summary.teams.join(' / ')}</p><blockquote className="career-quote">{summary.quote}</blockquote></div><div className="retirement-score"><b>{summary.trophies.length}</b><span>冠军奖杯</span></div></section><section className="retirement-metrics"><div><b>{summary.matches}</b><span>比赛场次</span></div><div><b>{summary.averageRating}</b><span>生涯 Rating</span></div><div><b>{summary.mvpCount}</b><span>MVP</span></div><div><b>{summary.evpCount}/{summary.vpCount}</b><span>EVP / VP</span></div><div><b>{summary.earnings} 万</b><span>生涯收入</span></div></section><section className="trophy-cabinet"><div className="retirement-section-head"><div><p className="eyebrow">TROPHY CABINET</p><h2>冠军陈列柜</h2></div><span>点击奖杯查看赛事详情</span></div>{summary.trophies.length ? <div className="trophy-shelf">{summary.trophies.map(trophy => <button key={trophy.id} onClick={() => setSelected(trophy)}><TrophyIcon trophy={trophy}/><b>{trophy.name}</b><span>{trophy.calendarYear}</span>{trophy.personalHonor && <em>{trophy.personalHonor}</em>}</button>)}</div> : <p className="empty-cabinet"><Trophy/>职业生涯没有获得赛事冠军</p>}</section><div className="retirement-columns"><section className="major-achievements"><p className="eyebrow">PLAYER ACHIEVEMENTS</p><h2>Major 成就</h2><div><span><b>{summary.major.appearances}</b>参赛</span><span><b>{summary.major.wins}</b>冠军</span><span><b>{summary.major.mvps}</b>Major MVP</span><span><b>{summary.major.bestPlacement}</b>最高名次</span></div></section><section className="top-history"><p className="eyebrow">HLTV TOP20 HISTORY</p><h2>年度排名</h2>{summary.top20.length ? <div>{summary.top20.map(item => <details key={item.calendarYear}><summary><b>#{item.playerRank}</b>（'{String(item.calendarYear).slice(-2)}）</summary>{item.review&&<p>{item.review}</p>}{item.generatedQuote&&<blockquote>{item.generatedQuote}</blockquote>}</details>)}</div> : <p>职业生涯没有进入年度 TOP20</p>}</section></div><div className="retirement-columns"><section className="income-breakdown"><p className="eyebrow">INCOME BREAKDOWN</p><h2>收入构成</h2><span>工资收入 <b>{summary.incomeBreakdown.salary} 万</b></span><span>税后赛事奖金 <b>{summary.incomeBreakdown.prize} 万</b></span><span>转会签字费 <b>{summary.incomeBreakdown.signing} 万</b></span></section><section className="career-route"><p className="eyebrow">CAREER ROUTE</p><h2>履历</h2>{summary.teams.map(team => <span key={team}>{team}</span>)}</section></div><div className="retirement-columns"><section className="key-events"><p className="eyebrow">KEY EVENTS</p><h2>关键节点</h2>{summary.keyEvents.length ? summary.keyEvents.map((event,index) => <span key={`${event}-${index}`}>{event}</span>) : <p>没有留下额外争议记录</p>}</section></div>{selected && <div className="trophy-detail-backdrop" onClick={() => setSelected(null)}><article className="trophy-detail" role="dialog" aria-modal="true" aria-labelledby="trophy-detail-title" onClick={event => event.stopPropagation()}><button aria-label="关闭奖杯详情" title="关闭奖杯详情" onClick={() => setSelected(null)}><X/></button><TrophyIcon trophy={selected}/><p className="eyebrow">{selected.honorClass.toUpperCase()} / {selected.tier}</p><h2 id="trophy-detail-title">{selected.name}</h2><dl><div><dt>年份</dt><dd>{selected.calendarYear}</dd></div><div><dt>赛制</dt><dd>{selected.format}</dd></div><div><dt>最终名次</dt><dd>冠军</dd></div><div><dt>个人 Rating</dt><dd>{selected.rating}</dd></div><div><dt>战队赛事奖金</dt><dd>{selected.teamPrize} 万</dd></div><div><dt>个人税后奖金</dt><dd>{selected.playerPrize.toFixed(1)} 万</dd></div><div><dt>个人荣誉</dt><dd>{selected.personalHonor ?? '无'}</dd></div></dl></article></div>}</main>;
}

function AwardsPanel({ state, onContinue }: { state: CareerState; onContinue: () => void }) {
  const award = state.top20History.at(-1)!;
  return <article className="top20-awards"><div className="top20-title"><p className="eyebrow">HLTV TOP20 / {award.calendarYear}</p><h3>年度选手榜单</h3><span>{award.eligible ? award.playerRank ? `${state.name} 获得年度第 ${award.playerRank} 名` : `${state.name} 未进入年度 TOP20` : '本年度未满足参评资格'}</span>{award.review&&<p className="top20-review">{award.review}</p>}{award.generatedQuote&&<blockquote>{award.generatedQuote}</blockquote>}</div><div className="top-five">{award.entries.slice(0,5).map(entry => <div className={entry.isPlayer ? 'is-player' : ''} key={entry.playerId}><strong>#{entry.rank}</strong><b>{entry.nick}</b><span>{entry.team}</span></div>)}</div><div className="top20-list">{award.entries.slice(5).map(entry => <div className={entry.isPlayer ? 'is-player' : ''} key={entry.playerId}><strong>#{entry.rank}</strong><b>{entry.nick}</b><span>{entry.team}</span></div>)}</div><button className="career-primary" onClick={onContinue}>继续进入休赛期<ChevronRight/></button></article>;
}

function Delta({ label, value, suffix = '' }: { label: string; value: number; suffix?: string }) {
  return <div className={value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral'}><span>{label}</span><b>{value > 0 ? '+' : ''}{value}{suffix}</b></div>;
}

function TournamentFlow({ state, setState }:{state:CareerState;setState:(next:CareerState)=>void}){
  const progress=state.seasonProgress!;
  const [revealing,setRevealing]=useState(progress.awaitingContinue);
  const timer=useRef<number|undefined>(undefined);
  const latest=progress.results.at(-1);
  useEffect(()=>{
    window.clearTimeout(timer.current);
    if(progress.awaitingContinue){setRevealing(true);timer.current=window.setTimeout(()=>setRevealing(false),1400);}else setRevealing(false);
    return()=>window.clearTimeout(timer.current);
  },[progress.awaitingContinue,progress.results.length]);
  const continueLabel=progress.nextIndex>=progress.tournamentIds.length?'生成赛季报告':'继续下一项赛事';
  return <article className="tournament-flow-panel">
    <div className="flow-heading"><div><p className="eyebrow">LIVE TOURNAMENT CALENDAR</p><h3>赛季进行中</h3><span>{progress.results.length} / {progress.tournamentIds.length} 项赛事已完成</span></div><strong>{Math.round(progress.results.length/Math.max(1,progress.tournamentIds.length)*100)}<small>%</small></strong></div>
    <div className="flow-progress"><i style={{width:`${progress.results.length/Math.max(1,progress.tournamentIds.length)*100}%`}}/></div>
    {state.lastEventResult&&<div className="event-result-receipt"><b>赛间记录</b><span>{state.lastEventResult}</span></div>}
    <div className="live-tournament-list" aria-live="polite">
      {progress.results.map((item,index)=><div key={item.id} className={`live-tournament-row ${index===progress.results.length-1&&progress.awaitingContinue?'is-revealing':''}`}><span className={`tier tier-${item.tier.toLowerCase()}`}>{item.tier}</span><div><b>{item.name}</b><small>{item.organizer} · {item.invitationReason}</small></div><strong>{item.placement}</strong><span>{item.wins}/{item.matches}</span><em>{item.rating}</em></div>)}
      {progress.nextIndex<progress.tournamentIds.length&&!progress.awaitingContinue&&<div className="next-tournament-slot"><span>{String(progress.nextIndex+1).padStart(2,'0')}</span><b>下一项赛事等待结算</b></div>}
    </div>
    {!progress.awaitingContinue?<button className="career-primary" onClick={()=>setState(advanceTournament(state))}><Play/>{progress.nextIndex>=progress.tournamentIds.length?'生成赛季报告':progress.results.length?'进行下一项赛事':'进行首项赛事'}</button>:revealing?<button className="flow-skip" onClick={()=>setRevealing(false)}><FastForward/>跳过动画</button>:<button className="career-primary" onClick={()=>setState(continueTournament(state))}>{continueLabel}<ChevronRight/></button>}
  </article>;
}

function ActiveCareer({ state, setState, onRestart }: { state: CareerState; setState: (next: CareerState) => void; onRestart: () => void }) {
  const [retirementOpen, setRetirementOpen] = useState(false);
  const role = roles.find(item => item.id === state.role)!;
  const report = state.history.at(-1);
  const decision = state.decision;
  const continueLabel = state.postReportEvent ? '处理赛后事件' : state.pace === 'fast' && state.half === 'first' ? '进入下半年赛季' : state.pace === 'fast' ? '进入年度选择' : '进入休赛期';

  return <main className="career-dossier">
    <header className="career-bar">
      <button aria-label="返回大厅" title="返回大厅" onClick={() => platform.leaveToLobby()}><ArrowLeft /></button>
      <div><p className="eyebrow">CS CAREER / {state.phase.toUpperCase()}</p><strong>{state.name} · {role.name}</strong></div>
      <span className="seed-tag">SEED / {state.seed.toString(16).toUpperCase()}</span>
      <button aria-label="重新开始生涯" title="重新开始生涯" onClick={onRestart}><RotateCcw /></button>
    </header>
    <div className="dossier-grid">
      <aside className="career-identity">
        <p className="eyebrow">PLAYER / 01</p><RoleIcon role={state.role} className="identity-role-icon" />
        <h1>{state.name}<br/><em>{role.name}</em></h1>
        <dl><div><dt>年龄</dt><dd>{state.age}</dd></div><div><dt>战队</dt><dd>{state.team}</dd></div><div><dt>定位</dt><dd>{siteLabels[state.defensiveSite]}</dd></div><div><dt>防区熟悉</dt><dd>{state.positionFamiliarity >= 75 ? '默契' : state.positionFamiliarity >= 55 ? '稳定' : '适应中'}</dd></div><div><dt>赛场</dt><dd>{state.tier}</dd></div><div><dt>模拟 VRS</dt><dd>全球 #{state.globalRank} / 区域 #{state.regionRank}</dd></div><div><dt>月薪</dt><dd>{state.salary} 万</dd></div><div><dt>战队状态</dt><dd>{state.teamForm} / 100</dd></div><div><dt>阵容稳定</dt><dd>{state.rosterStability} / 100</dd></div>{state.cncsRevival&&<div><dt>CNCS</dt><dd>复兴进行中</dd></div>}</dl>
        <div className="career-timeline"><span>16</span><i style={{ height: `${Math.min(100, ((state.age - 16) / 18) * 100)}%` }} /><span>{state.age > 30 ? `${state.age}↓` : '∞'}</span></div>
      </aside>
      <section className="career-main">
        <div className="season-head"><div><p className="eyebrow">SEASON {String(state.season).padStart(2, '0')} / AGE {state.age}</p><h2>{seasonLabel(state)}</h2></div><span className={`pace-badge ${state.pace}`}>{paceLabels[state.pace]}</span></div>

        {state.phase === 'ready' && <article className="season-ready-panel"><p className="eyebrow">SEASON READY</p><h3>名单已提交，赛程即将开始</h3><p>本赛季将逐项结算赛事。每项赛事结束后都可能出现团队、位置、训练、采访或健康事件，全部完成后生成赛季报告。</p><button className="career-primary" onClick={() => setState(startSeason(state))}><Play />开始赛季</button></article>}

        {state.phase === 'season' && state.seasonProgress && <TournamentFlow state={state} setState={setState}/>} 

        {state.phase === 'emergency' && decision && <article className="decision-panel emergency"><div className="emergency-badge"><Zap />{state.eventResume === 'continue-season' ? `${decision.category} · 赛事后事件` : `${emergencyProgress(state)} · 职业突发事件`}</div><div className="decision-number">{state.eventResume === 'continue-season' ? 'POST' : String(state.resolvedEmergencies.length + 1).padStart(2, '0')}</div><p className="eyebrow">{state.eventResume === 'continue-season' ? 'AFTER TOURNAMENT' : 'SEASON INTERRUPTED'}</p><h3>{decision.title}</h3><p>{decision.briefing}</p>{state.eventResume !== 'continue-season' && <div className="season-progress"><i style={{ width: emergencyProgress(state) === '赛季初' ? '25%' : emergencyProgress(state) === '赛季末' ? '82%' : '52%' }} /></div>}<div className="decision-options">{decision.options.map(option => <button key={option.id} onClick={() => setState(resolveEmergency(state, option.id))}><span>{option.label}</span><small>{option.detail}</small><ChevronRight /></button>)}</div></article>}

        {state.phase === 'report' && report && <><article className="season-report-panel"><div className="report-heading"><div><p className="eyebrow">SEASON REPORT / COMPLETE</p><h3>{report.placement}</h3><span>{report.note}</span></div><strong>{report.winRate}<small>% 胜率</small></strong></div><div className="ranking-summary"><span>模拟 VRS 全球排名 <b>#{report.globalRank}</b></span><span>区域排名 <b>#{report.regionRank}</b></span><span>积分变化 <b className={report.rankingDelta >= 0 ? 'up' : 'down'}>{report.rankingDelta >= 0 ? '+' : ''}{report.rankingDelta}</b></span></div><div className="report-core"><div><span>Rating</span><b>{report.rating}</b></div><div><span>K/D</span><b>{report.kd}</b></div><div><span>ADR</span><b>{report.adr}</b></div><div><span>场次</span><b>{report.matches}</b></div><div><span>个人奖金</span><b>{report.playerPrize.toFixed(1)} 万</b></div></div><div className="report-deltas"><Delta label="能力" value={report.deltas.ability}/><Delta label="关系" value={report.deltas.connections}/><Delta label="清白" value={report.deltas.integrity}/><Delta label="名气" value={report.deltas.fame}/><Delta label="健康" value={report.deltas.health}/><Delta label="收入" value={report.deltas.earnings} suffix=" 万"/></div><div className="report-actions"><button className="career-primary" onClick={() => setState(continueFromReport(state))}>{continueLabel}<ChevronRight /></button><button className="report-retire" onClick={() => setRetirementOpen(true)}>申请退役</button></div></article><section className="tournament-report"><div className="section-label"><p className="eyebrow">TOURNAMENT CALENDAR</p><span>{report.tournaments.length} 项赛事</span></div>{report.tournaments.map(item => <details className={`tournament-row ${item.upset ? `has-upset upset-${item.upset.kind}` : ''}`} key={item.id}><summary><div><span className={`tier tier-${item.tier.toLowerCase()}`}>{item.tier}</span><b>{item.name}</b><small>{item.invitationReason} · {item.organizer}</small></div><span>{item.upset ? item.upset.kind==='positive'?'爆冷获胜':'爆冷出局' : item.placement}</span><span>{item.wins}/{item.matches}</span><strong>{item.rating}</strong><em>队 {item.teamPrize} / 个人 {item.playerPrize.toFixed(1)} 万</em></summary>{item.upset&&<div className="upset-detail"><b>对手：{item.upset.opponent}（当时世界 #{item.upset.opponentRank}）</b><span>{item.upset.format} · 比分 {item.upset.score}</span><span>爆冷概率 {item.upset.probability}%</span><span>模拟 VRS {item.upset.rankingImpact>0?'+':''}{item.upset.rankingImpact}</span></div>}</details>)}</section></>}

        {state.phase === 'awards' && <AwardsPanel state={state} onContinue={() => setState(continueFromAwards(state))}/>} 

        {state.phase === 'choice' && decision && <article className="decision-panel career-choice"><div className="decision-number">{state.choiceKind === 'annual' ? 'YR' : 'OFF'}</div><p className="eyebrow">{state.choiceKind === 'annual' ? 'ANNUAL DECISION' : 'OFFSEASON DECISION'}</p><h3>{decision.title}</h3><p>{decision.briefing}</p><div className="decision-options">{decision.options.map(option => <button key={option.id} onClick={() => setState(resolveCareerChoice(state, option.id))}><span>{option.label}</span><small>{option.detail}</small><ChevronRight /></button>)}</div></article>}

        <section className="season-history"><div className="section-label"><p className="eyebrow">SEASON ARCHIVE</p><span>完整生涯 · {state.history.length} 份报告</span></div>{state.history.length ? [...state.history].reverse().map(item => <div className="season-row" key={item.season}><span>S{String(item.season).padStart(2, '0')}</span><b>第 {item.careerYear} 年{item.half === 'first' ? '上半年' : '下半年'}</b><small>{item.placement} · {item.winRate}% 胜率</small><strong>{item.rating}</strong></div>) : <p className="empty-history">点击“开始赛季”生成第一份报告。</p>}</section>
      </section>
      <aside className="career-status"><div className="status-head"><p className="eyebrow">FOUR TRACKS</p><ShieldCheck/><span>档案状态 / 有效</span></div><Track name={trackLabels.ability} value={state.ability} tone="ability"/><Track name={trackLabels.connections} value={state.connections} tone="connections"/><Track name={trackLabels.integrity} value={state.integrity} tone="integrity"/><Track name={trackLabels.fame} value={state.fame} tone="fame"/><section className="team-form-panel"><p className="eyebrow">TEAM FORM</p><div><span>战队状态</span><b>{state.teamForm}</b></div><i><em style={{width:`${state.teamForm}%`}}/></i></section><section className="contract-panel"><p className="eyebrow">CURRENT ROSTER / STATIC SNAPSHOT</p><h3>{state.team}</h3><div className="roster-list">{state.roster.map(player => <div className={player.isPlayer ? 'active-player' : ''} key={`${player.nick}-${player.role}`}><b>{player.nick}</b><span>{player.role}{player.isPlayer ? ' / 你' : ''}</span></div>)}</div><dl><div><dt>健康状态</dt><dd>{state.health} / 100</dd></div><div><dt>生涯收入</dt><dd>{Math.round(state.stats.earnings)} 万</dd></div><div><dt>工资 / 奖金 / 签字费</dt><dd>{Math.round(state.stats.salaryIncome)} / {Math.round(state.stats.prizeIncome)} / {Math.round(state.stats.signingIncome)}</dd></div><div><dt>最近转会费</dt><dd>{state.lastTransferFee ? `${state.lastTransferFee} 万（俱乐部）` : '无'}</dd></div></dl></section><section className="honor-cabinet"><p className="eyebrow">HONORS</p>{state.honors.length ? state.honors.slice(-5).reverse().map(honor => <span key={honor.id}><b>{honor.kind}</b>{honor.tournamentName}</span>) : <small>荣誉柜还是空的</small>}</section><section className="field-log"><p className="eyebrow">FIELD LOG</p>{state.log.slice(0,4).map((item,index) => <span key={`${item}-${index}`}>{item}</span>)}</section></aside>
    </div>
    {retirementOpen && <div className="retirement-backdrop" role="presentation" onClick={() => setRetirementOpen(false)}><section className="retirement-dialog" role="dialog" aria-modal="true" aria-labelledby="retirement-title" onClick={event => event.stopPropagation()}><p className="eyebrow">RETIREMENT DECISION</p><h2 id="retirement-title">结束这段职业生涯？</h2><p>退役后将立即生成最终履历。取消后仍会停留在本赛季报告。</p><div><button onClick={() => setRetirementOpen(false)}>返回赛季报告</button><button className="confirm-retirement" onClick={() => setState(retireCareer(state))}>确认退役</button></div></section></div>}
  </main>;
}

export default function CareerApp() {
  const [career, setCareer] = useState<CareerState | null>(() => loadCareer());
  useEffect(() => { if (career) saveCareer(career); }, [career]);
  const restart = () => { clearCareer(); setCareer(null); };
  if (!career) return <Entry onStart={setCareer} />;
  if (career.status === 'retired') return <Retired state={career} onRestart={restart} />;
  return <ActiveCareer state={career} setState={setCareer} onRestart={restart} />;
}
