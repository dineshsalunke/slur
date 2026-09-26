import { mkdir, writeFile } from 'node:fs/promises';
import { deflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const OUT = path.dirname(fileURLToPath(import.meta.url));
await mkdir(path.join(OUT, 'textures'), { recursive: true });
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const add = (a, b) => a.map((v, i) => v + b[i]);
const sub = (a, b) => a.map((v, i) => v - b[i]);
const mul = (a, s) => a.map(v => v * s);
const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const unit = a => mul(a, 1 / (Math.hypot(...a) || 1));
const mix = (a, b, t) => a + (b-a)*t;

const crcTable = Array.from({length:256}, (_, n) => {
  let c=n; for(let k=0;k<8;k++) c=(c&1)?0xedb88320^(c>>>1):c>>>1; return c>>>0;
});
function crc32(buf) { let c=0xffffffff; for(const b of buf)c=crcTable[(c^b)&255]^(c>>>8); return (c^0xffffffff)>>>0; }
function png(w,h,pixels) {
  const chunk=(type,data)=>{const t=Buffer.from(type);const b=Buffer.alloc(data.length+12);b.writeUInt32BE(data.length);t.copy(b,4);data.copy(b,8);b.writeUInt32BE(crc32(Buffer.concat([t,data])),data.length+8);return b;};
  const ih=Buffer.alloc(13);ih.writeUInt32BE(w);ih.writeUInt32BE(h,4);ih[8]=8;ih[9]=2;
  const scan=Buffer.alloc(h*(w*3+1));for(let y=0;y<h;y++)pixels.copy(scan,y*(w*3+1)+1,y*w*3,(y+1)*w*3);
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ih),chunk('IDAT',deflateSync(scan,{level:9})),chunk('IEND',Buffer.alloc(0))]);
}
function hash(x,y){let v=Math.imul(x,374761393)^Math.imul(y,668265263)^17391;v=Math.imul(v^(v>>>13),1274126177);return ((v^(v>>>16))>>>0)/4294967295;}
function noise(x,y){const i=Math.floor(x),j=Math.floor(y);let a=x-i,b=y-j;a=a*a*(3-2*a);b=b*b*(3-2*b);return mix(mix(hash(i,j),hash(i+1,j),a),mix(hash(i,j+1),hash(i+1,j+1),a),b);}
const S=1024, field=new Float32Array(S*S), wear=new Float32Array(S*S);
for(let y=0;y<S;y++)for(let x=0;x<S;x++){
  const n=.55*noise(x/92,y/92)+.28*noise(x/23,y/23)+.17*noise(x/5,y/5);
  field[y*S+x]=n*.10+(hash(x,y)-.5)*.018;
  wear[y*S+x]=n;
}
for(let i=0;i<1300;i++){
  const x0=Math.floor(hash(i,100)*S),y0=Math.floor(hash(i,200)*S),len=2+hash(i,300)*25,angle=hash(i,400)*6.283;
  for(let k=0;k<len;k++){const x=Math.round(x0+Math.cos(angle)*k),y=Math.round(y0+Math.sin(angle)*k);if(x<0||y<0||x>=S||y>=S)continue;field[y*S+x]-=.016;wear[y*S+x]+=.25*(1-k/len);}
}
const color=Buffer.alloc(S*S*3),orm=Buffer.alloc(S*S*3),normal=Buffer.alloc(S*S*3);
for(let y=0;y<S;y++)for(let x=0;x<S;x++){
 const i=y*S+x,j=i*3,n=wear[i],grain=hash(x+7,y+19)-.5;
 const v=43+(n-.5)*23+grain*3;
 color[j]=clamp(v,22,78);color[j+1]=clamp(v+1,22,80);color[j+2]=clamp(v+2,22,82);
 orm[j]=255;orm[j+1]=clamp(163+(n-.5)*38+grain*9,120,205);orm[j+2]=184;
 const dx=field[y*S+((x+1)%S)]-field[y*S+((x-1+S)%S)],dy=field[((y+1)%S)*S+x]-field[((y-1+S)%S)*S+x];
 const nv=unit([-dx*2.5,dy*2.5,1]);for(let k=0;k<3;k++)normal[j+k]=Math.round((nv[k]*.5+.5)*255);
}
const textureEntries=[['graphite-basecolor.png',png(S,S,color)],['graphite-orm.png',png(S,S,orm)],['graphite-normal.png',png(S,S,normal)]];
for(const [name,data]of textureEntries)await writeFile(path.join(OUT,'textures',name),data);

