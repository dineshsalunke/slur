import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const repo=path.resolve(root,'../../../../../..');
const three=path.join(repo,'node_modules/.pnpm/three@0.185.1/node_modules/three');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.glb':'model/gltf-binary','.png':'image/png','.json':'application/json'};
http.createServer(async(req,res)=>{
 try {
  const url=new URL(req.url,'http://localhost');
  const isThree=url.pathname.startsWith('/three/'),base=isThree?three:root;
  const file=path.resolve(base,'.'+(isThree?url.pathname.slice(6):url.pathname==='/'?'/preview.html':decodeURIComponent(url.pathname)));
  if(!file.startsWith(base+path.sep)){res.writeHead(403).end();return;}
  const bytes=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'}).end(bytes);
 }catch{res.writeHead(404).end('Not found');}
}).listen(19731,'127.0.0.1',()=>console.log('Cutlass preview: http://127.0.0.1:19731'));
