#!/usr/bin/env bun

import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomBytes } from 'node:crypto';

const env = process.env;
const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '../..');
const baseUrl = env.BASE_URL ?? localDomainBaseUrl() ?? 'http://localhost';
const outputPath = env.E2E_ADMIN_STORAGE_STATE ?? '.auth/admin.json';
const composeService = env.E2E_POSTGRES_SERVICE ?? 'postgres';
const dbName = env.POSTGRES_DB ?? 'todo';
const dbUser = env.POSTGRES_USER ?? 'todo';
const dbSchema = env.E2E_POSTGRES_SCHEMA ?? env.POSTGRES_SCHEMA;
const adminEmail = env.E2E_ADMIN_EMAIL;
const refreshDays = Number(env.E2E_REFRESH_TOKEN_DAYS ?? '30');

type AdminUser = {
	id: string;
	email: string;
};

function localDomainBaseUrl(): string | undefined {
	const domainFile = resolve(repoRoot, '.local-domain');
	if (!existsSync(domainFile)) {
		return undefined;
	}
	const domain = readFileSync(domainFile, 'utf8').replaceAll('\r', '').trim();
	return domain ? `https://${domain}` : undefined;
}

function printHelp() {
	console.log(`Creates ${outputPath} from an initialized database.

The script selects an unblocked admin user, inserts a refresh token into the
database, and writes a Playwright storage state file with the matching
refreshToken cookie.

Usage:
  cd e2e
  BASE_URL=https://todo.test bun run auth:admin

Environment:
  BASE_URL                    App URL used by Playwright. Default: https://../.local-domain or http://localhost
  E2E_ADMIN_STORAGE_STATE     Output file. Default: .auth/admin.json
  E2E_ADMIN_EMAIL             Optional admin email to select
  E2E_POSTGRES_SERVICE        Docker Compose service. Default: postgres
  POSTGRES_DB                 Database name. Default: todo
  POSTGRES_USER               Database user. Default: todo
  E2E_POSTGRES_SCHEMA         Optional schema/search_path for users and refresh_tokens
  POSTGRES_SCHEMA             Alias for E2E_POSTGRES_SCHEMA
  E2E_REFRESH_TOKEN_DAYS      Refresh token lifetime. Default: 30

Requires the Docker Compose postgres service to be running.`);
}

function sqlString(value: string): string {
	return `'${value.replaceAll("'", "''")}'`;
}

function pgOptionsSearchPath(value: string): string {
	if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
		throw new Error(`E2E_POSTGRES_SCHEMA must be a simple PostgreSQL identifier, got ${value}`);
	}
	return `-c search_path=${value},public`;
}

async function psql(sql: string): Promise<string> {
	const proc = Bun.spawn({
		cmd: [
			'docker',
			'compose',
			'exec',
			'-T',
			...(dbSchema ? ['-e', `PGOPTIONS=${pgOptionsSearchPath(dbSchema)}`] : []),
			composeService,
			'psql',
			'-U',
			dbUser,
			'-d',
			dbName,
			'-At',
			'-F',
			'\t',
			'-c',
			sql,
		],
		stdout: 'pipe',
		stderr: 'pipe',
	});
	const [stdout, stderr, exitCode] = await Promise.all([
		new Response(proc.stdout).text(),
		new Response(proc.stderr).text(),
		proc.exited,
	]);
	if (exitCode !== 0) {
		throw new Error(`psql failed (${exitCode}): ${stderr.trim() || stdout.trim()}`);
	}
	return stdout.trim();
}

async function findAdmin(): Promise<AdminUser> {
	const emailFilter = adminEmail ? `AND lower(email) = lower(${sqlString(adminEmail)})` : '';
	const result = await psql(`
		SELECT id, email
		FROM users
		WHERE admin = true
		  AND blocked_at IS NULL
		  ${emailFilter}
		ORDER BY created_at
		LIMIT 1
	`);
	if (!result) {
		throw new Error(adminEmail
			? `No unblocked admin found for E2E_ADMIN_EMAIL=${adminEmail}`
			: 'No unblocked admin user found in the initialized database');
	}
	const [id, email] = result.split('\t');
	return { id, email };
}

async function createRefreshToken(userId: string): Promise<{ raw: string; expiresAt: number }> {
	const raw = randomBytes(32).toString('hex');
	const hash = createHash('sha256').update(raw, 'utf8').digest('hex');
	const expiresAt = Math.floor(Date.now() / 1000) + refreshDays * 24 * 60 * 60;
	await psql(`
		INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
		VALUES (${sqlString(userId)}, ${sqlString(hash)}, to_timestamp(${expiresAt}))
	`);
	return { raw, expiresAt };
}

async function main() {
	if (process.argv.includes('--help') || process.argv.includes('-h')) {
		printHelp();
		return;
	}
	if (!Number.isFinite(refreshDays) || refreshDays <= 0) {
		throw new Error(`E2E_REFRESH_TOKEN_DAYS must be a positive number, got ${env.E2E_REFRESH_TOKEN_DAYS}`);
	}

	const admin = await findAdmin();
	const refreshToken = await createRefreshToken(admin.id);
	const url = new URL(baseUrl);
	const storageState = {
		cookies: [
			{
				name: 'refreshToken',
				value: refreshToken.raw,
				domain: url.hostname,
				path: '/api/auth',
				expires: refreshToken.expiresAt,
				httpOnly: true,
				secure: true,
				sameSite: 'Strict',
			},
		],
		origins: [],
	};

	await mkdir(dirname(outputPath), { recursive: true });
	await writeFile(outputPath, `${JSON.stringify(storageState, null, 2)}\n`);
	console.log(`Wrote ${outputPath} for admin ${admin.email}`);
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});
