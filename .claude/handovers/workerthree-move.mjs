import fs from 'node:fs'; import path from 'node:path'; import { execFileSync } from 'node:child_process';
const [ , , mapFile, mode ] = process.argv;
const write = mode === 'write';
const app = '/Users/apple/Projects/personal/slur/apps/client/app';
const pairs = JSON.parse(fs.readFileSync(mapFile,'utf8'));
const moves = new Map();
for (const [from,to] of pairs) {
  const a = path.join(app,from), b = path.join(app,to);
  if (fs.statSync(a).isDirectory()) { for (const n of fs.readdirSync(a)) moves.set(path.join(a,n), path.join(b,n)); }
  else moves.set(a,b);
}
const rule = l => `id: spec-${l}\nlanguage: ${l}\nrule:\n  kind: string\n  regex: "^['\\"](\\\\.|~/)"\n`;
const rules = rule('typescript') + '---\n' + rule('tsx');
const out = execFileSync('ast-grep',['scan','--inline-rules',rules,'--json=compact',path.dirname(app)+'/app'],{maxBuffer:1<<28}).toString();
const matches = JSON.parse(out);
const exts = ['', '.ts', '.tsx', '/index.ts'];
const resolveFile = abs => { for (const e of exts) { const p = abs+e; if (fs.existsSync(p) && fs.statSync(p).isFile()) return [p,e]; } return [null,null]; };
const edits = new Map();
for (const m of matches) {
  const f = path.resolve(path.dirname(app), m.file.startsWith('/')?m.file:path.relative(path.dirname(app), path.resolve(m.file)));
  const file = path.resolve(m.file);
  const raw = m.text; const q = raw[0]; const s = raw.slice(1,-1);
  const alias = s.startsWith('~/');
  const abs = alias ? path.join(app,s.slice(2)) : path.resolve(path.dirname(file),s);
  const [target, ext] = resolveFile(abs);
  if (!target) { console.error('UNRESOLVED', path.relative(app,file), s); continue; }
  const fNew = moves.get(file) ?? file; const tNew = moves.get(target) ?? target;
  if (fNew === file && tNew === target) continue;
  let tSpec = ext ? tNew.slice(0, tNew.length - ext.length) : tNew;
  let ns;
  if (alias) ns = '~/' + path.relative(app, tSpec);
  else { ns = path.relative(path.dirname(fNew), tSpec); if (!ns.startsWith('.')) ns = './' + ns; }
  if (ns === s) continue;
  (edits.get(file) ?? edits.set(file, []).get(file)).push({ start: m.range.byteOffset.start, end: m.range.byteOffset.end, text: q+ns+q, old: s });
}
const touched = new Set([...edits.keys()]);
for (const f of touched) for (const e of edits.get(f)) console.log(`${path.relative(app,f)}${moves.has(f)?' -> '+path.relative(app,moves.get(f)):''}: ${e.old} => ${e.text}`);
console.log('files with edits:', touched.size, 'moved files:', moves.size);
if (!write) process.exit(0);
for (const [a,b] of moves) {
  let buf = fs.readFileSync(a);
  const es = (edits.get(a) ?? []).sort((x,y)=>y.start-x.start);
  for (const e of es) buf = Buffer.concat([buf.subarray(0,e.start), Buffer.from(e.text), buf.subarray(e.end)]);
  fs.mkdirSync(path.dirname(b),{recursive:true}); fs.writeFileSync(b,buf); fs.unlinkSync(a);
}
for (const [f,es] of edits) { if (moves.has(f)) continue;
  let buf = fs.readFileSync(f); for (const e of es.sort((x,y)=>y.start-x.start)) buf = Buffer.concat([buf.subarray(0,e.start), Buffer.from(e.text), buf.subarray(e.end)]); fs.writeFileSync(f,buf); }
for (const [from] of pairs) { const a = path.join(app,from); if (fs.existsSync(a) && fs.statSync(a).isDirectory() && fs.readdirSync(a).length===0) fs.rmdirSync(a); }
console.log('written');
