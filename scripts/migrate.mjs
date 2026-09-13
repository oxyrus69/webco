// Migrasi skema WebCo. ke Neon — menjalankan semua drizzle/*.sql berurutan (idempoten).
import { readdir, readFile } from 'node:fs/promises';
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';

config();
const url = process.env.DATABASE_URL;
if (!url) {
	console.error('DATABASE_URL kosong. Isi file .env dulu.');
	process.exit(1);
}
const sql = neon(url);
const dir = new URL('../drizzle/', import.meta.url);
const berkas = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort();
for (const nama of berkas) {
	const ddl = await readFile(new URL(nama, dir), 'utf8');
	for (const stmt of ddl.split(';').map((s) => s.trim()).filter(Boolean)) {
		await sql.query(stmt);
	}
	console.log('ok:', nama);
}
console.log('Migrasi selesai: skema WebCo. siap.');
