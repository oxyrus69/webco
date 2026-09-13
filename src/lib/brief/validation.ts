const teks = (v: unknown) => String(v ?? '');
const emailOk = (v: unknown) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(teks(v).trim());
const telOk = (v: unknown) => /^[+0-9][0-9\s\-().]{7,20}$/.test(teks(v).trim());
const yearOk = (v: unknown) => {
	// Input tahun memakai type="number" sehingga nilainya bisa number, bukan string.
	const s = teks(v).trim();
	if (!s) return true;
	const n = Number(s);
	const now = new Date().getFullYear();
	return Number.isInteger(n) && n >= 1800 && n <= now;
};

export type Errors = Record<string, string>;

// Validasi per bab. Mengembalikan map field->pesan. Kosong = lolos.
export function validateStep(step: number, d: Record<string, string>): Errors {
	const e: Errors = {};
	const need = (k: string, msg = 'Wajib diisi.') => {
		if (!String(d[k] ?? '').trim()) e[k] = msg;
	};
	if (step === 0) {
		need('kontakNama', 'Nama lengkap wajib diisi.');
		need('kontakJabatan', 'Jabatan wajib diisi agar kami tahu peran Anda.');
		need('kontakWa');
		if (!e.kontakWa && !telOk(d.kontakWa)) e.kontakWa = 'Nomor tidak valid. Contoh: 0812-3456-7890.';
		need('kontakEmail');
		if (!e.kontakEmail && !emailOk(d.kontakEmail)) e.kontakEmail = 'Alamat email tidak valid.';
	}
	if (step === 1) {
		need('namaResmi', 'Nama perusahaan wajib diisi.');
		need('bidang', 'Bidang usaha wajib diisi.');
		need('alamatPusat', 'Alamat kantor pusat wajib diisi.');
		if (!yearOk(d.tahunBerdiri ?? '')) e.tahunBerdiri = 'Tahun berdiri harus antara 1800 dan tahun ini.';
		if (d.emailPerusahaan && d.emailPerusahaan.trim() && !emailOk(d.emailPerusahaan))
			e.emailPerusahaan = 'Email perusahaan tidak valid.';
		if (d.teleponPerusahaan && d.teleponPerusahaan.trim() && !telOk(d.teleponPerusahaan))
			e.teleponPerusahaan = 'Nomor telepon perusahaan tidak valid.';
	}
	if (step === 2) {
		need('sejarah', 'Ceritakan sejarah singkat, minimal 2 kalimat.');
		if (!e.sejarah && String(d.sejarah ?? '').trim().length < 40)
			e.sejarah = 'Tambahkan sedikit lagi agar halaman Tentang Kami punya bahan.';
		need('visi', 'Visi wajib diisi.');
		need('misi', 'Misi wajib diisi.');
	}
	if (step === 3) {
		need('daftarProduk', 'Daftar produk atau layanan wajib diisi.');
	}
	if (step === 7) {
		need('warnaIdentitas', 'Tulis warna identitas. Contoh: biru dongker dan emas.');
		need('gayaDesain', 'Pilih satu gaya desain.');
		if (d.gayaDesain === 'Lainnya' && !String(d.gayaLainnya ?? '').trim())
			e.gayaLainnya = 'Tulis gaya yang Anda maksud.';
	}
	return e;
}

// Bab 4,5,6,7(bagian sosmed) opsional — selalu lolos kecuali format salah.
export function isStepOptional(step: number) {
	return step === 4 || step === 5 || step === 6;
}
