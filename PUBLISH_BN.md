# npm publishing guide

## বর্তমান release

- npm package: `bsonlite-sdk@0.6.0-rc.2`
- Embedded SDK: `0.6.0-rc.1`
- SDK binary, build-info.json, validation.json, source archive ও checksums অপরিবর্তিত।

npm package version এবং embedded SDK build version আলাদা হতে পারে। `package.json`-এর `bsonlite.sdkVersion` দিয়ে matching SDK build যাচাই করা হয়; `npm version` চালিয়ে build-info.json বা checksum বদলাতে হবে না।

## E409: Cannot stage previously published version

`0.6.0-rc.1` registry-তে আগে ব্যবহৃত হয়েছিল বলে npm সেটি আর গ্রহণ করছে না। Public version list-এ বা pending stage list-এ না থাকলেও previously published version আবার ব্যবহার করা যায় না। `--force`, cache clean বা login করে এই নিয়ম এড়ানো যায় না।

এই কারণে নতুন package release `0.6.0-rc.2` প্রস্তুত করা হয়েছে।

## Pull, test ও stage

Repository checkout-এ চালান:

```powershell
git pull origin main
npm pkg get name version bsonlite
npm test
npm run verify
npm stage publish --access public --tag latest
```

Expected package version: `0.6.0-rc.2`। Local file পুরোনো থাকলে stage করবেন না। Uncommitted local changes থাকলে আগে সেগুলো সংরক্ষণ/merge করুন; reset --hard প্রয়োজন নেই।

Staged publishing-এর জন্য npm CLI 11.15.0+ এবং Node.js 22.14.0+ লাগে। SDK ব্যবহারকারীদের minimum runtime এখনও Node.js 20+।

## Approve

Stage সফল হলে returned stage ID review করুন:

```powershell
npm stage list bsonlite-sdk
npm stage view <stage-id>
npm stage approve <stage-id>
```

`<stage-id>`-এর জায়গায় returned ID বসাতে হবে। Approval-এর সময় নিজের 2FA সম্পন্ন করুন। Website থেকে চাইলে নিজের npm account-এর **Staged Packages** tab-এ package review করে **Approve** করা যায়।

Stage তৈরি করলেই public installable release হয় না। Approval-ই আসল প্রকাশের ধাপ। `latest` tag ইচ্ছাকৃত: সাধারণ `npm install bsonlite-sdk` এই release candidate পাবে।

কোনো `rc.2` pending stage আগে থেকেই থাকলে একই version আবার submit করবেন না; আগে সেটি inspect করুন। সঠিক content হলে approve করুন। পুরোনো content হলে শুধু নিজের matching pending stage-টি `npm stage reject <stage-id>` দিয়ে সরিয়ে তারপর আবার stage করা যায়। Previously published version reject/unpublish করে reuse করা যায় না।

## npm page-এ placeholder / README

`0.0.0-stage` ও **Temporary Holding Version** staging-এর placeholder। আসল package approve না হওয়া পর্যন্ত তার README ও metadata public npm page-এ আসে না।

GitHub README push/pull করলেই npm-এ থাকা পুরোনো tarball বদলায় না। এই commit-এর README পেতে এই checkout থেকেই নতুন version stage করতে হবে।

## Public result যাচাই

```powershell
npm view bsonlite-sdk version
npm view bsonlite-sdk dist-tags versions --json
```

Approval এবং latest tag সঠিক হলে `0.6.0-rc.2` দেখা যাবে। npm page refresh করে README ও GitHub link দেখুন।

Windows project-এ ব্যবহার:

```powershell
npm install bsonlite-sdk
```

```javascript
const BsonLite = require('bsonlite-sdk');
```

## Authentication

প্রয়োজনে `npm login` করুন এবং npmjs.com → Account → Two-Factor Authentication থেকে 2FA setup করুন। Password/token/recovery code GitHub বা chat-এ দেবেন না।

## Distribution source ও licenses

এই repository npm distribution-এর জন্য। মূল SDK development source: https://github.com/MohammadAtikurRahman/BsonLite। নতুন binary build করলে তার matching source, build-info ও checksums-ও নিতে হবে। Applicable engine licenses এবং exact matching source public package-এ রাখুন।

References:
- https://docs.npmjs.com/staged-publishing/
- https://docs.npmjs.com/cli/v11/commands/npm-publish/
