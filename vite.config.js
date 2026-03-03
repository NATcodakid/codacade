import { defineConfig } from 'vite';

export default defineConfig({
    base: '/codacade/',
    root: '.',
    publicDir: 'assets',
    server: {
        port: 3000,
        open: false
    },
    build: {
        outDir: 'dist'
    }
});
