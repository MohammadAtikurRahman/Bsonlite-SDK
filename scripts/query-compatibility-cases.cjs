'use strict';
const cases = [];
function add(group, id, run, options = {}) { cases.push({ group, id: group + '/' + id, run, ...options }); }
function seed(B) {
  return [
    { _id: 1, name: 'Alice', age: 24, score: 7.5, active: true, dept: 'dev', tags: ['a','b'], scores: [10,20,30], address: { city: 'Dhaka', zip: 1207 }, items: [{ sku: 'x', qty: 2 },{ sku: 'y', qty: 4 }], nullish: null, bits: 5, joined: new Date('2024-01-15T12:30:00Z') },
    { _id: 2, name: 'Bob', age: 31, score: 9, active: false, dept: 'qa', tags: ['b'], scores: [5,15], address: { city: 'Chattogram', zip: 4000 }, items: [{ sku: 'x', qty: 1 }], nullish: 'value', bits: 3, joined: new Date('2024-02-20T04:10:00Z') },
    { _id: 3, name: 'Carol', age: 42, score: 6, active: true, dept: 'dev', tags: [], scores: [0,10], address: { city: 'dhaka', zip: 1207 }, items: [{ sku: 'z', qty: 7 }], bits: 15, joined: new Date('2024-03-05T00:00:00Z') },
    { _id: 4, name: 'Dave', age: 18, score: 8.25, active: true, dept: 'ops', tags: ['c'], scores: [], items: [], nullish: null, bits: 8, joined: new Date('2023-12-31T23:59:59Z') },
    { _id: 5, name: 'Eve', score: 4, active: false, dept: 'qa', tags: ['a','c'], scores: [2,4], address: { city: 'Sylhet' }, items: [{ sku: 'x', qty: 3 }], bits: 0, joined: new Date('2024-05-01T00:00:00Z') },
    { _id: 6, name: 'Finn', age: null, score: 5, active: true, dept: 'ops', tags: ['b','c'], scores: [3,6], address: { city: 'Dhaka' }, items: [{ sku: 'y', qty: 5 }], bits: 6, joined: new Date('2024-06-15T00:00:00Z') }
  ];
}
function typeSeed(B) {
  const values = {
    objectId: new B.ObjectId('0123456789abcdef01234567'), int: new B.Int32(42), long: B.Long.fromString('9007199254740993'),
    double: new B.Double(1.25), decimal: B.Decimal128.fromString('1234.5678'), binary: new B.Binary(Buffer.from([0,1,2,255]), 0),
    uuid: new B.UUID('00112233-4455-6677-8899-aabbccddeeff'), timestamp: B.Timestamp.fromBits(12, 1700000000),
    date: new Date('2024-01-01T00:00:00Z'), regex: new B.BSONRegExp('^a', 'i'), minKey: new B.MinKey(), maxKey: new B.MaxKey(),
    code: new B.Code('return 42'), null: null, bool: true, string: 'ঢাকা — BSON', object: { nested: [1, 'two', null] },
    nan: new B.Double(NaN), infinity: new B.Double(Infinity), negativeInfinity: new B.Double(-Infinity)
  };
  return Object.entries(values).map(([label, v]) => ({ _id: label, value: v }));
}
const filters = {
  eq: {age:{$eq:24}}, ne:{age:{$ne:24}}, gt:{age:{$gt:24}}, gte:{age:{$gte:24}}, lt:{age:{$lt:31}}, lte:{age:{$lte:31}},
  in:{age:{$in:[18,31]}}, nin:{dept:{$nin:['qa']}}, and:{$and:[{age:{$gte:20}},{active:true}]},
  or:{$or:[{age:{$lt:20}},{dept:'qa'}]}, nor:{$nor:[{dept:'qa'},{age:{$gt:35}}]}, not:{age:{$not:{$gte:30}}},
  exists:{age:{$exists:true}}, missing:{age:{$exists:false}}, null:{age:null}, exactNull:{age:{$type:'null'}},
  numericType:{age:{$type:'number'}}, mod:{age:{$mod:[2,0]}}, regex:{name:{$regex:'^a',$options:'i'}}, regexObject:{name:/a/i},
  all:{tags:{$all:['a','b']}}, size:{tags:{$size:0}}, elemMatch:{items:{$elemMatch:{sku:'x',qty:{$gte:2}}}},
  arrayScalar:{tags:'b'}, arrayIndex:{'scores.0':{$gte:5}}, nested:{'address.city':'Dhaka'}, embeddedEquality:{address:{city:'Dhaka',zip:1207}},
  expr:{$expr:{$gt:['$age',{$multiply:['$score',3]}]}}, jsonSchema:{$jsonSchema:{required:['age'],properties:{age:{bsonType:['int','double'],minimum:20}}}},
  bitsAllSet:{bits:{$bitsAllSet:5}}, bitsAnySet:{bits:{$bitsAnySet:[1,3]}}, bitsAllClear:{bits:{$bitsAllClear:8}}, bitsAnyClear:{bits:{$bitsAnyClear:7}},
  dateRange:{joined:{$gte:new Date('2024-01-01'),$lt:new Date('2024-04-01')}}, emptyIn:{name:{$in:[]}},
  stringCollation:{'address.city':'dhaka'}, nestedOr:{$and:[{$or:[{dept:'dev'},{dept:'ops'}]},{score:{$gte:6}}]}
};
for (const [id, filter] of Object.entries(filters)) add('find', id, e => e.col('people').find(filter).sort({_id:1}).toArray());
add('find','full-seed',async e=>{ const rows=await e.col('people').find().sort({_id:1}).toArray(); if(rows.length!==6)throw new Error('Fixture must contain six documents');return rows; });
const projections = {
  inclusion:{name:1,age:1,_id:0}, exclusion:{items:0,address:0}, nested:{'address.city':1,_id:0},
  slice:{scores:{$slice:[1,2]}}, elemMatch:{items:{$elemMatch:{sku:'x'}}}, computed:{name:1,doubleScore:{$multiply:['$score',2]}},
  rename:{person:'$name',_id:0}, literal:{constant:{$literal:'$name'},_id:0}
};
for(const [id,p] of Object.entries(projections)) add('projection',id,e=>e.col('people').find({}).project(p).sort({_id:1}).toArray());
add('projection','positional',e=>e.col('people').find({scores:{$gt:10}},{projection:{'scores.$':1}}).sort({_id:1}).toArray());
add('cursor','sort-skip-limit',e=>e.col('people').find().sort({score:-1,_id:1}).skip(1).limit(3).toArray());
add('cursor','batch-size',e=>e.col('people').find().sort({_id:1}).batchSize(2).toArray());
add('cursor','hint-max-time',e=>e.col('people').find({age:{$gte:20}}).hint('age_1').maxTimeMS(10000).sort({_id:1}).toArray());
add('cursor','collation',e=>e.col('people').find({'address.city':'DHAKA'},{collation:{locale:'en',strength:2}}).sort({_id:1}).toArray());
add('cursor','count-documents',e=>e.col('people').countDocuments({active:true}));
add('cursor','estimated-count',e=>e.col('people').estimatedDocumentCount());
add('cursor','distinct',async e=>(await e.col('people').distinct('dept')).sort());
add('cursor','find-one',e=>e.col('people').findOne({_id:3}));
add('cursor','async-iterator',async e=>{const out=[];for await(const d of e.col('people').find().sort({_id:1}).batchSize(1))out.push(d._id);return out;});
add('cursor','read-concern-local',e=>e.col('people').find({active:true},{readConcern:{level:'local'}}).sort({_id:1}).toArray());
add('cursor','explain-hinted-index',async e=>{const x=await e.col('people').find({age:24}).hint('age_1').explain('executionStats');return {nReturned:x.executionStats.nReturned,usedAgeIndex:JSON.stringify(x.queryPlanner.winningPlan).includes('age_1')};});
for(const label of ['objectId','int','long','double','decimal','binary','uuid','timestamp','date','regex','minKey','maxKey','code','null','bool','string','object','nan','infinity','negativeInfinity']) {
  add('bson',label,e=>e.col('types').findOne({_id:label}));
}
add('bson','server-types',e=>e.col('types').aggregate([{$project:{kind:{$type:'$value'}}},{$sort:{_id:1}}]).toArray());

