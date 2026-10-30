import fs from 'fs';
import path from 'path';

const dataDir = '/Volumes/500GB/sanoba-witch-ydpen-port/app/data';
const assetsDir = '/Volumes/500GB/sanoba-witch-ydpen-port/build_assets';

const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.js') && (f.startsWith('chapter_') || f.startsWith('scn_') || f.startsWith('after_')));

const voiceFiles = new Set(fs.readdirSync(path.join(assetsDir, 'voice')).map(f => f.toLowerCase().replace('.opus', '')));
const sdFiles = new Set(fs.readdirSync(path.join(assetsDir, 'sd')).map(f => f.toLowerCase().replace('.png', '')));
const fgFiles = new Set(fs.readdirSync(path.join(assetsDir, 'fg')).map(f => f.toLowerCase().replace('.png', '')));

const voicesNeeded = new Set();
const sdsNeeded = new Set();
const charCounts = {};
const fgConfigs = [];

for (const file of files) {
  const content = fs.readFileSync(path.join(dataDir, file), 'utf-8');
  const jsonStart = content.indexOf('[[');
  const jsonEnd = content.lastIndexOf(']]');
  if (jsonStart === -1 || jsonEnd === -1) continue;
  const arrayStr = content.slice(jsonStart, jsonEnd + 2);
  try {
    const arr = JSON.parse(arrayStr);
    for (const row of arr) {
      if (row[3]) voicesNeeded.add(String(row[3]).toLowerCase());
      if (row[6] && typeof row[6] === 'object' && row[6].char) {
        charCounts[row[6].char] = (charCounts[row[6].char] || 0) + 1;
        fgConfigs.push(row[6]);
      }
      if (row[8]) sdsNeeded.add(String(row[8]).toLowerCase());
    }
  } catch (e) {
    console.error('Failed to parse', file, e.message);
  }
}

console.log('=== 剧本数据全量核验报告 ===');
console.log(`剧本总需求语音数: ${voicesNeeded.size}`);
let missingVoiceCount = 0;
for (const v of voicesNeeded) {
  if (!voiceFiles.has(v)) missingVoiceCount++;
}
console.log(`本地实际就绪语音数: ${voicesNeeded.size - missingVoiceCount}`);
console.log(`语音覆盖率: ${(((voicesNeeded.size - missingVoiceCount) / voicesNeeded.size) * 100).toFixed(2)}%`);

console.log(`\n剧本总需求 SD 小人数: ${sdsNeeded.size}`);
let missingSdCount = 0;
const missingSds = [];
for (const s of sdsNeeded) {
  if (!sdFiles.has(s)) {
    missingSdCount++;
    missingSds.push(s);
  }
}
console.log(`本地实际就绪 SD 数: ${sdsNeeded.size - missingSdCount}`);
console.log(`SD 覆盖率: ${(((sdsNeeded.size - missingSdCount) / sdsNeeded.size) * 100).toFixed(2)}%`);
if (missingSds.length > 0) {
  console.log('缺失 SD 样例:', missingSds.slice(0, 10));
}

console.log('\n剧本立绘出场统计:');
console.log(JSON.stringify(charCounts, null, 2));