const materials=[
 {name:'Graphite · worn coated metal',pbrMetallicRoughness:{baseColorTexture:{index:0},metallicRoughnessTexture:{index:1},metallicFactor:1,roughnessFactor:1},normalTexture:{index:2,scale:.6}},
 {name:'Graphite · bevels',pbrMetallicRoughness:{baseColorFactor:[.012,.014,.017,1],metallicFactor:.72,roughnessFactor:.64}},
 {name:'Dark recesses and seam housings',pbrMetallicRoughness:{baseColorFactor:[.008,.01,.012,1],metallicFactor:.48,roughnessFactor:.76}},
 {name:'Fasteners and vent blades',pbrMetallicRoughness:{baseColorFactor:[.038,.042,.047,1],metallicFactor:.85,roughnessFactor:.50}},
 {name:'Marigold · interrupted boundary seams',pbrMetallicRoughness:{baseColorFactor:[.18,.06,.002,1],metallicFactor:.2,roughnessFactor:.35},emissiveFactor:[1,.40,.015],extensions:{KHR_materials_emissive_strength:{emissiveStrength:2.5}}},
 {name:'Marigold · engine cores',pbrMetallicRoughness:{baseColorFactor:[.2,.08,.003,1],metallicFactor:.15,roughnessFactor:.35},emissiveFactor:[1,.48,.025],extensions:{KHR_materials_emissive_strength:{emissiveStrength:5}}},
 {name:'Engine collar · dark bronze',pbrMetallicRoughness:{baseColorFactor:[.065,.038,.014,1],metallicFactor:.82,roughnessFactor:.48}}
];
const groups=new Map();let faces=0;
function bucket(mat,part){const key=part+'|'+mat;if(!groups.has(key))groups.set(key,{mat,part,p:[],n:[],uv:[],t:[]});return groups.get(key);}
function tri(a,b,c,mat,part,prefer){
 let n=unit(cross(sub(b,a),sub(c,a)));if(Math.hypot(...cross(sub(b,a),sub(c,a)))<1e-10)return;
 if(prefer&&dot(n,prefer)<0){[b,c]=[c,b];n=mul(n,-1);}
 const axis=Math.abs(n[1])>.5?1:(Math.abs(n[2])>.5?2:0);
 const uv=p=>axis===1?[(p[0]+1.2)/2.4,(p[2]+1.2)/2.4]:axis===2?[(p[0]+1.2)/2.4,(p[1]+.2)/.7]:[(p[2]+1.2)/2.4,(p[1]+.2)/.7];
 const uvs=[uv(a),uv(b),uv(c)],e1=sub(b,a),e2=sub(c,a),du1=uvs[1][0]-uvs[0][0],dv1=uvs[1][1]-uvs[0][1],du2=uvs[2][0]-uvs[0][0],dv2=uvs[2][1]-uvs[0][1],det=du1*dv2-du2*dv1;
 let tan=Math.abs(det)>1e-12?mul(sub(mul(e1,dv2),mul(e2,dv1)),1/det):[1,0,0];tan=unit(sub(tan,mul(n,dot(n,tan))));
 const bit=Math.abs(det)>1e-12?mul(sub(mul(e2,du1),mul(e1,du2)),1/det):cross(n,tan),w=dot(cross(n,tan),bit)<0?-1:1;
 const g=bucket(mat,part);for(let i=0;i<3;i++){g.p.push(...[a,b,c][i]);g.n.push(...n);g.uv.push(...uvs[i]);g.t.push(...tan,w);}faces++;
}
function face(v,mat,part,prefer){for(let i=1;i<v.length-1;i++)tri(v[0],v[i],v[i+1],mat,part,prefer);}
function plate(poly,top,depth,mat=0,part='Hull panels',bevel=.008){
 const center=poly.reduce((s,p)=>[s[0]+p[0]/poly.length,s[1]+p[1]/poly.length],[0,0]);
 const yy=(x,z)=>typeof top==='function'?top(x,z):top;
 const ring=poly.map(([x,z])=>[x,yy(x,z)-bevel,z]);
 const cap=poly.map(([x,z])=>{const dx=center[0]-x,dz=center[1]-z,l=Math.hypot(dx,dz);return [x+dx/l*bevel,yy(x,z),z+dz/l*bevel];});
 const bottom=poly.map(([x,z])=>[x,yy(x,z)-depth,z]);
 face(cap,mat,part,[0,1,0]);face(bottom,mat,part,[0,-1,0]);
 for(let i=0;i<poly.length;i++){const j=(i+1)%poly.length,out=[(poly[i][0]+poly[j][0])/2-center[0],0,(poly[i][1]+poly[j][1])/2-center[1]];face([ring[i],ring[j],cap[j],cap[i]],mat===0?1:mat,part,[out[0],.2,out[2]]);face([bottom[i],bottom[j],ring[j],ring[i]],mat,part,out);}
}
function rect(x,z,w,l){return [[x-w/2,z-l/2],[x+w/2,z-l/2],[x+w/2,z+l/2],[x-w/2,z+l/2]];}
function inset(poly,d){const c=poly.reduce((s,p)=>[s[0]+p[0]/poly.length,s[1]+p[1]/poly.length],[0,0]);return poly.map(p=>{const dx=c[0]-p[0],dz=c[1]-p[1],l=Math.hypot(dx,dz);return [p[0]+dx/l*d,p[1]+dz/l*d];});}
function mirror(poly,s){return poly.map(([x,z])=>[x*s,z]);}
function screw(x,z,y){const p=Array.from({length:8},(_,i)=>[x+Math.cos(i*Math.PI/4)*.006,z+Math.sin(i*Math.PI/4)*.006]);plate(p,y,.003,3,'Flush fasteners',.001);plate(rect(x,z,.007,.0013),y+.0003,.0005,2,'Flush fasteners',.0001);}
function ribbon(a,b,width,y,mat,part){const dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz),nx=-dz/l*width/2,nz=dx/l*width/2;plate([[a[0]+nx,a[1]+nz],[b[0]+nx,b[1]+nz],[b[0]-nx,b[1]-nz],[a[0]-nx,a[1]-nz]],y,.004,mat,part,.0008);}
function seam(a,b){ribbon(a,b,.021,.164,2,'Boundary seam recesses');ribbon(a,b,.008,.165,4,'Interrupted boundary seams');}
function vent(x,z,w,l,y){plate(rect(x,z,w+.018,l+.018),y,.007,1,'Vent frames',.004);plate(rect(x,z,w,l),y+.001,.004,2,'Vent cavities',.002);const count=Math.floor(l/.019);for(let i=0;i<count;i++)plate(rect(x,z-l/2+.014+i*.019,w-.008,.006),y+.005,.005,3,'Vent louvers',.001);}

