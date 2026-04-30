import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import fs from 'fs'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-pdfjs-worker',
      apply: 'build',
      enforce: 'post',
      generateBundle() {
        // Copy PDF.js worker file to dist/pdfjs-dist/build/
        const workerSrc = resolve('./node_modules/pdfjs-dist/build/pdf.worker.min.js')
        const workerDest = resolve('./dist/pdfjs-dist/build/pdf.worker.min.js')
        
        try {
          // Create directory if it doesn't exist
          const dir = resolve('./dist/pdfjs-dist/build')
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
          }
          
          // Copy the file
          if (fs.existsSync(workerSrc)) {
            fs.copyFileSync(workerSrc, workerDest)
            console.log('✓ PDF.js worker copied to dist/')
          } else {
            console.warn('⚠ PDF.js worker file not found at:', workerSrc)
          }
        } catch (error) {
          console.error('Error copying PDF.js worker:', error.message)
        }
      }
    }
  ],
  build: {
    outDir: 'dist',
  },
  server: {
    // Proxy /api/* to local Functions runtime in dev
    proxy: {
      '/api': 'http://localhost:7072',
    },
  },
})
