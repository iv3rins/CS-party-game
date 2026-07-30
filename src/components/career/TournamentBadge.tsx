/**
 * 赛事徽章组件 - 根据赛事等级显示不同徽章和配色
 */

import { Trophy, Star, Award } from 'lucide-react';
import type { TournamentTier, HonorClass } from '../../careerEngine';

export interface TournamentBadgeProps {
  tier: TournamentTier;
  honorClass?: HonorClass;
  name: string;
  size?: 'small' | 'medium' | 'large';
}

export function TournamentBadge({ tier, honorClass, name, size = 'medium' }: TournamentBadgeProps) {
  const isMajor = tier === 'Major';
  const isSuperElite = honorClass === 'super-elite' || honorClass === 'major';
  const isElite = honorClass === 'elite';
  
  let badgeClass = 'tournament-badge';
  let icon = <Star className="badge-icon" />;
  let label: string = tier;
  
  if (isMajor) {
    badgeClass += ' badge-major';
    icon = <Trophy className="badge-icon" />;
    label = 'MAJOR';
  } else if (isSuperElite) {
    badgeClass += ' badge-super-elite';
    icon = <Award className="badge-icon" />;
    label = 'S-TIER';
  } else if (isElite) {
    badgeClass += ' badge-elite';
    icon = <Award className="badge-icon" />;
    label = 'ELITE';
  } else if (tier === 'T1') {
    badgeClass += ' badge-t1';
  } else if (tier === 'T2') {
    badgeClass += ' badge-t2';
  } else {
    badgeClass += ' badge-unranked';
  }
  
  badgeClass += ` badge-${size}`;
  
  return (
    <div className={badgeClass} title={name}>
      {icon}
      <span className="badge-label">{label}</span>
    </div>
  );
}

/**
 * 赛事行内联徽章 - 用于赛事列表中的紧凑显示
 */
export function InlineTournamentBadge({ tier, honorClass }: Pick<TournamentBadgeProps, 'tier' | 'honorClass'>) {
  const isMajor = tier === 'Major';
  const isSuperElite = honorClass === 'super-elite' || honorClass === 'major';
  const isElite = honorClass === 'elite';
  
  let className = 'inline-badge';
  let label: string = tier;
  
  if (isMajor) {
    className += ' inline-major';
    label = 'Major';
  } else if (isSuperElite) {
    className += ' inline-super-elite';
    label = 'S-Tier';
  } else if (isElite) {
    className += ' inline-elite';
    label = 'Elite';
  } else if (tier === 'T1') {
    className += ' inline-t1';
    label = 'T1';
  } else if (tier === 'T2') {
    className += ' inline-t2';
    label = 'T2';
  } else {
    className += ' inline-unranked';
    label = 'Unranked';
  }
  
  return <span className={className}>{label}</span>;
}
