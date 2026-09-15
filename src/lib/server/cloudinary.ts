import { env } from '$env/dynamic/private';
import { v2 as cloudinary } from 'cloudinary';

/**
 * Cloudinary — wadah penyimpanan berkas klien (gambar & PDF).
 *
 * Kredensial dibaca dari `CLOUDINARY_URL` (`cloudinary://<api_key>:<api_secret>@<cloud_name>`)
 * atau dari trio `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET`.
 * Tanpa kredensial, lapisan ini dilewati diam-diam dan penyimpanan jatuh ke lapis berikutnya
 * supaya situs tetap menerima berkas di lingkungan mana pun.
 */

/** Semua berkas dossier dikelompokkan di bawah folder ini, satu subfolder per tiket. */
const FOLDER = 'webco/uploads';
const POLA_URL = /^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/;

export type KredensialCloudinary = { cloudName: string; apiKey: string; apiSecret: string };
export type TautanCloudinary = { publikId: string; resourceType: string };

function dariUrl(url: string): KredensialCloudinary | null {
	const cocok = POLA_URL.exec(url.trim());
	if (!cocok) return null;
	const [, apiKey, apiSecret, cloudName] = cocok;
	if (!apiKey || !apiSecret || !cloudName) return null;
	return { cloudName: cloudName.trim(), apiKey, apiSecret };
}

// Env dibaca saat dipakai (bukan saat build), tetapi hasil parsing di-cache supaya
// setiap unggahan tidak mengurai URL lagi — cache kunci ikut menjaga bila env berubah.
let simpan: { jejak: string; nilai: KredensialCloudinary | null } | null = null;

export function kredensialCloudinary(): KredensialCloudinary | null {
	const jejak = [
		env.CLOUDINARY_URL,
		env.CLOUDINARY_CLOUD_NAME,
		env.CLOUDINARY_API_KEY,
		env.CLOUDINARY_API_SECRET
	].join('|');
	if (simpan?.jejak === jejak) return simpan.nilai;

	let nilai: KredensialCloudinary | null = env.CLOUDINARY_URL ? dariUrl(env.CLOUDINARY_URL) : null;
	if (!nilai && env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
		nilai = {
			cloudName: env.CLOUDINARY_CLOUD_NAME,
			apiKey: env.CLOUDINARY_API_KEY,
			apiSecret: env.CLOUDINARY_API_SECRET
		};
	}
	simpan = { jejak, nilai };
	return nilai;
}

export const cloudinarySiap = () => kredensialCloudinary() !== null;

/** Nama akun dipakai untuk memastikan tautan yang diterima memang milik cloud kita. */
export const namaCloud = () => kredensialCloudinary()?.cloudName ?? null;

/** Pasang kredensial ke SDK Cloudinary; dipakai setiap operasi agar env selalu segar. */
export function pasangCloudinary(): KredensialCloudinary {
	const k = kredensialCloudinary();
	if (!k) throw new Error('Cloudinary belum dikonfigurasi: isi CLOUDINARY_URL.');
	cloudinary.config({
		cloud_name: k.cloudName,
		api_key: k.apiKey,
		api_secret: k.apiSecret,
		secure: true
	});
	return k;
}

const namaDasar = (nama: string) =>
	nama
		.replace(/\.[^./\\]+$/, '')
		.replace(/[^a-zA-Z0-9._-]/g, '_')
		.slice(-50) || 'berkas';

/**
 * Public ID unik: `<FOLDER>/<grup>/<acak>-<nama>`. Bagian acak membuat berkas
 * tidak pernah saling menimpa, baik antar tiket maupun saat pengirim mengunggah
 * berkas bernama sama dua kali.
 */
export function publicIdCloudinary(grup: string, nama: string) {
	const acak = Math.random().toString(36).slice(2, 8);
	return `${FOLDER}/${grup}/${acak}-${namaDasar(nama)}`;
}

/**
 * Simpan satu berkas ke Cloudinary, kembalikan tautan `secure_url`-nya.
 *
 * `resource_type: 'image'` dipakai sengaja, bukan `'auto'`: tanpa petunjuk nama berkas,
 * deteksi `auto` mengira SVG (XML, tanpa magic bytes) sebagai berkas mentah — tersimpan
 * di `/raw/upload` dan tersaji sebagai octet-stream yang tak bisa ditransformasi.
 * PDF, PNG, JPG, WebP, dan SVG semuanya sah sebagai sumber daya `image` di Cloudinary.
 */