function pipeline(id, stages, options={}) { add('aggregation',id,e=>e.col('people').aggregate(stages,{maxTimeMS:10000,...options}).toArray()); }
pipeline('match-project-sort-limit',[{$match:{active:true}},{$project:{name:1,score:1}},{$sort:{score:-1,_id:1}},{$skip:1},{$limit:2}]);
pipeline('group-accumulators',[{$group:{_id:'$dept',count:{$sum:1},avg:{$avg:'$score'},min:{$min:'$score'},max:{$max:'$score'},std:{$stdDevPop:'$score'}}},{$sort:{_id:1}}]);
pipeline('ordered-group',[{$sort:{_id:1}},{$group:{_id:'$dept',first:{$first:'$name'},last:{$last:'$name'},names:{$push:'$name'},tags:{$addToSet:'$dept'}}},{$sort:{_id:1}}]);
pipeline('unwind',[{$unwind:{path:'$tags',includeArrayIndex:'position',preserveNullAndEmptyArrays:true}},{$sort:{_id:1,position:1}}]);
pipeline('lookup',[{$lookup:{from:'departments',localField:'dept',foreignField:'_id',as:'department'}},{$sort:{_id:1}}]);
pipeline('lookup-pipeline',[{$lookup:{from:'departments',let:{d:'$dept'},pipeline:[{$match:{$expr:{$eq:['$_id','$$d']}}},{$project:{lead:1}}],as:'department'}},{$sort:{_id:1}}]);
pipeline('graph-lookup',[{$match:{_id:2}},{$graphLookup:{from:'departments',startWith:'$dept',connectFromField:'parent',connectToField:'_id',as:'tree',maxDepth:3}},{$project:{tree:{$sortArray:{input:'$tree',sortBy:{_id:1}}}}}]);
pipeline('facet',[{$facet:{counts:[{$group:{_id:'$dept',n:{$sum:1}}},{$sort:{_id:1}}],top:[{$sort:{score:-1,_id:1}},{$limit:2},{$project:{name:1}}]}}]);
pipeline('union-with',[{$match:{_id:1}},{$project:{_id:0,label:'$name'}},{$unionWith:{coll:'departments',pipeline:[{$project:{_id:0,label:'$lead'}}]}},{$sort:{label:1}}]);
pipeline('replace-root',[{$match:{_id:1}},{$replaceRoot:{newRoot:'$address'}}]);
pipeline('replace-with',[{$match:{_id:1}},{$replaceWith:{$mergeObjects:['$address',{person:'$name'}]}}]);
pipeline('set-unset',[{$set:{doubleScore:{$multiply:['$score',2]}}},{$unset:['items','tags']},{$sort:{_id:1}}]);
pipeline('count',[{$match:{active:true}},{$count:'activeUsers'}]);
pipeline('sort-by-count',[{$sortByCount:'$dept'},{$sort:{_id:1}}]);
pipeline('bucket',[{$bucket:{groupBy:'$score',boundaries:[0,5,8,10],default:'other',output:{n:{$sum:1}}}},{$sort:{_id:1}}]);
pipeline('bucket-auto',[{$bucketAuto:{groupBy:'$score',buckets:3}}]);
pipeline('redact',[{$redact:{$cond:[{$eq:['$active',true]},'$$KEEP','$$PRUNE']}},{$sort:{_id:1}}]);
pipeline('window-rank',[{$setWindowFields:{partitionBy:'$dept',sortBy:{score:1},output:{rank:{$rank:{}},dense:{$denseRank:{}},running:{$sum:'$score',window:{documents:['unbounded','current']}}}}},{$sort:{_id:1}}]);
pipeline('window-shift',[{$setWindowFields:{sortBy:{_id:1},output:{previous:{$shift:{output:'$score',by:-1,default:0}},number:{$documentNumber:{}}}}},{$sort:{_id:1}}]);
pipeline('top-bottom-n',[{$group:{_id:'$dept',top:{$topN:{n:1,sortBy:{score:-1},output:'$name'}},bottom:{$bottomN:{n:1,sortBy:{score:-1},output:'$name'}}}},{$sort:{_id:1}}]);
pipeline('first-last-min-max-n',[{$sort:{_id:1}},{$group:{_id:'$dept',first:{$firstN:{input:'$name',n:1}},last:{$lastN:{input:'$name',n:1}},min:{$minN:{input:'$score',n:1}},max:{$maxN:{input:'$score',n:1}}}},{$sort:{_id:1}}]);

