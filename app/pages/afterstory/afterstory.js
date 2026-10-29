// pages/afterstory/afterstory.js —— 5位女主专属后日谈物语与系统播报语音
import { S, log, getGal } from '../../common.js';
import { readSettings } from '../../storage.js';
import { titleBgUrl, cgUrl, voicePath } from '../../media.js';
import { after_nene } from '../../data/after_nene.js';
import { after_meguru } from '../../data/after_meguru.js';
import { after_tsumugi } from '../../data/after_tsumugi.js';
import { after_touko } from '../../data/after_touko.js';
import { after_wakana } from '../../data/after_wakana.js';

var HEROINES = [
  {
    key: 'nene',
    // flowchart_data: nene 通常结局接 nene_restart 真结局；转码规则中 117 日后谈在 110~116 重启篇之后。
    clearRoute: 'nene_restart',
    unlockHint: '通关宁宁重启线解锁',
    name: '绫地 宁宁',
    lines: after_nene,
    voice: 'nen001_027_ref.opus',
    bg: cgUrl('ev102a')
  },
  {
    key: 'meguru',
    clearRoute: 'meguru',
    unlockHint: '通关巡线后解锁',
    name: '因幡 巡',
    lines: after_meguru,
    voice: 'meg006_022.opus',
    bg: cgUrl('ev201a')
  },
  {
    key: 'tsumugi',
    clearRoute: 'tsumugi',
    unlockHint: '通关紬线后解锁',
    name: '椎名 紬',
    lines: after_tsumugi,
    voice: 'tsu011_002.opus',
    bg: cgUrl('ev301a')
  },
  {
    key: 'touko',
    clearRoute: 'touko',
    unlockHint: '通关憧子线后解锁',
    name: '户隐 憧子',
    lines: after_touko,
    voice: 'tou006_017.opus',
    bg: cgUrl('ev401a')
  },
  {
    key: 'wakana',
    clearRoute: 'wakana',
    unlockHint: '通关和奏线后解锁',
    name: '假屋 和奏',
    lines: after_wakana,
    voice: 'wak001_033.opus',
    bg: cgUrl('ev501a')
  }
];

for (var i = 0; i < HEROINES.length; i++) {
  HEROINES[i].lineCount = HEROINES[i].lines.length;
  HEROINES[i].voiceCount = HEROINES[i].lines.filter(function (line) {
    return !!line[3];
  }).length;
}

// 两侧各留 9px；五张卡片连同双侧 1px 边框与四处间距共 782px。
var AS_VIEWPORT_WIDTH = 782;
var AS_VIEWPORT_HEIGHT = 188;
var AS_CARD_WIDTH = 148;
var AS_CARD_GAP = 8;
var AS_CONTENT_WIDTH = HEROINES.length * (AS_CARD_WIDTH + 2) + (HEROINES.length - 1) * AS_CARD_GAP;
var AS_MIN_PAN = Math.min(0, AS_VIEWPORT_WIDTH - AS_CONTENT_WIDTH);

function readClearedAfterRoutes() {
  var settings = readSettings() || {};
  return Array.isArray(settings.clearedRoutes) ? settings.clearedRoutes : [];
}

function isAfterUnlocked(heroine, cleared) {
  return !!heroine && cleared.indexOf(heroine.clearRoute) >= 0;
}

function findHeroine(key) {
  for (var i = 0; i < HEROINES.length; i++) {
    if (HEROINES[i].key === key) return HEROINES[i];
  }
  return null;
}

export var afterstoryMethods = {
  initAfterStory: function () {
    this.afterPanX = 0;
    this._asStartX = 0;
    this._asStartPanX = 0;
    this._asMoved = false;
    var cleared = readClearedAfterRoutes();
    if (!isAfterUnlocked(findHeroine(this.selectedAfterHeroine), cleared)) {
      this.selectedAfterHeroine = '';
      for (var i = 0; i < HEROINES.length; i++) {
        if (isAfterUnlocked(HEROINES[i], cleared)) {
          this.selectedAfterHeroine = HEROINES[i].key;
          break;
        }
      }
    }
    // 词典笔没有 ALSA dmix：先释放标题 BGM 独占的声卡，播报语音才能打开设备。
    var G = getGal();
    if (G && typeof G.stopBgm === 'function') {
      G.stopBgm();
    }
  },
  onAsTouchStart: function (e) {
    if (e && e.changedTouches && e.changedTouches[0]) {
      var t = e.changedTouches[0];
      this._asStartX = t.pageX || t.clientX || 0;
      this._asStartPanX = this.afterPanX || 0;
      this._asMoved = false;
    }
  },
  onAsTouchMove: function (e) {
    if (e && e.changedTouches && e.changedTouches[0]) {
      var t = e.changedTouches[0];
      var cx = t.pageX || t.clientX || 0;
      var dx = cx - this._asStartX;
      if (Math.abs(dx) > 6) {
        this._asMoved = true;
      }
      var newX = this._asStartPanX + dx;
      if (newX > 0) newX = 0;
      if (newX < AS_MIN_PAN) newX = AS_MIN_PAN;
      this.afterPanX = newX;
    }
  },
  onAsTouchEnd: function () {
    var self = this;
    setTimeout(function () {
      self._asMoved = false;
    }, 120);
  },
  selectAfterHeroine: function (heroine) {
    if (this._asMoved || !heroine) return;
    this.selectedAfterHeroine = heroine.key;
    this.playHeroineVoice(heroine.voice);
  },
  playHeroineVoice: function (voiceFile) {
    if (this._asMoved || !voiceFile) return;
    log('play heroine voice: ' + voiceFile);
    var G = getGal();
    if (G) {
      // 先停 BGM 释放独占声卡，再切换播报语音，避免 Device busy 无声。
      if (typeof G.stopBgm === 'function') {
        G.stopBgm();
      }
      G.stopVoice();
      G.playVoice(voicePath(voiceFile), 1.0);
    }
  },
  startHeroineStory: function (heroine) {
    if (this._asMoved || !heroine) return;
    // 入口重新读取持久化进度；不信任旧卡片状态或调用者传入的解锁字段。
    heroine = findHeroine(heroine.key);
    if (!isAfterUnlocked(heroine, readClearedAfterRoutes())) return;
    log('start heroine story: after_' + heroine.key);
    var G = getGal();
    if (G) {
      G.stopVoice();
    }
    this.selectedAfterHeroine = heroine.key;
    this.view = 'game';
    if (typeof this.initGame === 'function') {
      this.initGame('after_' + heroine.key, 0);
    }
  },
  returnToTitleFromAs: function () {
    var G = getGal();
    if (G) {
      G.stopVoice();
    }
    this.view = 'title';
    if (typeof this.initTitle === 'function') {
      this.initTitle();
    }
  }
};

