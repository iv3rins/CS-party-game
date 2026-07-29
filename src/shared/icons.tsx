import type { ReactNode } from 'react';
import { ItemKind, WeaponKind } from '../games/cs-push/engine';

type SvgProps = { className?: string; title?: string };

const gunStroke = { stroke: '#202522', strokeWidth: 1.6, strokeLinejoin: 'round' as const };
const paths: Record<WeaponKind, ReactNode> = {
  deagle: <g {...gunStroke}><rect x="30" y="15" width="70" height="15" rx="2" fill="#bdc3c7"/><rect x="95" y="15" width="10" height="15" rx="1" fill="#95a5a6"/><path d="M40 30h15L45 55H25z" fill="#2c3e50"/><path d="M55 30h15v12H60" fill="none" stroke="#7f8c8d" strokeWidth="3"/><rect x="53" y="30" width="4" height="8" fill="#2c3e50"/><path d="M35 18h43" stroke="#eef2f2" strokeWidth="2" opacity=".55"/><path d="M100 19h9" stroke="#596264"/></g>,
  galil: <g {...gunStroke}><path d="M40 25 15 28v12l20-8 5 0z" fill="#7f8c8d"/><rect x="40" y="22" width="60" height="12" fill="#34495e"/><rect x="100" y="24" width="25" height="8" fill="#2c3e50"/><rect x="125" y="25" width="15" height="4" fill="#7f8c8d"/><path d="M70 34h15l5 18H75z" fill="#2c3e50"/><path d="M45 34h10L50 48H40z" fill="#34495e"/><path d="M44 25h41" stroke="#87969d"/><path d="M109 27h28" stroke="#d9e0df" opacity=".5"/></g>,
  m4a1: <g {...gunStroke}><rect x="10" y="22" width="25" height="14" rx="2" fill="#2c3e50"/><rect x="38" y="20" width="45" height="13" fill="#34495e"/><path d="M45 20 50 12h15l5 8z" fill="#2c3e50"/><rect x="83" y="21" width="25" height="11" rx="2" fill="#2c3e50"/><rect x="108" y="22" width="35" height="9" rx="3" fill="#7f8c8d"/><path d="M55 33h10l5 17H58z" fill="#2c3e50"/><path d="M40 33h10L45 46H35z" fill="#34495e"/><path d="M113 24h25" stroke="#dbe2e2" opacity=".6"/></g>,
  ak47: <g {...gunStroke}><path d="M40 22 15 26v14l15-5 10-3z" fill="#d35400"/><rect x="40" y="20" width="45" height="12" fill="#2c3e50"/><rect x="85" y="21" width="22" height="10" fill="#d35400"/><path d="M107 23h30v4h-30v3h25" fill="#2c3e50"/><path d="M60 32q5 13-5 23h15q10-10 5-23z" fill="#2c3e50"/><path d="M45 32h10L50 46H40z" fill="#d35400"/><path d="M45 23h32" stroke="#68747a" opacity=".6"/></g>,
  awp: <g {...gunStroke}><path d="M90 28h48v4H90zM95 32h25v3H95z" fill="#2c3e50"/><rect x="138" y="25" width="6" height="10" rx="1" fill="#1a252f"/><path d="M10 25h32l3 3h50v6H60l-5 11H42l6-11H20l-5 8H5l5-8z" fill="#3b533f"/><path d="M5 38 10 25H5l-3 11zM15 23h22v3H15z" fill="#1a252f"/><path d="M25 29h13l-4 6H22z" fill="#1a252f"/><rect x="62" y="34" width="12" height="12" fill="#2c3e50"/><path d="M62 46h12l-2 2H64z" fill="#1a252f"/><path d="M42 34v6h6M45 34v4h2" fill="none" stroke="#1a252f" strokeWidth="2"/><rect x="44" y="24" width="10" height="4" fill="#7f8c8d"/><circle cx="54" cy="26" r="3" fill="#1a252f"/><path d="M52 22v6M74 22v6"/><rect x="45" y="16" width="38" height="6" fill="#2c3e50"/><path d="M35 13 45 16v6l-10 3zM83 16l10-4v14l-10-4z" fill="#1a252f"/><path d="M18 28h22" stroke="#a1edaa" opacity=".65"/></g>,
};

