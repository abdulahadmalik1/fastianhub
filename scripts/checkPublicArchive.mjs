import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const archive = JSON.parse(readFileSync('data/pastPapers.json', 'utf8'));
const serverFields = new Set(['repo', 'rawBase', 'downloadUrl']);
function checkFields(value) {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    assert.ok(!serverFields.has(key), `Server-only field in public archive: ${key}`);
    checkFields(child);
  }
}
checkFields(archive);

// Inspect emitted browser assets as well as HTML/RSC responses: stripping data
// at runtime would still leak its original contents in the JavaScript bundle.
let checked = 0;
function scan(directory, extensions) {
  for (const item of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, item.name);
    if (item.isDirectory()) scan(path, extensions);
    else if (extensions.test(item.name)) {
      const content = readFileSync(path, 'utf8');
      assert.ok(!/malikhacks|FAST-NUCES-CFD|abdulahadmalik1\/fastianhub/i.test(content), `Source identity exposed in ${path}`);
      checked++;
    }
  }
}
scan('.next/static', /\.(js|json|map|css)$/);
scan('.next/server/app', /\.(html|rsc)$/);
assert.ok(checked > 0, 'Build the production site before checking');
console.log(`PASS public archive and ${checked} production browser assets/responses contain no private source identity`);