export function renderAfterstory(vm, h) {
  var backButton = h('div', {
    staticStyle: S('as-btn-back'),
    on: { click: function () { vm.returnToTitleFromAs(); } }
  }, [
    h('text', { staticStyle: S('as-btn-back-text') }, '返回标题')
  ]);

  // 渲染和入口使用同一解锁规则，不新增根组件未声明的响应式状态。
  var cleared = readClearedAfterRoutes();
  var cards = [];
  for (var i = 0; i < HEROINES.length; i++) {
    (function (heroine) {
      var unlocked = isAfterUnlocked(heroine, cleared);
      var cardStyle = unlocked ? 'as-card as-card-unlocked' : 'as-card';
      if (unlocked && vm.selectedAfterHeroine === heroine.key) cardStyle += ' as-card-active';
      cards.push(
        h('div', {
          key: heroine.key,
          staticStyle: S(cardStyle),
          on: { click: function () { vm.selectAfterHeroine(heroine); } }
        }, [
          h('div', { staticStyle: S('as-card-cover') }, [
            heroine.bg ? h('image', {
              staticStyle: S(unlocked ? 'as-card-cover-img' : 'as-card-cover-img as-card-cover-locked'),
              attrs: { src: heroine.bg, resize: 'contain' }
            }) : null,
            unlocked ? h('div', { staticStyle: S('as-card-status-badge') }, [
              h('text', { staticStyle: S('as-card-status') }, '已通关')
            ]) : h('div', { staticStyle: S('as-card-lock') }, [
              h('text', { staticStyle: S('as-card-lock-title') }, '未解锁'),
              h('text', { staticStyle: S('as-card-lock-hint') }, heroine.unlockHint)
            ])
          ]),

          h('div', { staticStyle: S('as-card-info') }, [
            h('text', { staticStyle: S('as-card-name') }, heroine.name),
            h('text', {
              staticStyle: S('as-card-stats')
            }, heroine.lineCount + ' 句台词 / ' + heroine.voiceCount + ' 条语音'),

            h('div', { staticStyle: S('as-card-bottom-actions') }, [
              heroine.voice ? h('div', {
                staticStyle: S('as-btn-voice'),
                on: { click: function (e) {
                  if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
                  vm.selectAfterHeroine(heroine);
                } }
              }, [
                h('text', { staticStyle: S('as-btn-voice-text') }, '播报')
              ]) : null,
              h('div', {
                staticStyle: S(unlocked ? 'as-btn-play' : 'as-btn-play as-btn-play-locked'),
                on: { click: function (e) {
                  if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
                  vm.startHeroineStory(heroine);
                } }
              }, [
                h('text', { staticStyle: S('as-btn-play-text') }, unlocked ? '进入后日谈' : '未解锁')
              ])
            ])
          ])
        ])
      );
    })(HEROINES[i]);
  }

  return h('div', { staticStyle: S('as-root') }, [
    h('image', {
      staticStyle: S('as-bg-img'),
      attrs: { src: titleBgUrl(), resize: 'contain' }
    }),
    h('div', { staticStyle: S('as-bg-shade') }),
    h('div', { staticStyle: S('as-header') }, [
      h('div', { staticStyle: S('as-title-box') }, [
        h('text', { staticStyle: S('as-title-text') }, '日后谈 AFTER STORY'),
        h('text', { staticStyle: S('as-subtitle') }, '通关对应路线后解锁，播报可随时试听')
      ]),
      backButton
    ]),
    h('div', {
      staticStyle: S('as-viewport'),
      on: {
        touchstart: function (e) { vm.onAsTouchStart(e); },
        touchmove: function (e) { vm.onAsTouchMove(e); },
        touchend: function () { vm.onAsTouchEnd(); }
      }
    }, [
      h('div', {
        staticStyle: S('as-card-list', {
          left: (vm.afterPanX || 0) + 'px',
          width: AS_CONTENT_WIDTH + 'px',
          height: AS_VIEWPORT_HEIGHT + 'px'
        })
      }, cards)
    ])
  ]);
}
