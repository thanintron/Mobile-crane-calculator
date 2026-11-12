const assert=require('node:assert/strict'),fs=require('node:fs');
const {calculateOriginal}=require('../static/original-calculator.js');
const v={R:10,L:25,pivotHeight:2.2,netLoad:12,hook:.8,rigging:.4,cable:.15,extra:.15,ratedCapacity:18,craneWeight:30,gbc:25,soilSF:1.25};
const r=calculateOriginal(v);assert.equal(r.utilization,75);assert.ok(Math.abs(r.totalGrossLoad-13.5)<1e-10);assert.ok(Math.abs(r.tipHeight-25.1128784748)<1e-8);assert.equal(r.matDimension,1.3);assert.ok(r.matDimension**2>=r.requiredMatArea);
for(const change of [{R:26},{R:25},{ratedCapacity:0},{gbc:0},{L:NaN},{hook:-1},{soilSF:.5},{netLoad:Infinity}])assert.throws(()=>calculateOriginal({...v,...change}));
assert.ok(calculateOriginal({...v,gbc:13}).matDimension**2>=calculateOriginal({...v,gbc:13}).requiredMatArea);
const html=fs.readFileSync('static/index.html','utf8');
for(const id of ['craneSvg','inputRadius','inputBoomLength','inputPivotHeight','loadNet','inputRatedCapacity','selectSoilType','certNumber','guideModal','geometryHelpModal','soilHelpModal','diagramExplainerModal','deviceSave','deviceBackup','deviceImport'])assert.ok(html.includes('id="'+id+'"'),id);
assert.ok(!/<(?:script|link)[^>]*(?:src|href)="https?:\/\//.test(html));
for(const file of ['cranelift.js','device-storage.js','original-calculator.js'])assert.ok(!/fetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket/.test(fs.readFileSync('static/'+file,'utf8')),file);
const fonts=fs.readFileSync('static/fonts.css','utf8');assert.ok(!fonts.includes('https://'));const sw=fs.readFileSync('static/sw.js','utf8');for(const url of html.matchAll(/(?:src|href)="(\/static\/[^"#]+)"/g)){assert.ok(sw.includes(url[1]),url[1]+' not precached');}
console.log('Original UI controls, local assets, 75% boundary, geometry, upward pad rounding, invalid inputs and no plan network APIs passed');
