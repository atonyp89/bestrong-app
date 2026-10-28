import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Everything is inlined into one HTML file, because the Claude artifact host serves a single page.
export default defineConfig({
  plugins: [viteSingleFile()],
  build: { target: 'es2020' },
});
