# BsonLite query compatibility — ২৭ অক্টোবর ২০২৬

**নির্বাচিত engine/query পরীক্ষায় অপ্রত্যাশিত পার্থক্য পাওয়া যায়নি। Console interpreter-এ ৩টি বাস্তব bug পাওয়া গেছে। পূর্ণ MongoDB Community parity প্রমাণিত হয়নি।**

বাস্তব Windows Server 2022 x64 runner-এ Node.js 24.22.1 দিয়ে পরীক্ষা হয়েছে। Linux simulation বা fake database-কে native ফল হিসেবে ব্যবহার করা হয়নি। প্রতিটি target-এ নতুন synthetic database ছিল।

## কোন সংস্করণ পরীক্ষা হয়েছে

| অংশ | সুনির্দিষ্ট পরিচয় |
| --- | --- |
| বর্তমান published npm | `bsonlite-sdk@0.7.0-alpha.4`, embedded SDK `0.7.0-alpha.0`, driver `7.7.0` |
| SDK repo inspected base | `94a6ab7a290f332cbcdd620555ae489d31e786aa` |
| বর্তমান core | `31183756a2a3cde31bc04f67f5899b3606545ee4`; সফল core Windows run `40308893103` থেকে পরীক্ষিত npm artifact |
| Console | `333b246d80472d69b1304a11e24d0c68bd2f05d9`, version `0.3.0`, direct-connection driver `6.16.0` |
| তুলনার stock Community | Official Windows MongoDB Community **9.0.4**, driver **7.7.0** |
| নতুন suite commit | `c7f25aac8e5260df7d6249bdc036f696ff2ae212` |

দুই engine-এর `buildInfo.version`-ই `9.0.4`। BsonLite custom build-এর `gitVersion` হলো `nogitversion`; stock build-এরটি `64ade602b836c9adeffba7fa038c887ffab56196`। Version একই; binary/source build identity এক বলে দাবি করা হচ্ছে না।

Published SDK-এর compiled SHA-256 `bc5a3cd20dc217c0a4c0255921dad687aa94844fe1730a6ad51bf56b50a83172`; বর্তমান core artifact-এরটি `286a10516ddfc38bbf397d5ac3c5bd2807a29f5df0ff5af78cde608791d2703b`। সেজন্য দুটিকে আলাদা target হিসেবে চালানো হয়েছে। Published SDK-এর native engine SHA-256 `61d9c95ae1e58d96ac7f74d5aa46e7aefc1f8a3208a86097dbc77c3af62f5307`; বর্তমান core artifact-এর native engine SHA-256 `6898780b2265a2c10583c31288a597a1c3deba064f76d2da7a4b5eacf024b0b9`। অর্থাৎ একই reported engine version হলেও দুটি native binary এক নয়; প্রতিটির নিজস্ব validation ও checksum ধরে পরীক্ষা হয়েছে।

## Engine-এর ফল

| শ্রেণি | Published SDK | বর্তমান core |
| --- | ---: | ---: |
| সফল ফল/পরিবর্তন মিলে গেছে | 327 | 327 |
| প্রত্যাশিত error-এর name/code/codeName মিলেছে | 10 | 10 |
| BsonLite-এ ইচ্ছাকৃত JavaScript restriction | 3 | 3 |
| উভয় standalone topology-র সীমা | 2 | 2 |
| অপ্রত্যাশিত engine difference/shared rejection | 0 | 0 |
| সম্পন্ন case | **342** | **342** |

এগুলো একই ৩৪২টি case, দুই distribution-এ পুনরায় চালানো। ৬৮৪টি আলাদা operator পরীক্ষা হয়েছে—এমন অর্থ নয়। কোনো case বাদ যায়নি; দুই report-এ `complete: true` আছে।

যা মিলেছে: CRUD, nested/array filter, comparison/logical/bitwise operators, projection, sort/skip/limit, bulk writes, update pipeline ও arrayFilters, unique/partial/TTL-definition/text/geospatial indexes, aggregation, lookup/graphLookup/facet/unionWith, windows/rank, date/string/array/set/object expressions, views, time series, validators, `$out`, `$merge` এবং selected BSON values।

BSON-এর মধ্যে ObjectId, Int32, Long, Double, Decimal128, Binary, UUID, Timestamp, Date, regex, MinKey/MaxKey, NaN/Infinity ও Unicode আছে। অতিরিক্ত পরীক্ষায় 64-bit integer-এর দুই boundary, integral Double বনাম Int32-এর explicit type, decimal exponent, embedded-document field-order query এবং null বনাম missing field independent expectations দিয়ে যাচাই হয়েছে। BSON `Code` value রাখা আর সেই JavaScript execute করা আলাদা বিষয়।

