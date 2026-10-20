# npm publish ও README guide

## Screenshot-এ instructions কেন নেই?

`0.0.0-stage` ও **Temporary Holding Version** npm-এর placeholder। আপনার আসল package staging area-তে আছে; approval না হওয়া পর্যন্ত তার SDK, README এবং metadata public package page-এ আসে না।

GitHub-এ README push করলে npm-এ আগের staged tarball নিজে থেকে বদলায় না। GitHub source এবং npm registry আলাদা।

## Latest files নিন

এই repository-এর local checkout-এর মধ্যে চালান:

```powershell
git pull origin main
npm test
npm run verify
npm publish --dry-run
```

অন্য uncommitted local change থাকলে আগে সেগুলো সংরক্ষণ বা merge করুন। `git reset --hard` প্রয়োজন নেই। Runtime dependencies bundle করা আছে; checks চালাতে আলাদা npm install লাগবে না।

## আগের staged release দেখতে ও approve করতে

npm CLI 11.15.0+ এবং publishing-এর জন্য Node.js 22.14.0+ ব্যবহার করুন। SDK ব্যবহারকারীদের requirement এখনও Node.js 20+।

```powershell
npm login
npm stage list bsonlite-sdk
```

List থেকে সঠিক stage ID ও version দেখুন:

```powershell
npm stage view <stage-id>
```

`<stage-id>`-এর জায়গায় returned ID বসাতে হবে।

আগের staged package-এর README/content ঠিক থাকলে npmjs.com-এ নিজের account-এর **Staged Packages** tab খুলে package review করে **Approve** করুন, অথবা:

```powershell
npm stage approve <stage-id>
```

Approval-এর সময় নিজের 2FA সম্পন্ন করতে হবে। Approval সফল হলে staged version public হবে। একই version আবার publish করবেন না।

## এই commit-এর README ও metadata-সহ release দিতে চাইলে

আগের staged tarball এই commit-এর আগে তৈরি হয়ে থাকলে তার ভেতরে নতুন README/repository link নেই। একই version-এর pending stage থাকা অবস্থায় একই version পুনরায় stage/publish করলে conflict হবে।

1. `npm stage view <old-stage-id>` দিয়ে নিশ্চিত করুন সেটি আপনার `bsonlite-sdk@0.6.0-rc.1`-এর পুরোনো pending stage।
2. শুধু সেই পুরোনো pending stage সরাতে `npm stage reject <old-stage-id>` চালান। এতে ওই unpublished staged artifact সরবে; public release unpublish করবেন না।
3. Latest checkout-এ tests/checks চালিয়ে নতুন stage তৈরি করুন:

```powershell
npm stage publish --access public --tag latest
```

4. নতুন returned stage ID review করুন এবং **Staged Packages → Approve** বা `npm stage approve <new-stage-id>` দিয়ে approve করুন।
5. Browser/terminal-এর 2FA prompt সম্পন্ন করুন।

`latest` tag ইচ্ছাকৃত: সাধারণ `npm install bsonlite-sdk` এই release candidate পাবে। Stage তৈরির পরে তার tag বদলানো যায় না; ভুল tag হলে pending stage reject করে আবার stage করতে হয়।

কোনো real version ইতিমধ্যে public হয়ে গেলে একই version পুনরায় publish করা যাবে না। তখন নতুন distribution release প্রস্তুত করতে হবে; শুধু README বদলানোর জন্য SDK binary, engine source বা checksum নষ্ট করবেন না।

## Public result যাচাই

```powershell
npm view bsonlite-sdk dist-tags versions --json
```

`latest` যদি এখনও `0.0.0-stage` দেখায়, operational release এখনও live latest হয়নি। Public package page refresh করে বাস্তব version, README ও repository link দেখুন।

নতুন Windows project-এ:

```powershell
npm install bsonlite-sdk
```

```javascript
const BsonLite = require('bsonlite-sdk');
```

## 2FA / E403

npmjs.com → profile picture → Account → Two-Factor Authentication থেকে 2FA configure করুন। Password, token ও recovery code chat বা GitHub-এ commit করবেন না।

## Distribution files

এই repository-তে `package.json`, bundled `BsonLite.cjs`, README, verification script, tests, licenses এবং matching engine source আছে। SDK development source আলাদা https://github.com/MohammadAtikurRahman/BsonLite repository-তে; binary নতুন করে compile করার জন্য সেই build workflow প্রয়োজন।

Public package-এ applicable license texts এবং matching modified-engine source বজায় রাখুন।

References:
- https://docs.npmjs.com/staged-publishing/
- https://docs.npmjs.com/cli/v11/commands/npm-stage/
