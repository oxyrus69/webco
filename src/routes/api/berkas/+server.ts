import { json } from '@sveltejs/kit';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { env } from '$env/dynamic/private';
import { MB, SLOT_BERKAS } from '$lib/brief/berkas';
import type { RequestHandler } from './$types';

const TIPE_DIIZINKAN = [...new Set(SLOT_BERKAS.flatMap((s) => s.tipe))];
const MAKS_BYTE = Math.max(...SLOT_BERKAS.map((s) => s.maksMB)) * MB;

// Token untuk unggah langsung dari browser ke Vercel Blob. Berkasnya tidak
// melewati fungsi server, jadi batas body 4,5MB Vercel tidak berlaku di sini.
export const POST: RequestHandler = async ({ request }) => {
	if (!env.BLOB_READ_WRITE_TOKEN) {
		return json({ galat: 'Vercel Blob belum dikonfigurasi di lingkungan ini.' }, { status: 503 });
	}

	let body: HandleUploadBody;
	try {
		body = (await request.json()) as HandleUploadBody;
	} catch {
		return json({ galat: 'Permintaan unggah tidak terbaca.' }, { status: 400 });
	}

	try {
		const hasil = await handleUpload({
			body,
			request,
			token: env.BLOB_READ_WRITE_TOKEN,
			onBeforeGenerateToken: async () => ({
				allowedContentTypes: TIPE_DIIZINKAN,
				maximumSizeInBytes: MAKS_BYTE,
				addRandomSuffix: true
			})
		});
		return json(hasil);
	} catch (e) {
		console.error('[webco] token unggah Blob gagal:', e);
		return json({ galat: (e as Error).message || 'Unggahan ditolak.' }, { status: 400 });
	}
};