const outline=[[-.115,-1.04],[.115,-1.04],[.46,-.67],[1,.32],[.96,.57],[.73,.84],[.23,.90],[-.23,.90],[-.73,.84],[-.96,.57],[-1,.32],[-.46,-.67]];
plate(outline,.15,.125,0,'Continuous clipped wedge hull',.025);
plate(inset(outline,.045),.031,.028,2,'Recessed armored underside',.012);
function outer(z){if(z<-.67)return mix(.115,.46,(z+1.04)/.37);if(z<.32)return mix(.46,1,(z+.67)/.99);if(z<.57)return mix(1,.96,(z-.32)/.25);return mix(.96,.73,(z-.57)/.27);}
function spineWidth(z){return z<-.7?mix(.058,.125,(z+1.02)/.32):mix(.125,.205,(z+.7)/1.6);}
function deckY(x,z){return .171 + .021*(1-clamp(Math.abs(x),0,1)) - .012*clamp((-z-.25),0,1);}
const rows=[-.87,-.64,-.36,-.06,.25,.51,.72,.82];
for(const s of [-1,1])for(let r=0;r<rows.length-1;r++){
 const z0=rows[r]+.004,z1=rows[r+1]-.004,in0=spineWidth(z0)+.015,in1=spineWidth(z1)+.015,out0=outer(z0)-.035,out1=outer(z1)-.035;
 if(out0-in0<.025)continue;
 for(let strip=0;strip<2;strip++){
  const a=strip*.54,b=strip===0?.525:1;
  const poly=mirror([[mix(in0,out0,a),z0],[mix(in0,out0,b),z0],[mix(in1,out1,b),z1],[mix(in1,out1,a),z1]],s);
  plate(inset(poly,.002),deckY,.020,0,'Segmented shoulder plating',.004);
  for(const [x,z]of inset(poly,.021))screw(x,z,deckY(x,z)+.001);
 }
}
const spineRows=[-1.02,-.74,-.43,-.1,.22,.5,.75,.9];
function spineY(z){return z<-.7?mix(.16,.235,(z+1.02)/.32):mix(.235,.269,(z+.7)/1.6);}
for(let r=0;r<spineRows.length-1;r++){
 const a=spineRows[r]+.004,b=spineRows[r+1]-.004;
 const poly=[[-spineWidth(a),a],[spineWidth(a),a],[spineWidth(b),b],[-spineWidth(b),b]];
 plate(poly,(_,z)=>spineY(z),.11,0,'Low central dorsal spine',.014);
 for(const [x,z]of inset(poly,.025))screw(x,z,spineY(z)+.0006);
}
vent(0,-.6,.12,.13,spineY(-.6)+.006);vent(0,.39,.23,.13,spineY(.39)+.006);
for(const s of [-1,1]){
 vent(s*.38,-.38,.105,.18,deckY(s*.38,-.38)+.005);
 vent(s*.77,.18,.105,.19,deckY(s*.77,.18)+.003);
 plate(rect(s*.31,.56,.055,.10),.197,.013,2,'Aft marker recesses',.005);
 plate(rect(s*.31,.56,.022,.069),.200,.007,4,'Aft marker lights',.002);
 for(const [a,b]of [[-.61,-.43],[-.18,.04],[.17,.30]])seam([s*(outer(a)-.014),a],[s*(outer(b)-.014),b]);
 seam([s*.982,.36],[s*.957,.51]);
 seam([s*.94,.59],[s*.83,.72]);
 seam([s*.81,.75],[s*.745,.81]);
}
function oct(cx,cy,w,h,c){return [[cx-w+c,cy-h],[cx+w-c,cy-h],[cx+w,cy-h+c],[cx+w,cy+h-c],[cx+w-c,cy+h],[cx-w+c,cy+h],[cx-w,cy+h-c],[cx-w,cy-h+c]];}
function endRing(outerPts,innerPts,z,mat,part){for(let i=0;i<outerPts.length;i++){let j=(i+1)%outerPts.length;face([[...outerPts[i],z],[...outerPts[j],z],[...innerPts[j],z],[...innerPts[i],z]],mat,part,[0,0,1]);}}
function engine(cx,side){
 const cy=.139,front=.96,back=.61,o=oct(cx,cy,.198,.117,.025),i=oct(cx,cy,.151,.075,.017),rear=oct(cx,cy,.17,.105,.019);
 endRing(o,i,front,1,'Engine '+side+' bevel frame');
 for(let k=0;k<8;k++){let j=(k+1)%8;face([[...o[k],front],[...o[j],front],[...rear[j],back],[...rear[k],back]],0,'Engine '+side+' housing',[o[k][0]-cx,o[k][1]-cy,0]);face([[...i[k],front],[...i[j],front],[...i[j],front-.051],[...i[k],front-.051]],6,'Engine '+side+' throat',[cx-i[k][0],cy-i[k][1],0]);}
 face(i.map(p=>[...p,front-.054]),2,'Engine '+side+' cavity',[0,0,1]);
 for(let k=-1;k<=1;k++){
  const yy=cy+k*.039;
  face([[cx-.132,yy-.006,front-.033],[cx+.132,yy-.006,front-.033],[cx+.132,yy+.006,front-.033],[cx-.132,yy+.006,front-.033]],5,'Engine '+side+' three emissive bars',[0,0,1]);
 }
}
engine(-.49,'port');engine(.49,'starboard');
for(const s of [-1,1]){
 plate(mirror([[.265,.68],[.70,.68],[.67,.87],[.28,.9]],s),.258,.035,0,'Aft engine service covers',.012);
 for(const z of [.735,.82])for(const x of [.3,.64])screw(s*x,z,.259);
}

