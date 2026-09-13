import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db/client';
import { briefSubmissions } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';
import type { LayoutServerLoad } from './$types';

// Pemisah public vs admin: seluruh /admin kecuali login/keluar wajib punya cookie sesi.
// Plus hitungan status untuk badge sidebar.
export const load: LayoutServerLoad = async ({ cookies, url }) => {
	const masuk = cookies.get('webco_admin') === '1';
	if (url.pathname === '/admin/login' || url.pathname === '/admin/keluar') return { masuk };
	if (!masuk) {
		throw redirect(303, `/admin/login?lanjut=${encodeURIComponent(url.pathname)}`);
	}
	try {
		const semua = await db
			.select({ status: briefSubmissions.status })
			.from(briefSubmissions)
			.orderBy(desc(briefSubmissions.createdAt))
			.limit(500);
		const counts = { total: semua.length, baru: 0, diproses: 0, selesai: 0 };
		for (const r of semua) {
			if (r.status === 'baru') counts.baru++;
			else if (r.status === 'diproses') counts.diproses++;
			else if (r.status === 'selesai') counts.selesai++;
		}
		return { masuk: true, counts };
	} catch {
		return { masuk: true, counts: { total: 0, baru: 0, diproses: 0, selesai: 0 } };
	}
};
