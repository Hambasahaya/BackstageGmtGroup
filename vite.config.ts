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
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@tensorflow') || id.includes('tfjs')) {
              return 'tensorflow-vendor';
            }
            if (id.includes('recharts')) {
              return 'recharts-vendor';
            }
            if (id.includes('xlsx')) {
              return 'xlsx-vendor';
            }
            if (id.includes('leaflet')) {
              return 'leaflet-vendor';
            }
            if (id.includes('lucide-react')) {
              return 'lucide-vendor';
            }
          }
        },
      },
    },
  },
  define: {
    'import.meta.env.MODE_Agent': JSON.stringify(agentModeValue),
    'import.meta.env.VITE_MODE_AGENT': JSON.stringify(agentModeValue),
  },
  }
})
