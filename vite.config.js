import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        lib: {
            entry:    resolve(__dirname, 'src/index.js'),
            name:     'ZyCrypt',
            fileName: 'index',
            formats:  ['es'],
        },
        rollupOptions: {
            external: ['vue'],
            output: {
                globals: { vue: 'Vue' },
            },
        },
        minify:          true,
        sourcemap:       false,
        emptyOutDir:     true,
    },
});
