import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, LogIn, Settings, Shield, Trophy, UserRound, Users, Volume2, VolumeX, Wifi, X } from 'lucide-react';
import { Account, GameManifest, GameRoom, getRankTier, PlatformPreferences, QueueTicket, Rating, gameManifest, platform } from '../platform';
import { OperatorAvatar } from '../shared/icons';
import { resetTutorial } from '../games/cs-push/tutorial';

type Modal = 'account' | 'create' | 'join' | 'room' | 'rules' | null;
type SmokeParticle = { x: number; y: number; homeX: number; homeY: number; vx: number; vy: number; radius: number; alpha: number; baseAlpha: number; phase: number };

const isMultiplayer = (game: GameManifest) => game.maxPlayers > 1;
const rankName = (rating: Rating | null) => !rating ? '同步中' : getRankTier(rating.elo).name;

function SmokeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let particles: SmokeParticle[] = [];
    let clearings: { x: number; y: number; strength: number }[] = [];
    let frame = 0;
    let width = 0;
    let height = 0;
    let lastTime = performance.now();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      context.setTransform(scale, 0, 0, scale, 0, 0);
      const count = Math.max(32, Math.round(width * height / 12500));
      particles = Array.from({ length: count }, (_, index) => {
        const homeX = ((index * 73) % 101) / 100 * width;
        const homeY = ((index * 47 + 19) % 103) / 102 * height;
        const baseAlpha = .11 + (index % 5) * .025;
        return { x: homeX, y: homeY, homeX, homeY, vx: 0, vy: 0, radius: 68 + index % 7 * 14, alpha: baseAlpha, baseAlpha, phase: index * .81 };
      });
    };

    const disturb = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      clearings.push({ x, y, strength: 1 });
      if (clearings.length > 28) clearings.shift();
      particles.forEach(particle => {
        const dx = particle.x - x;
        const dy = particle.y - y;
        const distance = Math.hypot(dx, dy);
        if (distance >= 120) return;
        const force = (1 - distance / 120) * 2.2;
        const safeDistance = Math.max(distance, 1);
        particle.vx += dx / safeDistance * force;
        particle.vy += dy / safeDistance * force;
        particle.alpha *= .18;
      });
    };

    const onPointerMove = (event: PointerEvent) => disturb(event.clientX, event.clientY);
    const draw = (time: number) => {
      const dt = Math.min(2, (time - lastTime) / 16.67);
      lastTime = time;
      context.clearRect(0, 0, width, height);
      context.save();
      context.globalCompositeOperation = 'source-over';
      particles.forEach(particle => {
        const driftX = reducedMotion ? 0 : Math.sin(time / 3200 + particle.phase) * .04;
        const driftY = reducedMotion ? 0 : Math.cos(time / 4100 + particle.phase) * .025;
        particle.vx += (particle.homeX - particle.x) * .0018 * dt + driftX * dt;
        particle.vy += (particle.homeY - particle.y) * .0018 * dt + driftY * dt;
        particle.vx *= .94;
        particle.vy *= .94;
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.alpha += (particle.baseAlpha - particle.alpha) * .012 * dt;
        const gradient = context.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.radius);
        gradient.addColorStop(0, `rgba(70, 78, 69, ${particle.alpha})`);
        gradient.addColorStop(.55, `rgba(104, 112, 101, ${particle.alpha * .72})`);
        gradient.addColorStop(1, 'rgba(125, 132, 120, 0)');
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fill();
      });
      context.globalCompositeOperation = 'destination-out';
      clearings.forEach(clearing => {
        const radius = 125 * clearing.strength;
        const gradient = context.createRadialGradient(clearing.x, clearing.y, 0, clearing.x, clearing.y, radius);
        gradient.addColorStop(0, `rgba(0, 0, 0, ${Math.min(1, clearing.strength * 1.4)})`);
        gradient.addColorStop(.7, `rgba(0, 0, 0, ${clearing.strength * .55})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(clearing.x, clearing.y, radius, 0, Math.PI * 2);
        context.fill();
        clearing.strength -= .006 * dt;
      });
      clearings = clearings.filter(clearing => clearing.strength > .02);
      context.restore();
      frame = requestAnimationFrame(draw);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    canvas.addEventListener('pointermove', onPointerMove);
    frame = requestAnimationFrame(draw);
    return () => { observer.disconnect(); canvas.removeEventListener('pointermove', onPointerMove); cancelAnimationFrame(frame); };
  }, []);

  return <canvas ref={canvasRef} className="lobby-smoke" />;
}

function GameStage({ game }: { game: GameManifest }) {
  const multiplayer = isMultiplayer(game);
  const displayName = game.name.replace(/^CS\s*/, '');
  return <section className={`lobby-game-stage ${multiplayer ? 'push-stage' : 'career-stage'}`}>
    <div className="stage-ring outer" /><div className="stage-ring middle" /><div className="stage-ring inner" />
    <div className="stage-orbit"><i /><i /><i /><i /></div>
    {multiplayer ? <div className="push-scene">
      <span className="stage-role role-ct"><Shield />CT</span><span className="stage-role role-t"><Trophy />T</span>
      {[0, 1, 2, 3, 4].map(lane => <div className="stage-lane" key={lane}><i className="ct-unit" /><i className="t-unit" /></div>)}
    </div> : <div className="career-scene">
      <span className="career-node origin">16<small>起点</small></span><span className="career-node contract">20<small>合同</small></span><span className="career-node peak">25<small>巅峰</small></span><span className="career-node legacy">31<small>履历</small></span>
    </div>}
    <div className="stage-title" key={game.gameId}><small>{multiplayer ? 'TACTICAL LANE BATTLE' : 'PLAYER CAREER DOSSIER'}</small><h1><b>CS</b><span>{displayName}</span></h1><em>{multiplayer ? '部署 · 推进 · 突破' : '选择 · 赛季 · 生涯'}</em></div>
    <div className="smoke-mask"><SmokeCanvas /></div>
  </section>;
}

function Lobby() {
  const [account, setAccount] = useState<Account | null>(null);
  const [games, setGames] = useState<GameManifest[]>([]);
  const [preferences, setPreferences] = useState<PlatformPreferences>({ soundEnabled: true, masterVolume: .55, language: 'zh-CN' });
  const [selectedGameId, setSelectedGameId] = useState(gameManifest.gameId);
  const [rating, setRating] = useState<Rating | null>(null);
  const [queue, setQueue] = useState<QueueTicket | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [roomName, setRoomName] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [allowSpectators, setAllowSpectators] = useState(true);
  const [inviteCode, setInviteCode] = useState('');
  const [bindName, setBindName] = useState('');
  const [error, setError] = useState('');

  const selectedGame = useMemo(() => games.find(game => game.gameId === selectedGameId) ?? gameManifest, [games, selectedGameId]);
  const multiplayer = isMultiplayer(selectedGame);
  const availableGames = games.filter(game => game.availability === 'available');
  const comingSoonGames = games.filter(game => game.availability !== 'available');
  const signedIn = account ? !account.isGuest : false;

  useEffect(() => {
    Promise.all([platform.getAccount(), platform.listGames(), platform.getPreferences()]).then(async ([nextAccount, nextGames, nextPreferences]) => {
      setAccount(nextAccount); setGames(nextGames); setPreferences(nextPreferences);
      const initial = nextGames.find(game => game.gameId === selectedGameId) ?? nextGames[0];
      if (initial) { setSelectedGameId(initial.gameId); if (initial.ranked && !nextAccount.isGuest) setRating(await platform.getRating(initial.gameId, initial.seasonId)); }
    }).catch(() => setError('大厅数据载入失败，请刷新后重试。'));
  }, []);

  useEffect(() => {
    if (!queue || queue.status !== 'searching') return;
    const timer = window.setInterval(async () => {
      try { setQueue(await platform.getQueueStatus(queue.queueId)); }
      catch (caught) { setError(caught instanceof Error ? caught.message : '匹配状态读取失败'); }
    }, 500);
    return () => window.clearInterval(timer);
  }, [queue]);

  const selectGame = async (game: GameManifest) => {
    setSelectedGameId(game.gameId); setQueue(null); setRoom(null); setError('');
    setRating(game.ranked && signedIn ? await platform.getRating(game.gameId, game.seasonId) : null);
  };
  const enterGame = async () => { 
    try { 
      // 如果是在线匹配成功，跳转到在线对局
      if (queue && queue.status === 'matched' && (queue as any).onlineMatchId) {
        const matchId = (queue as any).onlineMatchId;
        const side = (queue as any).mySide || 'ct';
        window.dispatchEvent(new CustomEvent('cspa:navigate', { detail: { path: `/games/${selectedGame.gameId}?matchId=${matchId}&side=${side}` } }));
        setQueue(null);
        return;
      }
      // 否则正常启动游戏（本地模式）
      await platform.launchGame(selectedGame.gameId); 
    } catch (caught) { 
      setError(caught instanceof Error ? caught.message : '无法进入游戏'); 
    } 
  };
  const startQueue = async () => { try { setQueue(await platform.joinQueue({ gameId: selectedGame.gameId, seasonId: selectedGame.seasonId })); } catch (caught) { setError(caught instanceof Error ? caught.message : '无法开始匹配'); } };
  const createRoom = async () => { try { const next = await platform.createRoom({ gameId: selectedGame.gameId, seasonId: selectedGame.seasonId, config: { name: roomName, visibility, roundSeconds: 180, allowSpectators } }); setRoom(next); setModal('room'); } catch (caught) { setError(caught instanceof Error ? caught.message : '创建房间失败'); } };
  const joinRoom = async () => { try { const next = await platform.joinRoom({ inviteCode: inviteCode.trim() }); setRoom(next); setModal('room'); setInviteCode(''); } catch (caught) { setError(caught instanceof Error ? caught.message : '加入房间失败'); } };
  const leaveRoom = async () => { if (!room) return; await platform.leaveRoom(room.roomId); setRoom(null); setModal(null); };
  const bindAccount = async () => {
    if (!bindName.trim()) { setError('请填写账号名称。'); return; }
    try { await platform.bindAccount({ provider: 'placeholder', credential: bindName.trim() }); const next = await platform.updateDisplayName(bindName.trim()); setAccount(next); setBindName(''); if (selectedGame.ranked) setRating(await platform.getRating(selectedGame.gameId, selectedGame.seasonId)); }
    catch (caught) { setError(caught instanceof Error ? caught.message : '登录失败'); }
  };

  return <main className="lobby-shell">
    <header className="arena-lobby-bar">
      <div className="arena-logo"><b>CS</b><span><strong>PARTY GAME</strong><small>战术小游戏合集</small></span></div>
      <div className="arena-bar-actions">
        <button aria-label="游戏规则" title="游戏规则" onClick={() => setModal('rules')}><BookOpen /></button>
        <button aria-label={preferences.soundEnabled ? '关闭音效' : '启用音效'} title={preferences.soundEnabled ? '关闭音效' : '启用音效'} onClick={() => void platform.updatePreferences({ soundEnabled: !preferences.soundEnabled }).then(setPreferences)}>{preferences.soundEnabled ? <Volume2 /> : <VolumeX />}</button>
        <span className="connection-state" title="已连接"><i /><Wifi /> 在线</span>
        <button aria-label="账号设置" title="账号设置" onClick={() => setModal('account')}><Settings /></button>
      </div>
    </header>

    <div className="arena-lobby-grid">
      <aside className="lobby-account-panel">
        <div className="account-identity"><OperatorAvatar accountId={account?.accountId ?? 'guest'} /><span><small>{signedIn ? '已登录玩家' : '访客模式'}</small><strong>{account?.displayName ?? '载入中'}</strong></span></div>
        {signedIn ? <><section className="account-rank"><Trophy /><span><small>CS推推 / 独立天梯</small><strong>{rankName(rating)}</strong></span><b>{rating?.elo ?? 1000}</b></section><dl className="account-record"><div><dt>胜</dt><dd>{rating?.wins ?? 0}</dd></div><div><dt>负</dt><dd>{rating?.losses ?? 0}</dd></div><div><dt>平</dt><dd>{rating?.draws ?? 0}</dd></div></dl></> : <section className="guest-gate"><UserRound /><strong>登录后记录战绩</strong><span>访客可试玩，天梯与对局历史不会写入。</span><button onClick={() => setModal('account')}><LogIn />注册 / 登录</button></section>}
        <button className="rules-entry" onClick={() => setModal('rules')}><BookOpen /><span><strong>游戏规则</strong><small>{selectedGame.name}</small></span></button>
      </aside>

      <div className="lobby-center"><GameStage game={selectedGame} /><div className="lobby-welcome">{signedIn ? `欢迎，${account?.displayName}` : '访客试玩模式'}</div></div>

      <aside className="lobby-action-panel">
        <div className="game-tabs" role="tablist" aria-label="选择游戏">{availableGames.map(game => <button role="tab" aria-selected={game.gameId === selectedGame.gameId} className={game.gameId === selectedGame.gameId ? 'active' : ''} key={game.gameId} onClick={() => void selectGame(game)}><b>{game.index}</b><span>{game.name}</span><small>{isMultiplayer(game) ? '多人' : '单人'}</small></button>)}</div>
        <section className="selected-game-action"><small>{multiplayer ? 'PVP MODE' : 'CAREER MODE'}</small><h2>{selectedGame.name}</h2><p>{multiplayer ? '快速匹配或创建私人房间，与其他玩家实时对战。' : '从 16 岁开始，继续你的职业选手档案。'}</p>
          {multiplayer ? <><button className="lobby-main-command" onClick={() => void startQueue()}><Users />快速匹配</button><div className="lobby-room-commands"><button onClick={() => setModal('create')}>创建房间</button><button onClick={() => setModal('join')}>加入房间</button></div></> : <button className="lobby-main-command" onClick={() => void enterGame()}><UserRound />开始游玩</button>}
        </section>
        <div className="coming-modes">{comingSoonGames.map(game => <span key={game.gameId}><b>{game.index}</b>{game.name}<small>即将开放</small></span>)}</div>
      </aside>
    </div>

    {error && <div className="lobby-error" role="alert">{error}<button aria-label="关闭" onClick={() => setError('')}><X /></button></div>}
    {queue && <div className="modal-backdrop"><section className="queue-modal" role="dialog" aria-modal="true">{queue.status === 'searching' ? <><span className="queue-spinner" /><small>MATCHMAKING</small><h2>正在匹配</h2><p>正在为您寻找合适的对手，预计等待约 {queue.estimatedWaitSeconds} 秒。</p><div className="queue-bar"><i /></div><button onClick={async () => setQueue(await platform.cancelQueue(queue.queueId))}>取消匹配</button></> : queue.status === 'matched' ? <><h2>对手已找到</h2><button className="lobby-main-command" onClick={() => void enterGame()}>进入对局</button></> : <><h2>匹配已取消</h2><button onClick={() => setQueue(null)}>返回大厅</button></>}</section></div>}
    {modal === 'rules' && <div className="modal-backdrop"><section className="room-modal rules-modal" role="dialog" aria-modal="true"><button className="modal-close" aria-label="关闭" onClick={() => setModal(null)}><X /></button><small>{selectedGame.name.toUpperCase()}</small><h2>游戏规则</h2>{multiplayer ? <ul><li>购买枪械和战术道具，部署到五条赛道。</li><li>连续接触的武器形成推力链，突破底线造成伤害。</li><li>三分钟后进入突然死亡，率先击破基地获胜。</li></ul> : <ul><li>选择出身、位置和节奏，开始职业生涯。</li><li>每个赛季模拟训练、比赛、合同与市场评价。</li><li>关键选择会长期影响能力、关系、清白和名气。</li></ul>}</section></div>}
    {modal === 'create' && <div className="modal-backdrop"><section className="room-modal" role="dialog" aria-modal="true"><button className="modal-close" aria-label="关闭" onClick={() => setModal(null)}><X /></button><small>LOCAL ROOM PREVIEW</small><h2>创建本地房间</h2><p className="local-room-warning">房间仅保存在当前页面内存中，刷新后会消失，其他设备无法加入。</p><label>房间名称<input value={roomName} onChange={event => setRoomName(event.target.value)} placeholder="今晚开黑" maxLength={30} /></label><div className="segmented"><button className={visibility === 'public' ? 'selected' : ''} onClick={() => setVisibility('public')}>公开</button><button className={visibility === 'private' ? 'selected' : ''} onClick={() => setVisibility('private')}>私密</button></div><label className="check-row"><input type="checkbox" checked={allowSpectators} onChange={event => setAllowSpectators(event.target.checked)} />允许观战</label><button className="lobby-main-command" onClick={() => void createRoom()}>创建</button></section></div>}
    {modal === 'join' && <div className="modal-backdrop"><section className="room-modal" role="dialog" aria-modal="true"><button className="modal-close" aria-label="关闭" onClick={() => setModal(null)}><X /></button><small>LOCAL ROOM PREVIEW</small><h2>加入本地房间</h2><p className="local-room-warning">仅能加入当前浏览器会话中创建的房间。</p><label>六位房间码<input value={inviteCode} onChange={event => setInviteCode(event.target.value.toUpperCase())} maxLength={6} /></label><button className="lobby-main-command" disabled={inviteCode.trim().length !== 6} onClick={() => void joinRoom()}>加入</button></section></div>}
    {modal === 'room' && room && <div className="modal-backdrop"><section className="room-modal waiting-modal" role="dialog" aria-modal="true"><button className="modal-close" aria-label="关闭" onClick={() => void leaveRoom()}><X /></button><h2>{room.config.name}</h2><div className="invite-code"><span><small>房间码</small><strong>{room.inviteCode}</strong></span><button onClick={() => void navigator.clipboard?.writeText(`${location.origin}/lobby?room=${room.inviteCode}`)}>复制链接</button></div><div className="member-list">{room.members.map(member => <div key={member.accountId}><OperatorAvatar accountId={member.accountId} /><span>{member.displayName}{member.isHost && <small>房主</small>}</span>{member.accountId === account?.accountId && !member.isHost ? <button onClick={() => void platform.setRoomReady({ roomId: room.roomId, ready: !member.ready }).then(setRoom)}>{member.ready ? '取消准备' : '准备'}</button> : <b>{member.ready ? '已准备' : '等待准备'}</b>}</div>)}</div><div className="waiting-actions"><button onClick={() => void leaveRoom()}>离开</button>{room.hostAccountId === account?.accountId && <button className="lobby-main-command" disabled={room.members.length < selectedGame.minPlayers || !room.members.every(member => member.ready)} onClick={async () => { try { await platform.startRoom(room.roomId); await enterGame(); } catch (caught) { setError(caught instanceof Error ? caught.message : '无法开始'); } }}>开始游戏</button>}</div></section></div>}
    {modal === 'account' && <div className="drawer-backdrop" onClick={() => setModal(null)}><aside className="account-drawer" onClick={event => event.stopPropagation()}><button className="modal-close" aria-label="关闭" onClick={() => setModal(null)}><X /></button><OperatorAvatar accountId={account?.accountId ?? 'guest'} className="drawer-avatar" /><h2>{account?.displayName ?? '游客'}</h2><small>{signedIn ? '账号已登录 · 多人数据将被记录' : '访客模式 · 多人数据不会记录'}</small>{!signedIn ? <div className="drawer-section login-section"><label className="drawer-label"><Shield />账号名称<input value={bindName} onChange={event => setBindName(event.target.value)} maxLength={18} /></label><button className="drawer-action primary" onClick={() => void bindAccount()}><LogIn />注册 / 登录</button></div> : <div className="drawer-section"><label className="drawer-label"><UserRound />昵称<input value={account?.displayName ?? ''} onChange={event => void platform.updateDisplayName(event.target.value).then(setAccount)} maxLength={18} /></label></div>}<div className="drawer-section"><label className="drawer-label">主音量<input type="range" min="0" max="1" step=".05" value={preferences.masterVolume} onChange={event => void platform.updatePreferences({ masterVolume: Number(event.target.value) }).then(setPreferences)} /></label></div><button className="drawer-action" onClick={() => { resetTutorial(); setModal(null); }}>重置新手教程</button></aside></div>}
  </main>;
}

export default Lobby;
