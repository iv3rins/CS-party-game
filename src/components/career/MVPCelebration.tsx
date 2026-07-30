import { useEffect, useRef } from 'react';
import { Award, ChevronRight, X } from 'lucide-react';
import type { TournamentResult, HonorAward } from '../../careerEngine';
import { TournamentBadge } from './TournamentBadge';

export interface MVPCelebrationProps {
  tournament: TournamentResult;
  honor: HonorAward;
  onContinue: () => void;
}

export function MVPCelebration({ tournament, honor, onContinue }: MVPCelebrationProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const continueRef = useRef<HTMLButtonElement>(null);
  const isMajor = tournament.tier === 'Major';
  const honorType = honor.kind === 'MVP' ? '最有价值球员' : honor.kind === 'EVP' ? '杰出表现球员' : '有价值球员';
  const winRate = Math.round(tournament.wins / Math.max(1, tournament.matches) * 100);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    const handleKeyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onContinue();
      if (event.key === 'Tab') {
        if (event.shiftKey && document.activeElement === closeRef.current) { event.preventDefault(); continueRef.current?.focus(); }
        else if (!event.shiftKey && document.activeElement === continueRef.current) { event.preventDefault(); closeRef.current?.focus(); }
      }
    };
    window.addEventListener('keydown', handleKeyboard);
    return () => { window.removeEventListener('keydown', handleKeyboard); previousFocus?.focus(); };
  }, [onContinue]);

  return (
    <div className="mvp-celebration-overlay" onMouseDown={event => { if (event.target === event.currentTarget) onContinue(); }}>
      <article className={`mvp-celebration-modal ${isMajor ? 'major-celebration' : ''}`} role="dialog" aria-modal="true" aria-labelledby="mvp-celebration-title">
        <button ref={closeRef} className="mvp-close" onClick={onContinue} aria-label="关闭荣誉结算" title="关闭荣誉结算"><X /></button>
        <header className="mvp-header">
          <TournamentBadge tier={tournament.tier} honorClass={tournament.honorClass} name={tournament.name} size="small" />
          <p className="eyebrow">赛事结算 / 个人荣誉</p>
          <h1 id="mvp-celebration-title" className="mvp-title">{tournament.placement}</h1>
          <h2 className="mvp-tournament">{tournament.name}</h2>
          <p className="mvp-organizer">{[tournament.city, tournament.organizer].filter(Boolean).join(' · ')}</p>
        </header>

        <section className="mvp-award-band" aria-label="个人荣誉">
          <Award className="mvp-award-icon" />
          <div><h3>{honor.kind}</h3><p>{honorType}</p></div>
        </section>

        <dl className="mvp-stats-grid">
          <div><dt>个人 Rating</dt><dd>{tournament.rating}</dd></div>
          <div><dt>K/D 比</dt><dd>{((tournament.rating - 0.5) * 1.5 + 1).toFixed(2)}</dd></div>
          <div><dt>场均伤害</dt><dd>{Math.round(70 + (tournament.rating - 1) * 50)}</dd></div>
          <div><dt>比赛场次</dt><dd>{tournament.matches}</dd></div>
          <div><dt>胜率</dt><dd>{winRate}%</dd></div>
          <div><dt>个人奖金</dt><dd>{Math.round(tournament.playerPrize)} 万</dd></div>
        </dl>

        {tournament.upset && <section className="mvp-upset-highlight"><strong>关键对手</strong><p>{tournament.upset.opponent} <small>世界 #{tournament.upset.opponentRank}</small></p><span>{tournament.upset.format} · {tournament.upset.score}</span></section>}
        <button ref={continueRef} className="mvp-continue" onClick={onContinue}>继续职业生涯 <ChevronRight /></button>
      </article>
    </div>
  );
}
