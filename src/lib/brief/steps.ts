// Metadata 8 bab dossier WebCo. — dipakai navigator, validasi, dan admin.
export type StepDef = {
	no: string;
	id: string;
	judul: string;
	sub: string;
	wajib: boolean;
};

export const STEPS: StepDef[] = [
	{ no: '01', id: 'kontak', judul: 'Informasi Kontak Klien', sub: 'Siapa yang bisa kami hubungi setiap hari', wajib: true },
	{ no: '02', id: 'identitas', judul: 'Identitas Dasar Perusahaan', sub: 'Nama, bidang, alamat, dan logo', wajib: true },
	{ no: '03', id: 'profil', judul: 'Profil & Latar Belakang', sub: 'Bahan halaman Tentang Kami', wajib: true },
	{ no: '04', id: 'produk', judul: 'Produk & Layanan', sub: 'Apa yang Anda jual dan apa pembedanya', wajib: true },
	{ no: '05', id: 'portofolio', judul: 'Portofolio, Klien & Testimoni', sub: 'Bukti yang membangun kepercayaan', wajib: false },
	{ no: '06', id: 'tim', judul: 'Tim & Legalitas', sub: 'Opsional: direksi, sertifikasi, penghargaan', wajib: false },
	{ no: '07', id: 'sosial', judul: 'Tautan & Sosial Media', sub: 'Tempat pengunjung menemukan Anda', wajib: false },
	{ no: '08', id: 'desain', judul: 'Desain & Fitur Web', sub: 'Warna, gaya, referensi, dan kebutuhan', wajib: true }
];

export const GAYA_DESAIN = [
	'Minimalis & Modern',
	'Elegan & Mewah',
	'Ceria & Penuh Warna',
	'Korporat & Profesional',
	'Lainnya'
] as const;

export const FITUR_LIST = [
	{ id: 'multibahasa', label: 'Multi-bahasa (Bilingual)', desc: 'Indonesia + Inggris dengan tombol alih bahasa' },
	{ id: 'formulir', label: 'Formulir Kontak / Penawaran Harga', desc: 'Pengunjung bisa meminta penawaran langsung' },
	{ id: 'wa-float', label: 'Tombol Chat WhatsApp (Floating CTA)', desc: 'Tombol melayang yang membuka chat WA' },
	{ id: 'gmaps', label: 'Integrasi Google Maps', desc: 'Peta alamat kantor di halaman kontak' },
	{ id: 'blog', label: 'Blog / Artikel', desc: 'Ruang berita, tips, dan studi kasus' },
	{ id: 'galeri', label: 'Galeri Foto / Video', desc: 'Kumpulan dokumentasi proyek dan tim' }
] as const;

export const CONTOH: Record<string, string> = {
	kontakNama: 'cth: Ratna Prameswari',
	bidang: 'cth: Konstruksi baja ringan',
	alamatPusat: 'cth: Jl. Merdeka No. 88, Bandung 40115',
	daftarProduk: 'cth: 1) Atap baja ringan — garansi 10 tahun. 2) Jasa pasang — survei gratis Jabodetabek.',
	usp: 'cth: Survei 24 jam dan garansi tertulis, kompetitor hanya garansi lisan.',
	targetMarket: 'cth: B2B kontraktor dan B2C keluarga muda 25–40 tahun.',
	referensi: 'cth: Tempel 2–3 link website yang Anda suka beserta alasannya.'
};
