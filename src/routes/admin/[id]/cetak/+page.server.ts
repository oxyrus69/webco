import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db/client';
import { briefSubmissions } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	try {
		const rows = await db.select().from(briefSubmissions).where(eq(briefSubmissions.id, params.id)).limit(1);
		if (!rows.length) throw error(404, 'Dossier tidak ditemukan.');
		return { row: rows[0] };
	} catch (e: any) {
		if (e?.status === 404) throw e;
		console.error('[webco] cetak dossier gagal:', e);
		throw error(500, 'Database tidak dapat dihubungi. Periksa DATABASE_URL.');
	}
};
