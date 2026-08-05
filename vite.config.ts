import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const agentModeValue = env.MODE_Agent ?? env.VITE_MODE_AGENT ?? env.MODE_AGENT ?? env.VITE_AGENT_MODE ?? '1';

  return {
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],
  build: {
    chunkSizeWarningLimit: 800,
  },
  define: {
    'import.meta.env.MODE_Agent': JSON.stringify(agentModeValue),
    'import.meta.env.VITE_MODE_AGENT': JSON.stringify(agentModeValue),
  },
  }
})
