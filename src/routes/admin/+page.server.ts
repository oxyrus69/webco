import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db/client';
import { briefSubmissions } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import type { Actions, PageServerLoad } from './$types';

const STATUS = ['baru', 'diproses', 'selesai'] as const;

export const load: PageServerLoad = async ({ url }) => {
	try {
		const q = (url.searchParams.get('q') ?? '').trim().toLowerCase();
		const status = url.searchParams.get('status') ?? 'semua';
		const semua = await db
			.select()
			.from(briefSubmissions)
			.orderBy(desc(briefSubmissions.createdAt))
			.limit(500);

		const counts = { total: semua.length, baru: 0, diproses: 0, selesai: 0, mingguIni: 0 };
		const batas = Date.now() - 7 * 24 * 3600 * 1000;
		for (const r of semua) {
			if (r.status === 'baru') counts.baru++;
			else if (r.status === 'diproses') counts.diproses++;
			else if (r.status === 'selesai') counts.selesai++;
			if (new Date(r.createdAt).getTime() >= batas) counts.mingguIni++;
		}

		const rows = semua.filter((r) => {
			if (STATUS.includes(status as (typeof STATUS)[number]) && r.status !== status) return false;
			if (!q) return true;
			return [r.ticket, r.namaResmi, r.kontakNama, r.kontakEmail, r.bidang]
				.filter(Boolean)
				.some((v) => String(v).toLowerCase().includes(q));
		});

		return { rows, counts, q: url.searchParams.get('q') ?? '', status, dbMati: false };
	} catch (e) {
		console.error('[webco] admin list gagal:', e);
		return { rows: [], counts: { total: 0, baru: 0, diproses: 0, selesai: 0, mingguIni: 0 }, q: '', status: 'semua', dbMati: true };
	}
};

export const actions: Actions = {
	hapus: async ({ request }) => {
		const fd = await request.formData();
		const id = String(fd.get('id') ?? '');
		if (!id) return fail(400, { galat: 'ID dossier tidak dikenal.' });
		try {
			const rows = await db.select().from(briefSubmissions).where(eq(briefSubmissions.id, id)).limit(1);
			if (!rows.length) return fail(404, { galat: 'Dossier tidak ditemukan.' });
			try {
				await rm(join(process.cwd(), 'static', 'uploads', rows[0].ticket), { recursive: true, force: true });
			} catch {}
			await db.delete(briefSubmissions).where(eq(briefSubmissions.id, id));
			return { sukses: true, tiket: rows[0].ticket };
		} catch (e) {
			console.error('[webco] hapus dossier gagal:', e);
			return fail(500, { galat: 'Gagal menghapus. Coba lagi.' });
		}
	}
};