const expressions = {
  abs:{$abs:-12}, add:{$add:[2,3]}, subtract:{$subtract:[7,2]}, multiply:{$multiply:[3,4]}, divide:{$divide:[7,2]}, mod:{$mod:[10,3]},
  ceil:{$ceil:2.1}, floor:{$floor:2.9}, round:{$round:[2.356,2]}, trunc:{$trunc:[2.356,2]}, pow:{$pow:[2,5]}, sqrt:{$sqrt:81}, exp:{$exp:1}, ln:{$ln:10}, log:{$log:[100,10]}, log10:{$log10:100},
  sin:{$sin:0}, cos:{$cos:0}, tan:{$tan:0}, asin:{$asin:0}, acos:{$acos:1}, atan:{$atan:1}, atan2:{$atan2:[1,1]}, degrees:{$radiansToDegrees:Math.PI}, radians:{$degreesToRadians:180},
  and:{$and:[true,{$gt:['$age',20]}]}, or:{$or:[false,'$active']}, not:{$not:['$active']}, cmp:{$cmp:[5,3]}, eq:{$eq:['$dept','dev']}, ne:{$ne:[1,2]}, gt:{$gt:['$age',20]}, gte:{$gte:['$age',24]}, lt:{$lt:['$age',30]}, lte:{$lte:['$age',24]},
  cond:{$cond:['$active','yes','no']}, ifNull:{$ifNull:['$notPresent','fallback']}, switch:{$switch:{branches:[{case:{$gt:['$score',7]},then:'high'}],default:'low'}},
  let:{$let:{vars:{x:4},in:{$multiply:['$$x',3]}}}, literal:{$literal:'$notAField'}, type:{$type:'$score'}, isNumber:{$isNumber:'$age'},
  convert:{$convert:{input:'123',to:'int',onError:0,onNull:0}}, toString:{$toString:'$age'}, toInt:{$toInt:'42'}, toLong:{$toLong:'9007199254740993'}, toDouble:{$toDouble:'2.5'}, toDecimal:{$toDecimal:'19.95'}, toBool:{$toBool:1}, toDate:{$toDate:'2024-01-01'}, toObjectId:{$toObjectId:'0123456789abcdef01234567'},
  concat:{$concat:['$name','!']}, substrBytes:{$substrBytes:['Alice',1,3]}, substrCP:{$substrCP:['ঢাকা',0,2]}, strLenBytes:{$strLenBytes:'ঢাকা'}, strLenCP:{$strLenCP:'ঢাকা'}, toLower:{$toLower:'ALICE'}, toUpper:{$toUpper:'alice'},
  trim:{$trim:{input:'  Alice  '}}, ltrim:{$ltrim:{input:'--name--',chars:'-'}}, rtrim:{$rtrim:{input:'--name--',chars:'-'}}, split:{$split:['a,b,c',',']}, strcasecmp:{$strcasecmp:['Alice','alice']}, indexOfBytes:{$indexOfBytes:['notebook','book']}, indexOfCP:{$indexOfCP:['ঢাকা শহর','শ']},
  regexMatch:{$regexMatch:{input:'$name',regex:'^a',options:'i'}}, regexFind:{$regexFind:{input:'a1b22',regex:'[0-9]+'}}, regexFindAll:{$regexFindAll:{input:'a1b22',regex:'[0-9]+'}}, replaceOne:{$replaceOne:{input:'a-b-b',find:'b',replacement:'x'}}, replaceAll:{$replaceAll:{input:'a-b-b',find:'b',replacement:'x'}},
  arrayElemAt:{$arrayElemAt:['$scores',1]}, arrayToObject:{$arrayToObject:[[['a',1],['b',2]]]}, objectToArray:{$objectToArray:'$address'}, concatArrays:{$concatArrays:['$scores',[99]]}, filter:{$filter:{input:'$scores',as:'s',cond:{$gt:['$$s',10]}}},
  map:{$map:{input:'$scores',as:'s',in:{$multiply:['$$s',2]}}}, reduce:{$reduce:{input:'$scores',initialValue:0,in:{$add:['$$value','$$this']}}}, range:{$range:[0,5,2]}, reverseArray:{$reverseArray:'$scores'}, size:{$size:'$scores'}, slice:{$slice:['$scores',1,2]},
  zip:{$zip:{inputs:[[1,2],['a','b']]}}, indexOfArray:{$indexOfArray:['$scores',20]}, in:{$in:['a','$tags']}, isArray:{$isArray:'$scores'}, sortArray:{$sortArray:{input:'$scores',sortBy:-1}}, first:{$first:'$scores'}, last:{$last:'$scores'},
  setEquals:{$setEquals:[['a','b'],['b','a','a']]}, setIntersection:{$setIntersection:[['a','b'],['b','c']]}, setUnion:{$setUnion:[['a'],['a','b']]}, setDifference:{$setDifference:[['a','b'],['b']]}, setIsSubset:{$setIsSubset:[['a'],['a','b']]}, anyElementTrue:{$anyElementTrue:[[false,true]]}, allElementsTrue:{$allElementsTrue:[[true,true]]},
  mergeObjects:{$mergeObjects:['$address',{extra:true}]}, getField:{$getField:{field:'city',input:'$address'}}, setField:{$setField:{field:'extra',input:'$address',value:1}}, unsetField:{$unsetField:{field:'zip',input:'$address'}},
  year:{$year:'$joined'}, month:{$month:'$joined'}, dayOfMonth:{$dayOfMonth:'$joined'}, dayOfWeek:{$dayOfWeek:'$joined'}, dayOfYear:{$dayOfYear:'$joined'}, hour:{$hour:'$joined'}, minute:{$minute:'$joined'}, second:{$second:'$joined'}, millisecond:{$millisecond:'$joined'}, week:{$week:'$joined'}, isoWeek:{$isoWeek:'$joined'}, isoWeekYear:{$isoWeekYear:'$joined'}, isoDayOfWeek:{$isoDayOfWeek:'$joined'},
  dateToString:{$dateToString:{date:'$joined',format:'%Y-%m-%d',timezone:'Asia/Dhaka'}}, dateFromString:{$dateFromString:{dateString:'2024-01-01T00:00:00Z'}}, dateToParts:{$dateToParts:{date:'$joined',timezone:'UTC'}}, dateFromParts:{$dateFromParts:{year:2024,month:2,day:29}},
  dateAdd:{$dateAdd:{startDate:'$joined',unit:'day',amount:2}}, dateSubtract:{$dateSubtract:{startDate:'$joined',unit:'month',amount:1}}, dateDiff:{$dateDiff:{startDate:'$joined',endDate:new Date('2025-01-01'),unit:'day'}}, dateTrunc:{$dateTrunc:{date:'$joined',unit:'month'}},
  bsonSize:{$bsonSize:'$address'}, binarySize:{$binarySize:'Alice'}
};
for(const [id, expression] of Object.entries(expressions)) add('expression',id,e=>e.col('people').aggregate([{$match:{_id:1}},{$project:{_id:0,result:expression}}]).toArray());

