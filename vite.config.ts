import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Everything is inlined into one HTML file, because the Claude artifact host serves a single page.
export default defineConfig({
  plugins: [viteSingleFile()],
  // Shown in Settings so you can tell which build a device is running.
  define: { __BUILD_TIME__: JSON.stringify(new Date().toISOString()) },
  build: { target: 'es2020' },
});
