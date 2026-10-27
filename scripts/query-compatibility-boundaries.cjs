'use strict';
const assert = require('node:assert/strict');
function extend(cases) {
  const add = (id,run,options={}) => cases.push({group:'boundary',id:'boundary/'+id,run,...options});
  add('int64-decimal-explicit-types', e => e.work('typed',[{_id:1,lo:e.BSON.Long.MIN_VALUE,hi:e.BSON.Long.MAX_VALUE,int:new e.BSON.Int32(7),double:new e.BSON.Double(7),decimal:e.BSON.Decimal128.fromString('1.234500E+20')}], async c => {
    const d = await c.findOne({_id:1},{promoteValues:false,promoteLongs:false});
    assert.equal(d.lo.toString(),'-9223372036854775808');assert.equal(d.hi.toString(),'9223372036854775807');
    assert.equal(d.int._bsontype,'Int32');assert.equal(d.double._bsontype,'Double');
    assert.equal(d.decimal.toString(),'1.234500E+20');return d;
  }));
  add('embedded-document-field-order', e => e.work('ordered',[{_id:1,v:{a:1,b:2}},{_id:2,v:{b:2,a:1}}], async c => {
    const a=await c.find({v:{a:1,b:2}}).toArray(),b=await c.find({v:{b:2,a:1}}).toArray();
    assert.deepEqual(a.map(d=>d._id),[1]);assert.deepEqual(b.map(d=>d._id),[2]);return {a,b};
  }));
  add('null-missing-independent-oracle', e => e.work('nulls',[{_id:1,v:null},{_id:2},{_id:3,v:0}], async c => {
    const ids=async q=>(await c.find(q).sort({_id:1}).toArray()).map(d=>d._id);
    const values={null:await ids({v:null}),missing:await ids({v:{$exists:false}}),exact:await ids({v:{$type:'null'}})};
    assert.deepEqual(values,{null:[1,2],missing:[2],exact:[1]});return values;
  }));
  add('find-one-and-update-after', e => e.work('findmodify',[{_id:1,n:2}],async c => {
    const d=await c.findOneAndUpdate({_id:1},{$inc:{n:3}},{returnDocument:'after',includeResultMetadata:false});assert.equal(d.n,5);return d;
  }));
  add('invalid-update-operator',e=>e.work('invalidupdate',[{_id:1}],c=>c.updateOne({_id:1},{$madeUp:{n:1}})),{expectedError:9});
  add('immutable-id',e=>e.work('immutable',[{_id:1}],c=>c.updateOne({_id:1},{$set:{_id:2}})),{expectedError:66});
  add('missing-index-hint',e=>e.col('people').find({}).hint('not_an_index').toArray(),{expectedError:2});
  add('admin-role-denied',e=>e.client.db('admin').command({getCmdLineOpts:1}),{expectedError:13});
  add('single-db-role-denied',e=>e.client.db('audit_other_database').collection('sentinel').findOne({}),{expectedError:13});
}
module.exports={extend};
