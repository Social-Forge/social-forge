import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build'
		}),
		csrf: {
			trustedOrigins: ['*'] // Use with caution!
		},
		alias: {
			'@/*': './src/lib/*'
			// '@components': './src/lib/components/*',
			// '@util': './src/lib/utils/*',
			// '@stores': './src/lib/stores/*',
			// '@server': './src/lib/server/*',
			// '@assets': './src/lib/assets/*',
			// '@middleware': './src/lib/middleware/*',
			// '@types': './src/lib/types/*'
		}
	}
};

export default config;
