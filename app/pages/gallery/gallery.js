// pages/gallery/gallery.js —— 柚子社《魔女的夜宴》多合一鉴赏收藏馆（CG/场景回忆/立绘/音乐盒，800x220）
import { S, getGal } from '../../common.js';
import { readSettings } from '../../storage.js';
import { cgUrl, bgmPath, characterUrl } from '../../media.js';
import { gallery_cgs } from '../../data/gallery_cgs.js';
import { gallery_scenes } from '../../data/gallery_scenes.js';
import { GALLERY } from '../../data/gallery_data.js';

// Falcon 固定像素画布；只有图片可放大，控制/滚动容器不超过屏幕。
var SCREEN_WIDTH = 800;
var SCREEN_HEIGHT = 220;
var STAND_VIEW_WIDTH = 664;
var CG_PAGE_SIZE = 4;
var SCENE_PAGE_SIZE = 4;
var BGM_PAGE_SIZE = 6;

function listMaxPan(count, pageSize) {
  return Math.max(0, Math.ceil(count / pageSize) - 1) * SCREEN_WIDTH;
}

function cardLeft(index, pageSize, step, pan) {
  var inset = (SCREEN_WIDTH - (pageSize * step - 10)) / 2;
  return Math.floor(index / pageSize) * SCREEN_WIDTH + (index % pageSize) * step + inset + (pan || 0);
}

// CG 分组：5 大女主 + 共通 + Q版SD
var CG_GROUPS = [
  { key: 'nene', name: '宁宁' },
  { key: 'meguru', name: '巡' },
  { key: 'tsumugi', name: '紬' },
  { key: 'touko', name: '憧子' },
  { key: 'wakana', name: '和奏' },
  { key: 'common', name: '共通' },
  { key: 'sd', name: 'Q版SD' }
];

var CG_LIST = [];
for (var cgi = 0; cgi < gallery_cgs.length; cgi++) {
  var cgItem = gallery_cgs[cgi];
  var rawFile = cgItem.file || cgItem.id;
  cgItem.src = cgUrl(rawFile);
  CG_LIST.push(cgItem);
}

var CG_GROUP_LISTS = {};
for (var cgg = 0; cgg < CG_GROUPS.length; cgg++) {
  var groupKey = CG_GROUPS[cgg].key;
  var grouped = [];
  for (var cgl = 0; cgl < CG_LIST.length; cgl++) {
    if (CG_LIST[cgl].group === groupKey || (groupKey === 'common' && (CG_LIST[cgl].group === 'main' || !CG_LIST[cgl].group))) {
      grouped.push(CG_LIST[cgl]);
    }
  }
  for (var cgx = 0; cgx < grouped.length; cgx++) grouped[cgx].idx = cgx;
  CG_GROUP_LISTS[groupKey] = grouped;
}

// 场景回忆分组：5 位女主角
var SCENE_GROUPS = [
  { key: 'nene', name: '宁宁' },
  { key: 'meguru', name: '巡' },
  { key: 'tsumugi', name: '紬' },
  { key: 'touko', name: '憧子' },
  { key: 'wakana', name: '和奏' }
];

var SCENE_LIST = [];
for (var sci = 0; sci < gallery_scenes.length; sci++) {
  SCENE_LIST.push(gallery_scenes[sci]);
}

var SCENE_GROUP_LISTS = {};
for (var scg = 0; scg < SCENE_GROUPS.length; scg++) {
  var sceneGroupKey = SCENE_GROUPS[scg].key;
  var sceneGrouped = [];
  for (var scl = 0; scl < SCENE_LIST.length; scl++) {
    if (SCENE_LIST[scl].route === sceneGroupKey || SCENE_LIST[scl].group === sceneGroupKey) {
      sceneGrouped.push(SCENE_LIST[scl]);
    }
  }
  for (var scx = 0; scx < sceneGrouped.length; scx++) sceneGrouped[scx].idx = scx;
  SCENE_GROUP_LISTS[sceneGroupKey] = sceneGrouped;
}

function activeSceneList(vm) {
  return (vm && vm.gallerySceneGroup && SCENE_GROUP_LISTS[vm.gallerySceneGroup]) || SCENE_LIST;
}

function sceneVariantCount(scene) {
  return (scene && scene.variants && scene.variants.length) || 1;
}

function sceneVariantSrc(scene, index) {
  if (!scene) return '';
  var variants = scene.variants || [];
  var file = variants[index] || variants[0] || scene.cover;
  return cgUrl(file);
}

function sceneGroupMaxPan(vm) {
  var list = (vm && vm.gallerySceneGroup && SCENE_GROUP_LISTS[vm.gallerySceneGroup]) || [];
  return listMaxPan(list.length, SCENE_PAGE_SIZE);
}

// 原版「立绘鉴赏」：5 名主角，服装/表情差分来自设备端 stand 与 fg 目录
var STAND_CHARS = [
  { key: 'nene', name: '绫地宁宁', char: '宁宁', dresses: ['制服', '私服', '魔女服', '部屋着', '裸'], faces: 20 },
  { key: 'meguru', name: '因幡巡', char: '巡', dresses: ['制服', '私服', '部屋着', 'コスプレ', '裸'], faces: 20 },
  { key: 'tsumugi', name: '椎名紬', char: '紬', dresses: ['制服', '私服', '魔女服', 'コスプレ', '裸'], faces: 20 },
  { key: 'touko', name: '户隐憧子', char: '憧子', dresses: ['制服', '私服', 'デート服', '部屋着', '裸'], faces: 20 },
  { key: 'wakana', name: '假屋和奏', char: '和奏', dresses: ['制服', '私服', 'ウェイトレス', '裸'], faces: 20 }
];

var STAND_BACKGROUNDS = [
  { name: '学院门前', file: '学院_学院前a.png' },
  { name: '超自然部', file: '学院_部室a.png' },
  { name: '宁宁房间', file: 'ヒロイン_寧々の部屋a.png' },
  { name: '咖啡店内', file: '喫茶店_店内a.png' },
  { name: '开阔晴空', file: '空_青空.png' },
  { name: '纯黑背景', file: '' }
];

function standBgUrl(bgIndex) {
  var idx = (bgIndex || 0) % STAND_BACKGROUNDS.length;
  if (idx < 0) idx = 0;
  var item = STAND_BACKGROUNDS[idx];
  if (!item || !item.file) return '';
  return 'file:///userdisk/gal_data/sanoba_witch/bg/' + item.file;
}

function standMeta(key) {
  for (var i = 0; i < STAND_CHARS.length; i++) {
    if (STAND_CHARS[i].key === key) return STAND_CHARS[i];
  }
  return null;
}

function pad2(n) {
  return n < 10 ? '0' + n : '' + n;
}

function standSrc(meta, dressIndex, faceIndex, isFull) {
  if (!meta) return '';
  var dress = meta.dresses[dressIndex || 0] || meta.dresses[0];
  var face = ((faceIndex || 0) % meta.faces) + 1;
  return characterUrl(isFull !== false ? 'stand' : 'fg', meta.char, dress, face);
}

var STAND_ZOOM_LEVELS = [
  { scale: 1.0, w: 391, h: 220, label: '1.0x' },
  { scale: 1.4, w: 547, h: 308, label: '1.4x' },
  { scale: 1.8, w: 704, h: 396, label: '1.8x' },
  { scale: 2.2, w: 860, h: 484, label: '2.2x' }
];

