import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import path from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/js/src/main.tsx'],
            refresh: true,
        }),
    ],
    esbuild: {
        loader: 'tsx',
        include: /src\/.*\.[tj]sx?$/,
        exclude: [],
    },
    optimizeDeps: {
        esbuildOptions: {
            loader: {
                '.js': 'jsx',
                '.ts': 'tsx',
                '.tsx': 'tsx',
            },
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './resources/js/src'),
        },
    },
    server: {
        host: true,
        hmr: {
            host: 'localhost',
        },
    },
});
