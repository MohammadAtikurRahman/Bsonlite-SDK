# আধুনিক engine-এর npm package প্রস্তুত করা

`upgrade/mongodb-9.0`-এ BsonLite-এর নতুন experimental engine-এর জন্য প্রস্তুতি
আছে। Engine 9.0.4, driver 7.7.0; আধুনিক build-এর জন্য Node.js 20.19+ এবং
Windows x64 build 20348+ প্রয়োজন। এই repository-র বিদ্যমান 0.6 package-কে
শুধু version বদলে আধুনিক package বানানো যাবে না।

Core workflow বাস্তব Windows engine, encrypted storage, journal/spill,
backup/restore, পুরোনো SDK থেকে migration, CLI এবং final single-file SDK
পরীক্ষা করে। তারপর এই repository-র pinned preparation script দিয়ে npm package
তৈরি ও verify/pack করা হয়। [Core build ও artifacts](https://github.com/MohammadAtikurRahman/BsonLite/actions/workflows/modern-engine.yml)
দেখুন। Source preview দিয়ে npm release তৈরি করা বন্ধ থাকে।

## পরীক্ষিত npm artifact থেকে publish

সফল core run-এর `BsonLite-modern-npm-<commit>` artifact নিন। ZIP-এর ভেতরে
প্রস্তুত `bsonlite-sdk-0.7.0-alpha.0.tgz` থাকবে। সেটি extract করুন:

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
আগে publish হওয়া একই version আবার publish করা যাবে না। নতুন npm version
লাগলে preparation script-এর `--version` ব্যবহার করে package পুনরায় প্রস্তুত
করতে হবে; প্রস্তুত package-এর checksum ভেঙে শুধু package.json বদলাবেন না।

এই GitHub কাজ নিজে npm registry-তে publish করে না। Publish সম্পন্ন হওয়ার
পরে app-এ `npm install bsonlite-sdk@next` ব্যবহার করা যাবে।

## একই artifact থেকে নিজে প্রস্তুত করলে

পুরো `BsonLite-modern-experimental-<commit>` artifact ZIP extract করুন। সেই
run-এর সঠিক commit SHA ও run ID দিয়ে:

```powershell
node scripts/prepare-modern.cjs --artifact F:/BsonLiteModern --out ./prepared-modern --commit CORE_COMMIT_SHA --run-id CORE_RUN_ID
cd prepared-modern
npm test
npm pack
```

`CORE_COMMIT_SHA` ও `CORE_RUN_ID` সফল core run থেকে নিতে হবে। Output folder
আগে থেকে থাকা চলবে না। অন্য version চাইলে `--version 0.7.0-alpha.1` দিতে
পারেন, তবে সেটি আগে npm-এ publish হওয়া চলবে না।

Script SDK, engine, matching modified source এবং তিন ধরনের runtime report-এর
checksum যাচাই করে। বানানো package-এ matching source, component licenses,
validation record ও checksum থাকে। CommonJS ও ES-module import পরীক্ষা করা
হয়। নতুন CJS-এ Console adapter আগে থেকেই আছে, তাই পুরোনো adapter দিয়ে আবার
wrap করা হয় না। User-এর computer-এ engine download করার postinstall script
নেই।

পুরোনো database সরাসরি নতুন engine-এ খুলবেন না। নতুন directory-তে logical
upgrade-এর জন্য [বাংলা migration guide](https://github.com/MohammadAtikurRahman/BsonLite/blob/upgrade/mongodb-9.0/native/modern/UPGRADE_BN.md)
দেখুন। Standalone profile-এ server-side JavaScript, replica-set transactions
ও change streams নেই। Experimental release-কে independent security audit
বা সব Windows computer-এ পরীক্ষিত software হিসেবে দাবি করা হয় না।
