// Pratinjau berkas klien untuk panel admin. Tautan Cloudinary bisa dikecilkan di
// tempat lewat transformasi URL (`f_auto,q_auto`), jadi admin tidak perlu mengunduh
// katalog 10MB hanya untuk memastikan berkasnya benar. Lapis penyimpanan lain
// (Vercel Blob, folder lokal, bytea Neon) ditampilkan apa adanya.

export type JenisBerkas = 'gambar' | 'pdf' | 'lain';

/** Hanya sumber daya `image` Cloudinary yang bisa ditransformasi lewat URL. */
const AWAL_IMAGE = /^https:\/\/res\.cloudinary\.com\/([^/]+)\/image\/upload\//i;
const EKSTENSI_GAMBAR = ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'avif'];

/** Ekstensi dari URL (query/hash diabaikan); string kosong bila tidak ada. */
export function ekstensiUrl(url: string): string {
	const bersih = url.split(/[?#]/)[0];
	const nama = bersih.split('/').pop() ?? '';
	const titik = nama.lastIndexOf('.');
	return titik > 0 ? nama.slice(titik + 1).toLowerCase() : '';
}

export function jenisBerkas(url: string): JenisBerkas {
	const ext = ekstensiUrl(url);
	if (EKSTENSI_GAMBAR.includes(ext)) return 'gambar';
	if (ext === 'pdf') return 'pdf';
	return 'lain';
}

/** Nama berkas yang terbaca admin, bukan URL panjang. */
export function namaBerkas(url: string): string {
	try {
		const segmen = new URL(url, 'https://lokal').pathname.split('/').filter(Boolean);
		const nama = decodeURIComponent(segmen[segmen.length - 1] ?? url);
		return nama.length > 48 ? `…${nama.slice(-47)}` : nama;
	} catch {
		return url;
	}
}

/** Ukuran berkas yang enak dibaca pengirim: “812 KB”, “4,2 MB”. */
export function ukuranRingkas(byte: number): string {
	if (byte < 1024) return `${byte} B`;
	if (byte < 1024 * 1024) return `${Math.round(byte / 1024)} KB`;
	return `${(byte / (1024 * 1024)).toFixed(byte < 10 * 1024 * 1024 ? 1 : 0).replace('.', ',')} MB`;
}

export const labelJenis = (jenis: JenisBerkas) =>
	jenis === 'pdf' ? 'PDF' : jenis === 'gambar' ? 'gambar' : 'berkas';

/**
 * Satu lampiran yang sedang dipilih pengirim. Sebelum naik ke wadah, `tautan`-nya
 * object URL berkas di perangkat sendiri (`lokal: true`) sehingga pratinjau muncul
 * seketika — termasuk saat berkas harus ikut formulir, mis. SVG atau PDF besar.
 */
export type LampiranPilihan = {
	nama: string;
	ukuran: number;
	jenis: JenisBerkas;
	tautan: string;
	diWadah: boolean;
	lokal: boolean;
};

/** Tautan gambar mini satu lampiran; `null` bila thumbnail tak mungkin dibuat (PDF lokal). */
export function tautanLampiran(l: LampiranPilihan, lebar: number): string | null {
	if (l.jenis === 'pdf') return l.diWadah ? tautanMini(l.tautan, lebar, 'pdf') : null;
	if (l.jenis !== 'gambar') return null;
	// Gambar dari wadah ditransformasi bila memungkinkan; selebihnya dipakai apa adanya.
	return l.diWadah ? (tautanMini(l.tautan, lebar, 'gambar') ?? l.tautan) : l.tautan;
}

export type RingkasanBerkas = {
	/** Jumlah berkas yang benar-benar terlampir (bukan jumlah slot). */
	jumlah: number;
	/** Slot yang terisi, siap dibaca manusia: “logo, katalog, 3 logo klien”. */
	isi: string[];
};

type BerkasDossier = {
	logoUrl?: string | null;
	katalogUrl?: string | null;
	logoKlienUrls?: string[] | null;
	portofolioFileUrl?: string | null;
	fotoTimUrls?: string[] | null;
	legalitasFileUrl?: string | null;
};

/**
 * Kelengkapan berkas satu dossier, dipakai daftar dossier di dashboard supaya
 * dossier yang berkasnya lengkap (atau kosong) terlihat tanpa perlu dibuka.
 */
export function ringkasanBerkas(row: BerkasDossier): RingkasanBerkas {
	const isi: string[] = [];
	let jumlah = 0;
	const satu = (ada: string | null | undefined, label: string) => {
		if (!ada) return;
		jumlah += 1;
		isi.push(label);
	};
	const banyak = (daftar: string[] | null | undefined, label: string) => {
		const n = daftar?.length ?? 0;
		if (!n) return;
		jumlah += n;
		isi.push(n > 1 ? `${n} ${label}` : label);
	};

	satu(row.logoUrl, 'logo');
	satu(row.katalogUrl, 'katalog');
	banyak(row.logoKlienUrls, 'logo klien');
	satu(row.portofolioFileUrl, 'portofolio');
	banyak(row.fotoTimUrls, 'foto tim');
	satu(row.legalitasFileUrl, 'legalitas');

	return { jumlah, isi };
}

/**
 * Tautan mini untuk pratinjau: `f_auto` (format terbaik yang didukung browser) +
 * `q_auto` (mutu otomatis), dengan lebar dibatasi `c_limit` agar tidak mengunduh
 * berkas penuh. PDF ditampilkan dari halaman pertamanya (`pg_1`) — karena itu
 * ekstensinya menjadi `.jpg`, kalau tetap `.pdf` yang terkirim isi PDF-nya.
 *
 * Mengembalikan `null` bila berkas tidak bisa dikecilkan di URL (bukan sumber daya
 * `image` Cloudinary) — pemanggil memakai tautan aslinya atau menampilkan tautan saja.
 */
export function tautanMini(url: string, lebar: number, jenis: JenisBerkas = jenisBerkas(url)): string | null {
	if (!AWAL_IMAGE.test(url)) return null;
	// SVG sudah vektor: dibiarkan apa adanya agar tetap tajam, dan tanpa biaya transformasi.
	if (jenis === 'gambar' && ekstensiUrl(url) === 'svg') return url;

	const transformasi = (t: string) => (_cocok: string, cloud: string) =>
		`https://res.cloudinary.com/${cloud}/image/upload/${t}/`;

	if (jenis === 'pdf') {
		return url
			.replace(/\.pdf(?=$|[?#])/i, '.jpg')
			.replace(AWAL_IMAGE, transformasi(`pg_1,c_limit,w_${lebar},f_auto,q_auto`));
	}
	if (jenis === 'gambar') {
		return url.replace(AWAL_IMAGE, transformasi(`c_limit,w_${lebar},f_auto,q_auto`));
	}
	return null;
}
