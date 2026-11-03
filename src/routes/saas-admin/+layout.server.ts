import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (url.pathname === '/saas-admin/login') {
		return {
			superAdmin: null
		};
	}

	if (!locals.superAdmin) {
		throw redirect(303, `/saas-admin/login?redirect=${encodeURIComponent(url.pathname)}`);
	}

	return {
		superAdmin: locals.superAdmin
	};
};

