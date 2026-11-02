import 'dotenv/config';
import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-auto';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	server: {
		host: '0.0.0.0',
		port: Number(process.env.PORT) || 8080,
		allowedHosts: true
	},
	preview: {
		host: '0.0.0.0',
		port: Number(process.env.PORT) || 8080,
		allowedHosts: true
	},
	plugins: [
		tailwindcss(),
		sveltekit({
			csrf: {
				trustedOrigins: ['*']
			},
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter()
		})
	]
});
