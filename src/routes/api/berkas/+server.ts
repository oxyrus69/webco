import { json } from '@sveltejs/kit';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { env } from '$env/dynamic/private';
import { MB, SLOT_BERKAS, formatSlotCloudinary, slotBerkas } from '$lib/brief/berkas';
import { cloudinarySiap, tandaUnggahLangsung } from '$lib/server/cloudinary';
import { blobSiap } from '$lib/server/storage';
import type { RequestHandler } from './$types';

const TIPE_DIIZINKAN = [...new Set(SLOT_BERKAS.flatMap((s) => s.tipe))];
const MAKS_BYTE = Math.max(...SLOT_BERKAS.map((s) => s.maksMB)) * MB;

type PermintaanBerkas = { slot?: string; nama?: string };

/**
 * Kunci unggahan langsung dari browser. Cloudinary didahulukan: server hanya mengirim
 * tanda tangan, pengirim menaruh berkasnya langsung ke Cloudinary, jadi batas body
 * 4,5MB milik Vercel Functions tidak berlaku dan berkas 10MB tetap sampai.
 * Bila Cloudinary belum dikonfigurasi, jalur Vercel Blob lama tetap dipakai.
 */
export const POST: RequestHandler = async ({ request }) => {
	if (cloudinarySiap()) return tandaTangan(request);
	if (blobSiap()) return tokenBlob(request);
	return json({ galat: 'Penyimpanan berkas belum dikonfigurasi di lingkungan ini.' }, { status: 503 });
};

async function tandaTangan(request: Request) {
	let body: PermintaanBerkas;
	try {
		body = (await request.json()) as PermintaanBerkas;
	} catch {
		return json({ galat: 'Permintaan unggah tidak terbaca.' }, { status: 400 });
	}

	const slot = slotBerkas(String(body.slot ?? ''));
	const nama = String(body.nama ?? '').trim();
	if (!slot || !nama) return json({ galat: 'Slot berkas tidak dikenal.' }, { status: 400 });

	try {
		// Grup acak: pengirim belum punya nomor tiket saat berkas masih diunggah.
		const grup = Math.random().toString(36).slice(2, 10);
		return json(tandaUnggahLangsung(grup, nama, formatSlotCloudinary(slot)));
	} catch (e) {
		console.error('[webco] tanda tangan unggah Cloudinary gagal:', e);
		return json({ galat: (e as Error).message || 'Unggahan ditolak.' }, { status: 400 });
	}
}

// Token untuk unggah langsung dari browser ke Vercel Blob (cadangan bila Cloudinary kosong).
async function tokenBlob(request: Request) {
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
}