const gltf={asset:{version:'2.0',generator:'SLUR Cutlass asset builder / Node.js',copyright:'Original SLUR asset; generated from owner-approved concept direction'},extensionsUsed:['KHR_materials_emissive_strength'],scene:0,scenes:[{name:'Cutlass',nodes:[0]}],nodes:[{name:'Cutlass · asset v1',children:[],extras:{forward:'-Z',up:'+Y',units:'metres',status:'First modeled interpretation; requires owner fidelity review'}}],meshes:[],materials,textures:[],images:[],samplers:[{magFilter:9729,minFilter:9987,wrapS:10497,wrapT:10497}],accessors:[],bufferViews:[],buffers:[]};
const bins=[];let offset=0;
function append(data,target){const pad=(4-data.length%4)%4,idx=gltf.bufferViews.length;gltf.bufferViews.push({buffer:0,byteOffset:offset,byteLength:data.length,...(target?{target}:{})});bins.push(data,Buffer.alloc(pad));offset+=data.length+pad;return idx;}
function accessor(values,width,type){const data=Buffer.alloc(values.length*4);values.forEach((v,i)=>{if(!Number.isFinite(v))throw Error('Nonfinite geometry');data.writeFloatLE(v,i*4);});const view=append(data,34962);const a={bufferView:view,componentType:5126,count:values.length/width,type};if(type==='VEC3'){a.min=Array.from({length:width},(_,j)=>{let n=Infinity;for(let i=j;i<values.length;i+=width)n=Math.min(n,values[i]);return n;});a.max=Array.from({length:width},(_,j)=>{let n=-Infinity;for(let i=j;i<values.length;i+=width)n=Math.max(n,values[i]);return n;});}gltf.accessors.push(a);return gltf.accessors.length-1;}
const partMap=new Map();for(const g of groups.values()){
 const attributes={POSITION:accessor(g.p,3,'VEC3'),NORMAL:accessor(g.n,3,'VEC3')};
 if(g.mat===0){attributes.TEXCOORD_0=accessor(g.uv,2,'VEC2');attributes.TANGENT=accessor(g.t,4,'VEC4');}
 const prim={attributes,material:g.mat,mode:4};
 if(!partMap.has(g.part)){partMap.set(g.part,gltf.meshes.length);gltf.meshes.push({name:g.part,primitives:[]});gltf.nodes[0].children.push(gltf.nodes.length);gltf.nodes.push({name:g.part,mesh:gltf.meshes.length-1});}
 gltf.meshes[partMap.get(g.part)].primitives.push(prim);
}
for(const [name,bytes]of textureEntries){gltf.images.push({name,bufferView:append(bytes),mimeType:'image/png'});gltf.textures.push({sampler:0,source:gltf.images.length-1});}
gltf.buffers.push({byteLength:offset});
const json=Buffer.from(JSON.stringify(gltf)),jsonPad=Buffer.alloc((4-json.length%4)%4,32),j=Buffer.concat([json,jsonPad]),b=Buffer.concat(bins),head=Buffer.alloc(12),jh=Buffer.alloc(8),bh=Buffer.alloc(8);
head.writeUInt32LE(0x46546c67);head.writeUInt32LE(2,4);head.writeUInt32LE(12+8+j.length+8+b.length,8);jh.writeUInt32LE(j.length);jh.writeUInt32LE(0x4e4f534a,4);bh.writeUInt32LE(b.length);bh.writeUInt32LE(0x004e4942,4);
const glb=Buffer.concat([head,jh,j,bh,b]);await writeFile(path.join(OUT,'cutlass.glb'),glb);
const bounds={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]};for(const g of groups.values())for(let i=0;i<g.p.length;i+=3)for(let k=0;k<3;k++){bounds.min[k]=Math.min(bounds.min[k],g.p[i+k]);bounds.max[k]=Math.max(bounds.max[k],g.p[i+k]);}
const stats={triangles:faces,vertices:faces*3,meshes:gltf.meshes.length,primitives:groups.size,materials:materials.length,textureResolution:S,embeddedTextures:textureEntries.map(e=>e[0]),bytes:glb.length,bounds,dimensions:bounds.max.map((v,i)=>v-bounds.min[i]),forward:'-Z',up:'+Y',engineMouths:2};
await writeFile(path.join(OUT,'asset-info.json'),JSON.stringify(stats,null,2)+'\n');console.log(JSON.stringify(stats,null,2));
