import { useEffect, useState } from 'react';
import CsPushGame from '../games/cs-push/CsPushGame';
import CareerGame from '../games/cs-career/CareerGame';
import Lobby from '../lobby/Lobby';

const getGamePath = () => window.location.pathname;

export default function Router() {
  const [gamePath, setGamePath] = useState(getGamePath);
  useEffect(() => {
    const sync = () => setGamePath(getGamePath());
    const navigate = (event: Event) => {
      const path = (event as CustomEvent<{ path?: string }>).detail?.path;
      if (!path) return;
      window.history.pushState({}, '', path);
      sync();
    };
    window.addEventListener('popstate', sync);
    window.addEventListener('cspa:navigate', navigate);
    return () => { window.removeEventListener('popstate', sync); window.removeEventListener('cspa:navigate', navigate); };
  }, []);
  if (gamePath === '/games/cs-push') return <CsPushGame />;
  if (gamePath === '/games/cs-career') return <CareerGame />;
  return <Lobby />;
}
