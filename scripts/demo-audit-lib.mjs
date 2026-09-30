import { readFile, readdir, lstat } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

export const sha256 = data => createHash('sha256').update(data).digest('hex');
export async function regularFiles(root) {
  const files=[];
  async function walk(dir) {
    if ((await lstat(dir)).isSymbolicLink()) throw Error('Symlink release directory');
    for(const name of await readdir(dir)) {
      const path=resolve(dir,name),s=await lstat(path);
      if(s.isSymbolicLink()) throw Error('Symlink release entry');
      if(s.isDirectory()) await walk(path);
      else if(s.isFile()) files.push(relative(root,path).replaceAll('\\','/'));
      else throw Error('Non-regular release entry');
    }
  }
  await walk(root);return files.sort();
}
export function auditText(text, name) {
  const forbidden=[
    /[A-Z]:[\\/](?:Users|MycoCompass|CodexMission)/i,
    /(?:MBSC andy|research[\\/]Overleaf|sourceMappingURL=)/i,
    /(?:Thermal conductivity\.xlsx|Compression_Engineering_Properties\.csv|Sheet1![A-Z]+\d+)/i,
    /(?:rawBakedMassG|sourceDensityKgM3|Sigma25_MPa|ApparentModulus_8_12_MPa)["']?\s*:\s*[-.\d]/,
    /(?:github_pat_[A-Za-z0-9_]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|AKIA[A-Z0-9]{16}|sk-(?:proj-)?[A-Za-z0-9_-]{30,})/,
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    /\/api\/(?:assistant|local-export|projects|upload)/,
  ];
  if(forbidden.some(pattern=>pattern.test(text))) throw Error(`Disallowed release content in ${name}`);
}
function keys(object, expected) { assert.deepEqual(Object.keys(object).sort(),expected.split(' ').sort()); }
export function auditPublicCatalogue(c, original) {
  keys(c,'version records');assert.match(c.version,/^public1\./);assert.equal(c.records.length,24);
  assert.equal(new Set(c.records.map(r=>r.id)).size,24);
  for(const r of c.records) {
    keys(r,'disclosure id sourceSampleId idMappingNote shape perforationLevel supportLevel nominalDimensionsM skinDepthM replicates conductivity density compression applicability geometryStatus');
    keys(r.conductivity,'value unit status basis temperatureC source');keys(r.density,'value unit status reason');keys(r.compression,'Sigma10_MPa');
    assert.equal(r.disclosure,'mbsc-public-1');assert.match(r.id,/^(holes|slots)-h[0-3]w[0-2]$/);
    assert.equal(r.id,`${r.shape}-h${r.perforationLevel}w${r.supportLevel}`);
    assert.equal(r.sourceSampleId,r.id);assert.equal(r.idMappingNote,null);
    assert.equal(r.replicates,1);assert.deepEqual(r.nominalDimensionsM,[.12,.12,.04]);assert.equal(r.skinDepthM,.002);
    assert.equal(r.density.value,null);assert.equal(r.density.status,'unresolved_basis');assert.equal(r.density.unit,'kg/m3');
    assert.equal(r.conductivity.unit,'W/mK');assert.equal(r.conductivity.temperatureC,20);
    assert.equal(r.conductivity.basis,'whole_tested_specimen');assert.equal(r.conductivity.status,'source_observation');
    assert.ok(Number.isFinite(r.conductivity.value)&&r.conductivity.value>0);assert.ok(Number.isFinite(r.compression.Sigma10_MPa)&&r.compression.Sigma10_MPa>0);
    assert.equal(r.conductivity.source,`Laboratory MBSC catalogue / ${r.id} / whole-specimen observations`);
    assert.equal(r.density.reason,'Density remains unresolved because the measurement volume basis is not reconciled.');
    assert.equal(r.applicability,'Single coupon observation only. No core-property, edited-geometry, full-size board or wall-performance transfer.');
    assert.equal(r.geometryStatus,'Nominal reconstruction; exact fabrication dimensions remain unresolved.');
    if(original) {
      assert.equal(c.version,`public1.${original.version}`);
      const source=original.records.find(s=>s.id===r.id);assert.ok(source);
      assert.equal(r.conductivity.value,source.conductivity.value);assert.equal(r.compression.Sigma10_MPa,source.compression.Sigma10_MPa);
    }
  }
}
export async function auditDemo(root, original) {
  root=resolve(root);const files=await regularFiles(root),manifest=[];
  for(const required of ['index.html','public-catalogue.json','THIRD_PARTY_NOTICES.txt']) assert.ok(files.includes(required),`Missing ${required}`);
  for(const name of files) {
    assert.ok(['index.html','public-catalogue.json','THIRD_PARTY_NOTICES.txt'].includes(name)||/^assets\/[\w.-]+-[\w-]{8,}\.(js|css)$/.test(name),`Unexpected release file: ${name}`);
    const data=await readFile(resolve(root,name)),text=data.toString('utf8');auditText(text,name);
    manifest.push({path:name,bytes:data.length,sha256:sha256(data)});
    if(original&&name.endsWith('.js')) for(const r of original.records) {
      // Schema names remain for legacy imports; literal internal values must not.
      for(const v of [r.sourceSampleId,r.sourceDensity.formula,r.sourceDensity.cell])
        assert.ok(!text.includes(JSON.stringify(v)),`Internal source literal in ${name}`);
    }
    if(name==='index.html') {
      assert.ok(text.includes('connect-src &#39;none&#39;')||text.includes("connect-src 'none'"),'Missing static CSP');
      for(const [,url] of text.matchAll(/(?:src|href)="([^"]+)"/g))
        assert.ok(url.startsWith('./assets/')&&files.includes(url.slice(2)),`Unexpected or missing entry resource: ${url}`);
    }
  }
  const catalogue=JSON.parse(await readFile(resolve(root,'public-catalogue.json'),'utf8'));auditPublicCatalogue(catalogue,original);
  return {profile:'mycocompass-public-demo-1',catalogueVersion:catalogue.version,files:manifest,bytes:manifest.reduce((n,f)=>n+f.bytes,0)};
}
