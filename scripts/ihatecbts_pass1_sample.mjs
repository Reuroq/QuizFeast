// Sample the pass-1 manifest by bucket to eyeball whether the filter caught junk.
import fs from 'node:fs';
const m = JSON.parse(fs.readFileSync('scripts/ihatecbts_pass1_manifest.json'));

function sample(arr, n) {
  if (arr.length <= n) return arr;
  const out = [];
  const step = arr.length / n;
  for (let i = 0; i < n; i++) out.push(arr[Math.floor(i * step)]);
  return out;
}

const byBucket = {};
for (const k of m.keepers) {
  (byBucket[k.bucket] ||= []).push(k);
}

for (const [bucket, arr] of Object.entries(byBucket)) {
  console.log('\n=====', bucket, '(' + arr.length + ' files) =====');
  for (const s of sample(arr, 25)) {
    console.log(`  [${s.matched}]  ${s.filename}`);
  }
}
