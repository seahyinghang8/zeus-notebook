import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import type { Plugin } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	},
	worker: {
		plugins: [
			{
				name: 'remove-manifest',
				configResolved(c) {
					const workerPlugins = c.worker.plugins as Plugin[];
					const manifestPlugin = workerPlugins.findIndex((p) => p.name === 'vite:manifest');
					if (manifestPlugin !== -1) workerPlugins.splice(manifestPlugin, 1);
					const ssrManifestPlugin = c.worker.plugins.findIndex(
						(p) => p.name === 'vite:ssr-manifest'
					);
					if (ssrManifestPlugin !== -1) workerPlugins.splice(ssrManifestPlugin, 1);
				}
			}
		]
	}
});
