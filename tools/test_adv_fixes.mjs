import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SourceTextModule, SyntheticModule, createContext } from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const styles = {};
for (const page of ['title', 'game']) {
  const css = readFileSync(resolve(root, `app/pages/${page}/${page}.css`), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const [, selectors, body] of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    const rule = {};
    for (const declaration of body.split(';')) {
      const colon = declaration.indexOf(':');
      if (colon < 0) continue;
      rule[declaration.slice(0, colon).trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = declaration.slice(colon + 1).trim();
    }
    for (const selector of selectors.split(',')) if (selector.trim().startsWith('.')) styles[selector.trim().slice(1)] = rule;
  }
}

async function loadGameApp() {
  const stopVoiceCalls = [];
  const playVoiceCalls = [];
  const gal = {
    readText: () => '',
    writeText: () => true,
    playBgm: () => {},
    stopBgm: () => {},
    setBgmVolume: () => {},
    stopVoice: () => { stopVoiceCalls.push(Date.now()); },
    playVoice: (...args) => { playVoiceCalls.push(args); }
  };
  const context = createContext({
    console: { log() {}, warn() {}, error() {} },
    setTimeout: (fn) => setTimeout(fn, 0),
    clearTimeout: () => {}
  });
  const modules = new Map();
  function get(path) {
    if (modules.has(path)) return modules.get(path);
    let module;
    if (path === 'gal' || path.endsWith('/Styles.js')) {
      const value = path === 'gal' ? gal : styles;
      module = new SyntheticModule(['default'], function () { this.setExport('default', value); }, { context, identifier: path });
    } else {
      module = new SourceTextModule(readFileSync(path, 'utf8'), { context, identifier: path });
    }
    modules.set(path, module);
    return module;
  }
  const entry = new SourceTextModule(`
    export * from './app/pages/game/game.js';
    export * from './app/media.js';
    export { chapter_all } from './app/data/chapter_all.js';
  `, { context, identifier: resolve(root, 'test-adv-entry.js') });
  await entry.link((specifier, ref) => get(specifier === 'gal' ? 'gal' : resolve(dirname(ref.identifier), specifier)));
  await entry.evaluate();
  return {
    exports: entry.namespace,
    gal,
    stopVoiceCalls,
    playVoiceCalls
  };
}

test('配角立绘名称与资产路径映射解析', async function () {
  const { exports } = await loadGameApp();
  const { characterAssetName, characterUrl } = exports;

  const sideChars = [
    { char: '七绪', dress: '私服', face: '01', expected: '七緒_私服_01.png' },
    { char: '七绪', dress: 'マスター', face: '05h', expected: '七緒_マスター_05h.png' },
    { char: '佳苗', dress: '私服', face: '02', expected: '佳苗_私服_02.png' },
    { char: '秀明', dress: '制服', face: '01', expected: '秀明_制服_01.png' },
    { char: '秀明', dress: 'コスプレ', face: '02h', expected: '秀明_コスプレ_02h.png' },
    { char: '太一', dress: '私服', face: '03h', expected: '太一_私服_03h.png' },
    { char: '太一', dress: '部屋着', face: '04', expected: '太一_部屋着_04.png' },
    { char: '宽太', dress: '私服', face: '04n', expected: 'アカギ_私服_04n.png' },
    { char: '越路', dress: '制服', face: '05h', expected: '越路_制服_05h.png' },
  ];

  for (let i = 0; i < sideChars.length; i++) {
    const item = sideChars[i];
    const actual = characterAssetName(item.char, item.dress, item.face).normalize('NFC');
    const expected = item.expected.normalize('NFC');
    assert.equal(actual, expected, `配角 ${item.char} 的立绘资源名称解析不正确`);
    const url = characterUrl('fg', item.char, item.dress, item.face).normalize('NFC');
    assert.ok(url.indexOf(expected) >= 0, `配角 ${item.char} 的完整 URL 路径不正确`);
  }
});

test('ADV 渲染模式下 SD 二头身小人与背景分离，彻底杜绝黑屏', async function () {
  const { exports } = await loadGameApp();
  const { renderGame } = exports;

  const mockVm = {
    currentScenario: 'test_mock_scn',
    currentScenarioData: [
      [0, '女同学', '「哇，好可爱！」', 'nen001_001', '学院_廊下モブa', 'bgm02', null, 'chapter 1-1', 'sd609e', null]
    ],
    currentLine: 0,
    dialoguePage: 0,
    activeChoice: null,
    modalType: '',
    confirmModal: null,
    fxShakeX: 0,
    fxShakeY: 0,
    autoPlay: false,
    skipMode: false,
    zoomMode: false
  };

  const elements = [];
  function mockH(tag, props, children) {
    const el = { tag, props, children };
    elements.push(el);
    return el;
  }

  renderGame(mockVm, mockH);

  const imageNodes = elements.filter(e => e.tag === 'image');
  assert.ok(imageNodes.length >= 2, '必须同时渲染背景与 SD 小人');

  const bgNode = imageNodes.find(e => e.props && e.props.attrs && e.props.attrs.src.indexOf('/bg/') >= 0);
  assert.ok(bgNode, '背景图片必须正常加载自 /bg/，不能被 sd 覆盖成空或黑屏');
  assert.ok(bgNode.props.attrs.src.indexOf('学院_廊下モブa.png') >= 0, '背景路径必须是正确的学院走廊背景');

  const sdNode = imageNodes.find(e => e.props && e.props.attrs && e.props.attrs.src.indexOf('/sd/') >= 0);
  assert.ok(sdNode, 'SD Q版小人必须正常加载自 /sd/');
  assert.ok(sdNode.props.attrs.src.indexOf('sd609e.png') >= 0, 'SD 小人文件名必须是小写 sd609e.png');
});

test('剧情推进时角色语音必须立即截断停止', async function () {
  const { exports, stopVoiceCalls, playVoiceCalls } = await loadGameApp();
  const { gameMethods } = exports;

  // 使用超过 5 行换行文本以保证 dialoguePages 会分成 2 页
  const longText = '第一行文字\n第二行文字\n第三行文字\n第四行文字\n第五行文字\n第六行文字（第二页开始）';

  const ctx = Object.assign({}, gameMethods, {
    currentScenario: 'test_mock_scn',
    currentScenarioData: [
      [0, '宁宁', '「柊史君！」', 'nen001_001', '学院_廊下モブa', 'bgm02', null, 'chapter 1-1', null, null],
      [1, '柊史', '「怎么了？」', null, '学院_廊下モブa', 'bgm02', null, 'chapter 1-1', null, null],
      [2, '宁宁', longText, 'nen001_002', '学院_廊下モブa', 'bgm02', null, 'chapter 1-1', null, null]
    ],
    currentLine: 0,
    dialoguePage: 0,
    activeChoice: null,
    modalType: '',
    confirmModal: null,
    autoPlay: false,
    skipMode: false,
    zoomMode: false,
    hasVoice: false,
    applyFxForLine() {},
    clearFx() {},
    scheduleAutoNext() {},
    clearAutoTimer() {}
  });

  // 1. 进入第 0 行，播放宁宁语音
  ctx.applyCurrentLine(true);
  assert.equal(playVoiceCalls.length, 1, '第 0 行必须播放语音');
  assert.equal(ctx.hasVoice, true);
  const initialStops = stopVoiceCalls.length;

  // 2. 点击推进到第 1 行（男主角台词，无语音）
  ctx.nextLine();
  assert.equal(ctx.currentLine, 1, '必须推进到第 1 行');
  assert.ok(stopVoiceCalls.length > initialStops, '推进到无语音台词时，旧语音必须立即截断停止！');
  assert.equal(ctx.hasVoice, false);

  // 3. 推进到第 2 行第 1 页
  ctx.nextLine();
  assert.equal(ctx.currentLine, 2);
  assert.equal(ctx.dialoguePage, 0);

  const stopsBeforePage = stopVoiceCalls.length;
  // 4. 点击推进到第 2 页（长文本同一行内的翻页）
  ctx.nextLine();
  assert.equal(ctx.dialoguePage, 1, '必须推进到第 2 页');
  assert.ok(stopVoiceCalls.length > stopsBeforePage, '长对话翻页时，也必须立即截断停止上一页语音！');
});