export function WeaponIcon({ kind, className = '', title }: SvgProps & { kind: WeaponKind }) {
  return <svg className={`svg-icon weapon-svg ${className}`} viewBox="0 0 150 60" preserveAspectRatio="xMidYMid meet" shapeRendering="geometricPrecision" role="img" aria-label={title ?? kind}><g>{paths[kind]}</g></svg>;
}

const roleStroke = { stroke: '#111', strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
export function RoleIcon({ role, className = '' }: { role: 'entry' | 'awper' | 'igl' | 'support'; className?: string }) {
  const art: Record<typeof role, ReactNode> = {
    entry: <g {...roleStroke}><path d="M16 18h32l12 14H28z" fill="#e86f2c"/><path d="M40 32v16l-8 4-8-4V32"/></g>,
    awper: <g {...roleStroke}><circle cx="32" cy="32" r="22" fill="none"/><circle cx="32" cy="32" r="10"/><line x1="32" y1="4" x2="32" y2="12"/><line x1="32" y1="52" x2="32" y2="60"/><line x1="4" y1="32" x2="12" y2="32"/><line x1="52" y1="32" x2="60" y2="32"/></g>,
    igl: <g {...roleStroke}><rect x="10" y="16" width="44" height="32" rx="4" fill="#4eb5c6"/><circle cx="22" cy="28" r="4"/><circle cx="32" cy="28" r="4"/><circle cx="42" cy="28" r="4"/><path d="M18 40h32"/><path d="M20 44h28"/></g>,
    support: <g {...roleStroke}><path d="M32 6 54 18v20c0 16-22 24-22 24S10 54 10 38V18z" fill="#b6d943"/><path d="M24 34l8 8 14-16" fill="none" stroke="#111" strokeWidth="3"/></g>,
  };
  return <svg className={`svg-icon role-svg ${className}`} viewBox="0 0 64 64" shapeRendering="geometricPrecision" role="img" aria-label={role}><g>{art[role]}</g></svg>;
}

export function ItemIcon({ kind, className = '', title }: SvgProps & { kind: ItemKind }) {
  const art: Record<ItemKind, ReactNode> = {
    flash: <><path d="M31 9h19v11H31zM25 19h31l5 11v24H20V30z"/><path d="M27 27h7v20h-7zm13 0h7v20h-7zm13 4h7v15h-7z"/></>,
    smoke: <><path d="M29 8h21v10H29zM22 17h35l5 12v26H17V29z"/><path d="M25 29h29v8H25zm0 13h29v7H25z"/></>,
    c4: <><rect x="13" y="15" width="50" height="39" rx="2"/><rect x="20" y="22" width="20" height="12" className="cut"/><path d="M45 22h11v5H45zm0 10h11v5H45zm0 10h11v5H45zM21 39h18v9H21z"/></>,
    defuse: <><path d="M37 35 18 14l5-5 19 21zM39 35 58 14l-5-5-19 21z" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round"/><path d="M20 12 12 6M56 12l8-6" stroke="#f4c426" strokeWidth="8" strokeLinecap="round"/><path d="M36 33 29 54M40 33l7 21" stroke="#2c3e50" strokeWidth="4"/></>,
  };
  return <svg className={`svg-icon item-svg ${className}`} viewBox="0 0 76 64" role="img" aria-label={title ?? kind}><g>{art[kind]}</g></svg>;
}

export function UiIcon({ name, className = '' }: SvgProps & { name: 'back'|'timer'|'base'|'intel'|'trophy'|'sound'|'restart'|'crosshair' }) {
  const art = {
    back: <path d="M27 11 10 28l17 17 5-5-9-9h27v-7H23l9-8z"/>,
    timer: <><circle cx="32" cy="34" r="20" fill="none" stroke="currentColor" strokeWidth="5"/><path d="M28 5h8v8h-8zm4 27 10-8 3 4-13 11z"/></>,
    base: <><path d="M8 51h48V29L32 12 8 29z"/><path className="cut" d="M25 35h14v16H25zM16 30h8v8h-8zm24 0h8v8h-8z"/></>,
    intel: <><path d="M32 6 55 15v17c0 14-9 23-23 27C18 55 9 46 9 32V15z"/><path className="cut" d="m22 31 7 7 14-16 5 5-19 21-12-12z"/></>,
    trophy: <><path d="M18 8h28v15c0 12-6 19-14 19s-14-7-14-19z"/><path d="M9 12h9v7c0 8-4 13-11 14V26c3-1 5-4 5-8H9zm37 0h9v6c0 4 2 7 5 8v7c-9-2-14-7-14-14zM28 41h8v9h12v7H16v-7h12z"/></>,
    sound: <><path d="M8 25h12L34 13v38L20 39H8z"/><path d="M41 23c5 5 5 13 0 18l5 5c9-9 9-21 0-28zm8-9c13 13 13 27 0 40l5 5c17-17 17-34 0-50z"/></>,
    restart: <><path d="M15 18A24 24 0 1 1 9 40l7-2a17 17 0 1 0 5-15l8 8H8V10z"/></>,
    crosshair: <><circle cx="32" cy="32" r="20" fill="none" stroke="currentColor" strokeWidth="4"/><circle cx="32" cy="32" r="5"/><path d="M29 2h6v16h-6zm0 44h6v16h-6zM2 29h16v6H2zm44 0h16v6H46z"/></>,
  };
  return <svg className={`svg-icon ui-svg ${className}`} viewBox="0 0 64 64" aria-hidden="true"><g>{art[name]}</g></svg>;
}

const hash = (value: string) => [...value].reduce((sum, char) => Math.imul(sum ^ char.charCodeAt(0), 16777619), 2166136261) >>> 0;
export function OperatorAvatar({ accountId, className = '' }: { accountId: string; className?: string }) {
  const seed = hash(accountId || 'guest');
  const visor = seed % 3;
  const mask = (seed >>> 3) % 3;
  const accent = ['#ffca0a', '#3b75e7', '#d85438'][seed % 3];
  return <svg className={`operator-avatar ${className}`} viewBox="0 0 64 64" role="img" aria-label="玩家干员头像">
    <rect width="64" height="64" fill="#242720"/><path d="M10 64c2-16 9-23 22-23s20 7 22 23" fill="#4b5047"/>
    <path d="M16 29C16 13 23 6 32 6s16 7 16 23v14c-4 8-10 12-16 12S20 51 16 43z" fill="#b5aa96"/>
    <path d="M12 27C13 8 21 2 32 2s19 6 20 25l-8-5H20z" fill="#171914"/><path d="M9 25h46v8H9z" fill={accent}/>
    {visor === 0 ? <path d="M17 28h30v11H17z" fill="#111"/> : visor === 1 ? <><rect x="17" y="28" width="13" height="10" fill="#111"/><rect x="34" y="28" width="13" height="10" fill="#111"/><path d="M30 31h4v4h-4z"/></> : <path d="m17 30 30-3v11H17z" fill="#111"/>}
    {mask === 0 ? <path d="M19 39h26v14c-8 8-18 8-26 0z" fill="#272b25"/> : mask === 1 ? <path d="m18 40 14 8 14-8v14c-9 7-19 7-28 0z" fill="#272b25"/> : <path d="M20 43h24v10H20z" fill="#272b25"/>}
    <path d="M27 48h10v3H27z" fill={accent}/>
  </svg>;
}
