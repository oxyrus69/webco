// Unggahan langsung dari browser ke Cloudinary. Ditulis terpisah dari halaman brief
// supaya logikanya bisa dipakai slot berkas mana pun dan mudah diuji sendiri.

export type TandaUnggahCloudinary = {
	penyimpanan: 'cloudinary';
	cloudName: string;
	apiKey: string;
	timestamp: number;
	signature: string;
	public_id: string;
	allowed_formats: string;
};

/** Minta tanda tangan unggahan ke server: hanya server yang tahu API secret. */
export async function mintaTandaUnggah(slot: string, nama: string): Promise<TandaUnggahCloudinary> {
	const res = await fetch('/api/berkas', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ slot, nama })
	});
	const data = (await res.json().catch(() => null)) as
		| (TandaUnggahCloudinary & { galat?: string })
		| null;
	if (!res.ok || data?.penyimpanan !== 'cloudinary') {
		throw new Error(data?.galat ?? 'Tanda tangan unggah tidak tersedia.');
	}
	return data;
}

/**
 * Kirim satu berkas ke Cloudinary. XHR dipakai (bukan fetch) karena hanya XHR yang
 * memberi kabar kemajuan unggahan — pengirim berkas 10MB perlu melihat progresnya.
 *
 * Endpoint `/image/upload` (bukan `/auto/upload`) supaya berkas selalu tersimpan
 * sebagai sumber daya `image` yang bisa ditransformasi di URL, bukan berkas mentah.
 */
export function kirimKeCloudinary(
	berkas: File,
	tanda: TandaUnggahCloudinary,
	saatMaju: (persen: number) => void
): Promise<string> {
	return new Promise<string>((selesai, gagal) => {
		const xhr = new XMLHttpRequest();
		xhr.open('POST', `https://api.cloudinary.com/v1_1/${tanda.cloudName}/image/upload`);
		xhr.upload.onprogress = (e) => {
			if (e.lengthComputable) saatMaju(Math.round((e.loaded / e.total) * 100));
		};
		xhr.onload = () => {
			let jawab: { secure_url?: string; error?: { message?: string } } | null = null;
			try {
				jawab = JSON.parse(xhr.responseText);
			} catch {}
			if (xhr.status >= 200 && xhr.status < 300 && jawab?.secure_url) selesai(jawab.secure_url);
			else gagal(new Error(jawab?.error?.message ?? `Cloudinary menolak berkas (${xhr.status}).`));
		};
		xhr.onerror = () => gagal(new Error('Koneksi ke Cloudinary terputus.'));
		xhr.ontimeout = () => gagal(new Error('Unggahan ke Cloudinary kehabisan waktu.'));

		const fd = new FormData();
		fd.append('file', berkas);
		fd.append('api_key', tanda.apiKey);
		fd.append('timestamp', String(tanda.timestamp));
		fd.append('signature', tanda.signature);
		fd.append('public_id', tanda.public_id);
		fd.append('allowed_formats', tanda.allowed_formats);
		xhr.send(fd);
	});
}
