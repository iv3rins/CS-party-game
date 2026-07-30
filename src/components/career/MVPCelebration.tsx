/**
 * MVP/冠军庆祝弹窗组件
 */

import { Trophy, Award, X, ChevronRight } from 'lucide-react';
import type { TournamentTier, HonorClass, TournamentResult, HonorAward } from '../../careerEngine';

export interface MVPCelebrationProps {
  tournament: TournamentResult;
  honor: HonorAward;
  onContinue: () => void;
}

export function MVPCelebration({ tournament, honor, onContinue }: MVPCelebrationProps) {
  const isMajor = tournament.tier === 'Major';
  const isChampion = tournament.placement === '冠军';
  const honorType = honor.kind === 'MVP' ? '最有价值球员' : honor.kind === 'EVP' ? '杰出表现球员' : '有价值球员';
  
  return (
    <div className="mvp-celebration-overlay">
      <div className={`mvp-celebration-modal ${isMajor ? 'major-celebration' : ''}`}>
        <button className="mvp-close" onClick={onContinue} aria-label="关闭">
          <X />
        </button>
        
        <div className="mvp-header">
          {isMajor && <div className="major-badge">
            <Trophy className="major-icon" />
            <span>MAJOR</span>
          </div>}
          <h1 className="mvp-title">{isChampion ? '冠军' : tournament.placement}</h1>
          <h2 className="mvp-tournament">{tournament.name}</h2>
          <p className="mvp-organizer">{tournament.city} · {tournament.organizer}</p>
        </div>

        <div className="mvp-award-badge">
          <Award className="mvp-award-icon" />
          <h3>{honor.kind}</h3>
          <p>{honorType}</p>
        </div>

        <div className="mvp-stats-grid">
          <div className="mvp-stat">
            <span className="mvp-stat-label">个人 Rating</span>
            <b className="mvp-stat-value">{tournament.rating}</b>
          </div>
          <div className="mvp-stat">
            <span className="mvp-stat-label">K/D 比</span>
            <b className="mvp-stat-value">{((tournament.rating - 0.5) * 1.5 + 1).toFixed(2)}</b>
          </div>
          <div className="mvp-stat">
            <span className="mvp-stat-label">场均伤害</span>
            <b className="mvp-stat-value">{Math.round(70 + (tournament.rating - 1) * 50)}</b>
          </div>
          <div className="mvp-stat">
            <span className="mvp-stat-label">比赛场次</span>
            <b className="mvp-stat-value">{tournament.matches}</b>
          </div>
          <div className="mvp-stat">
            <span className="mvp-stat-label">胜率</span>
            <b className="mvp-stat-value">{Math.round((tournament.wins / tournament.matches) * 100)}%</b>
          </div>
          <div className="mvp-stat">
            <span className="mvp-stat-label">个人奖金</span>
            <b className="mvp-stat-value">{Math.round(tournament.playerPrize)} 万</b>
          </div>
        </div>

        {tournament.upset && (
          <div className="mvp-upset-highlight">
            <strong>决赛对手</strong>
            <p>{tournament.upset.opponent} <small>（世界 #{tournament.upset.opponentRank}）</small></p>
            <span className="mvp-upset-score">{tournament.upset.format} · {tournament.upset.score}</span>
          </div>
        )}

        <button className="mvp-continue" onClick={onContinue}>
          继续职业生涯 <ChevronRight />
        </button>
      </div>
    </div>
  );
}
