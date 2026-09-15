import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { bersihkanBerkasYatim, hariTunggu } from '$lib/server/berkas-yatim';
import type { RequestHandler } from './$types';

/**
 * Pemicu pembersih berkas yatim. Dipanggil Vercel Cron tiap hari (lihat `vercel.json`),
 * dan bisa dijalankan tangan untuk memeriksa lebih dulu:
 *
 *   curl -H "Authorization: Bearer $CRON_SECRET" "https://<domain>/api/cron/bersihkan-berkas?kering=1"
 *
 * Tanpa `CRON_SECRET` endpoint ini mati (503) supaya tidak ada yang bisa memicunya dari luar.
 * `?kering=1` hanya melaporkan (pakai ini dulu saat memeriksa), `?hari=N` menimpa masa
 * tenggang — `hari=0` berarti semua berkas yang tidak dirujuk dossier, tanpa tenggang.
 */
const proses: RequestHandler = async ({ request, url }) => {
	const rahasia = env.CRON_SECRET;
	if (!rahasia) {
		return json({ galat: 'CRON_SECRET belum diisi — pembersih berkas tidak dijalankan.' }, { status: 503 });
	}
	if (request.headers.get('authorization') !== `Bearer ${rahasia}`) {
		return json({ galat: 'Tidak diizinkan.' }, { status: 401 });
	}

	const hariParam = url.searchParams.get('hari');
	const hari = hariParam !== null ? Math.min(365, Math.max(0, Number(hariParam) || 0)) : hariTunggu();
	const kering = url.searchParams.get('kering') === '1';

	const laporan = await bersihkanBerkasYatim({ hari, kering });
	if (!kering || laporan.yatim) {
		console.warn('[webco] pembersih berkas yatim:', JSON.stringify(laporan));
	}
	return json(laporan);
};

export const GET = proses;
export const POST = proses;