function activeCgList(vm) {
  return (vm && vm.galleryCgGroup && CG_GROUP_LISTS[vm.galleryCgGroup]) || CG_LIST;
}

function cgGroupMaxPan(vm) {
  var list = (vm && vm.galleryCgGroup && CG_GROUP_LISTS[vm.galleryCgGroup]) || [];
  return listMaxPan(list.length, CG_PAGE_SIZE);
}

// BGM 列表
var BGM_TRACKS = [];
if (GALLERY && GALLERY.bgm && GALLERY.bgm.length) {
  for (var bi = 0; bi < GALLERY.bgm.length; bi++) {
    var bgmItem = GALLERY.bgm[bi];
    BGM_TRACKS.push({
      id: bgmItem.id || ('bgm_' + bi),
      file: bgmPath(bgmItem.file || bgmItem.id).split('/').pop(),
      code: bgmItem.code || ('BGM' + (bi + 1)),
      title: bgmItem.title || ('BGM ' + (bi + 1)),
      idx: bi
    });
  }
} else {
  for (var bj = 1; bj <= 40; bj++) {
    var bCode = bj < 10 ? '0' + bj : '' + bj;
    BGM_TRACKS.push({ id: 'bgm' + bCode, file: 'bgm' + bCode + '.opus', code: 'BGM' + bCode, title: 'BGM ' + bCode, idx: bj - 1 });
  }
}

// 缩放档位
var ZOOM_LEVELS = [
  { scale: 1.0, w: 391, h: 220, label: '1.0x' },
  { scale: 1.5, w: 587, h: 330, label: '1.5x' },
  { scale: 2.0, w: 782, h: 440, label: '2.0x' },
  { scale: 2.5, w: 978, h: 550, label: '2.5x' }
];

function getBgmPlaybackSettings() {
  var settings = readSettings() || {};
  var volume = typeof settings.bgmVolume === 'number' && isFinite(settings.bgmVolume)
    ? settings.bgmVolume
    : 0.8;
  if (volume < 0) volume = 0;
  if (volume > 1) volume = 1;
  return {
    enabled: settings.bgmEnabled !== false,
    volume: volume
  };
}

