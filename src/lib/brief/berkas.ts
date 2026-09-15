// Definisi slot berkas dossier — satu sumber kebenaran untuk UI pengirim,
// validasi server, dan token unggah langsung ke Vercel Blob.
export type SlotBerkas = {
	nama: string;
	label: string;
	maksMB: number;
	tipe: string[];
	banyak?: boolean;
};

export const MB = 1024 * 1024;

export const SLOT_BERKAS: SlotBerkas[] = [
	{
		nama: 'logoFile',
		label: 'Logo perusahaan',
		maksMB: 5,
		tipe: ['image/png', 'image/svg+xml', 'image/webp', 'image/jpeg']
	},
	{
		nama: 'katalogFile',
		label: 'Katalog / brosur',
		maksMB: 10,
		tipe: ['application/pdf']
	},
	{
		nama: 'logoKlienFiles',
		label: 'Logo klien / mitra',
		maksMB: 5,
		tipe: ['image/png', 'image/svg+xml', 'image/webp', 'image/jpeg'],
		banyak: true
	},
	{
		nama: 'portofolioFile',
		label: 'Berkas portofolio',
		maksMB: 10,
		tipe: ['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
	},
	{
		nama: 'fotoTimFiles',
		label: 'Foto anggota tim',
		maksMB: 5,
		tipe: ['image/jpeg', 'image/png', 'image/webp'],
		banyak: true
	},
	{
		nama: 'legalitasFile',
		label: 'Berkas sertifikasi',
		maksMB: 10,
		tipe: ['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
	}
];

export const slotBerkas = (nama: string) => SLOT_BERKAS.find((s) => s.nama === nama);

/** Nama berkas yang aman dipakai di URL, header respons, dan filesystem. */
export function namaAman(nama: string) {
	return nama.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-60) || 'berkas';
}

/** Berapa MB yang membulatkan angka besar agar pesan tetap terbaca. */
export const mb = (byte: number) => (byte / MB).toFixed(byte < 10 * MB ? 1 : 0).replace('.0', '');

/**
 * Pesan saat berkas ditolak karena ukuran — selalu menyebut cara memulihkan,
 * bukan sekadar kode galat (prinsip produk: jujur soal berkas).
 */
export function pesanTerlaluBesar(slot: SlotBerkas, byte: number, batasMB: number) {
	return `${slot.label} berukuran ${mb(byte)}MB, sedangkan batas di sini ${batasMB}MB. Kecilkan berkasnya (kompres PDF atau perkecil gambarnya) lalu unggah ulang — atau tempel tautan berkas di kolom catatan Bab 08, tim kami mengambilnya dari sana.`;
}

/**
 * Nama format Cloudinary per tipe MIME. Dipakai untuk menandatangani unggahan
 * langsung, supaya Cloudinary sendiri yang menolak format di luar slot.
 */
const FORMAT_CLOUDINARY: Record<string, string> = {
	'image/png': 'png',
	'image/svg+xml': 'svg',
	'image/webp': 'webp',
	'image/jpeg': 'jpg',
	'application/pdf': 'pdf'
};

export function formatSlotCloudinary(slot: SlotBerkas): string[] {
	const set = new Set(slot.tipe.map((t) => FORMAT_CLOUDINARY[t]).filter(Boolean));
	// Cloudinary menormalkan .jpeg menjadi jpg; keduanya diterima agar unggahan wajar tidak ditolak.
	if (set.has('jpg')) set.add('jpeg');
	// SVG tidak boleh ikut daftar ini: begitu `allowed_formats` memuat "svg", Cloudinary
	// menolak unggahannya dengan "Raw file format svg not allowed". Berkas SVG karena itu
	// dikirim lewat formulir dan disimpan di sisi server — hasilnya tetap Cloudinary.
	set.delete('svg');
	return [...set];
}

const LABEL_TIPE: Record<string, string> = {
	'image/png': 'PNG',
	'image/svg+xml': 'SVG',
	'image/webp': 'WebP',
	'image/jpeg': 'JPG',
	'application/pdf': 'PDF'
};

export function pesanTipeSalah(slot: SlotBerkas) {
	const daftar = slot.tipe.map((t) => LABEL_TIPE[t] ?? t).join(', ');
	return `${slot.label} berformat tidak didukung. Ubah ke ${daftar} lalu unggah ulang.`;
}
