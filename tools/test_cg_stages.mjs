import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { resolveCgName, cgPath, cgUrl, ASSET_ROOT } from '../app/media.js';

const assetsDir = '/Volumes/500GB/sanoba-witch-ydpen-port/build_assets';

console.log('--- 测试 CG 阶段路由与素材存在性 ---');

// 1. 测试未射出态与射出高潮态的路由区分
assert.strictEqual(resolveCgName('ev115aa'), 'ev115a', 'ev115aa 应解析为未射出态 ev115a');
assert.strictEqual(resolveCgName('ev115ba'), 'ev115b', 'ev115ba 应解析为射出高潮态 ev115b');
assert.strictEqual(resolveCgName('ev116aa'), 'ev116a', 'ev116aa 应解析为未射出态 ev116a');
assert.strictEqual(resolveCgName('ev116bb'), 'ev116b', 'ev116bb 应解析为射出高潮态 ev116b');
assert.strictEqual(resolveCgName('ev405aa'), 'ev405a', 'ev405aa 应解析为未射出态 ev405a');
assert.strictEqual(resolveCgName('ev405df'), 'ev405b', 'ev405df 应解析为射出高潮态 ev405b');
assert.strictEqual(resolveCgName('ev101a'), 'ev101a', '普通CG应保持 ev101a');

// 2. 测试本地 build_assets/cg 中是否存在这些文件
const ev115a_path = path.join(assetsDir, 'cg', 'ev115a.png');
const ev115b_path = path.join(assetsDir, 'cg', 'ev115b.png');
const ev116a_path = path.join(assetsDir, 'cg', 'ev116a.png');
const ev116b_path = path.join(assetsDir, 'cg', 'ev116b.png');

assert(fs.existsSync(ev115a_path), 'ev115a.png 必须存在');
assert(fs.existsSync(ev115b_path), 'ev115b.png 必须存在');
assert(fs.existsSync(ev116a_path), 'ev116a.png 必须存在');
assert(fs.existsSync(ev116b_path), 'ev116b.png 必须存在');

console.log('✔ 所有 CG 阶段路由与素材断言测试全部通过！');