export var galleryMethods = {
  initGallery: function () {
    this.galleryTab = this.galleryTab || 'cg';
    this.galleryPanX = 0;
    this._gStartX = 0;
    this._gStartPanX = 0;
    this._gMoved = false;

    this.galleryZoomIndex = 0;
    this.galleryImgPanX = 0;
    this.galleryImgPanY = 0;
    this.galleryCgGroup = '';
    this.galleryCgPage = 0;
    this.galleryCgFullscreen = false;
    this.gallerySceneGroup = '';
    this.galleryScenePage = 0;
    this.gallerySceneIndex = 0;
    this.gallerySceneExpr = 0;
    this.gallerySceneFullscreen = false;
    this.galleryStandChar = this.galleryStandChar || '';
    this.galleryStandDress = this.galleryStandDress || 0;
    this.galleryStandFace = this.galleryStandFace || 0;
    this.galleryStandBgIndex = this.galleryStandBgIndex || 0;
    this.galleryStandIsFull = this.galleryStandIsFull !== false;
    this.galleryStandFullscreen = false;
    this.galleryStandZoomIndex = 0;
    this.galleryStandPanX = 0;
    this.galleryStandPanY = 0;
    this._sTouchStartX = 0;
    this._sTouchStartY = 0;
    this._sStartPanX = 0;
    this._sStartPanY = 0;
    this._imgTouchStartX = 0;
    this._imgTouchStartY = 0;
    this._imgStartPanX = 0;
    this._imgStartPanY = 0;
  },

  setGalleryTab: function (tab) {
    this.galleryTab = tab;
    this.galleryPanX = 0;
    this.galleryCgFullscreen = false;
    this.gallerySceneFullscreen = false;
    this.galleryStandFullscreen = false;
    if (tab === 'cg') {
      this.galleryCgGroup = '';
      this.galleryCgPage = 0;
    } else if (tab === 'scene') {
      this.gallerySceneGroup = '';
      this.galleryScenePage = 0;
      this.gallerySceneIndex = 0;
      this.gallerySceneExpr = 0;
    }
  },

  selectCgGroup: function (key) {
    if (!CG_GROUP_LISTS[key]) return;
    this.galleryCgGroup = key;
    this.galleryCgPage = 0;
    this.galleryCgIndex = 0;
    this.galleryPanX = 0;
  },

  backToCgGroups: function () {
    this.galleryCgGroup = '';
    this.galleryCgPage = 0;
    this.galleryCgIndex = 0;
    this.galleryPanX = 0;
  },

  setCgPage: function (delta) {
    var list = CG_GROUP_LISTS[this.galleryCgGroup] || [];
    var pages = Math.max(1, Math.ceil(list.length / CG_PAGE_SIZE));
    var page = (this.galleryCgPage || 0) + delta;
    if (page < 0) page = 0;
    if (page >= pages) page = pages - 1;
    this.galleryCgPage = page;
    this.galleryPanX = -page * SCREEN_WIDTH;
  },

  selectSceneGroup: function (key) {
    if (!SCENE_GROUP_LISTS[key]) return;
    this.gallerySceneGroup = key;
    this.galleryScenePage = 0;
    this.gallerySceneIndex = 0;
    this.gallerySceneExpr = 0;
    this.galleryPanX = 0;
  },

  backToSceneGroups: function () {
    this.gallerySceneGroup = '';
    this.galleryScenePage = 0;
    this.gallerySceneIndex = 0;
    this.gallerySceneExpr = 0;
    this.galleryPanX = 0;
  },

  setScenePage: function (delta) {
    var list = SCENE_GROUP_LISTS[this.gallerySceneGroup] || [];
    var pages = Math.max(1, Math.ceil(list.length / SCENE_PAGE_SIZE));
    var page = (this.galleryScenePage || 0) + delta;
    if (page < 0) page = 0;
    if (page >= pages) page = pages - 1;
    this.galleryScenePage = page;
    this.galleryPanX = -page * SCREEN_WIDTH;
  },

  openFullscreenScene: function (idx) {
    if (this._gMoved || !activeSceneList(this)[idx]) return;
    this.gallerySceneFullscreen = true;
    this.gallerySceneIndex = idx;
    this.gallerySceneExpr = 0;
    this.resetCgZoom();
    if (typeof this.$forceUpdate === 'function') this.$forceUpdate();
  },

  exitFullscreenScene: function () {
    this.gallerySceneFullscreen = false;
  },

  prevFullscreenScene: function () {
    var list = activeSceneList(this);
    var idx = (this.gallerySceneIndex || 0) - 1;
    if (idx < 0) idx = list.length - 1;
    this.gallerySceneIndex = idx;
    this.gallerySceneExpr = 0;
    this.resetCgZoom();
  },

  nextFullscreenScene: function () {
    var list = activeSceneList(this);
    var idx = (this.gallerySceneIndex || 0) + 1;
    if (idx >= list.length) idx = 0;
    this.gallerySceneIndex = idx;
    this.gallerySceneExpr = 0;
    this.resetCgZoom();
  },

  changeSceneExpr: function (delta) {
    var list = activeSceneList(this);
    var scene = list[this.gallerySceneIndex || 0];
    var count = sceneVariantCount(scene);
    var expr = (this.gallerySceneExpr || 0) + delta;
    if (expr < 0) expr = count - 1;
    if (expr >= count) expr = 0;
    this.gallerySceneExpr = expr;
  },

  resetSceneExpr: function () {
    this.gallerySceneExpr = 0;
  },

  selectStandChar: function (key) {
    if (!standMeta(key)) return;
    this.galleryStandChar = key;
    this.galleryStandDress = 0;
    this.galleryStandFace = 0;
  },

  backToStandChars: function () {
    this.galleryStandChar = '';
    this.galleryStandDress = 0;
    this.galleryStandFace = 0;
  },

  setStandDress: function (index) {
    var meta = standMeta(this.galleryStandChar);
    if (!meta || !meta.dresses[index]) return;
    this.galleryStandDress = index;
  },

  changeStandFace: function (delta) {
    var meta = standMeta(this.galleryStandChar);
    if (!meta) return;
    var face = (this.galleryStandFace || 0) + delta;
    if (face < 0) face = meta.faces - 1;
    if (face >= meta.faces) face = 0;
    this.galleryStandFace = face;
  },

  cycleStandBg: function () {
    var cur = this.galleryStandBgIndex || 0;
    this.galleryStandBgIndex = (cur + 1) % STAND_BACKGROUNDS.length;
    if (typeof this.$forceUpdate === 'function') this.$forceUpdate();
  },

  toggleStandFullBody: function () {
    this.galleryStandIsFull = !this.galleryStandIsFull;
    if (typeof this.$forceUpdate === 'function') this.$forceUpdate();
  },

  openStandFullscreen: function () {
    if (this._gMoved) return;
    this.galleryStandFullscreen = true;
    this.resetStandZoom();
  },

  closeStandFullscreen: function () {
    this.galleryStandFullscreen = false;
    if (typeof this.$forceUpdate === 'function') this.$forceUpdate();
  },

  prevStandChar: function () {
    var curKey = this.galleryStandChar || 'nene';
    var idx = 0;
    for (var i = 0; i < STAND_CHARS.length; i++) {
      if (STAND_CHARS[i].key === curKey) { idx = i; break; }
    }
    idx = idx - 1;
    if (idx < 0) idx = STAND_CHARS.length - 1;
    this.selectStandChar(STAND_CHARS[idx].key);
    this.resetStandZoom();
  },

  nextStandChar: function () {
    var curKey = this.galleryStandChar || 'nene';
    var idx = 0;
    for (var i = 0; i < STAND_CHARS.length; i++) {
      if (STAND_CHARS[i].key === curKey) { idx = i; break; }
    }
    idx = (idx + 1) % STAND_CHARS.length;
    this.selectStandChar(STAND_CHARS[idx].key);
    this.resetStandZoom();
  },

  resetStandZoom: function () {
    this.galleryStandZoomIndex = 0;
    var z = STAND_ZOOM_LEVELS[0];
    this.galleryStandPanX = Math.round((STAND_VIEW_WIDTH - z.w) / 2);
    this.galleryStandPanY = Math.round((SCREEN_HEIGHT - z.h) / 2);
    if (typeof this.$forceUpdate === 'function') this.$forceUpdate();
  },

  zoomInStand: function () {
    var cur = this.galleryStandZoomIndex || 0;
    if (cur < STAND_ZOOM_LEVELS.length - 1) {
      this.galleryStandZoomIndex = cur + 1;
      this.clampStandPan();
      if (typeof this.$forceUpdate === 'function') this.$forceUpdate();
    }
  },

  zoomOutStand: function () {
    var cur = this.galleryStandZoomIndex || 0;
    if (cur > 0) {
      this.galleryStandZoomIndex = cur - 1;
      this.clampStandPan();
      if (typeof this.$forceUpdate === 'function') this.$forceUpdate();
    }
  },

  clampStandPan: function () {
    var z = STAND_ZOOM_LEVELS[this.galleryStandZoomIndex || 0];
    var minX = STAND_VIEW_WIDTH - z.w;
    var maxX = 0;
    var minY = SCREEN_HEIGHT - z.h;
    var maxY = 0;
    if (z.w <= STAND_VIEW_WIDTH) {
      this.galleryStandPanX = Math.round((STAND_VIEW_WIDTH - z.w) / 2);
    } else {
      if (this.galleryStandPanX < minX) this.galleryStandPanX = minX;
      if (this.galleryStandPanX > maxX) this.galleryStandPanX = maxX;
    }
    if (z.h <= SCREEN_HEIGHT) {
      this.galleryStandPanY = Math.round((SCREEN_HEIGHT - z.h) / 2);
    } else {
      if (this.galleryStandPanY < minY) this.galleryStandPanY = minY;
      if (this.galleryStandPanY > maxY) this.galleryStandPanY = maxY;
    }
  },

  onStandTouchStart: function (e) {
    if (e && e.changedTouches && e.changedTouches[0]) {
      var t = e.changedTouches[0];
      this._sTouchStartX = t.pageX || t.clientX || 0;
      this._sTouchStartY = t.pageY || t.clientY || 0;
      this._sStartPanX = this.galleryStandPanX || 0;
      this._sStartPanY = this.galleryStandPanY || 0;
    }
  },

  onStandTouchMove: function (e) {
    if (e && e.changedTouches && e.changedTouches[0]) {
      var t = e.changedTouches[0];
      var cx = t.pageX || t.clientX || 0;
      var cy = t.pageY || t.clientY || 0;
      var dx = cx - this._sTouchStartX;
      var dy = cy - this._sTouchStartY;
      this.galleryStandPanX = this._sStartPanX + dx;
      this.galleryStandPanY = this._sStartPanY + dy;
      this.clampStandPan();
      if (typeof this.$forceUpdate === 'function') this.$forceUpdate();
    }
  },

  onStandTouchEnd: function () {
  },

  openFullscreenCg: function (idx) {
    if (this._gMoved || !activeCgList(this)[idx]) return;
    this.galleryCgFullscreen = true;
    this.galleryCgIndex = idx;
    this.resetCgZoom();
    if (typeof this.$forceUpdate === 'function') this.$forceUpdate();
  },

  exitFullscreenCg: function () {
    this.galleryCgFullscreen = false;
  },

  prevFullscreenCg: function () {
    var list = activeCgList(this);
    var idx = (this.galleryCgIndex || 0) - 1;
    if (idx < 0) idx = list.length - 1;
    this.galleryCgIndex = idx;
    this.resetCgZoom();
  },

  nextFullscreenCg: function () {
    var list = activeCgList(this);
    var idx = (this.galleryCgIndex || 0) + 1;
    if (idx >= list.length) idx = 0;
    this.galleryCgIndex = idx;
    this.resetCgZoom();
  },

  cycleCgZoom: function () {
    var cur = this.galleryZoomIndex || 0;
    this.galleryZoomIndex = (cur + 1) % ZOOM_LEVELS.length;
    var z = ZOOM_LEVELS[this.galleryZoomIndex];
    this.galleryImgPanX = Math.round((SCREEN_WIDTH - z.w) / 2);
    this.galleryImgPanY = Math.round((SCREEN_HEIGHT - z.h) / 2);
    if (typeof this.$forceUpdate === 'function') this.$forceUpdate();
  },

  zoomInCg: function () {
    var cur = this.galleryZoomIndex || 0;
    if (cur < ZOOM_LEVELS.length - 1) {
      this.galleryZoomIndex = cur + 1;
      var z = ZOOM_LEVELS[this.galleryZoomIndex];
      this.galleryImgPanX = Math.round((SCREEN_WIDTH - z.w) / 2);
      this.galleryImgPanY = Math.round((SCREEN_HEIGHT - z.h) / 2);
      if (typeof this.$forceUpdate === 'function') this.$forceUpdate();
    }
  },

  zoomOutCg: function () {
    var cur = this.galleryZoomIndex || 0;
    if (cur > 0) {
      this.galleryZoomIndex = cur - 1;
      var z = ZOOM_LEVELS[this.galleryZoomIndex];
      this.galleryImgPanX = Math.round((SCREEN_WIDTH - z.w) / 2);
      this.galleryImgPanY = Math.round((SCREEN_HEIGHT - z.h) / 2);
      if (typeof this.$forceUpdate === 'function') this.$forceUpdate();
    }
  },

  resetCgZoom: function () {
    this.galleryZoomIndex = 0;
    var z = ZOOM_LEVELS[0];
    this.galleryImgPanX = Math.round((SCREEN_WIDTH - z.w) / 2);
    this.galleryImgPanY = Math.round((SCREEN_HEIGHT - z.h) / 2);
    if (typeof this.$forceUpdate === 'function') this.$forceUpdate();
  },

  clampCgPan: function () {
    var z = ZOOM_LEVELS[this.galleryZoomIndex || 0];
    var minX = SCREEN_WIDTH - z.w;
    var maxX = 0;
    var minY = SCREEN_HEIGHT - z.h;
    var maxY = 0;
    if (z.w <= SCREEN_WIDTH) {
      this.galleryImgPanX = Math.round((SCREEN_WIDTH - z.w) / 2);
    } else {
      if (this.galleryImgPanX < minX) this.galleryImgPanX = minX;
      if (this.galleryImgPanX > maxX) this.galleryImgPanX = maxX;
    }
    if (z.h <= SCREEN_HEIGHT) {
      this.galleryImgPanY = Math.round((SCREEN_HEIGHT - z.h) / 2);
    } else {
      if (this.galleryImgPanY < minY) this.galleryImgPanY = minY;
      if (this.galleryImgPanY > maxY) this.galleryImgPanY = maxY;
    }
  },

  onImgTouchStart: function (e) {
    if (e && e.changedTouches && e.changedTouches[0]) {
      var t = e.changedTouches[0];
      this._imgTouchStartX = t.pageX || t.clientX || 0;
      this._imgTouchStartY = t.pageY || t.clientY || 0;
      this._imgStartPanX = this.galleryImgPanX || 0;
      this._imgStartPanY = this.galleryImgPanY || 0;
      this._imgMoved = false;
    }
  },

  onImgTouchMove: function (e) {
    if (e && e.changedTouches && e.changedTouches[0]) {
      var t = e.changedTouches[0];
      var cx = t.pageX || t.clientX || 0;
      var cy = t.pageY || t.clientY || 0;
      var dx = cx - this._imgTouchStartX;
      var dy = cy - this._imgTouchStartY;
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        this._imgMoved = true;
      }
      this.galleryImgPanX = this._imgStartPanX + dx;
      this.galleryImgPanY = this._imgStartPanY + dy;
      this.clampCgPan();
      if (typeof this.$forceUpdate === 'function') this.$forceUpdate();
    }
  },

  onImgTouchEnd: function () {
    if (!this._imgMoved) {
      this.cycleCgZoom();
    }
  },

  onGalleryTouchStart: function (e) {
    if (e && e.changedTouches && e.changedTouches[0]) {
      var t = e.changedTouches[0];
      this._gStartX = t.pageX || t.clientX || 0;
      this._gStartPanX = this.galleryPanX || 0;
      this._gMoved = false;
    }
  },

  onGalleryTouchMove: function (e) {
    if (e && e.changedTouches && e.changedTouches[0]) {
      var t = e.changedTouches[0];
      var cx = t.pageX || t.clientX || 0;
      var dx = cx - this._gStartX;
      if (Math.abs(dx) > 6) {
        this._gMoved = true;
      }
      var newX = this._gStartPanX + dx;
      if (newX > 0) newX = 0;
      var maxPan = 0;
      if (this.galleryTab === 'cg') {
        if (CG_GROUPS.length && !this.galleryCgGroup) { this.galleryPanX = 0; return; }
        maxPan = -cgGroupMaxPan(this);
      } else if (this.galleryTab === 'scene') {
        if (SCENE_GROUPS.length && !this.gallerySceneGroup) { this.galleryPanX = 0; return; }
        maxPan = -sceneGroupMaxPan(this);
      } else if (this.galleryTab === 'bgm') {
        maxPan = -listMaxPan(BGM_TRACKS.length, BGM_PAGE_SIZE);
      }
      if (newX < maxPan) newX = maxPan;
      this.galleryPanX = newX;
      if (this.galleryTab === 'cg') this.galleryCgPage = Math.round(-newX / SCREEN_WIDTH);
      if (this.galleryTab === 'scene') this.galleryScenePage = Math.round(-newX / SCREEN_WIDTH);
    }
  },

  onGalleryTouchEnd: function () {
    var self = this;
    setTimeout(function () {
      self._gMoved = false;
    }, 120);
  },

  setBgmPage: function (delta) {
    var page = Math.round(-(this.galleryPanX || 0) / SCREEN_WIDTH) + delta;
    var maxPage = listMaxPan(BGM_TRACKS.length, BGM_PAGE_SIZE) / SCREEN_WIDTH;
    this.galleryPanX = -Math.max(0, Math.min(page, maxPage)) * SCREEN_WIDTH;
  },

  playGalleryBgm: function (index) {
    var it = BGM_TRACKS[index];
    if (this._gMoved || !it) return;
    this.galleryBgmIndex = index;
    var G = getGal();
    if (this.galleryPlayingBgm === it.file) {
      if (G && typeof G.stopBgm === 'function') G.stopBgm();
      this.galleryPlayingBgm = '';
      return;
    }
    var playback = getBgmPlaybackSettings();
    if (!playback.enabled) {
      this.galleryPlayingBgm = '';
      if (G && typeof G.stopBgm === 'function') G.stopBgm();
      return;
    }
    this.galleryPlayingBgm = it.file;
    if (G && typeof G.playBgm === 'function') {
      G.playBgm(bgmPath(it.file), true, playback.volume);
    }
  },

  toggleGalleryBgmState: function () {
    var G = getGal();
    if (!G) return;
    if (this.galleryPlayingBgm) {
      if (typeof G.stopBgm === 'function') G.stopBgm();
      this.galleryPlayingBgm = '';
    } else {
      var curIdx = this.galleryBgmIndex || 0;
      this.playGalleryBgm(curIdx);
    }
  },

  returnToTitleFromGallery: function () {
    var G = getGal();
    if (G && typeof G.stopBgm === 'function') {
      G.stopBgm();
    }
    this.galleryPlayingBgm = '';
    this.view = 'title';
    if (typeof this.initTitle === 'function') {
      this.initTitle();
    }
  }
};