৪০টি compound query independent deterministic JavaScript oracle-এর সঙ্গেও মিলেছে; ৩৭টির ফল non-empty। Random/sample/currentDate case-এ validity contract মিলেছে, হুবহু random value/time নয়।

বাস্তব disk-spill case-এ ২২,০০০ document ও ১৫৭,৭৬১,৯৯৭ payload bytes ছিল। দুই engine-এই execution statistics-এ spill নিশ্চিত হয়েছে; aggregate count, byte total ও rank sum মিলেছে। এটি performance benchmark বা spill encryption-এর নতুন cryptographic audit নয়।

মূল engine query comparison-এ দুই পাশেই database-scoped `readWrite`, standalone, `w:1`, journaling ও `retryWrites:false` রাখা হয়েছে। BsonLite-এর mutual TLS বজায় ছিল; stock server authenticated loopback ব্যবহার করেছে। এটি TLS configuration parity test নয়।

## Error behavior

| পরীক্ষা | দুই engine-এর code |
| --- | ---: |
| Unique index conflict / duplicate `_id` | 11000 |
| Validator rejection | 121 |
| অজানা query operator / অনুপস্থিত index hint | 2 |
| ভুল inclusion/exclusion projection | 31254 |
| অজানা update operator | 9 |
| `_id` বদলানোর চেষ্টা | 66 |
| Admin command / অন্য database পড়ার permission নেই | 13 |

এই ১০টি case-এ error class, code এবং codeName একই। ৮টির message হুবহু একই। দুই permission error-এর message-এ শুধু প্রত্যেক connection-এর আলাদা `lsid` UUID ছিল; সেই runtime-generated session ID বাদ দিলে text-ও একই। Raw text অপরিবর্তিত রেখে JSON-এ রাখা হয়েছে। Suite-এর pass criterion error message-এর byte identity নয়।

## কোন সীমা কোন layer-এ

**Application API:** BsonLite-এর `Database` পূর্ণ MongoDB `Db` বা `MongoClient` object নয়। `collection()`, `createCollection()`, `listCollections()`, `ping()` এবং lifecycle methods আছে; `Database.command` পরীক্ষায় `undefined`। Collection আসল driver collection। একটি wrapper method না থাকা মানে engine-এ সংশ্লিষ্ট query নেই—এমন নয়। `readWrite` account-এর admin/অন্য database access দুই পাশেই প্রত্যাখ্যাত হয়েছে।

**Engine configuration:** BsonLite-এর `--noscripting` রাখা হয়েছে। `$where`-এ code `6108304`; `$function` ও JavaScript `$accumulator`-এ `31264` পাওয়া গেছে। Stock Community-র অপরিবর্তিত default-এ এগুলো সফল হয়েছে। BsonLite-এ scripting চালু করা হয়নি।

**Topology:** উভয় server standalone রাখা হয়েছে। Change stream-এ উভয়ে `40573`; multi-document transaction-এ উভয়ে `20`। Replica set বানিয়ে ফল পাল্টানো হয়নি।

**Console interpreter:** একবারে একটি expression, নির্দিষ্ট method/modifier allowlist, read-only policy ও output bounds আছে। `batchSize()` SDK-তে চলে, Console-এ modifier হিসেবে প্রত্যাখ্যাত। Arbitrary JavaScript/variables এবং `$where` parser-এই আটকায়। App-link দিয়ে `db.runCommand({ping:1})` নিষিদ্ধ, অথচ SDK `ping()` এবং authenticated direct Community Console-তে ping চলে। এটি app-link policy।

Console default-এ ৫০টি document দেখায়; সর্বোচ্চ ১০০০। ১০০৫টি synthetic record দিয়ে default truncation ও `.limit(0)`-এর ১০০০-row cap যাচাই হয়েছে। Record হারায়নি। Console error-কে sanitized plain `Error` message করে: duplicate-key-এর text-এ `E11000` আছে, কিন্তু driver-এর numeric `error.code` property নেই। এটি engine error-code mismatch নয়।

## Console-এর ৩টি actual mismatch

প্রতিটি target-এ **২৫টি Console case** সম্পন্ন: **১৩টি match, ৯টি নির্ধারিত interface limit, ৩টি semantic difference**। Real SDK app-link এবং authenticated Community direct connection ব্যবহার হয়েছে; Electron window চালিয়ে GUI পরীক্ষা করা হয়নি। Native Console insert/update/read/findOneAndUpdate/delete, BSON constructors, count, index listing ও aggregation grouping মিলেছে।

একই ছয়জন synthetic person, `_id` ১–৬, ব্যবহার করে পাওয়া ফল:

