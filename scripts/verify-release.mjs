import { readFile, readdir, lstat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { auditDemo, auditText, regularFiles, sha256 } from './demo-audit-lib.mjs';

export async function verifyRelease(root) {
  root=resolve(root);
  const manifest=JSON.parse(await readFile(resolve(root,'release-manifest.json'),'utf8'));
  assert.equal(manifest.format,'mycocompass-release-1');
  const actual=[];
  for(const name of await readdir(root)) {
    if(name==='.git') continue;
    const full=resolve(root,name),s=await lstat(full);assert.ok(!s.isSymbolicLink(),'Symlink release entry');
    if(s.isDirectory()) actual.push(...(await regularFiles(full)).map(f=>`${name}/${f}`));
    else if(s.isFile()&&name!=='release-manifest.json') actual.push(name);
    else if(!s.isFile()) throw Error('Non-regular release entry');
  }
  assert.deepEqual(actual.sort(),manifest.files.map(f=>f.path).sort(),'Release file list differs');
  for(const required of ['README.md','.github/workflows/pages.yml','scripts/demo-audit-lib.mjs','scripts/verify-release.mjs'])
    assert.ok(actual.includes(required),`Missing release support: ${required}`);
  for(const f of manifest.files) {
    assert.ok(/^site\//.test(f.path)||['README.md','.github/workflows/pages.yml','scripts/demo-audit-lib.mjs','scripts/verify-release.mjs'].includes(f.path),'Unexpected release support file');
    assert.ok(!f.path.includes('..')&&!f.path.includes('\\'),'Invalid release path');
    const data=await readFile(resolve(root,f.path));assert.equal(data.length,f.bytes);assert.equal(sha256(data),f.sha256,`Checksum mismatch: ${f.path}`);
    // Scanner source contains prohibited-pattern examples; it is fixed, checksum-pinned support code.
    if(!f.path.startsWith('scripts/')) auditText(data.toString('utf8'),f.path);
  }
  const report=await auditDemo(resolve(root,'site'));
  assert.equal(report.catalogueVersion,manifest.catalogueVersion);
  return {format:manifest.format,files:manifest.files.length,siteBytes:report.bytes,catalogueVersion:report.catalogueVersion};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)
  console.log(JSON.stringify(await verifyRelease(process.argv[2]??'.'),null,2));