const writeSeed = () => [
  {_id:1,n:10,label:'a',enabled:true,nested:{x:1},a:[1,2,3],items:[{sku:'x',qty:2},{sku:'y',qty:5}]},
  {_id:2,n:20,label:'b',enabled:false,nested:{x:2},a:[2,4],items:[{sku:'x',qty:1}]}
];
const updates = {
  set:{$set:{label:'changed','nested.y':3}}, unset:{$unset:{enabled:''}}, inc:{$inc:{n:3}}, mul:{$mul:{n:2}}, min:{$min:{n:5}}, max:{$max:{n:50}}, rename:{$rename:{label:'title'}},
  bit:{$bit:{n:{or:1}}}, push:{$push:{a:9}}, pushEachSliceSort:{$push:{a:{$each:[9,0],$sort:1,$slice:4}}}, addToSet:{$addToSet:{a:{$each:[2,7]}}}, pop:{$pop:{a:-1}}, pull:{$pull:{a:{$gte:2}}}, pullAll:{$pullAll:{a:[1,3]}},
  pipeline:[{$set:{n:{$add:['$n',5]},newField:{$concat:['$label','!']}}}], pipelineUnset:[{$unset:'enabled'}], pipelineReplace:[{$replaceWith:{$mergeObjects:['$$ROOT',{label:'pipeline'}]}}]
};
for(const [id,update] of Object.entries(updates)) add('update',id,e=>e.work('update',writeSeed(),async c=>{const r=await c.updateOne({_id:1},update);return {matched:r.matchedCount,modified:r.modifiedCount,rows:await c.find().sort({_id:1}).toArray()};}));
add('update','arrayFilters',e=>e.work('arrays',writeSeed(),async c=>{await c.updateMany({},{$inc:{'items.$[it].qty':10}},{arrayFilters:[{'it.sku':'x'}]});return c.find().sort({_id:1}).toArray();}));
add('update','positional',e=>e.work('positional',writeSeed(),async c=>{await c.updateOne({_id:1,'items.sku':'y'},{$set:{'items.$.qty':9}});return c.findOne({_id:1});}));
add('update','all-positional',e=>e.work('allpos',writeSeed(),async c=>{await c.updateOne({_id:1},{$inc:{'items.$[].qty':1}});return c.findOne({_id:1});}));
add('update','many',e=>e.work('many',writeSeed(),async c=>{const r=await c.updateMany({},{$inc:{n:1}});return {matched:r.matchedCount,modified:r.modifiedCount,rows:await c.find().sort({_id:1}).toArray()};}));
add('update','upsert-setOnInsert',e=>e.work('upsert',[],async c=>{const r=await c.updateOne({_id:7},{$set:{value:3},$setOnInsert:{created:'fixed'}},{upsert:true});return {upserted:r.upsertedId,row:await c.findOne({_id:7})};}));
add('update','replace',e=>e.work('replace',writeSeed(),async c=>{await c.replaceOne({_id:1},{label:'replaced'});return c.findOne({_id:1});}));
add('update','findOneAndUpdate',e=>e.work('fau',writeSeed(),c=>c.findOneAndUpdate({_id:1},{$inc:{n:1}},{returnDocument:'after'})));
add('update','findOneAndReplace',e=>e.work('far',writeSeed(),c=>c.findOneAndReplace({_id:1},{label:'new'},{returnDocument:'before'})));
add('update','findOneAndDelete',e=>e.work('fad',writeSeed(),c=>c.findOneAndDelete({_id:2})));
add('write','insertMany',e=>e.work('insert',[],async c=>{const r=await c.insertMany([{_id:1,x:1},{_id:2,x:2}]);return {count:r.insertedCount,rows:await c.find().sort({_id:1}).toArray()};}));
add('write','bulkWrite',e=>e.work('bulk',writeSeed(),async c=>{const r=await c.bulkWrite([{insertOne:{document:{_id:3,n:30}}},{updateOne:{filter:{_id:1},update:{$inc:{n:1}}}},{replaceOne:{filter:{_id:2},replacement:{n:22}}},{deleteOne:{filter:{_id:3}}}]);return {inserted:r.insertedCount,matched:r.matchedCount,modified:r.modifiedCount,deleted:r.deletedCount,rows:await c.find().sort({_id:1}).toArray()};}));
add('write','deleteMany',e=>e.work('delete',writeSeed(),async c=>{const r=await c.deleteMany({n:{$gte:10}});return {deleted:r.deletedCount,count:await c.countDocuments()};}));

