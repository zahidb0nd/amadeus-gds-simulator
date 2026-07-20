const fs = require('fs');
const path = require('path');

process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';

if (!process.env.MONGODB_URI) {
	const envPath = path.join(process.cwd(), '.env.local');

	if (fs.existsSync(envPath)) {
		const contents = fs.readFileSync(envPath, 'utf8');

		for (const line of contents.split(/\r?\n/)) {
			const trimmed = line.trim();

			if (!trimmed || trimmed.startsWith('#')) {
				continue;
			}

			const equalsIndex = trimmed.indexOf('=');

			if (equalsIndex === -1) {
				continue;
			}

			const key = trimmed.slice(0, equalsIndex).trim();
			const value = trimmed.slice(equalsIndex + 1).trim().replace(/^['"]|['"]$/g, '');

			if (!process.env[key]) {
				process.env[key] = value;
			}
		}

		// Let Jest forceExit handle closing connections cleanly without throwing MongoExpiredSessionError
		// afterAll(async () => {
		// 	try {
		// 		const { getMongoClient } = require('./src/lib/mongodb');
		// 		const client = await getMongoClient();
		// 		await client.close();
		// 	} catch {
		// 		// No shared client was opened during the test run.
		// 	}
		// });
	}
}

afterAll(async () => {
	try {
		const { getMongoClient } = require('./src/lib/mongodb');
		const client = await getMongoClient();
		await client.close();
	} catch {
		// No shared client was opened during the test run.
	}
});