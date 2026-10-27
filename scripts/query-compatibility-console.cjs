'use strict';
const path=require('node:path');
const assert=require('node:assert/strict');
const {createRequire}=require('node:module');
async function run({lite,community,communityUri,appPassword,name,sdk,canonical,consoleRoot}) {
  const req=createRequire(path.resolve(consoleRoot,'package.json'));
  const {Connection}=req('./src/connection.cjs');
  const consoleBSON=req('mongodb').BSON;
  const results=[];
  const a=new Connection(), b=new Connection();
  const raw=[{db:lite,BSON:sdk.BSON},{db:community.db(name),BSON:require(path.resolve(process.env.QUERY_RUNTIME||'.query-runtime','node_modules/mongodb')).BSON}];
  const capture=async(fn,B)=>{try{return{ok:true,value:JSON.parse(canonical(await fn(),B))};}catch(e){return{ok:false,error:{name:e.name,code:e.code??null,codeName:e.codeName??null,message:e.message}};}};
  async function compare(id,source,direct) {
    const directA=await capture(()=>direct(raw[0]),raw[0].BSON),directB=await capture(()=>direct(raw[1]),raw[1].BSON);
    const consoleA=await capture(async()=>{const r=await a.run(source);return {value:r.value,truncated:r.truncated};},consoleBSON);
    const consoleB=await capture(async()=>{const r=await b.run(source);return {value:r.value,truncated:r.truncated};},consoleBSON);
    const equal=(c,d)=>c.ok&&d.ok&&JSON.stringify(c.value.value)===JSON.stringify(d.value);
    const status=equal(consoleA,directA)&&equal(consoleB,directB)?'match':'difference';
    results.push({id,source,status,directBsonlite:directA,directCommunity:directB,consoleBsonlite:consoleA,consoleCommunity:consoleB});
  }
  async function rejection(id,source,pattern,note) {
    const outcomes=[];
    for(const c of [a,b])outcomes.push(await capture(()=>c.run(source),consoleBSON));
    const valid=outcomes.every(x=>!x.ok&&pattern.test(x.error.message));
    results.push({id,source,status:valid?'console-limit':'difference',note,bsonlite:outcomes[0],community:outcomes[1]});
  }
  try {
    await a.connect({uri:lite.connectionURL,database:name,readOnly:false});
    const uri=communityUri.replace('mongodb://','mongodb://audit_app:'+appPassword+'@')+'/'+name+'?authSource='+name+'&directConnection=true';
    await b.connect({uri,database:name,readOnly:false});
    await compare('find-sort-project','db.people.find({active:true}).sort({_id:1}).project({name:1}).limit(3)',e=>e.db.collection('people').find({active:true}).sort({_id:1}).project({name:1}).limit(3).toArray());
    await compare('nested-array-query','db.people.find({items:{$elemMatch:{sku:"x",qty:{$gte:2}}}}).sort({_id:1})',e=>e.db.collection('people').find({items:{$elemMatch:{sku:'x',qty:{$gte:2}}}}).sort({_id:1}).toArray());
    await compare('bson-long','db.types.findOne({_id:"long"})',e=>e.db.collection('types').findOne({_id:'long'}));
    await compare('bson-decimal','db.types.findOne({value:NumberDecimal("1234.5678")})',e=>e.db.collection('types').findOne({value:e.BSON.Decimal128.fromString('1234.5678')}));
    await compare('bson-objectid','db.types.findOne({value:ObjectId("0123456789abcdef01234567")})',e=>e.db.collection('types').findOne({value:new e.BSON.ObjectId('0123456789abcdef01234567')}));
    await compare('count','db.people.countDocuments({active:true})',e=>e.db.collection('people').countDocuments({active:true}));
    await compare('indexes','db.people.indexes()',e=>e.db.collection('people').indexes());
    await compare('aggregate-group','db.people.aggregate([{$group:{_id:"$dept",n:{$sum:1}}},{$sort:{_id:1}}])',e=>e.db.collection('people').aggregate([{$group:{_id:'$dept',n:{$sum:1}}},{$sort:{_id:1}}]).toArray());
    // These use the actual interpreter, not an emulation of mongosh syntax.
    await compare('aggregate-limit-before-sort','db.people.aggregate([]).limit(2).sort({_id:-1})',e=>e.db.collection('people').aggregate([]).limit(2).sort({_id:-1}).toArray());
    await compare('aggregate-limit-before-skip','db.people.aggregate([]).limit(2).skip(1)',e=>e.db.collection('people').aggregate([]).limit(2).skip(1).toArray());
    await compare('find-options-limit','db.people.find({}, {limit:1,sort:{_id:1}})',e=>e.db.collection('people').find({}, {limit:1,sort:{_id:1}}).toArray());
    // Read-only is a session option; no production or persistent defaults are modified.
    a.readOnly=true;b.readOnly=true;
    await rejection('read-only-write','db.people.updateOne({_id:1},{$set:{active:true}})',/Read-only/,'Console read-only policy; ordinary SDK updateOne was tested separately.');
    a.readOnly=false;b.readOnly=false;
    await rejection('script-syntax','const x = db.people.find({})',/one database expression/,'The interpreter accepts a single expression, not arbitrary JavaScript.');
    await rejection('unsupported-cursor-method','db.people.find({}).batchSize(2)',/Unsupported cursor modifier/,'batchSize works through the SDK; it is absent from the Console modifier allowlist.');
    await rejection('server-js-parser','db.people.find({$where:"return true"})',/Server-side JavaScript/,'Console rejects before dispatch on both engines; BsonLite also disables scripting in the engine.');
    await rejection('explicit-limit-over-cap','db.people.find({}).limit(1001)',/Limit must be/,'Console has an intentional 1000-document display cap.');
    // App-link commands are blocked although the SDK driver and direct Console allow read commands.
    const command='db.runCommand({ping:1})';
    const ca=await capture(()=>a.run(command),consoleBSON),cb=await capture(async()=>({value:(await b.run(command)).value}),consoleBSON);
    results.push({id:'app-link-command-policy',source:command,status:!ca.ok&&/does not expose database commands/.test(ca.error.message)&&cb.ok?'console-limit':'difference',bsonlite:ca,community:cb,note:'App-link adapter restriction, not an engine ping failure; lite.ping() succeeds.'});
    for(const e of raw)await e.db.collection('console_caps').insertMany(Array.from({length:1005},(_,i)=>({_id:i})));
    for(const [id,source,expected,truncated] of [['default-display','db.console_caps.find({}).sort({_id:1})',50,true],['zero-limit-display','db.console_caps.find({}).sort({_id:1}).limit(0)',1000,true]]) {
      const outcomes=[];for(const c of [a,b]){const r=await c.run(source);outcomes.push({count:r.value.length,truncated:r.truncated,first:r.value[0]._id,last:r.value.at(-1)._id});}
      const directCounts=await Promise.all(raw.map(e=>e.db.collection('console_caps').countDocuments({})));
      const valid=outcomes.every(x=>x.count===expected&&x.truncated===truncated&&x.first===0&&x.last===expected-1)&&directCounts.every(x=>x===1005);
      results.push({id,source,status:valid?'console-limit':'difference',outcomes,directCounts,note:'Intentional display bound; not missing database records.'});
    }
    assert.equal((await lite.ping()).ok,1);
    return {commit:'333b246d80472d69b1304a11e24d0c68bd2f05d9',version:req('./package.json').version,driverVersion:req('mongodb/package.json').version,transport:'Actual SDK app-link for BsonLite; authenticated loopback direct URI for Community. No Electron GUI simulation.',results,complete:true};
  }finally{await a.disconnect().catch(()=>{});await b.disconnect().catch(()=>{});}
}
module.exports={run};
