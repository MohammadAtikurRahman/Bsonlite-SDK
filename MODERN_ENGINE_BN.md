# আধুনিক engine-এর npm package প্রস্তুত করা

নতুন experimental SDK **0.7.0-alpha.0**-এর আসল Windows engine, migration/CLI
ও final single-file SDK পরীক্ষা পাস করেছে। Engine 9.0.4, driver 7.7.0;
Node.js 20.19+ এবং Windows x64 build 20348+ প্রয়োজন। এই repository-র `main`-এ
preparation script আছে; root-এর 0.6 package-এর শুধু version বদলে নতুন engine
পাওয়া যাবে না।

পরীক্ষায় পাস করা build:

- Core commit: `5137fbc92749f20679445657d504718446db4eab`।
- [সফল Windows run](https://github.com/MohammadAtikurRahman/BsonLite/actions/runs/40181496708)।
- [প্রস্তুত npm package ZIP](https://github.com/MohammadAtikurRahman/BsonLite/actions/runs/40181496708/artifacts/12594269894)।
- [Standalone CJS ও matching source ZIP](https://github.com/MohammadAtikurRahman/BsonLite/actions/runs/40181496708/artifacts/12594725727)।

npm package ZIP extract করলে `bsonlite-sdk-0.7.0-alpha.0.tgz` পাবেন। এর
SHA-256: `67d24c400aa21ffb4419ec97c53d77c03708090fd1e1f71386612737cb2a5cd5`।
PowerShell-এ `Get-FileHash ./bsonlite-sdk-0.7.0-alpha.0.tgz -Algorithm SHA256`
দিয়ে মিলিয়ে নিতে পারেন।

Core workflow বাস্তব Windows engine, encrypted storage, journal/spill,
backup/restore, পুরোনো SDK থেকে migration, CLI এবং final single-file SDK
পরীক্ষা করে। তারপর এই repository-র pinned preparation script দিয়ে npm package
তৈরি ও verify/pack করা হয়। [Core build ও artifacts](https://github.com/MohammadAtikurRahman/BsonLite/actions/workflows/modern-engine.yml)
দেখুন। Source preview দিয়ে npm release তৈরি করা বন্ধ থাকে।

## Publish করার আগে নিজের নতুন project-এ পরীক্ষা

উপরের tarball-এর পাশে একটি নতুন project folder ব্যবহার করুন:

```powershell
mkdir bsonlite-modern-try
cd bsonlite-modern-try
npm init -y
npm install ../bsonlite-sdk-0.7.0-alpha.0.tgz
```

সেই project থেকে `require('bsonlite-sdk')` ব্যবহার করা যাবে। নতুন database-এ
আগের মতো `await BsonLite.connect()` করুন। চলমান app-টি Console/CLI-তে
automatic connection হিসেবে দেখা যাবে। পুরোনো `Database` folder-এর জন্য
নিচের migration guide অনুসরণ করুন।

## পরীক্ষিত npm artifact থেকে publish

ডাউনলোড করা tarball আলাদা একটি publish folder-এ রাখুন। সেটি extract করে
প্রস্তুত `package` folder থেকে চালান:

```powershell
tar -xzf ./bsonlite-sdk-0.7.0-alpha.0.tgz
cd package
npm test
npm run verify
npm stage publish --access public --tag next
```

বর্তমান npm CLI-তে staged publishing ও আপনার browser/2FA authentication
প্রয়োজন। Review শেষ হলে নিজের নতুন stage ID দিয়ে approve করুন। এখানে
experimental release-এর tag `next`; সাধারণ `latest` package থেকে এটি আলাদা।
নিজের নতুন stage ID দেখার ও review শেষে approve করার command:

```powershell
npm stage list bsonlite-sdk
npm stage approve YOUR_NEW_STAGE_ID
```

আগে publish হওয়া একই version আবার publish করা যাবে না। নতুন npm version
লাগলে preparation script-এর `--version` ব্যবহার করে package পুনরায় প্রস্তুত
করতে হবে; প্রস্তুত package-এর checksum ভেঙে শুধু package.json বদলাবেন না।

এই GitHub কাজ নিজে npm registry-তে publish করে না। Publish সম্পন্ন হওয়ার
পরে app-এ `npm install bsonlite-sdk@next` ব্যবহার করা যাবে।

## একই artifact থেকে নিজে প্রস্তুত করলে

পুরো `BsonLite-modern-experimental-<commit>` artifact ZIP extract করুন। সেই
run-এর সঠিক commit SHA ও run ID দিয়ে:

```powershell
node scripts/prepare-modern.cjs --artifact F:/BsonLiteModern --out ./prepared-modern --commit 5137fbc92749f20679445657d504718446db4eab --run-id 40181496708
cd prepared-modern
npm test
npm pack
```

অন্য সফল run-এর artifact নিলে তার নিজের commit SHA ও run ID দিন। Output
folder আগে থেকে থাকা চলবে না। অন্য version চাইলে `--version 0.7.0-alpha.1` দিতে
পারেন, তবে সেটি আগে npm-এ publish হওয়া চলবে না।

Script SDK, engine, matching modified source এবং তিন ধরনের runtime report-এর
checksum যাচাই করে। বানানো package-এ matching source, component licenses,
validation record, মূল তিনটি JUnit report এবং checksum থাকে। Report-গুলো
`validation/` folder-এ থাকে; GitHub artifact expire হলেও package থেকে পাওয়া
যাবে। Copy হওয়া SDK, source ও report-এর bytes-ও validation record-এর সঙ্গে
মিলিয়ে দেখা হয়। CommonJS ও ES-module import পরীক্ষা করা
হয়। নতুন CJS-এ Console adapter আগে থেকেই আছে, তাই পুরোনো adapter দিয়ে আবার
wrap করা হয় না। User-এর computer-এ engine download করার postinstall script
নেই।

পুরোনো database সরাসরি নতুন engine-এ খুলবেন না। নতুন directory-তে logical
upgrade-এর জন্য [বাংলা migration guide](https://github.com/MohammadAtikurRahman/BsonLite/blob/upgrade/mongodb-9.0/native/modern/UPGRADE_BN.md)
দেখুন। Standalone profile-এ server-side JavaScript, replica-set transactions
ও change streams নেই। Experimental release-কে independent security audit
বা সব Windows computer-এ পরীক্ষিত software হিসেবে দাবি করা হয় না।
