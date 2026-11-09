import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';

const version = JSON.parse(await readFile('package.json')).version;
const output = join(homedir(), 'downloads', 'dist');
const scratch = await mkdtemp(join(tmpdir(), 'reopen-review-source-'));
try {
  for (const file of ['extension', 'assets', 'scripts', 'tests', 'docs', 'store', 'package.json', 'package-lock.json', 'build.sh', 'README.md', 'PRIVACY.md', 'SUPPORT.md', 'LICENSE']) {
    await cp(file, join(scratch, file), { recursive: true });
  }
  await mkdir(join(scratch, 'third-party'), { recursive: true });
  for (const name of ['tldts', 'tldts-core']) {
    await cp(`node_modules/${name}`, join(scratch, 'third-party', name), { recursive: true });
  }
  await writeFile(join(scratch, 'REVIEW-README.md'), `# Reopen History ${version}: reviewer source\n\nRead docs/REVIEW-BUILD.md for exact reproduction commands and third-party provenance.\nThe extension source is in extension/. The third-party/ directory contains the exact installed tldts and tldts-core packages, including readable sources, licenses and source maps. These are reference copies, not executable build dependencies.\n`);
  const archive = join(output, `reopen-history-review-source-${version}.zip`);
  await rm(archive, { force: true });
  execFileSync('/usr/bin/zip', ['-qr', archive, '.'], { cwd: scratch });
  console.log(`Built reviewer source: ${archive}`);
} finally {
  await rm(scratch, { recursive: true, force: true });
}
