# npm SDK-এর সঙ্গে BsonLite Console ও CLI

## SDK update

এই repository-এর version **bsonlite-sdk@0.6.0-rc.3**। npm-এ publish হওয়ার পর নিজের app folder-এ:

```powershell
npm install bsonlite-sdk@latest
```

App-এর আগের connection code একই থাকবে:

```javascript
const BsonLite = require('bsonlite-sdk');
await BsonLite.connect();
```

Code-টি নিজের async startup function-এর মধ্যে থাকবে। Update-এর পর app restart করে চালু রাখো। আগে থেকে চলা Node process নতুন package নিজে reload করবে না।

## Desktop software download

https://github.com/MohammadAtikurRahman/BsonLite-Console/releases/download/v0.2.0/BsonLite-Console-0.2.0-Windows-x64.zip

১. ZIP extract করে BsonLite-Console-0.2.0-Windows-x64.exe চালাও। Viewer-এর জন্য আলাদা Node.js লাগে না।
২. নিজের app চালু রাখো। একই Windows account ব্যবহার করো।
৩. Running BsonLite databases থেকে database বেছে Connect চাপো। URL নিজে বসবে।

Console বন্ধ করলেও app চলবে। App বন্ধ থাকলে Console তার data folder নিজে খুলবে না। একাধিক app থাকলে dropdown থেকে বেছে নেবে। চাইলে নিজের authorized server URL-ও দেওয়া যায়; certificate লাগলে Options-এ দেবে।

## Terminal CLI

Extract করা Console folder-এর terminal-এ:

```powershell
npm install -g ./packages/bsonlite-cli-0.2.0.tgz
bsonlite
```

Terminal CLI-এর জন্য Node.js 20.19+ লাগে। একটি database চললে নিজে পাবে, একাধিক থাকলে list থেকে number বেছে নেবে। Query পরিবর্তন করার জন্য:

```powershell
bsonlite --write
```

CLI package-টি release ZIP-এ দেওয়া আছে; npm-এ bsonlite-cli নামে publish করা হয়েছে এমন দাবি করা হচ্ছে না। npm SDK এবং desktop/CLI আলাদা download/install।

## Collection তৈরি ও insert

GUI-তে Options থেকে Read-only বন্ধ করে Apply options চাপো। নিচের query দুটি আলাদা করে Run করবে:

```javascript
db.users.insertOne({ name: 'Atik', active: true, createdAt: ISODate() })
```

```javascript
db.users.find({})
```

প্রথম insert-এই users collection তৈরি হবে। Console ও CLI-তে একবারে একটি database expression চালাবে।

## পরীক্ষা করার জন্য demo app

SDK install করা নিজের project folder-এ:

```powershell
node node_modules/bsonlite-sdk/examples/console-app.cjs
```

এই app আলাদা ./BsonLiteConsoleDemo database ব্যবহার করে। Health page http://127.0.0.1:3000/health। Terminal খোলা রাখলে Console connect করতে পারবে; Ctrl+C দিলে বন্ধ হবে। Startup-এ নিজে থেকে record insert হয় না।

## গুরুত্বপূর্ণ পার্থক্য

npm app-এ require('bsonlite-sdk') বা import ব্যবহার করবে। Package-এর internal BsonLite.cjs হলো preserved native baseline; automatic Console adapter package entry থেকে load হয়। Single-file app-এর জন্য integrated CJS download করবে:

https://github.com/MohammadAtikurRahman/BsonLite-Console/releases/download/v0.2.0/BsonLite.cjs

rc.3 publish হওয়ার আগে registry-তে আগের version থাকলে full download-এর SDK/bsonlite-sdk-0.6.0-rc.3.tgz file install করা যায়। Registry version যাচাই: npm view bsonlite-sdk version।

Console access বন্ধ করতে app startup-এর আগে BSONLITE_CONSOLE=0 set করা যায়, অথবা connect options-এ console: false দেওয়া যায়। Session URL/token প্রকাশ্যে share করবে না। Native engine, encryption এবং database format অপরিবর্তিত। পরীক্ষার বিবরণ TEST_RESULTS.md-এ আছে।

Source ও build: https://github.com/MohammadAtikurRahman/BsonLite-Console
Guide: https://bsonlite.com/console.html
Discord: https://discord.gg/vSRMRPYqs
