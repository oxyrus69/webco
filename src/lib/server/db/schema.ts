import { pgTable, uuid, text, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const briefSubmissions = pgTable('brief_submissions', {
	id: uuid('id').defaultRandom().primaryKey(),
	ticket: text('ticket').notNull().unique(),
	status: text('status').notNull().default('baru'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),

	// Bab 1 — Kontak klien
	kontakNama: text('kontak_nama').notNull(),
	kontakJabatan: text('kontak_jabatan').notNull(),
	kontakWa: text('kontak_wa').notNull(),
	kontakEmail: text('kontak_email').notNull(),

	// Bab 2 — Identitas perusahaan
	namaResmi: text('nama_resmi').notNull(),
	singkatan: text('singkatan'),
	tagline: text('tagline'),
	tahunBerdiri: integer('tahun_berdiri'),
	bidang: text('bidang').notNull(),
	alamatPusat: text('alamat_pusat').notNull(),
	alamatCabang: text('alamat_cabang'),
	teleponPerusahaan: text('telepon_perusahaan'),
	emailPerusahaan: text('email_perusahaan'),
	logoUrl: text('logo_url'),

	// Bab 3 — Profil
	sejarah: text('sejarah'),
	visi: text('visi'),
	misi: text('misi'),
	coreValues: text('core_values'),
	targetMarket: text('target_market'),

	// Bab 4 — Produk & layanan
	daftarProduk: text('daftar_produk'),
	usp: text('usp'),
	katalogUrl: text('katalog_url'),

	// Bab 5 — Portofolio
	klienDaftar: text('klien_daftar'),
	logoKlienUrls: jsonb('logo_klien_urls').$type<string[]>().default([]),
	portofolioDesc: text('portofolio_desc'),
	portofolioFileUrl: text('portofolio_file_url'),
	testimoni: text('testimoni'),

	// Bab 6 — Tim & legalitas (opsional)
	anggotaTim: text('anggota_tim'),
	fotoTimUrls: jsonb('foto_tim_urls').$type<string[]>().default([]),
	legalitasDesc: text('legalitas_desc'),
	legalitasFileUrl: text('legalitas_file_url'),

	// Bab 7 — Sosmed
	instagram: text('instagram'),
	linkedin: text('linkedin'),
	facebookX: text('facebook_x'),
	youtubeTiktok: text('youtube_tiktok'),

	// Bab 8 — Desain & fitur
	warnaIdentitas: text('warna_identitas'),
	warnaHex1: text('warna_hex_1'),
	warnaHex2: text('warna_hex_2'),
	gayaDesain: text('gaya_desain'),
	gayaLainnya: text('gaya_lainnya'),
	referensi: text('referensi'),
	fitur: jsonb('fitur').$type<string[]>().default([]),
	catatan: text('catatan')
});

export type BriefSubmission = typeof briefSubmissions.$inferSelect;
export type NewBriefSubmission = typeof briefSubmissions.$inferInsert;