const indexSpecs = {
  compound:[{n:1,label:-1},{name:'compound'}], unique:[{label:1},{unique:true,name:'unique_label'}], sparse:[{missing:1},{sparse:true,name:'sparse_missing'}],
  partial:[{n:1},{partialFilterExpression:{enabled:true},name:'partial_n'}], ttl:[{expires:1},{expireAfterSeconds:3600,name:'ttl_expires'}],
  hashed:[{label:'hashed'},{name:'hashed_label'}], wildcard:[{'nested.$**':1},{name:'wild_nested'}],
  collation:[{label:1},{name:'collation_label',collation:{locale:'en',strength:2}}], text:[{label:'text'},{name:'text_label'}], twoD:[{point:'2d'},{name:'two_d'}], sphere:[{location:'2dsphere'},{name:'sphere'}]
};
for(const [id,[key,options]] of Object.entries(indexSpecs)) add('index',id,e=>e.work('idx',writeSeed(),async c=>{await c.createIndex(key,options);const indexes=await c.listIndexes().toArray();return indexes.map(i=>Object.fromEntries(Object.entries(i).filter(([k])=>!['ns','background'].includes(k)))).sort((a,b)=>a.name.localeCompare(b.name));}));
add('index','drop',e=>e.work('dropidx',writeSeed(),async c=>{await c.createIndex({n:1},{name:'n_index'});await c.dropIndex('n_index');return (await c.listIndexes().toArray()).map(i=>i.name);}));
add('index','unique-violation',e=>e.work('uniq',writeSeed(),async c=>{await c.createIndex({label:1},{unique:true});return c.insertOne({_id:3,label:'a'});}),{expectedError:11000});
add('index','text-query',e=>e.work('text',[{_id:1,text:'portable local database'},{_id:2,text:'document storage'},{_id:3,text:'portable music player'}],async c=>{await c.createIndex({text:'text'});return c.find({$text:{$search:'database'}}).sort({_id:1}).toArray();}));
add('geo','geoWithin',e=>e.work('geo',[{_id:1,p:[1,1]},{_id:2,p:[5,5]},{_id:3,p:[-1,-1]}],async c=>{await c.createIndex({p:'2d'});return c.find({p:{$geoWithin:{$box:[[0,0],[3,3]]}}}).sort({_id:1}).toArray();}));
add('geo','geoNear',e=>e.work('near',[{_id:1,location:{type:'Point',coordinates:[90.4,23.8]}},{_id:2,location:{type:'Point',coordinates:[91.8,22.3]}}],async c=>{await c.createIndex({location:'2dsphere'});return c.aggregate([{$geoNear:{near:{type:'Point',coordinates:[90.4,23.8]},distanceField:'distance',spherical:true}},{$project:{_id:1}}]).toArray();}));
add('geo','geoIntersects',e=>e.work('intersect',[{_id:1,p:{type:'Point',coordinates:[1,1]}},{_id:2,p:{type:'Point',coordinates:[10,10]}}],async c=>{await c.createIndex({p:'2dsphere'});return c.find({p:{$geoIntersects:{$geometry:{type:'Polygon',coordinates:[[[0,0],[3,0],[3,3],[0,3],[0,0]]]}}}}).sort({_id:1}).toArray();}));

