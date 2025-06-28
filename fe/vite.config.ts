import { defineConfig } from 'vite'
import vitePluginImp from 'vite-plugin-imp'
import { ViteAliases } from 'vite-aliases'
import react from '@vitejs/plugin-react'
import { join } from 'node:path'

export default defineConfig({
  define: {
    NODE_ENV: `"${process.env.NODE_ENV}"`,
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
  },
  resolve: {
    alias: { '/^~/': join(__dirname, './node_modules/') },
  },
  plugins: [
    react(),
    vitePluginImp({
      libList: [
        {
          libName: 'antd',
          esModule: true,
          style: (name) => {
            return `antd/es/${name}/style/index`
          },
        },
      ],
    }),
  ],
})
