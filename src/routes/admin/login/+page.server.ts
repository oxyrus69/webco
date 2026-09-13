import { fail, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { Actions, PageServerLoad } from './$types';

const kataKunci = () => env.ADMIN_PASSWORD ?? 'itsendri666';
const aman = (t: string) => (t.startsWith('/admin') && !t.includes('//') ? t : '/admin');

export const load: PageServerLoad = async ({ cookies, url }) => {
	if (cookies.get('webco_admin') === '1') {
		throw redirect(303, aman(url.searchParams.get('lanjut') ?? '/admin'));
	}
	return { lanjut: url.searchParams.get('lanjut') ?? '/admin' };
};

export const actions: Actions = {
	masuk: async ({ request, cookies, url }) => {
		const fd = await request.formData();
		const kunci = String(fd.get('kunci') ?? '');
		const lanjut = aman(String(fd.get('lanjut') ?? '/admin'));
		if (kunci !== kataKunci()) return fail(400, { salah: true, lanjut });
		cookies.set('webco_admin', '1', {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			// Secure hanya di HTTPS agar login tetap jalan saat uji via HTTP/LAN.
			secure: url.protocol === 'https:',
			maxAge: 60 * 60 * 24 * 7
		});
		throw redirect(303, lanjut);
	}
};
