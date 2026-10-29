// media.js —— 词典笔本地资源路径解析
// 默认所有资源位于 /userdisk/gal_data/ 下；支持自定义根目录。
// 数据文件只保存“资源基名”或“相对路径”，扩展名与根路径在这里统一处理。

export var ASSET_ROOT = '/userdisk/gal_data/sanoba_witch';

export function setAssetRoot(path) {
  if (path && typeof path === 'string') {
    ASSET_ROOT = path.replace(/\/+$/, '');
  }
}

var IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.webp'];
var VOICE_EXTS = ['.opus', '.ogg', '.wav'];
var BGM_EXTS = ['.opus', '.ogg', '.mp3', '.wav'];

function hasAnyExt(name, exts) {
  var lower = String(name || '').toLowerCase();
  for (var i = 0; i < exts.length; i++) {
    if (lower.slice(-exts[i].length) === exts[i]) return true;
  }
  return false;
}

function safeRelative(value) {
  var text = String(value || '').trim();
  if (!text || text.charAt(0) === '/' || text.indexOf('\0') >= 0 || text.indexOf('\\') >= 0) {
    return '';
  }
  var parts = text.split('/');
  for (var i = 0; i < parts.length; i++) {
    if (!parts[i] || parts[i] === '.' || parts[i] === '..') return '';
  }
  return text;
}

function withExt(name, defaultExt, exts) {
  var value = safeRelative(name);
  if (!value) return '';
  var list = exts || [defaultExt];
  return hasAnyExt(value, list) ? value : value + defaultExt;
}

export function fileUrl(path) {
  return 'file://' + path;
}

export function assetPath(kind, name, defaultExt) {
  var file = withExt(name, defaultExt || '.png', IMAGE_EXTS);
  return file ? ASSET_ROOT + '/' + kind + '/' + file : '';
}

export function bgPath(name) {
  return assetPath('bg', name, '.png');
}

export function bgmPath(name) {
  var file = withExt(name, '.opus', BGM_EXTS);
  return file ? ASSET_ROOT + '/bgm/' + file : '';
}

export function voicePath(name) {
  var file = withExt(name, '.opus', VOICE_EXTS);
  return file ? ASSET_ROOT + '/voice/' + file : '';
}

export function cgPath(name) {
  return assetPath('cg', name, '.png');
}

export function fgPath(name) {
  return assetPath('fg', name, '.png');
}

export function standPath(name) {
  return assetPath('stand', name, '.png');
}

// The scenario was dumped with Chinese heroine names, while the original PSB
// artwork keeps the Japanese kana/kanji prefix. These aliases are not cosmetic:
// a missing mapping renders an empty stage even though every sprite is present.
var CHAR_ASSET = {
  '宁宁': '\u5be7\u3005',
  '巡': '\u3081\u304f\u3099\u308b',
  '紬': '紬',
  '憧子': '憧子',
  '和奏': '和奏'
};
var DRESS_ASSET = {
  'コスプレ': '\u30b3\u30b9\u30d5\u309a\u30ec',
  '制服のみ': '制服',
  '制服ギター': '制服',
  '私服ギター': '私服',
  '女装': '制服',
  'ウエイトレス': 'ウェイトレス',
  'ウェイトレス': 'ウェイトレス',
  '女仆装': '制服',
  'メガネ': '制服',
  '外着': '私服',
  '裸髪': '裸',
  'x裸': '裸',
  'シーツ': '裸',
  '銃': '魔女服',
  'ハンマー': '制服',
  'デート服': '\u30c6\u3099\u30fc\u30c8\u670d',
  '部屋着': '部屋着',
  '魔女服': '魔女服',
  '私服': '私服',
  '制服': '制服',
  '裸': '裸'
};

export function characterAssetName(char, dress, face) {
  var prefix = CHAR_ASSET[char];
  if (!prefix) return '';
  var outfit = DRESS_ASSET[dress] || DRESS_ASSET['制服'];
  if ((char === '宁宁' || char === '憧子') && outfit === DRESS_ASSET['コスプレ']) outfit = '制服';
  var code = String(face || '01').trim();
  var match = /^(\d{1,2})([a-z]?)$/i.exec(code);
  var n = match ? Number(match[1]) : NaN;
  var suffix = match ? match[2].toLowerCase() : '';
  var f = '01';
  if (isFinite(n) && n >= 1 && n <= 43) {
    f = n < 10 ? '0' + n : '' + n;
    // The extracted set has exact h variants; d/e/n/r variants were not
    // extracted, so use their base number rather than a missing filename.
    if (suffix === 'h' && n <= 20) f += suffix;
  }
  return prefix + '_' + outfit + '_' + f + '.png';
}

export function characterUrl(kind, char, dress, face) {
  var name = characterAssetName(char, dress, face);
  return name ? fileUrl(ASSET_ROOT + '/' + kind + '/' + name) : '';
}

export function sdPath(name) {
  return assetPath('sd', name, '.png');
}

export function fxPath(name) {
  return assetPath('fx', name, '.png');
}

export function sceneVariantPath(name) {
  return assetPath('scene', name, '.png');
}

// 封面/绘马插图路径
export function coverPath(name) {
  return assetPath('bg', name, '.jpg');
}

export function bgUrl(name) {
  var path = bgPath(name);
  return path ? fileUrl(path) : '';
}

export function bgmUrl(name) {
  var path = bgmPath(name);
  return path ? fileUrl(path) : '';
}

export function voiceUrl(name) {
  var path = voicePath(name);
  return path ? fileUrl(path) : '';
}

export function cgUrl(name) {
  var path = cgPath(name);
  return path ? fileUrl(path) : '';
}

export function fgUrl(name) {
  var path = fgPath(name);
  return path ? fileUrl(path) : '';
}

export function standUrl(name) {
  var path = standPath(name);
  return path ? fileUrl(path) : '';
}

export function sdUrl(name) {
  var path = sdPath(name);
  return path ? fileUrl(path) : '';
}

export function fxUrl(name) {
  var path = fxPath(name);
  return path ? fileUrl(path) : '';
}

export function sceneVariantUrl(name) {
  var path = sceneVariantPath(name);
  return path ? fileUrl(path) : '';
}

export function coverUrl(name) {
  var path = coverPath(name);
  return path ? fileUrl(path) : '';
}

export function titleBgUrl() {
  // A new filename also invalidates the device's native image cache, which
  // keeps the old title background alive even after the file is replaced.
  return bgUrl('title_bg_v3');
}

// 空值或黑屏标记不渲染背景
export function isBlackBg(name) {
  return !name || name === '__black__' || name === '画面_黒' || name === 'black';
}
