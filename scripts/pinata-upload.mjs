// pinata-upload.mjs — Upload DEX frontend to IPFS via Pinata
import { readFileSync } from 'fs';
import { resolve, relative, basename, extname } from 'path';
import fs from 'fs';

const PINATA_KEY = '3d9c62f5ea59126cdde1';
const PINATA_SECRET = encodeURIComponent('V5XLLvei98@B3Gs');

const DIST = 'D:/openclaw-tools/ion-dex-nuke/frontend/dist';

async function uploadFile(filePath, name) {
  const FormData = (await import('form-data')).default;
  const form = new FormData();
  form.append('file', readFileSync(filePath), { filename: basename(filePath) });
  form.append('pinataMetadata', JSON.stringify({ name }));
  form.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));

  const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      pinata_api_key: PINATA_KEY,
      pinata_secret_api_key: PINATA_SECRET,
    },
    body: form,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Pinata: ${JSON.stringify(err)}`);
  }
  return res.json();
}

async function main() {
  console.log('=== Uploading DEX frontend to IPFS ===\n');
  
  // Upload each file
  const files = fs.readdirSync(DIST, { recursive: true }).filter(f => {
    const full = resolve(DIST, f);
    return fs.statSync(full).isFile();
  });

  const results = {};
  for (const file of files) {
    const fullPath = resolve(DIST, file);
    const name = file.replace(/\\/g, '/');
    console.log(`Uploading: ${name} (${(fs.statSync(fullPath).size / 1024).toFixed(1)} KB)`);
    try {
      const r = await uploadFile(fullPath, name);
      results[name] = r.IpfsHash;
      console.log(`  → CID: ${r.IpfsHash}`);
    } catch (e) {
      console.error(`  ✗ ${e.message}`);
    }
  }

  console.log('\n=== Upload Summary ===');
  for (const [name, cid] of Object.entries(results)) {
    console.log(`  ${cid} → ${name}`);
    console.log(`  https://gateway.pinata.cloud/ipfs/${cid}`);
  }

  // Save CID manifest
  const manifest = {
    uploaded: new Date().toISOString(),
    files: results,
    gateway: 'https://gateway.pinata.cloud/ipfs/',
  };
  fs.writeFileSync('D:/openclaw-tools/ion-dex-nuke/frontend/dist/ipfs-manifest.json', JSON.stringify(manifest, null, 2));
  console.log('\nManifest saved to dist/ipfs-manifest.json');
}

main().catch(e => { console.error(e); process.exit(1); });
