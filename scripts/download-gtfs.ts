import { existsSync, mkdirSync } from 'fs';
import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';
import extract from 'extract-zip';
import { GTFS_URL } from '../lib/constants';

const DATA_DIR = join(process.cwd(), 'data', 'gtfs');
const ZIP_PATH = join(DATA_DIR, 'gtfs_stm.zip');
const ETAG_PATH = join(process.cwd(), '.gtfs-etag');

async function main() {
  mkdirSync(DATA_DIR, { recursive: true });

  // Check ETag for freshness
  let oldEtag = '';
  try {
    oldEtag = await readFile(ETAG_PATH, 'utf-8');
  } catch {}

  console.log(`Downloading ${GTFS_URL} …`);
  const res = await fetch(GTFS_URL, {
    headers: oldEtag ? { 'If-None-Match': oldEtag } : {},
  });

  if (res.status === 304) {
    console.log('GTFS data is up to date (ETag match).');
    return;
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }

  const etag = res.headers.get('etag') || '';
  const data = Buffer.from(await res.arrayBuffer());
  await writeFile(ZIP_PATH, data);
  console.log(`Downloaded ${(data.length / 1024 / 1024).toFixed(1)} MB`);

  console.log('Extracting…');
  await extract(ZIP_PATH, { dir: DATA_DIR });
  console.log('Extracted to', DATA_DIR);

  if (etag) await writeFile(ETAG_PATH, etag);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
