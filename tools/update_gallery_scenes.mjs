import fs from 'fs';

const scenesPath = '/Volumes/500GB/sanoba-witch-ydpen-port/app/data/gallery_scenes.js';
const content = fs.readFileSync(scenesPath, 'utf-8');

const jsonStart = content.indexOf('[');
const jsonEnd = content.lastIndexOf(']');
const scenes = JSON.parse(content.slice(jsonStart, jsonEnd + 1));

const DUAL_SET = new Set([
  'ev104', 'ev106', 'ev108', 'ev110', 'ev111', 'ev115', 'ev116', 'ev117', 'ev118',
  'ev121', 'ev122', 'ev124', 'ev125', 'ev203', 'ev205', 'ev206', 'ev212', 'ev214',
  'ev215', 'ev216', 'ev217', 'ev308', 'ev310', 'ev311', 'ev318', 'ev405', 'ev409',
  'ev414', 'ev416', 'ev417', 'ev418', 'ev502', 'ev507', 'ev510', 'ev601'
]);

for (const sc of scenes) {
  const newVariants = [];
  for (const v of sc.variants) {
    newVariants.push(v);
    const prefix = v.slice(0, 5);
    if (DUAL_SET.has(prefix) && v.endsWith('a')) {
      const bVar = prefix + 'b';
      if (!sc.variants.includes(bVar) && !newVariants.includes(bVar)) {
        newVariants.push(bVar);
      }
    }
  }
  sc.variants = newVariants;
}

const newContent = `// gallery_scenes.js —— 场景回忆全量列表（含未射出/射出后多阶段差分）
export var gallery_scenes = ${JSON.stringify(scenes)};
`;

fs.writeFileSync(scenesPath, newContent, 'utf-8');
console.log('gallery_scenes.js 已更新！');
