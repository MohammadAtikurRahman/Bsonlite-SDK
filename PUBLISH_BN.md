# npm project folder

এই folder-এই package.json, পরীক্ষিত BsonLite.cjs, README, package verification script, tests, licenses এবং matching engine source আছে।

এটি npm distribution project। SDK-এর JavaScript বর্তমানে bundled BsonLite.cjs-এ আছে; মূল development repository হলো https://github.com/MohammadAtikurRahman/BsonLite। SDK build নতুন করে compile করতে মূল repository-এর src/scripts/native build workflow ব্যবহার করতে হবে। এই folder থেকে unchanged পরীক্ষিত SDK publish করা যাবে।

## Check

Windows x64 ও Node.js 20+ ব্যবহার করো। এখানে runtime dependencies আগে থেকেই bundle করা; এই check-এর আগে npm install প্রয়োজন নেই।

```powershell
npm test
npm run verify
npm publish --dry-run
```

## E403 / 2FA error সমাধান

এটি account authentication requirement। npmjs.com-এ login করে profile picture → Account → Two-Factor Authentication → Enable 2FA খোলো। Website-এর নির্দেশনা মেনে security key / passkey-এর উপযুক্ত পদ্ধতি setup করো এবং recovery codes নিজের কাছে রাখো। 2FA আগে থেকেই enabled থাকলে configured method দিয়ে নতুন login এবং publish authentication সম্পন্ন করো।

তারপর এই folder-এ terminal খুলে:

```powershell
npm login
npm whoami
npm publish --access public --tag latest
```

Browser/terminal-এর authentication prompt সম্পন্ন করো। Password, token বা recovery code chat-এ পাঠানোর প্রয়োজন নেই। শুধু npm login সফল হলেই publishing-এর 2FA requirement পূরণ হয়েছে ধরে নেবে না।

এই version release candidate; latest tag ব্যবহার করায় সাধারণ npm install bsonlite-sdk এই version পাবে, publish সফল হলে।

## Publish সফল হলে

```powershell
npm view bsonlite-sdk version
```

নিজের অন্য project-এ:

```powershell
npm install bsonlite-sdk
```

```js
const BsonLite = require('bsonlite-sdk');
```

## পরিবর্তন ও নতুন release

package.json ও README edit করা যায়। BsonLite.cjs বদলালে checksum validation ইচ্ছাকৃতভাবে fail করবে; verification বন্ধ করে publish করবে না। পরিবর্তিত SDK-এর জন্য নতুন validated build, matching build-info.json, checksums ও matching engine source নিতে হবে।

একই name/version একবার publish হয়ে গেলে তা পুনরায় publish করা যায় না। ভবিষ্যৎ SDK version এবং build-info-এর version মিলিয়ে release বানাতে হবে।

Documentation: https://bsonlite.com/docs/index.html
2FA instructions: https://docs.npmjs.com/configuring-two-factor-authentication/
