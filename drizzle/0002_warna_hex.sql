-- WebCo. — kode hex identitas dari color picker Bab 08 (opsional)
alter table if exists brief_submissions
	add column if not exists warna_hex_1 text,
	add column if not exists warna_hex_2 text;