add('collection','validator-valid',e=>e.work('valid',[],async c=>{await c.insertOne({_id:1,name:'valid'});return c.findOne({_id:1});},{validator:{$jsonSchema:{bsonType:'object',required:['name'],properties:{name:{bsonType:'string'}}}}}));
add('collection','validator-invalid',e=>e.work('invalid',[],c=>c.insertOne({_id:1,name:42}),{validator:{$jsonSchema:{bsonType:'object',required:['name'],properties:{name:{bsonType:'string'}}}}}),{expectedError:121});
add('collection','capped',e=>e.work('capped',[{_id:1,n:1}],async c=>({rows:await c.find().toArray(),isCapped:await c.isCapped()}),{capped:true,size:1048576,max:100}));
add('collection','timeseries',e=>e.work('ts',[],async c=>{await c.insertMany([{_id:1,ts:new Date('2024-01-01'),meta:'a',v:1},{_id:2,ts:new Date('2024-01-02'),meta:'a',v:2}]);return c.find().sort({_id:1}).toArray();},{timeseries:{timeField:'ts',metaField:'meta',granularity:'hours'}}));
add('collection','view',e=>e.work('view',[],async(c,n)=>{await e.db.createCollection(n+'_v',{viewOn:n,pipeline:[{$match:{n:{$gte:20}}}]});try{await c.insertMany(writeSeed());return await e.col(n+'_v').find().sort({_id:1}).toArray();}finally{await e.col(n+'_v').drop();}}));
add('collection','out',e=>e.work('out',writeSeed(),async(c,n)=>{await c.aggregate([{$match:{n:{$gt:10}}},{$out:n+'_out'}]).toArray();try{return await e.col(n+'_out').find().sort({_id:1}).toArray();}finally{await e.col(n+'_out').drop();}}));
add('collection','merge',e=>e.work('merge',writeSeed(),async(c,n)=>{await c.aggregate([{$set:{merged:true}},{$merge:{into:n+'_merged',on:'_id',whenMatched:'replace',whenNotMatched:'insert'}}]).toArray();try{return await e.col(n+'_merged').find().sort({_id:1}).toArray();}finally{await e.col(n+'_merged').drop();}}));
add('aggregation','densify',e=>e.work('dense',[{_id:1,n:1},{_id:2,n:3}],c=>c.aggregate([{$densify:{field:'n',range:{step:1,bounds:'full'}}},{$project:{_id:0,n:1}},{$sort:{n:1}}]).toArray()));
add('aggregation','fill',e=>e.work('fill',[{_id:1,n:1,v:10},{_id:2,n:2,v:null},{_id:3,n:3,v:30}],c=>c.aggregate([{$fill:{sortBy:{n:1},output:{v:{method:'linear'}}}},{$sort:{_id:1}}]).toArray()));