| Query | সরাসরি SDK/Community | Console, উভয় backend |
| --- | --- | --- |
| `db.people.aggregate([]).limit(2).sort({_id:-1})` | IDs `[2,1]` | IDs `[6,5]` |
| `db.people.aggregate([]).limit(2).skip(1)` | IDs `[2]` | IDs `[2,3]` |
| `db.people.find({}, {limit:1,sort:{_id:1}})` | IDs `[1]` | IDs `[1,2,3,4,5,6]` |

কারণ source-এও দেখা যায়: `src/execute.cjs` modifier-এর `limit` সঙ্গে সঙ্গে cursor/pipeline-এ দেয় না; শেষে display bound দিয়ে `cursor.limit(bound+1)` বসায়। ফলে aggregation stage order বদলায়। একই শেষের limit `find` options-এর limit-ও overwrite করে। প্রথম দুটি একই মূল stage-order bug-এর দুইটি reproduction। তৃতীয়টি options-limit হারানোর case।

বর্তমান compiled SDK app-link bridge এবং বর্তমান standalone Console direct path—দুই জায়গাতেই এগুলো ঘটেছে। তাই শুধু GUI parser-এর বাহ্যিক নামকরণ বা stock server-এর ত্রুটি বলা যাবে না। Engine-এ সরাসরি একই operation দুই পাশে মিলেছে। এগুলো পূর্ণ query ফল ভুল দেখাতে পারে; সংশ্লিষ্ট Console execution এবং embedded bridge implementation-এ regression fix দরকার। এই task-এ runtime/installer বদলানো হয়নি।

**CI failure ইচ্ছাকৃতভাবে সংরক্ষিত:** test execution শেষ হয়েছে; infrastructure blocker নেই। Unexpected Console differences পাওয়ায় runner exit 1 দিয়েছে এবং final gate failure হয়েছে। Green করার জন্য mismatch ignore বা expected-limit হিসেবে পুনর্লিখন করা হয়নি।

## আগের evidence কী বলছিল

