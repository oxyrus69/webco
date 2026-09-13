import { error, fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db/client';
import { briefSubmissions } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { hapusBerkas } from '$lib/server/storage';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	try {
		const rows = await db.select().from(briefSubmissions).where(eq(briefSubmissions.id, params.id)).limit(1);
		if (!rows.length) throw error(404, 'Dossier tidak ditemukan.');
		return { row: rows[0] };
	} catch (e: any) {
		if (e?.status === 404) throw e;
		console.error('[webco] admin detail gagal:', e);
		throw error(500, 'Database tidak dapat dihubungi. Periksa DATABASE_URL.');
	}
};

export const actions: Actions = {
	status: async ({ request, params }) => {
		const fd = await request.formData();
		const status = String(fd.get('status') ?? '');
		if (!['baru', 'diproses', 'selesai'].includes(status)) return fail(400, { galat: 'Status tidak dikenal.' });
		await db.update(briefSubmissions).set({ status }).where(eq(briefSubmissions.id, params.id));
		return { sukses: true };
	},
	hapus: async ({ params }) => {
		const rows = await db.select().from(briefSubmissions).where(eq(briefSubmissions.id, params.id)).limit(1);
		if (!rows.length) throw error(404, 'Dossier tidak ditemukan.');
		const r = rows[0];
		// Bersihkan berkasnya di semua lapis penyimpanan (Blob, Neon, folder lokal).
		await hapusBerkas(r.ticket, [
			r.logoUrl,
			r.katalogUrl,
			r.portofolioFileUrl,
			r.legalitasFileUrl,
			...(r.logoKlienUrls ?? []),
			...(r.fotoTimUrls ?? [])
		]);
		await db.delete(briefSubmissions).where(eq(briefSubmissions.id, params.id));
		throw redirect(303, '/admin');
	}
};
