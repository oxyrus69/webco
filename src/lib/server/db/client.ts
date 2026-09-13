import { env } from '$env/dynamic/private';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

function buatDb() {
	const url = env.DATABASE_URL;
	if (!url) {
		console.error('[webco] DATABASE_URL kosong — set di Vercel: Settings → Environment Variables → DATABASE_URL, lalu Redeploy.');
		throw new Error('DATABASE_URL belum diisi. Set Environment Variable DATABASE_URL di Vercel.');
	}
	return drizzle(neon(url), { schema });
}

// Lazy: koneksi Neon hanya dibuat saat query pertama, bukan saat build/prerender.
let cache: ReturnType<typeof buatDb> | null = null;
export const db = new Proxy({} as ReturnType<typeof buatDb>, {
	get(_t, prop, recv) {
		if (!cache) cache = buatDb();
		return Reflect.get(cache, prop, recv);
	}
});
