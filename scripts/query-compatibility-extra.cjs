'use strict';
const assert = require('node:assert/strict');
function generatedSeed() {
  return Array.from({length:320},(_,i)=>({_id:1000+i,group:i%8,n:(i*37)%101,nested:{enabled:i%3!==0},tags:[String(i%5),String((i+2)%5)]}));
}
function extend(cases) {
  const add = (group,id,run,options={}) => cases.push({group,id:group+'/'+id,run,...options});
  const people = e=>e.col('people');
  add('complex','join-unwind-group-window-facet',e=>people(e).aggregate([
    {$lookup:{from:'departments',localField:'dept',foreignField:'_id',as:'department'}},
    {$unwind:'$department'},{$unwind:{path:'$tags',preserveNullAndEmptyArrays:true}},
    {$group:{_id:'$dept',lead:{$first:'$department.lead'},tagRows:{$sum:1},total:{$sum:'$score'}}},
    {$setWindowFields:{sortBy:{total:-1},output:{rank:{$rank:{}},cumulative:{$sum:'$total',window:{documents:['unbounded','current']}}}}},
    {$facet:{ordered:[{$sort:{rank:1,_id:1}}],summary:[{$group:{_id:null,groups:{$sum:1},total:{$sum:'$total'}}}]}}
  ]).toArray());
  add('complex','correlated-lookup-filter-reduce',e=>people(e).aggregate([
    {$lookup:{from:'people',let:{d:'$dept',me:'$_id'},pipeline:[{$match:{$expr:{$and:[{$eq:['$dept','$$d']},{$ne:['$_id','$$me']}]}}},{$sort:{_id:1}},{$project:{name:1,score:1}}],as:'peers'}},
    {$project:{_id:1,peerNames:{$map:{input:'$peers',as:'p',in:'$$p.name'}},peerScore:{$reduce:{input:'$peers',initialValue:0,in:{$add:['$$value','$$this.score']}}},senior:{$cond:[{$gte:['$age',30]},true,false]}}},{$sort:{_id:1}}
  ]).toArray());
  add('complex','nested-facet-pipelines',e=>people(e).aggregate([
    {$facet:{byDepartment:[{$group:{_id:'$dept',n:{$sum:1},avg:{$avg:'$score'}}},{$sort:{_id:1}}],
      activeNames:[{$match:{active:true}},{$sort:{_id:1}},{$group:{_id:null,names:{$push:'$name'}}}],
      monthly:[{$group:{_id:{$dateTrunc:{date:'$joined',unit:'month'}},n:{$sum:1}}},{$sort:{_id:1}}]}},
    {$project:{byDepartment:1,activeNames:1,months:{$size:'$monthly'}}}
  ]).toArray());
  add('complex','percentile-and-median',e=>people(e).aggregate([{$group:{_id:'$dept',median:{$median:{input:'$score',method:'approximate'}},p:{$percentile:{input:'$score',p:[0.25,0.75],method:'approximate'}}}},{$sort:{_id:1}}]).toArray());
  add('complex','sample-contract',async e=>{const rows=await people(e).aggregate([{$sample:{size:3}}]).toArray();assert.equal(rows.length,3);assert.equal(new Set(rows.map(d=>d._id)).size,3);assert(rows.every(d=>d._id>=1&&d._id<=6));return {count:3,unique:true,validMembers:true};});
  add('complex','rand-contract',async e=>{const rows=await people(e).aggregate([{$project:{random:{$rand:{}}}}]).toArray();assert.equal(rows.length,6);assert(rows.every(d=>d.random>=0&&d.random<1));return {count:6,allWithinRange:true};});
  add('complex','current-date-update',e=>e.work('currentdate',[{_id:1,n:1}],async c=>{const start=Date.now()-1000;await c.updateOne({_id:1},{$currentDate:{updated:true}});const row=await c.findOne({_id:1});assert(row.updated instanceof Date);assert(row.updated.getTime()>=start&&row.updated.getTime()<=Date.now()+1000);return {date:true,n:row.n};}));
  // Fixed data and an independent JavaScript oracle prevent equal-but-vacuous results.
  for(let i=0;i<40;i++) {
    const group=i%8,min=(i*7)%50,max=min+35,tag=String(i%5),enabled=i%2===0;
    const expected=generatedSeed().filter(d=>d.group===group&&d.n>=min&&d.n<max&&d.nested.enabled===enabled&&d.tags.includes(tag)).map(d=>d._id).sort((a,b)=>a-b);
    add('combinations','oracle-'+String(i).padStart(2,'0'),async e=>{
      const filter={$and:[{group},{n:{$gte:min,$lt:max}},{'nested.enabled':enabled},{tags:{$in:[tag]}}]};
      const rows=await e.col('generated').find(filter,{projection:{_id:1}}).sort({_id:1}).toArray();
      const actual=rows.map(d=>d._id);assert.deepEqual(actual,expected);return actual;
    });
  }
  // Force a real external sort (no limit/top-k, no index, and payload remains a dependency).
  add('complex','encrypted-sort-spill-parity',e=>e.work('spill',Array.from({length:22000},(_,i)=>({_id:i,rank:(i*7919)%22000,payload:'x'.repeat(7168+i%7)})),async c=>{
    const pipeline=[{$sort:{rank:1,_id:1}},{$group:{_id:null,n:{$sum:1},rankSum:{$sum:'$rank'},bytes:{$sum:{$strLenBytes:'$payload'}},first:{$first:'$_id'},last:{$last:'$_id'}}}];
    const options={allowDiskUse:true,maxTimeMS:120000};
    const plan=await c.aggregate(pipeline,options).explain('executionStats');
    function spilled(x){if(!x||typeof x!=='object')return false;if(x.usedDisk===true||typeof x.spills==='number'&&x.spills>0)return true;return Object.values(x).some(spilled);}
    assert(spilled(plan),'External sort must actually spill; otherwise spill coverage was not exercised');
    const rows=await c.aggregate(pipeline,options).toArray();assert.equal(rows[0].n,22000);
    return {usedDisk:true,rows};
  }));
}
module.exports={extend,generatedSeed};
