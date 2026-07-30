import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const multiplayerServer = env.VITE_MULTIPLAYER_SERVER || 'http://127.0.0.1:3001';

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': { target: multiplayerServer, changeOrigin: true },
        '/ws': { target: multiplayerServer, changeOrigin: true, ws: true },
      },
    },
  };
});