- ২৬ অক্টোবরের [Windows differential run 40262963488](https://github.com/MohammadAtikurRahman/Bsonlite-SDK/actions/runs/40262963488): npm `0.7.0-alpha.1`, 333 case; 323 success, 5 expected error, 3 scripting limit, 2 topology limit। Raw report-এর counts, distinct case IDs এবং প্রত্যেক case-এর দুই outcome যাচাই হয়েছে। সেই suite Console interpreter cover করেনি।
- বর্তমান core-এর [run 40308893103](https://github.com/MohammadAtikurRahman/BsonLite/actions/runs/40308893103) সফল: native/source, runtime/migration/CLI এবং final embedded-consumer gates। সেখানকার verified modern npm artifact নিয়েই নতুন current-core target চালানো হয়েছে। ওই security/storage tests ও নতুন query tests আলাদা evidence।
- SDK repo-র root `package.json` এখনও retained `0.6.0-rc.3` compatibility fixture; main-এর packed-Console workflow সেটিই pack করে। শুধু তার green badge-কে modern `9.0.4` query parity বলা হয়নি। Modern release snapshot থেকে published `.4` এবং বর্তমান core artifact আলাদা করে পরীক্ষা করা হয়েছে।
- Console validation-এর installer/UI tests synthetic in-memory bridge ব্যবহার করেছিল; সেগুলো native query parity-এর বিকল্প নয়। বর্তমান Console source-এর ২১টি local code/bridge test-ও পাস করেছে; সেই সংখ্যা native differential result-এর সঙ্গে যোগ করা হয়নি।

## পুনরায় চালানো ও evidence

- **Final native Windows run:** https://github.com/MohammadAtikurRahman/Bsonlite-SDK/actions/runs/40446340893
- **সুনির্দিষ্ট workflow:** [`query-compatibility-current.yml`](../../../.github/workflows/query-compatibility-current.yml)
- **Published SDK-এর raw BSON/results/errors:** [published/report.json](published/report.json)
- **বর্তমান core-এর raw BSON/results/errors:** [current-core/report.json](current-core/report.json)
- **Checksums ও target পরিচয়:** [evidence-index.json](evidence-index.json)
- **স্থায়ী original CI evidence archive:** [native-evidence.zip](native-evidence.zip)
- **Installed dependency lockfiles:** [published](published/consumer-package-lock.json), [current core](current-core/consumer-package-lock.json)

Report JSON-এ `results` engine matrix; `console.results` Console matrix। Original generated `report.md` শুধু engine summary দেখায়; Console verdict-এর জন্য এই audit ও JSON দেখবে।

GitHub-এ final run-এর Artifacts থেকে `current-query-audit-c7f25aac8e5260df7d6249bdc036f696ff2ae212` download করলে দুই full report, পাঁচটি exact suite source ও উভয় installed dependency lockfile পাওয়া যায়। Archive SHA-256: `07753176ca9a3cfb36853b21fc88da9fb57259c331901c2c4f695209f4f2cd1d`। Workflow-pinned stock ZIP SHA-256: `1e6234c8c33e75de3659a7e1104cb12f1cb68ae41cba60b625537c1ed9256d43`; extracted executable SHA-256: `af268c8aceadfe93076b0fcbd87d47f9d448824b98632c778bcd06f560ace167`।

Manual reproduction supported Windows x64 build 20348+ ও Node 24.22.1-এ, disposable checkout-এ:

```powershell
git clone https://github.com/MohammadAtikurRahman/Bsonlite-SDK.git
cd Bsonlite-SDK
git checkout c7f25aac8e5260df7d6249bdc036f696ff2ae212
git clone https://github.com/MohammadAtikurRahman/BsonLite-Console.git .console-current
git -C .console-current checkout 333b246d80472d69b1304a11e24d0c68bd2f05d9
npm ci --prefix .console-current --omit=dev --ignore-scripts --no-audit --no-fund
New-Item -ItemType Directory -Force .query-runtime | Out-Null
Set-Content .query-runtime/package.json '{"name":"bsonlite-query-validation","private":true}'
npm install --prefix .query-runtime --ignore-scripts --no-audit --no-fund bsonlite-sdk@0.7.0-alpha.4 mongodb@7.7.0
$env:BSONLITE_CONSOLE_REPO = Join-Path $PWD '.console-current'
$env:COMMUNITY_BINARY = 'C:\path\to\verified-9.0.4\bin\mongod.exe'
$env:QUERY_TARGET = 'published-0.7.0-alpha.4'
$env:QUERY_PACKAGE_VERSION = '0.7.0-alpha.4'
$env:QUERY_REPORT = 'query-report/published'
node scripts/query-compatibility.cjs
```

Official ZIP URL ও checksum verification commands workflow-এ আছে। ভুল version/hash হলে runner বন্ধ হবে। Current-core reproduction-এর জন্য ওই workflow-র `gh run download 40308893103` ও `.core-runtime` install step অনুসরণ করতে হবে; তারপর `QUERY_RUNTIME=.core-runtime`, `QUERY_PACKAGE_VERSION=0.7.0-alpha.0`, `QUERY_TARGET=core-31183756a2a3cde31bc04f67f5899b3606545ee4`, `QUERY_REPORT=query-report/current-core` দিয়ে একই runner চালাতে হবে। Core artifact-এর embedded validation-এ ওই exact commit/run মেলা বাধ্যতামূলক।

Re-running the final Windows workflow also reproduces the checks. বিদ্যমান bug থাকলে exit 1-ই সঠিক ফল; শুধু reports তৈরি হওয়াকে pass বলা যাবে না। Pinned package install এখানে test reproducibility-র জন্য; সাধারণ ব্যবহারকারীর installation guidance বদলানো হয়নি।

## নিরাপত্তা ও অসম্পূর্ণ scope

BsonLite-এর native XChaCha20-Poly1305 storage encryption, verified full coverage, SCRAM-SHA-256, mutual TLS, account-protected vault ও existing startup security flags রাখা হয়েছে। সব data/managed vault/discovery path নতুন test-specific temporary root-এ; user database খোলা হয়নি। Stock server নতুন authenticated loopback standalone ছিল। তার upstream scripting default বদলানো হয়নি। BsonLite-এ `--noscripting` সরানো হয়নি; topology-ও বদলানো হয়নি। Console write checks শুধু test session-এ; persistent preferences বদলায়নি। কোনো data directory, vault, password, token বা certificate artifact হিসেবে upload করা হয়নি।

এখনও অপ্রমাণিত: প্রতিটি operator-এর সব option/combination, exhaustive malformed/error cases, BSON wire byte/field-order identity, every numeric/BSON edge, exact random values, timed TTL expiry, GridFS/tooling/mongosh parity, full direct-connection driver-6 parity, replica-set/sharded/Atlas services, long-duration/concurrent/failure workloads, power-loss behavior, performance superiority, clean Windows 11 Home/Pro GUI/installer validation এবং independent security certification।

তুলনায় driver-decoded canonical EJSON ব্যবহার করা হয়েছে: object keys normalize হয়, array order থাকে। নতুন explicit type ও field-order-query case নির্দিষ্ট কয়েকটি gap কমায়; পুরো wire protocol parity প্রমাণ করে না।

এই কাজের পরিবর্তন test suite, CI ও evidence branch-এ সীমিত। Main merge, npm publishing, website deployment বা product security configuration পরিবর্তন করা হয়নি।
