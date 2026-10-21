const test=require('node:test'),assert=require('node:assert/strict'),ts=require('typescript'),fs=require('node:fs'),path=require('node:path');
function harness({development=true,profile='camille',entries=[{day:'2026-10-20',score:3,tags:['Charge']},{day:'2026-10-21',score:4,tags:[]}],existing=[]}={}){
 const preferences=new Map(),saved=[],history=[...existing];
 const raw=JSON.stringify({profile,entries});const module={exports:{}};
 const imports={
  '@react-native-async-storage/async-storage':{__esModule:true,default:{getItem:async key=>preferences.get(key),setItem:async(key,value)=>preferences.set(key,value)}},
  './personalHistory':{readPersonalHistory:async()=>history,savePersonalMood:async(_,entry)=>{history.push(entry);saved.push(entry)}},
  './personalHistoryLogic':{retainPersonalMoods:(rows,today)=>rows.filter(row=>row.day>='2026-09-22'&&row.day<=today&&/^\d{4}-\d{2}-\d{2}$/.test(row.day))}
 };
 const code=ts.transpileModule(fs.readFileSync(path.join(__dirname,'../src/sampleProfile.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 new Function('module','exports','require','process','__DEV__',code)(module,module.exports,id=>imports[id],{env:{EXPO_PUBLIC_SAMPLE_PROFILE:raw}},development);
 return {api:module.exports,saved,preferences,raw};
}
test('L’aperçu est strictement limité au compte choisi et absent en production',async()=>{
 for(const options of [{development:false},{}]){
  const h=harness(options);await h.api.hydrateSampleProfile(options.development===false?'camille':'pierre','2026-10-21');assert.equal(h.saved.length,0);
 }
});
test('Les jours sont importés dans l’ordre, sans écraser une saisie ni doubler la croissance',async()=>{
 const original={day:'2026-10-21',score:5,tags:['Sens']};const h=harness({existing:[original]});
 await Promise.all([h.api.hydrateSampleProfile('camille','2026-10-21'),h.api.hydrateSampleProfile('camille','2026-10-21')]);
 assert.deepEqual(h.saved,[{day:'2026-10-20',score:3,tags:['Charge']}]);
 await h.api.hydrateSampleProfile('camille','2026-10-21');assert.equal(h.saved.length,1);assert.equal(original.score,5);
});
test('Effacer le récap désactive le réimport du profil synthétique',async()=>{
 const h=harness();await h.api.disableSampleProfile('camille','2026-10-21');await h.api.hydrateSampleProfile('camille','2026-10-21');assert.equal(h.saved.length,0);assert.equal([...h.preferences.values()][0],'yes');
});
test('Le format, les bornes et les jours futurs sont contrôlés',()=>{
 const h=harness();for(const entries of [[null],[{day:'2026-10-21',score:6,tags:[]}],Array(31).fill({day:'2026-10-21',score:3,tags:[]})])assert.deepEqual(h.api.sampleEntries(JSON.stringify({profile:'camille',entries}),'camille','2026-10-21'),[]);
 assert.deepEqual(h.api.sampleEntries('{','camille','2026-10-21'),[]);
 assert.deepEqual(h.api.sampleEntries(JSON.stringify({profile:'camille',entries:[{day:'2026-10-22',score:3,tags:[]}]}),'camille','2026-10-21'),[]);
});
