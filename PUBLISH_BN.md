# bsonlite-sdk 0.6.0-rc.3 — npm-এ প্রকাশ

এই release-এ BsonLite Console 0.2.0 desktop software ও terminal CLI-এর automatic connection আছে। Native engine/core 0.6.0-rc.1 অপরিবর্তিত। Package version ইতিমধ্যে **0.6.0-rc.3**; এখন আবার npm version চালানোর প্রয়োজন নেই।

## ১. Pull ও পরীক্ষা

যে repository folder-এ package.json আছে, সেখানে PowerShell খুলে চালাও:

```powershell
git pull --ff-only origin main
npm pkg get name version
npm test
npm run verify
```

Name হবে bsonlite-sdk, version হবে 0.6.0-rc.3। Local changes থাকায় pull আটকে গেলে সেগুলো সংরক্ষণ/merge করো; reset --hard দিয়ে মুছবে না। npm test পুরোনো Windows checkout-এর CRLF line ending ঠিক করতে পারে, তবে শুধু recorded checksum-এর সঙ্গে সম্পূর্ণ মিললে। নিজের code edit বা অন্য mismatch overwrite করবে না।

## ২. npm account ও CLI

```powershell
node --version
npm --version
npm whoami
```

Staged publishing-এর জন্য Node.js 22.14+ ও npm 11.15+ প্রয়োজন। Node.js 24 ব্যবহার করতে পারো। এটি প্রকাশকের environment; SDK ব্যবহারকারীর Node.js requirement 20+। npm whoami-এ login না থাকলে npm login করে নিজের browser-এ authentication সম্পন্ন করো।

## ৩. Stage upload

```powershell
npm stage list bsonlite-sdk
npm stage publish --access public --tag latest
```

আগে একই rc.3-এর pending stage থাকলে সেটির details দেখে নাও; একই version বারবার upload করবে না। Fresh upload সফল হলে npm একটি নতুন stage ID দেবে। সেটি ব্যবহার করবে, আগের rc.2-এর ID নয়।

## ৪. Review শেষ হলে approve

```powershell
npm stage view STAGE_ID
npm stage approve STAGE_ID
```

STAGE_ID-এর জায়গায় এই upload-এর নতুন UUID বসাও। Browser authentication ও 2FA নিজের account থেকে সম্পন্ন করো। Automated review চলতে থাকলে approve এখনই হবে না; review শেষ হওয়ার পর একই ID দিয়ে আবার approve করো। নতুন করে stage/version তৈরি করার প্রয়োজন নেই। চাইলে npmjs.com-এর Staged Packages থেকে একই package review ও approve করা যায়।

Stage upload করলেই public release হয় না। Approve হওয়ার পর package এবং এই README npm page-এ আসবে। latest tag ইচ্ছাকৃত, যাতে সাধারণ npm install bsonlite-sdk এই release পায়।

## ৫. প্রকাশ যাচাই

```powershell
npm view bsonlite-sdk version
npm view bsonlite-sdk dist-tags --json
```

latest হবে 0.6.0-rc.3। নিজের app folder-এ update করে app restart করো:

```powershell
npm install bsonlite-sdk@latest
```

Console software download: https://github.com/MohammadAtikurRahman/BsonLite-Console/releases/tag/v0.2.0

App চালু রাখলে একই Windows account-এর Console/CLI database খুঁজে পাবে। App code-এ require('bsonlite-sdk') ব্যবহার করবে। node_modules থেকে internal BsonLite.cjs আলাদা করে copy করলে automatic adapter বাদ পড়ে যাবে; single-file ব্যবহারের জন্য release-এর integrated CJS download করবে।

## সমস্যা হলে

- E409 previously published version: ওই version reuse করা যাবে না। আগে registry ও pending stage list যাচাই করো; তখন unused release version এবং matching package metadata প্রস্তুত করতে হবে।
- E409 review unfinished: একই stage-এর review শেষ হওয়া পর্যন্ত অপেক্ষা করে আবার approve করো।
- E403 / authentication: npm whoami দিয়ে সঠিক publisher account যাচাই করে npm login ও 2FA সম্পন্ন করো।
- GitHub push করলেই npm-এর আগের version বা README বদলায় না; নতুন version stage ও approve করতে হয়।

Engine source, licenses, console-build.json এবং SHA256SUMS package-এ রাখবে। শুধু npm version বদলালে native core build version বদলাবে না।

Official references:
- https://docs.npmjs.com/staged-publishing/
- https://docs.npmjs.com/cli/v11/commands/npm-stage/