export function renderGallery(vm, h) {
  var tab = vm.galleryTab || 'cg';
  var groupMeta = null;
  for (var gi = 0; gi < CG_GROUPS.length; gi++) {
    if (CG_GROUPS[gi].key === vm.galleryCgGroup) { groupMeta = CG_GROUPS[gi]; break; }
  }
  var sceneGroupMeta = null;
  for (var sgi = 0; sgi < SCENE_GROUPS.length; sgi++) {
    if (SCENE_GROUPS[sgi].key === vm.gallerySceneGroup) { sceneGroupMeta = SCENE_GROUPS[sgi]; break; }
  }
  var standSelected = standMeta(vm.galleryStandChar);
  var activeList = activeCgList(vm);

  var subtitle;
  if (tab === 'cg') {
    subtitle = groupMeta
      ? groupMeta.name + ' · ' + activeList.length + ' 张 CG · 轻触看大图'
      : '先选择女主角 / 共通 · 共 ' + CG_LIST.length + ' 张原版 CG';
  } else if (tab === 'scene') {
    subtitle = sceneGroupMeta
      ? sceneGroupMeta.name + ' · ' + activeSceneList(vm).length + ' 个场景 · 轻触切换表情'
      : '魔女名场景 · 5 位女主角 · 每个场景含表情差分';
  } else if (tab === 'stand') {
    subtitle = standSelected
      ? standSelected.name + ' · ' + standSelected.dresses[vm.galleryStandDress || 0]
        + ' · 表情 ' + ((vm.galleryStandFace || 0) + 1) + '/' + standSelected.faces
      : '原版 5 名角色立绘 · 可切换服装与表情';
  } else {
    subtitle = '横向滑动浏览 ' + BGM_TRACKS.length + ' 首魔女 BGM · 轻触播放';
  }

  // 0. 立绘鉴赏全屏特写模式（高清放大 + 手势拖动 + 表情/服装/背景切换）
  if (vm.galleryStandFullscreen) {
    var curStand = standSelected || STAND_CHARS[0];
    var sz = STAND_ZOOM_LEVELS[vm.galleryStandZoomIndex || 0];
    var sImgLeft = vm.galleryStandPanX !== undefined ? vm.galleryStandPanX : Math.round((STAND_VIEW_WIDTH - sz.w) / 2);
    var sImgTop = vm.galleryStandPanY !== undefined ? vm.galleryStandPanY : Math.round((SCREEN_HEIGHT - sz.h) / 2);
    var curBg = STAND_BACKGROUNDS[(vm.galleryStandBgIndex || 0) % STAND_BACKGROUNDS.length];
    var bgSrc = standBgUrl(vm.galleryStandBgIndex);
    var isFullBody = vm.galleryStandIsFull !== false;

    return h('div', { staticStyle: S('gallery-fs-root') }, [
      bgSrc ? h('image', {
        staticStyle: S('gallery-fs-bg'),
        attrs: { src: bgSrc, resize: 'cover' }
      }) : null,

      // 左翼控制栏 (宽 68px: 切换角色与退出)
      h('div', { staticStyle: S('gallery-fs-left-wing') }, [
        h('div', {
          staticStyle: S('gallery-fs-wing-btn'),
          on: { click: function () { vm.prevStandChar(); } }
        }, [
          h('text', { staticStyle: S('gallery-fs-wing-btn-text') }, '< 上角色')
        ]),
        h('div', {
          staticStyle: S('gallery-fs-wing-btn'),
          on: { click: function () { vm.nextStandChar(); } }
        }, [
          h('text', { staticStyle: S('gallery-fs-wing-btn-text') }, '下角色 >')
        ]),
        h('div', {
          staticStyle: S('gallery-fs-wing-btn'),
          on: { click: function () { vm.cycleStandBg(); } }
        }, [
          h('text', { staticStyle: S('gallery-fs-wing-btn-text') }, '换背景')
        ]),
        h('div', {
          staticStyle: S('gallery-fs-wing-btn-exit'),
          on: { click: function () { vm.closeStandFullscreen(); } }
        }, [
          h('text', { staticStyle: S('gallery-fs-wing-btn-text') }, '退出')
        ])
      ]),

      // 中间舞台视口 (宽 664px, 高 220px，支持拖动平移)
      h('div', {
        staticStyle: S('gallery-fs-viewport gallery-stand-fs-viewport'),
        on: {
          touchstart: function (e) { vm.onStandTouchStart(e); },
          touchmove: function (e) { vm.onStandTouchMove(e); },
          touchend: function () { vm.onStandTouchEnd(); }
        }
      }, [
        h('image', {
          staticStyle: S('gallery-fs-img', {
            left: sImgLeft + 'px',
            top: sImgTop + 'px',
            width: sz.w + 'px',
            height: sz.h + 'px'
          }),
          attrs: {
            src: standSrc(curStand, vm.galleryStandDress || 0, vm.galleryStandFace || 0, isFullBody),
            resize: 'contain'
          }
        }),
        h('div', { staticStyle: S('gallery-fs-header') }, [
          h('text', { staticStyle: S('gallery-fs-header-text') },
            curStand.name + ' · ' + (curStand.dresses[vm.galleryStandDress || 0] || '')
            + ' · 表情 ' + ((vm.galleryStandFace || 0) + 1) + '/' + curStand.faces
            + ' · ' + (isFullBody ? '全身' : '半身') + ' (' + sz.label + ')')
        ])
      ]),

      // 右翼控制栏 (宽 68px: 缩放/表情/视角)
      h('div', { staticStyle: S('gallery-fs-right-wing') }, [
        h('div', {
          staticStyle: S('gallery-fs-wing-btn'),
          on: { click: function () { vm.zoomInStand(); } }
        }, [
          h('text', { staticStyle: S('gallery-fs-wing-btn-text') }, '放大 +')
        ]),
        h('div', { staticStyle: S('gallery-fs-wing-badge') }, [
          h('text', { staticStyle: S('gallery-fs-wing-badge-text') }, sz.label)
        ]),
        h('div', {
          staticStyle: S('gallery-fs-wing-btn'),
          on: { click: function () { vm.zoomOutStand(); } }
        }, [
          h('text', { staticStyle: S('gallery-fs-wing-btn-text') }, '缩小 -')
        ]),
        h('div', {
          staticStyle: S('gallery-fs-wing-btn'),
          on: { click: function () { vm.toggleStandFullBody(); } }
        }, [
          h('text', { staticStyle: S('gallery-fs-wing-btn-text') }, isFullBody ? '切半身' : '切全身')
        ]),
        h('div', {
          staticStyle: S('gallery-fs-wing-btn'),
          on: { click: function () { vm.resetStandZoom(); } }
        }, [
          h('text', { staticStyle: S('gallery-fs-wing-btn-text') }, '重置')
        ])
      ])
    ]);
  }

  // 1. CG 全屏查看器
  if (vm.galleryCgFullscreen) {
    var curCg = activeList[vm.galleryCgIndex || 0] || activeList[0];
    var zoom = ZOOM_LEVELS[vm.galleryZoomIndex || 0];
    var imgLeft = vm.galleryImgPanX !== undefined ? vm.galleryImgPanX : Math.round((SCREEN_WIDTH - zoom.w) / 2);
    var imgTop = vm.galleryImgPanY !== undefined ? vm.galleryImgPanY : Math.round((SCREEN_HEIGHT - zoom.h) / 2);

    return h('div', { staticStyle: S('gallery-fs-overlay') }, [
      h('div', {
        staticStyle: S('gallery-fs-viewport'),
        on: {
          touchstart: function (e) { vm.onImgTouchStart(e); },
          touchmove: function (e) { vm.onImgTouchMove(e); },
          touchend: function () { vm.onImgTouchEnd(); }
        }
      }, [
        h('image', {
          staticStyle: S('gallery-fs-img', {
            left: imgLeft + 'px',
            top: imgTop + 'px',
            width: zoom.w + 'px',
            height: zoom.h + 'px'
          }),
          attrs: { src: curCg ? curCg.src : '', resize: 'contain' }
        })
      ]),
      h('div', {
        staticStyle: S('gallery-fs-nav-left'),
        on: { click: function () { vm.prevFullscreenCg(); } }
      }, [
        h('text', { staticStyle: S('gallery-fs-nav-text') }, '‹')
      ]),
      h('div', {
        staticStyle: S('gallery-fs-nav-right'),
        on: { click: function () { vm.nextFullscreenCg(); } }
      }, [
        h('text', { staticStyle: S('gallery-fs-nav-text') }, '›')
      ]),
      h('div', {
        staticStyle: S('gallery-fs-zoom-out'),
        on: { click: function () { vm.zoomOutCg(); } }
      }, [
        h('text', { staticStyle: S('gallery-fs-zoom-text') }, '- 缩小')
      ]),
      h('div', {
        staticStyle: S('gallery-fs-zoom-btn'),
        on: { click: function () { vm.cycleCgZoom(); } }
      }, [
        h('text', { staticStyle: S('gallery-fs-zoom-text') }, zoom.label)
      ]),
      h('div', {
        staticStyle: S('gallery-fs-zoom-in'),
        on: { click: function () { vm.zoomInCg(); } }
      }, [
        h('text', { staticStyle: S('gallery-fs-zoom-text') }, '+ 放大')
      ]),
      h('div', {
        staticStyle: S('gallery-fs-zoom-reset'),
        on: { click: function () { vm.resetCgZoom(); } }
      }, [
        h('text', { staticStyle: S('gallery-fs-zoom-text') }, '重置')
      ]),
      h('div', {
        staticStyle: S('gallery-fs-close-badge'),
        on: { click: function () { vm.exitFullscreenCg(); } }
      }, [
        h('text', { staticStyle: S('gallery-fs-close-text') }, '✕ 关闭')
      ])
    ]);
  }

  // 2. 场景回忆全屏查看器
  if (vm.gallerySceneFullscreen) {
    var curSceneList = activeSceneList(vm);
    var curScene = curSceneList[vm.gallerySceneIndex || 0] || curSceneList[0];
    var exprIdx = vm.gallerySceneExpr || 0;
    var totalExpr = sceneVariantCount(curScene);
    var sceneSrc = sceneVariantSrc(curScene, exprIdx);
    var sceneZoom = ZOOM_LEVELS[vm.galleryZoomIndex || 0];

    return h('div', { staticStyle: S('gallery-fs-overlay') }, [
      h('div', {
        staticStyle: S('gallery-fs-viewport'),
        on: {
          touchstart: function (e) { vm.onImgTouchStart(e); },
          touchmove: function (e) { vm.onImgTouchMove(e); },
          touchend: function () { vm.onImgTouchEnd(); }
        }
      }, [
        h('image', {
          staticStyle: S('gallery-fs-img', {
            left: vm.galleryImgPanX + 'px',
            top: vm.galleryImgPanY + 'px',
            width: sceneZoom.w + 'px',
            height: sceneZoom.h + 'px'
          }),
          attrs: { src: sceneSrc, resize: 'contain' }
        })
      ]),
      h('div', {
        staticStyle: S('gallery-fs-zoom-out'),
        on: { click: function () { vm.zoomOutCg(); } }
      }, [
        h('text', { staticStyle: S('gallery-fs-zoom-text') }, '- 缩小')
      ]),
      h('div', {
        staticStyle: S('gallery-fs-zoom-btn'),
        on: { click: function () { vm.cycleCgZoom(); } }
      }, [
        h('text', { staticStyle: S('gallery-fs-zoom-text') }, sceneZoom.label)
      ]),
      h('div', {
        staticStyle: S('gallery-fs-zoom-in'),
        on: { click: function () { vm.zoomInCg(); } }
      }, [
        h('text', { staticStyle: S('gallery-fs-zoom-text') }, '+ 放大')
      ]),
      h('div', {
        staticStyle: S('gallery-fs-zoom-reset'),
        on: { click: function () { vm.resetCgZoom(); } }
      }, [
        h('text', { staticStyle: S('gallery-fs-zoom-text') }, '重置')
      ]),
      h('div', {
        staticStyle: S('gallery-fs-nav-left'),
        on: { click: function () { vm.prevFullscreenScene(); } }
      }, [
        h('text', { staticStyle: S('gallery-fs-nav-text') }, '‹')
      ]),
      h('div', {
        staticStyle: S('gallery-fs-nav-right'),
        on: { click: function () { vm.nextFullscreenScene(); } }
      }, [
        h('text', { staticStyle: S('gallery-fs-nav-text') }, '›')
      ]),
      totalExpr > 1 ? h('div', {
        staticStyle: S('gallery-scene-expr-bar')
      }, [
        h('div', {
          staticStyle: S('gallery-scene-expr-btn'),
          on: { click: function () { vm.changeSceneExpr(-1); } }
        }, [
          h('text', { staticStyle: S('gallery-scene-expr-text') }, '‹ 表情')
        ]),
        h('div', { staticStyle: S('gallery-scene-expr-indicator') }, [
          h('text', { staticStyle: S('gallery-scene-expr-ind-text') }, (exprIdx + 1) + ' / ' + totalExpr)
        ]),
        h('div', {
          staticStyle: S('gallery-scene-expr-btn'),
          on: { click: function () { vm.changeSceneExpr(1); } }
        }, [
          h('text', { staticStyle: S('gallery-scene-expr-text') }, '表情 ›')
        ])
      ]) : null,
      h('div', {
        staticStyle: S('gallery-fs-close-badge'),
        on: { click: function () { vm.exitFullscreenScene(); } }
      }, [
        h('text', { staticStyle: S('gallery-fs-close-text') }, '✕ 关闭')
      ])
    ]);
  }

  // 3. 常规 4-Tab 页面主体
  var bodyContent = null;

  // TAB 1: CG 鉴赏
  if (tab === 'cg') {
    if (CG_GROUPS.length && !vm.galleryCgGroup) {
      var groupCards = CG_GROUPS.map(function (item) {
        var count = (CG_GROUP_LISTS[item.key] || []).length;
        var firstCg = (CG_GROUP_LISTS[item.key] || [])[0];
        return h('div', {
          key: item.key,
          staticStyle: S('g-group-card'),
          on: { click: function () { vm.selectCgGroup(item.key); } }
        }, [
          firstCg ? h('image', {
            staticStyle: S('g-group-card-bg'),
            attrs: { src: firstCg.src, resize: 'cover' }
          }) : null,
          h('div', { staticStyle: S('g-group-info') }, [
            h('text', { staticStyle: S('g-group-name') }, item.name),
            h('text', { staticStyle: S('g-group-count') }, count + ' 张 CG')
          ])
        ]);
      });
      bodyContent = h('div', { staticStyle: S('g-group-viewport') }, [
        h('text', { staticStyle: S('g-group-hint') }, '轻触分类卡片，进入专属 CG 网格'),
        h('div', { staticStyle: S('g-group-row') }, groupCards)
      ]);
    } else {
      var currentList = activeList;
      var totalCgPages = Math.max(1, Math.ceil(currentList.length / CG_PAGE_SIZE));
      var curCgPage = (vm.galleryCgPage || 0) + 1;

      var cgCards = currentList.map(function (it, index) {
        var left = cardLeft(index, CG_PAGE_SIZE, 186, vm.galleryPanX);
        if (left + 176 <= 0 || left >= SCREEN_WIDTH) return null;
        return h('div', {
          key: it.id,
          staticStyle: S('g-cg-card', { left: left + 'px' }),
          on: { click: function () { vm.openFullscreenCg(it.idx); } }
        }, [
          h('image', {
            staticStyle: S('g-cg-card-img'),
            attrs: { src: it.src, resize: 'contain' }
          }),
          h('div', { staticStyle: S('g-cg-card-footer') }, [
            h('text', { staticStyle: S('g-cg-card-code') }, it.code || it.id)
          ])
        ]);
      });

      bodyContent = h('div', { staticStyle: S('g-subgroup-root') }, [
        h('div', { staticStyle: S('g-cg-nav-bar') }, [
          h('div', {
            staticStyle: S('g-sub-nav'),
            on: { click: function () { vm.backToCgGroups(); } }
          }, [
            h('text', { staticStyle: S('g-sub-nav-text') }, '‹ 返回分类')
          ]),
          h('div', { staticStyle: S('g-cg-page-box') }, [
            h('div', {
              staticStyle: S('g-page-btn'),
              on: { click: function () { vm.setCgPage(-1); } }
            }, [
              h('text', { staticStyle: S('g-page-btn-text') }, '◀')
            ]),
            h('text', { staticStyle: S('g-page-info') }, curCgPage + ' / ' + totalCgPages + ' 页'),
            h('div', {
              staticStyle: S('g-page-btn'),
              on: { click: function () { vm.setCgPage(1); } }
            }, [
              h('text', { staticStyle: S('g-page-btn-text') }, '▶')
            ])
          ])
        ]),
        h('div', {
          staticStyle: S('g-cg-scroll-viewport'),
          on: {
            touchstart: function (e) { vm.onGalleryTouchStart(e); },
            touchmove: function (e) { vm.onGalleryTouchMove(e); },
            touchend: function () { vm.onGalleryTouchEnd(); }
          }
        }, [
          h('div', { staticStyle: S('g-cg-group-list') }, cgCards),
          !currentList.length ? h('text', { staticStyle: S('g-empty-text') }, '此分类暂无可用 CG') : null
        ])
      ]);
    }
  }

  // TAB 2: 场景回忆
  if (tab === 'scene') {
    if (SCENE_GROUPS.length && !vm.gallerySceneGroup) {
      var sGroupCards = SCENE_GROUPS.map(function (item) {
        var count = (SCENE_GROUP_LISTS[item.key] || []).length;
        var firstScene = (SCENE_GROUP_LISTS[item.key] || [])[0];
        return h('div', {
          key: item.key,
          staticStyle: S('g-group-card'),
          on: { click: function () { vm.selectSceneGroup(item.key); } }
        }, [
          firstScene ? h('image', {
            staticStyle: S('g-group-card-bg'),
            attrs: { src: sceneVariantSrc(firstScene, 0), resize: 'cover' }
          }) : null,
          h('div', { staticStyle: S('g-group-info') }, [
            h('text', { staticStyle: S('g-group-name') }, item.name),
            h('text', { staticStyle: S('g-group-count') }, count + ' 个场景')
          ])
        ]);
      });
      bodyContent = h('div', { staticStyle: S('g-group-viewport') }, [
        h('text', { staticStyle: S('g-group-hint') }, '轻触分类卡片，进入专属名场景回忆'),
        h('div', { staticStyle: S('g-group-row') }, sGroupCards)
      ]);
    } else {
      var curScenes = activeSceneList(vm);
      var totalScenePages = Math.max(1, Math.ceil(curScenes.length / SCENE_PAGE_SIZE));
      var curScenePage = (vm.galleryScenePage || 0) + 1;

      var sceneCards = curScenes.map(function (sc, index) {
        var left = cardLeft(index, SCENE_PAGE_SIZE, 186, vm.galleryPanX);
        if (left + 176 <= 0 || left >= SCREEN_WIDTH) return null;
        return h('div', {
          key: sc.id,
          staticStyle: S('g-cg-card', { left: left + 'px' }),
          on: { click: function () { vm.openFullscreenScene(sc.idx); } }
        }, [
          h('image', {
            staticStyle: S('g-cg-card-img'),
            attrs: { src: sceneVariantSrc(sc, 0), resize: 'contain' }
          }),
          h('div', { staticStyle: S('g-cg-card-footer') }, [
            h('text', { staticStyle: S('g-cg-card-code') }, sc.title || sc.id)
          ])
        ]);
      });

      bodyContent = h('div', { staticStyle: S('g-subgroup-root') }, [
        h('div', { staticStyle: S('g-cg-nav-bar') }, [
          h('div', {
            staticStyle: S('g-sub-nav'),
            on: { click: function () { vm.backToSceneGroups(); } }
          }, [
            h('text', { staticStyle: S('g-sub-nav-text') }, '‹ 返回分类')
          ]),
          h('div', { staticStyle: S('g-cg-page-box') }, [
            h('div', {
              staticStyle: S('g-page-btn'),
              on: { click: function () { vm.setScenePage(-1); } }
            }, [
              h('text', { staticStyle: S('g-page-btn-text') }, '◀')
            ]),
            h('text', { staticStyle: S('g-page-info') }, curScenePage + ' / ' + totalScenePages + ' 页'),
            h('div', {
              staticStyle: S('g-page-btn'),
              on: { click: function () { vm.setScenePage(1); } }
            }, [
              h('text', { staticStyle: S('g-page-btn-text') }, '▶')
            ])
          ])
        ]),
        h('div', {
          staticStyle: S('g-cg-scroll-viewport'),
          on: {
            touchstart: function (e) { vm.onGalleryTouchStart(e); },
            touchmove: function (e) { vm.onGalleryTouchMove(e); },
            touchend: function () { vm.onGalleryTouchEnd(); }
          }
        }, [
          h('div', { staticStyle: S('g-cg-group-list') }, sceneCards),
          !curScenes.length ? h('text', { staticStyle: S('g-empty-text') }, '此分类暂无可用场景') : null
        ])
      ]);
    }
  }

  // TAB 3: 立绘鉴赏 —— 5 名主角服装 / 表情差分
  if (tab === 'stand') {
    if (!standSelected) {
      var standCards = STAND_CHARS.map(function (item) {
        return h('div', {
          key: item.key,
          staticStyle: S('g-group-card'),
          on: { click: function () { vm.selectStandChar(item.key); } }
        }, [
          h('image', {
            staticStyle: S('g-stand-group-img'),
            attrs: { src: standSrc(item, 0, 0, false), resize: 'contain' }
          }),
          h('div', { staticStyle: S('g-group-info') }, [
            h('text', { staticStyle: S('g-group-name') }, item.name),
            h('text', { staticStyle: S('g-group-count') }, item.dresses.length + ' 套服装')
          ])
        ]);
      });
      bodyContent = h('div', { staticStyle: S('g-group-viewport') }, [
        h('text', { staticStyle: S('g-group-hint') }, '轻触角色，进入服装与表情差分鉴赏'),
        h('div', { staticStyle: S('g-group-row') }, standCards)
      ]);
    } else {
      var dresses = standSelected.dresses || ['default'];
      var isFull = vm.galleryStandIsFull !== false;

      var dressButtons = dresses.map(function (dress, di) {
        var active = (vm.galleryStandDress || 0) === di;
        return h('div', {
          key: dress,
          staticStyle: active ? S('g-stand-dress-btn g-stand-dress-btn-active') : S('g-stand-dress-btn'),
          on: { click: function () { vm.setStandDress(di); } }
        }, [
          h('text', { staticStyle: S('g-stand-dress-text') }, dress)
        ]);
      });

      bodyContent = h('div', { staticStyle: S('g-stand-pane') }, [
        h('div', {
          staticStyle: S('g-stand-stage'),
          on: { click: function () { vm.openStandFullscreen(); } }
        }, [
          h('image', {
            staticStyle: S('g-stand-img'),
            attrs: {
              src: standSrc(standSelected, vm.galleryStandDress || 0, vm.galleryStandFace || 0, isFull),
              resize: 'contain'
            }
          }),
          h('div', { staticStyle: S('g-stand-hint-badge') }, [
            h('text', { staticStyle: S('g-stand-hint-text') }, '轻触立绘进入全屏特写')
          ])
        ]),

        h('div', { staticStyle: S('g-stand-controls') }, [
          h('div', { staticStyle: S('g-stand-row') }, [
            h('div', {
              staticStyle: S('g-stand-back-btn'),
              on: { click: function () { vm.backToStandChars(); } }
            }, [
              h('text', { staticStyle: S('g-stand-back-text') }, '‹ 选角色')
            ]),
            h('text', { staticStyle: S('g-stand-char-name') }, standSelected.name),
            h('div', {
              staticStyle: S('g-stand-body-btn'),
              on: { click: function () { vm.toggleStandFullBody(); } }
            }, [
              h('text', { staticStyle: S('g-stand-body-text') }, isFull ? '全身' : '半身')
            ])
          ]),

          h('div', { staticStyle: S('g-stand-dress-row') }, dressButtons),

          h('div', { staticStyle: S('g-stand-face-row') }, [
            h('div', {
              staticStyle: S('g-stand-face-btn'),
              on: { click: function () { vm.changeStandFace(-1); } }
            }, [
              h('text', { staticStyle: S('g-stand-face-text') }, '‹ 上一表情')
            ]),
            h('text', { staticStyle: S('g-stand-face-info') }, ((vm.galleryStandFace || 0) + 1) + ' / ' + standSelected.faces),
            h('div', {
              staticStyle: S('g-stand-face-btn'),
              on: { click: function () { vm.changeStandFace(1); } }
            }, [
              h('text', { staticStyle: S('g-stand-face-text') }, '下一表情 ›')
            ])
          ])
        ])
      ]);
    }
  }

  // TAB 4: 音乐盒
  if (tab === 'bgm') {
    var bgmCards = BGM_TRACKS.map(function (track, ti) {
      var left = cardLeft(ti, BGM_PAGE_SIZE, 130, vm.galleryPanX);
      if (left + 120 <= 0 || left >= SCREEN_WIDTH) return null;
      var isPlaying = vm.galleryPlayingBgm === track.file;
      return h('div', {
        key: track.id,
        staticStyle: S(isPlaying ? 'g-bgm-card g-bgm-card-playing' : 'g-bgm-card', { left: left + 'px' }),
        on: { click: function () { vm.playGalleryBgm(ti); } }
      }, [
        h('div', { staticStyle: S('g-bgm-disk') }, [
          h('text', { staticStyle: S('g-bgm-disk-note') }, isPlaying ? '♬' : '♩')
        ]),
        h('div', { staticStyle: S('g-bgm-info') }, [
          h('text', { staticStyle: S('g-bgm-code') }, track.code),
          h('text', { staticStyle: S('g-bgm-title') }, track.title)
        ]),
        h('div', { staticStyle: S('g-bgm-status') }, [
          h('text', { staticStyle: S('g-bgm-status-text') }, isPlaying ? '播放中' : '播放')
        ])
      ]);
    });

    var bgmPage = Math.round(-(vm.galleryPanX || 0) / SCREEN_WIDTH) + 1;
    var bgmPages = Math.max(1, Math.ceil(BGM_TRACKS.length / BGM_PAGE_SIZE));
    bodyContent = h('div', { staticStyle: S('g-subgroup-root') }, [
      h('div', { staticStyle: S('g-cg-nav-bar') }, [
        h('div', {
          staticStyle: S('g-sub-nav'),
          on: { click: function () { vm.toggleGalleryBgmState(); } }
        }, [
          h('text', { staticStyle: S('g-sub-nav-text') }, vm.galleryPlayingBgm ? '暂停播放' : '继续播放')
        ]),
        h('div', { staticStyle: S('g-cg-page-box') }, [
          h('div', {
            staticStyle: S('g-page-btn'),
            on: { click: function () { vm.setBgmPage(-1); } }
          }, [h('text', { staticStyle: S('g-page-btn-text') }, '◀')]),
          h('text', { staticStyle: S('g-page-info') }, bgmPage + ' / ' + bgmPages + ' 页'),
          h('div', {
            staticStyle: S('g-page-btn'),
            on: { click: function () { vm.setBgmPage(1); } }
          }, [h('text', { staticStyle: S('g-page-btn-text') }, '▶')])
        ])
      ]),
      h('div', {
        staticStyle: S('g-bgm-scroll-viewport'),
        on: {
          touchstart: function (e) { vm.onGalleryTouchStart(e); },
          touchmove: function (e) { vm.onGalleryTouchMove(e); },
          touchend: function () { vm.onGalleryTouchEnd(); }
        }
      }, [h('div', { staticStyle: S('g-bgm-scroll-list') }, bgmCards)])
    ]);
  }

  // 顶层容器组装
  return h('div', { staticStyle: S('gallery-root') }, [
    h('image', {
      staticStyle: S('gallery-bg-img'),
      attrs: { src: 'file:///userdisk/gal_data/sanoba_witch/bg/title_bg_v3.png' }
    }),
    h('div', { staticStyle: S('gallery-header') }, [
      h('div', { staticStyle: S('gallery-title-box') }, [
        h('text', { staticStyle: S('gallery-title-text') }, '◆ 鉴赏收藏馆 EXTRA ◆'),
        h('text', { staticStyle: S('gallery-title-sub') }, subtitle)
      ]),
      h('div', { staticStyle: S('gallery-tab-row') }, [
        h('div', {
          staticStyle: tab === 'cg' ? S('gallery-tab-btn gallery-tab-btn-active') : S('gallery-tab-btn'),
          on: { click: function () { vm.setGalleryTab('cg'); } }
        }, [
          h('text', { staticStyle: S('gallery-tab-text') }, 'CG 鉴赏')
        ]),
        h('div', {
          staticStyle: tab === 'scene' ? S('gallery-tab-btn gallery-tab-btn-active') : S('gallery-tab-btn'),
          on: { click: function () { vm.setGalleryTab('scene'); } }
        }, [
          h('text', { staticStyle: S('gallery-tab-text') }, '场景回忆')
        ]),
        h('div', {
          staticStyle: tab === 'stand' ? S('gallery-tab-btn gallery-tab-btn-active') : S('gallery-tab-btn'),
          on: { click: function () { vm.setGalleryTab('stand'); } }
        }, [
          h('text', { staticStyle: S('gallery-tab-text') }, '立绘鉴赏')
        ]),
        h('div', {
          staticStyle: tab === 'bgm' ? S('gallery-tab-btn gallery-tab-btn-active') : S('gallery-tab-btn'),
          on: { click: function () { vm.setGalleryTab('bgm'); } }
        }, [
          h('text', { staticStyle: S('gallery-tab-text') }, '音乐盒')
        ])
      ]),
      h('div', {
        staticStyle: S('gallery-back-btn'),
        on: { click: function () { vm.returnToTitleFromGallery(); } }
      }, [
        h('text', { staticStyle: S('gallery-back-text') }, '返回标题')
      ])
    ]),
    bodyContent
  ]);
}
