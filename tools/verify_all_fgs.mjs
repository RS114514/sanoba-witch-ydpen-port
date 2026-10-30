import fs from 'fs';
import path from 'path';
import { characterAssetName } from '../app/media.js';

const dataDir = '/Volumes/500GB/sanoba-witch-ydpen-port/app/data';
const assetsDir = '/Volumes/500GB/sanoba-witch-ydpen-port/build_assets';

const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.js') && (f.startsWith('chapter_') || f.startsWith('scn_') || f.startsWith('after_')));
const fgFiles = new Set(fs.readdirSync(path.join(assetsDir, 'fg')).map(f => f.normalize('NFC')));

const STAND_HEROINE_NAMES = [
  '宁宁', '寧々', '巡', 'めぐる', '紬', '憧子', '和奏',
  '七绪', '七緒', '佳苗', '秀明', '太一', '宽太', '赤木', 'アカギ', '越路'
];

function resolveFgSrc(charInfo, speaker) {
  if (!charInfo) return '';
  let c = charInfo.char || '';
  if (c.indexOf('effect') >= 0 || STAND_HEROINE_NAMES.indexOf(c) < 0) {
    if (speaker && STAND_HEROINE_NAMES.indexOf(speaker) >= 0) {
      c = speaker;
    } else {
      return '';
    }
  }
  return characterAssetName(c, charInfo.dress || '制服', charInfo.face || 1);
}

let totalFgInvocations = 0;
let resolvedCount = 0;
let fileExistCount = 0;
const unresolvedSamples = [];

for (const file of files) {
  const content = fs.readFileSync(path.join(dataDir, file), 'utf-8');
  const jsonStart = content.indexOf('[[');
  const jsonEnd = content.lastIndexOf(']]');
  if (jsonStart === -1 || jsonEnd === -1) continue;
  const arrayStr = content.slice(jsonStart, jsonEnd + 2);
  try {
    const arr = JSON.parse(arrayStr);
    for (const row of arr) {
      const speaker = row[1];
      const fgObj = row[6];
      if (fgObj && typeof fgObj === 'object') {
        totalFgInvocations++;
        const resolved = resolveFgSrc(fgObj, speaker);
        if (resolved) {
          resolvedCount++;
          const baseName = resolved.normalize('NFC');
          if (fgFiles.has(baseName)) {
            fileExistCount++;
          } else {
            if (unresolvedSamples.length < 10) {
              unresolvedSamples.push({ fgObj, speaker, resolved: baseName });
            }
          }
        }
      }
    }
  } catch (e) {
    console.error('Parse error:', e);
  }
}

console.log('=== 全剧本立绘解析与资产匹配测试 ===');
console.log(`剧本总立绘调用次数: ${totalFgInvocations}`);
console.log(`解析成功并得到文件名次数: ${resolvedCount} (${((resolvedCount / totalFgInvocations) * 100).toFixed(2)}%)`);
console.log(`磁盘文件完全命中次数: ${fileExistCount} (${((fileExistCount / totalFgInvocations) * 100).toFixed(2)}%)`);
if (unresolvedSamples.length > 0) {
  console.log('未完全命中的样本 (前10个):', JSON.stringify(unresolvedSamples, null, 2));
}