add('error','duplicate-id',e=>e.work('dupid',writeSeed(),c=>c.insertOne({_id:1})),{expectedError:11000});
add('error','unknown-query-operator',e=>e.col('people').find({age:{$notARealOperator:1}}).toArray(),{expectedError:2});
add('error','invalid-projection',e=>e.col('people').find({}, {projection:{name:1,age:0}}).toArray(),{expectedError:31254});
add('profile','where-js',e=>e.col('people').find({$where:'this.age >= 25'}).sort({_id:1}).toArray(),{profileLimit:true});
add('profile','function-js',e=>e.col('people').aggregate([{$match:{_id:1}},{$project:{result:{$function:{body:'function(x){return x*2;}',args:['$score'],lang:'js'}}}}]).toArray(),{profileLimit:true});
add('profile','accumulator-js',e=>e.col('people').aggregate([{$group:{_id:null,n:{$accumulator:{init:'function(){return 0;}',accumulate:'function(s,x){return s+x;}',accumulateArgs:['$score'],merge:'function(a,b){return a+b;}',lang:'js'}}}}]).toArray(),{profileLimit:true});
add('topology','change-stream',e=>e.col('people').aggregate([{$changeStream:{}}],{maxTimeMS:2000}).toArray(),{topologyLimit:true});
add('topology','transaction',async e=>{const session=e.client.startSession();try{session.startTransaction();return await e.col('people').findOne({_id:1},{session});}finally{await session.abortTransaction().catch(()=>{});await session.endSession();}},{topologyLimit:true});

require('./query-compatibility-extra.cjs').extend(cases);
module.exports = { cases, seed, typeSeed };

if (require.main === module) {
  const counts = cases.reduce((out,t) => { out[t.group]=(out[t.group]||0)+1;return out; },{});
  console.log(JSON.stringify({total:cases.length,counts},null,2));
  if(new Set(cases.map(c=>c.id)).size!==cases.length)throw new Error('Duplicate test IDs');
}