export async function keCloudinary(isi: Buffer, publikId: string): Promise<string> {
	pasangCloudinary();
	return await new Promise<string>((selesai, gagal) => {
		const arus = cloudinary.uploader.upload_stream(
			{
				resource_type: 'image',
				public_id: publikId,
				type: 'upload',
				overwrite: false,
				unique_filename: false,
				use_filename: false
			},
			(err, hasil) =>
				err || !hasil
					? gagal(err ?? new Error('Cloudinary tidak mengembalikan tautan berkas.'))
					: selesai(hasil.secure_url)
		);
		arus.end(isi);
	});
}

/**
 * Pecah `secure_url` Cloudinary menjadi public ID + jenis sumber daya supaya bisa
 * dihapus. Tautan yang bukan milik cloud kita diabaikan — jangan menghapus apa pun
 * yang hanya kebetulan berbentuk tautan Cloudinary.
 */
export function bacaTautanCloudinary(url: string): TautanCloudinary | null {
	const k = kredensialCloudinary();
	let x: URL;
	try {
		x = new URL(url);
	} catch {
		return null;
	}
	if (x.protocol !== 'https:' || x.hostname !== 'res.cloudinary.com' || !k) return null;

	const bagian = x.pathname.split('/').filter(Boolean);
	const resourceType = bagian[1];
	if (bagian[0] !== k.cloudName) return null;
	if (!['image', 'video', 'raw'].includes(resourceType) || bagian[2] !== 'upload') return null;

	// .../<resource_type>/upload/[v<versi>/]<public_id>.<format>
	const sisa = bagian.slice(3).filter((s) => !/^v\d+$/.test(s));
	if (!sisa.length) return null;
	sisa[sisa.length - 1] = sisa[sisa.length - 1].replace(/\.[^./]+$/, '');
	return { publikId: sisa.join('/'), resourceType };
}

/** Hapus objek Cloudinary milik satu tiket; galat dicatat, tidak menghentikan alur. */
export async function hapusCloudinary(urls: (string | null | undefined)[]) {
	const daftar = urls
		.map((u) => (u ? bacaTautanCloudinary(u) : null))
		.filter((x): x is TautanCloudinary => !!x);
	if (!daftar.length) return;
	try {
		pasangCloudinary();
	} catch (e) {
		console.warn('[webco] Cloudinary tidak siap untuk menghapus:', (e as Error).message);
		return;
	}
	for (const { publikId, resourceType } of daftar) {
		try {
			const hasil = await cloudinary.uploader.destroy(publikId, { resource_type: resourceType, invalidate: true });
			if (hasil.result !== 'ok' && hasil.result !== 'not found') {
				console.warn('[webco] Cloudinary menolak hapus berkas:', publikId, hasil.result);
			}
		} catch (e) {
			console.warn('[webco] gagal hapus berkas Cloudinary:', publikId, e);
		}
	}
}

export type TandaUnggahCloudinary = {
	penyimpanan: 'cloudinary';
	cloudName: string;
	apiKey: string;
	timestamp: number;
	signature: string;
	public_id: string;
	allowed_formats: string;
};

/**
 * Tanda tangan untuk unggahan langsung dari browser ke Cloudinary: berkas besar
 * (katalog PDF sampai 10MB) tidak lewat fungsi server, jadi batas body 4,5MB milik
 * Vercel tidak berlaku. `public_id` dan `allowed_formats` dibuat di server dan ikut
 * ditandatangani, sehingga pengirim tidak bisa menaruh berkas di luar folder kita
 * atau menyelundupkan format lain.
 */
export function tandaUnggahLangsung(grup: string, nama: string, format: string[]): TandaUnggahCloudinary {
	const k = pasangCloudinary();
	const timestamp = Math.floor(Date.now() / 1000);
	const public_id = publicIdCloudinary(grup, nama);
	const allowed_formats = format.join(',');
	return {
		penyimpanan: 'cloudinary',
		cloudName: k.cloudName,
		apiKey: k.apiKey,
		timestamp,
		signature: cloudinary.utils.api_sign_request({ public_id, timestamp, allowed_formats }, k.apiSecret),
		public_id,
		allowed_formats
	};
}

/**
 * Ukuran berkas yang sudah diunggah langsung, dibaca dari header `content-length`
 * Cloudinary. Dipakai untuk menjaga batas per slot yang tidak bisa dititipkan ke
 * tanda tangan unggah. `null` berarti ukuran tidak diketahui (jaringan bermasalah).
 */
export async function ukuranTautan(url: string): Promise<number | null> {
	try {
		const res = await fetch(url, { method: 'HEAD' });
		if (!res.ok) return null;
		const n = Number(res.headers.get('content-length'));
		return Number.isFinite(n) && n > 0 ? n : null;
	} catch (e) {
		console.warn('[webco] gagal membaca ukuran berkas:', url, e);
		return null;
	}
}
