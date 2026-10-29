// pages/game/game.js —— 超宽带鱼屏 390+322+88 分栏视觉小说主引擎（魔女的夜宴）
import { S, getGal, log, getChapterByLine, formatChapter, resolveSlotThumbnail } from '../../common.js';
import { characterUrl } from '../../media.js';
import {
  readAllSaves,
  writeAllSaves,
  saveSlotRecord,
  loadSlotRecord,
  getNowDateStr,
  pushBacklog,
  getBacklog,
  readSettings,
  writeSettings
} from '../../storage.js';
import { chapter_all } from '../../data/chapter_all.js';
import { after_nene } from '../../data/after_nene.js';
import { after_meguru } from '../../data/after_meguru.js';
import { after_tsumugi } from '../../data/after_tsumugi.js';
import { after_touko } from '../../data/after_touko.js';
import { after_wakana } from '../../data/after_wakana.js';
import { scn_nene } from '../../data/scn_nene.js';
import { scn_nene_restart } from '../../data/scn_nene_restart.js';
import { scn_meguru } from '../../data/scn_meguru.js';
import { scn_tsumugi } from '../../data/scn_tsumugi.js';
import { scn_touko } from '../../data/scn_touko.js';
import { scn_wakana } from '../../data/scn_wakana.js';
import { flowchart_data, choices as FLOW_CHOICES } from '../../data/flowchart_data.js';
import { choices_all } from '../../data/choices_all.js';
import { fx_events } from '../../data/fx_events.js';

var ASSET_ROOT = '/userdisk/gal_data/sanoba_witch';

var FLOW_NODE_MAP = {};
if (flowchart_data && flowchart_data.nodes) {
  for (var flowNodeIndex = 0; flowNodeIndex < flowchart_data.nodes.length; flowNodeIndex++) {
    FLOW_NODE_MAP[flowchart_data.nodes[flowNodeIndex].id] = flowchart_data.nodes[flowNodeIndex];
  }
}

var CHOICE_BY_SCENARIO = {};
function choiceKey(choice) {
  return choice ? choice.route + ':' + choice.targetLine : '';
}
for (var choiceEntryIndex = 0; choiceEntryIndex < choices_all.length; choiceEntryIndex++) {
  var choiceEntry = choices_all[choiceEntryIndex];
  var choiceScenario = choiceEntry.route;
  if (!choiceScenario || typeof choiceEntry.targetLine !== 'number' || !choiceEntry.options) continue;
  if (!CHOICE_BY_SCENARIO[choiceScenario]) CHOICE_BY_SCENARIO[choiceScenario] = {};
  CHOICE_BY_SCENARIO[choiceScenario][choiceEntry.targetLine] = choiceEntry;
}

function findChoiceForLine(line, scenario) {
  var byLine = CHOICE_BY_SCENARIO[scenario || 'main'];
  return byLine && byLine[line] || null;
}

// choices_all/flowchart choices contain NO skip metadata. These compact scene
// records come from scenario_json/<NNN>*.ks.json (not adjacent option guesses).
// [label, non-empty-text offset from chapterStart, text count, ordered nexts,
//  optional postevals]. Counting follows transcode_sanoba_scenarios.py:203-277.
// Keep file-local label maps: even *405_01A is reused in 407. Cross-file route
// endings/recollection calls are deliberately outside this choice-only graph.
// tools/test_choices_ui.mjs independently checks these paths against the source.
var CHOICE_SCRIPTS = [
  ['main', 'com_part_5', 'f.sel_flag = 0', [ // 005
    ['*dummyselect1',432,0,[]], ['*005_01A',432,3,['*005_01com']],
    ['*005_01B',435,0,['*005_01com']], ['*005_01com',435,250,[]]
  ]],
  ['main', 'com_part_6', 'f.sel_flag = 0', [ // 006
    ['*dummyselect1',274,0,[]], ['*006_01A',274,127,['*006_01com']],
    ['*006_01B',401,64,['*006_01com']], ['*006_01com',465,51,[]]
  ]],
  ['main', 'com_part_9', 'f.sel_flag = 0', [ // 009: nested choices and zero-text merges
    ['*dummyselect1',140,0,[]], ['*009_01A',140,86,['*dummyselect2'],'f.sel_flag = 0'],
    ['*dummyselect2',226,0,[]], ['*009_02A',226,11,['*009_02com']],
    ['*009_02B',237,43,['*009_02com']], ['*009_02com',280,0,['*009_01com']],
    ['*009_01B',280,32,['*dummyselect3'],'f.sel_flag = 0'], ['*dummyselect3',312,0,[]],
    ['*009_03A',312,38,['*009_03com']],
    ['*009_03B',350,63,[['f.wak_flag != 1 || !(sf.clear_nene||sf.clear_meguru||sf.clear_tsumugi||sf.clear_touko)','*009_wak_com'],'*dummy1']],
    ['*dummy1',413,63,['*009_wak_com']], ['*009_wak_com',476,6,['*009_03com']],
    ['*009_03com',482,0,['*009_01com']], ['*009_01com',482,79,['*dummyselect4'],'f.sel_flag = 0'],
    ['*dummyselect4',561,0,[]], ['*009_04A',561,4,['*009_04com']],
    ['*009_04B',565,7,['*009_04com']], ['*009_04com',572,116,[]]
  ]],
  ['main', 'com_part_10', 'f.sel_flag = 0', [ // 010
    ['*dummyselect1',568,0,[]], ['*010_01A',568,8,['*010_01com']],
    ['*010_01B',576,2,['*010_01com']], ['*010_01com',578,111,[]]
  ]],
  ['main', 'com_part_14', 'f.sel_flag = 0', [ // 014
    ['*dummyselect1',60,0,[]], ['*014_01A',60,8,['*014_01com']],
    ['*014_01B',68,14,['*014_01com']], ['*014_01com',82,246,[]]
  ]],
  ['main', 'com_part_17', 'f.sel_flag = 0', [ // 017
    ['*dummyselect1',108,0,[]], ['*017_01A',108,71,['*017_01com']],
    ['*017_01B',179,90,['*017_01com']], ['*017_01com',269,248,[]]
  ]],
  ['main', 'com_part_18', 'f.sel_flag = 0', [ // 018
    ['*dummyselect1',627,0,[]], ['*018_01A',627,20,['*018_01com']],
    ['*018_01B',647,5,['*018_01com']], ['*018_01com',652,8,[]]
  ]],
  ['main', 'com_part_19', 'f.sel_flag = 0', [ // 019
    ['*dummyselect1',161,0,[]], ['*019_01A',161,11,['*019_01com']],
    ['*019_01B',172,6,['*019_01com']], ['*019_01com',178,13,['*dummyselect2'],'f.sel_flag = 0'],
    ['*dummyselect2',191,0,[]], ['*019_02A',191,3,['*019_02com']],
    ['*019_02B',194,4,['*019_02com']], ['*019_02C',198,15,['*019_02com']],
    ['*019_02D',213,7,['*019_02com']], ['*019_02com',220,266,[]]
  ]],
  ['nene', 'nene_nen_part_4', 'f.sel_flag = 0', [ // 104: shared prelude before conditional branch
    ['*dummyselect1',1218,0,['*dummy1']], ['*dummy1',1218,7,[['f.sel_flag == 1','*104_01B'],'*104_01A']],
    ['*104_01A',1225,8,['*104_01com']], ['*104_01B',1233,6,['*104_01com']], ['*104_01com',1239,15,[]]
  ]],
  ['nene', 'nene_nen_part_5', 'f.sel_flag = 0', [ // 105
    ['*dummyselect1',594,0,['*105_01A']], ['*105_01A',594,24,['*105_01com']],
    ['*105_01B',618,20,['*105_01com']], ['*105_01com',638,14,[]]
  ]],
  ['nene', 'nene_nen_part_8', 'f.sel_flag = 0', [ // 108
    ['*dummyselect1',372,0,['*dummy1']], ['*dummy1',372,6,[['f.sel_flag == 1','*108_01B'],'*108_01A']],
    ['*108_01A',378,8,['*108_01com']], ['*108_01B',386,5,['*108_01com']], ['*108_01com',391,12,[]]
  ]],
  ['nene_restart', 'nene_restart_nen_part_12', 'f.sel_flag = 0', [ // 112
    ['*dummyselect1',1203,0,['*dummy1']], ['*dummy1',1203,6,[['f.sel_flag == 1','*112_01B'],'*112_01A']],
    ['*112_01A',1209,8,['*112_01com']], ['*112_01B',1217,7,['*112_01com']], ['*112_01com',1224,12,[]]
  ]],
  ['nene_restart', 'nene_restart_nen_part_13', 'f.eye_flag = 0', [ // 113
    ['*dummyselect1',996,0,[]], ['*113_01A',996,2,['*113_01com']],
    ['*113_01B',998,2,['*dummy1'],'f.eye_flag = 1'], ['*dummy1',1000,6,['*113_01com']],
    ['*113_01com',1006,3,[['f.eye_flag == 1','*113_01B_eye'],'*113_01A_eye']],
    ['*113_01A_eye',1009,2,['*113_01com_eye']], ['*113_01B_eye',1011,3,['*113_01com_eye']],
    ['*113_01com_eye',1014,123,['*dummyselect2'],'f.sel_flag = 0'],
    ['*dummyselect2',1137,0,['*dummy2']], ['*dummy2',1137,7,[['f.sel_flag == 1','*113_02B'],'*113_02A']],
    ['*113_02A',1144,14,['*113_02com']], ['*113_02B',1158,6,['*113_02com']],
    ['*113_02com',1164,12,[['f.eye_flag == 1','*113_02B_eye'],'*113_02A_eye']],
    ['*113_02A_eye',1176,6,['*dummy3'],'f.eye_flag = 1'], ['*dummy3',1182,0,['*113_02com_eye']],
    ['*113_02B_eye',1182,3,['*113_02com_eye']], ['*113_02com_eye',1185,4,[]]
  ]],
  ['nene_restart', 'nene_restart_nen_part_15', 'f.sel_flag = 0', [ // 115
    ['*dummyselect1',445,0,['*dummy1']], ['*dummy1',445,6,[['f.sel_flag == 1','*115_01B'],'*115_01A']],
    ['*115_01A',451,9,['*115_01com']], ['*115_01B',460,8,['*115_01com']],
    ['*115_01com',468,274,['*dummyselect2'],'f.sel_flag = 0'], ['*dummyselect2',742,0,['*115_02A']],
    ['*115_02A',742,15,['*115_02com']], ['*115_02B',757,13,['*115_02com']], ['*115_02com',770,7,[]]
  ]],
  ['meguru', 'meguru_meg_part_14', 'f.sel_flag = 0', [ // 214
    ['*dummyselect1',657,0,['*dummy1']], ['*dummy1',657,19,[['f.sel_flag == 1','*214_01B'],'*214_01A']],
    ['*214_01A',676,7,['*214_01com']], ['*214_01B',683,6,['*214_01com']], ['*214_01com',689,15,[]]
  ]],
  ['meguru', 'meguru_meg_part_16', 'f.glass_flag = 0', [ // 216
    ['*dummyselect1',249,0,[]], ['*216_01A',249,2,['*216_01com']], ['*216_01B',251,1,['*216_01com']],
    ['*216_01com',252,113,['*dummyselect2'],'f.sel_flag = 0'], ['*dummyselect2',365,0,['*216_02A']],
    ['*216_02A',365,5,[['f.glass_flag == 1','*216_02A_glass'],'*216_02A_noglass']],
    ['*216_02A_noglass',370,1,['*216_02A_com']], ['*216_02A_glass',371,1,['*216_02A_com']],
    ['*216_02A_com',372,19,['*216_02com']],
    ['*216_02B',391,3,[['f.glass_flag == 1','*216_02B_glass'],'*216_02B_noglass']],
    ['*216_02B_noglass',394,3,['*216_02B_com']], ['*216_02B_glass',397,3,['*216_02B_com']],
    ['*216_02B_com',400,22,['*216_02com']], ['*216_02com',422,112,['*dummyselect3'],'f.sel_flag = 0'],
    ['*dummyselect3',534,0,['*216_03A']], ['*216_03A',534,10,['*216_03com']],
    ['*216_03B',544,10,['*216_03com']], ['*216_03com',554,87,['*dummyselect4']],
    ['*dummyselect4',641,0,['*dummy1']], ['*dummy1',641,7,[['f.sel_flag == 1 || f.sel_flag == 3','*216_04B'],'*216_04A']],
    ['*216_04A',648,9,['*216_04com']], ['*216_04B',657,11,['*216_04com']], ['*216_04com',668,10,[]]
  ]],
  ['meguru', 'meguru_meg_part_17', 'f.sel_flag = 0', [ // 217
    ['*dummyselect1',759,0,['*217_01A']], ['*217_01A',759,9,['*217_01com']],
    ['*217_01B',768,11,['*217_01com']], ['*217_01com',779,82,['*dummyselect2']],
    ['*dummyselect2',861,0,['*dummy1']], ['*dummy1',861,5,[['f.sel_flag == 1 || f.sel_flag == 3','*217_02B'],'*217_02A']],
    ['*217_02A',866,13,['*217_02com']], ['*217_02B',879,13,['*217_02com']], ['*217_02com',892,15,[]]
  ]],
  ['tsumugi', 'tsumugi_tsu_part_11', 'f.sel_flag = 0', [ // 311
    ['*dummyselect1',779,0,['*311_01A']], ['*311_01A',779,28,['*311_01com']],
    ['*311_01B',807,28,['*311_01com']], ['*311_01com',835,15,[]]
  ]],
  ['tsumugi', 'tsumugi_tsu_part_13', 'f.sel_flag = 0', [ // 313
    ['*dummyselect1',465,0,['*313_01A']], ['*313_01A',465,25,['*313_01com']],
    ['*313_01B',490,25,['*313_01com']], ['*313_01com',515,82,['*dummyselect2'],'f.sel_flag = 0'],
    ['*dummyselect2',597,0,['*313_02A']], ['*313_02A',597,26,['*313_02com']],
    ['*313_02B',623,26,['*313_02com']], ['*313_02com',649,6,[]]
  ]],
  ['tsumugi', 'tsumugi_tsu_part_15', 'f.sel_flag = 0', [ // 315
    ['*dummyselect1',248,0,['*315_01A']], ['*315_01A',248,25,['*315_01com']],
    ['*315_01B',273,27,['*315_01com']], ['*315_01com',300,83,['*dummyselect2'],'f.sel_flag = 0'],
    ['*dummyselect2',383,0,['*315_02A']], ['*315_02A',383,24,['*315_02com']],
    ['*315_02B',407,24,['*315_02com']], ['*315_02com',431,9,[]]
  ]],
  ['touko', 'touko_tou_part_5', 'f.sel_flag = 0', [ // 405
    ['*dummyselect1',1066,0,['*dummy1']], ['*dummy1',1066,7,[['f.sel_flag == 1','*405_01B'],'*405_01A']],
    ['*405_01A',1073,19,['*405_01com']], ['*405_01B',1092,14,['*405_01com']], ['*405_01com',1106,14,[]]
  ]],
  ['touko', 'touko_tou_part_7', 'f.sel_flag = 0', [ // 407 (labels really are 405_01A/B)
    ['*dummyselect1',844,0,['*dummy1']], ['*dummy1',844,6,[['f.sel_flag == 1','*405_01B'],'*405_01A']],
    ['*405_01A',850,11,['*407_01com']], ['*405_01B',861,6,['*407_01com']], ['*407_01com',867,14,[]]
  ]],
  ['wakana', 'wakana_wak_part_6', 'f.sel_flag = 0', [ // 506
    ['*dummyselect1',348,0,['*506_01A']], ['*506_01A',348,19,['*506_01com']],
    ['*506_01B',367,13,['*506_01com']], ['*506_01com',380,14,['*chapter64']],
    ['*chapter64',394,33,['*chapter65']], ['*chapter65',427,207,['*dummyselect2'],'f.sel_flag = 0'],
    ['*dummyselect2',634,0,['*506_02A']], ['*506_02A',634,17,['*506_02com']],
    ['*506_02B',651,29,['*506_02com']], ['*506_02com',680,6,[]],
    ['*dummyselect3',1134,0,['*dummy1']], ['*dummy1',1134,7,[['f.sel_flag == 1','*506_03B'],'*506_03A']],
    ['*506_03A',1141,13,['*506_03com']], ['*506_03B',1154,12,['*506_03com']], ['*506_03com',1166,15,[]]
  ]]
];
var CHOICE_SCRIPT_MAP = {};
for (var scriptIndex = 0; scriptIndex < CHOICE_SCRIPTS.length; scriptIndex++) {
  var script = CHOICE_SCRIPTS[scriptIndex];
  script.base = flowchart_data.chapterStart[script[1]];
  script.nodes = {};
  for (var sceneIndex = 0; sceneIndex < script[3].length; sceneIndex++) {
    var scene = script[3][sceneIndex];
    scene.line = script.base + scene[1];
    scene.position = sceneIndex;
    scene.choice = scene[0].indexOf('*dummyselect') === 0 ? findChoiceForLine(scene.line, script[0]) : null;
    script.nodes[scene[0]] = scene;
    if (scene.choice) CHOICE_SCRIPT_MAP[choiceKey(scene.choice)] = { script: script, scene: scene };
  }
}

// Only the assignment/post-increment grammar actually present in choice exp.
// Parse the whole expression before changing anything; never execute script JS.
function choiceOperations(exp) {
  if (!exp || !exp.trim()) return [];
  var parts = exp.split(',');
  var operations = [];
  for (var i = 0; i < parts.length; i++) {
    var match = /^\s*f\.(nen|meg|tsu|tou|wak|sel|eye|glass)_flag\s*(\+\+|=\s*[0-3])\s*$/.exec(parts[i]);
    if (!match) return null;
    operations.push({ flag: match[1], increment: match[2] === '++', value: Number(match[2].slice(1).trim()) });
  }
  return operations;
}
function affinityFlag(flag) { return /^(nen|meg|tsu|tou|wak)$/.test(flag); }
function applyChoiceOperations(flags, operations, localOnly, direction) {
  for (var i = 0; i < operations.length; i++) {
    var op = operations[i];
    if (localOnly && affinityFlag(op.flag)) continue;
    if (direction === -1) {
      if (affinityFlag(op.flag) && op.increment) flags[op.flag] = Math.max(0, (flags[op.flag] || 0) - 1);
    } else {
      flags[op.flag] = op.increment ? (flags[op.flag] || 0) + 1 : op.value;
    }
  }
}
function selectedChoiceOption(vm, choice) {
  var index = (vm.choiceSelections || {})[choiceKey(choice)];
  for (var i = 0; i < choice.options.length; i++) if (choice.options[i].index === index) return choice.options[i];
  return null;
}
function forgetChoice(vm, choice) {
  var selected = selectedChoiceOption(vm, choice);
  if (selected) applyChoiceOperations(vm.choiceFlags, choiceOperations(selected.exp) || [], false, -1);
  delete vm.choiceSelections[choiceKey(choice)];
}
function choiceCondition(condition, flags, cleared) {
  if (condition === 'f.wak_flag != 1 || !(sf.clear_nene||sf.clear_meguru||sf.clear_tsumugi||sf.clear_touko)') {
    return flags.wak !== 1 || !['nene', 'meguru', 'tsumugi', 'touko'].some(function (route) { return cleared.indexOf(route) >= 0; });
  }
  var parts = condition.split(' || ');
  var result = false;
  for (var i = 0; i < parts.length; i++) {
    var match = /^f\.(sel|eye|glass)_flag == ([13])$/.exec(parts[i]);
    if (!match) return null;
    if ((flags[match[1]] || 0) === Number(match[2])) result = true;
  }
  return result;
}
function nextChoiceScene(script, scene, flags, cleared) {
  for (var i = 0; i < scene[3].length; i++) {
    var edge = scene[3][i];
    if (typeof edge === 'string') return script.nodes[edge] || null;
    var matches = choiceCondition(edge[0], flags, cleared);
    if (matches === null) return null; // no evidence: do not guess a fallthrough
    if (matches) return script.nodes[edge[1]] || null;
  }
  return null;
}
function skipEmptyChoiceScenes(script, scene, flags, cleared) {
  for (var i = 0; scene && !scene.choice && !scene[2] && i < script[3].length; i++) {
    applyChoiceOperations(flags, choiceOperations(scene[4]) || [], true);
    scene = nextChoiceScene(script, scene, flags, cleared);
  }
  return scene;
}
function resolveChoiceOptionLine(option, choice) {
  if (!option || !choice) return null;
  var target = FLOW_NODE_MAP[option.targetNode];
  if (target && target.route === choice.route && typeof target.targetLine === 'number') return target.targetLine;
  var source = CHOICE_SCRIPT_MAP[choiceKey(choice)];
  if (!source || typeof source.script.base !== 'number') return null;
  var flags = {};
  applyChoiceOperations(flags, choiceOperations(option.exp) || [], true);
  var scene = option.targetNode ? source.script.nodes[option.targetNode] : nextChoiceScene(source.script, source.scene, flags, []);
  scene = skipEmptyChoiceScenes(source.script, scene, flags, []);
  return scene ? scene.line : null;
}

function choicePath(vm, scenario) {
  var result = { skips: [], entries: [], excluded: [] };
  var cleared = (readSettings() || {}).clearedRoutes || [];
  for (var si = 0; si < CHOICE_SCRIPTS.length; si++) {
    var script = CHOICE_SCRIPTS[si];
    if (script[0] !== scenario || typeof script.base !== 'number') continue;
    var flags = Object.assign({}, vm.choiceFlags, { sel: 0, eye: 0, glass: 0 });
    applyChoiceOperations(flags, choiceOperations(script[2]) || [], true);
    var scene = script[3][0];
    for (var steps = 0; scene && steps < script[3].length * 2; steps++) {
      var choice = scene.choice;
      var selected = choice && selectedChoiceOption(vm, choice);
      if (choice && !selected || !scene[3].length && !choice) {
        // A save/flowchart jump may start at a later choice without answering
        // earlier ones. Do not infer an answer; resume only at a stored choice.
        var later = null;
        for (var p = scene.position + 1; p < script[3].length; p++) {
          var candidate = script[3][p];
          if (candidate.choice && selectedChoiceOption(vm, candidate.choice)) {
            later = candidate;
            applyChoiceOperations(flags, choiceOperations(script[3][p - 1][4]) || [], true);
            break;
          }
        }
        scene = later;
        continue;
      }
      var next;
      if (choice) {
        applyChoiceOperations(flags, choiceOperations(selected.exp) || [], true);
        next = selected.targetNode ? script.nodes[selected.targetNode] : nextChoiceScene(script, scene, flags, cleared);
      } else {
        applyChoiceOperations(flags, choiceOperations(scene[4]) || [], true);
        next = nextChoiceScene(script, scene, flags, cleared);
      }
      next = skipEmptyChoiceScenes(script, next, flags, cleared);
      if (!next) break;
      if (choice) {
        result.entries.push({ choice: choice, targetLine: next.line });
        if (next.line > scene.line) result.excluded.push({ from: scene.line + 1, to: next.line });
      } else if (next.line > scene.line + scene[2]) {
        result.skips.push({ skipAfterLine: scene.line + scene[2] - 1, skipToLine: next.line });
        result.excluded.push({ from: scene.line + scene[2], to: next.line });
      }
      scene = next;
    }
  }
  return result;
}
function previousChoicePosition(vm, line) {
  var path = choicePath(vm, vm.currentScenario || 'main');
  for (var i = path.entries.length - 1; i >= 0; i--) {
    if (path.entries[i].targetLine === line) return path.entries[i].choice.targetLine;
  }
  for (var j = path.skips.length - 1; j >= 0; j--) {
    if (path.skips[j].skipToLine === line) return path.skips[j].skipAfterLine;
  }
  return line - 1;
}

var SCENARIOS = {
  main: chapter_all,
  nene: scn_nene,
  nene_restart: scn_nene_restart,
  meguru: scn_meguru,
  tsumugi: scn_tsumugi,
  touko: scn_touko,
  wakana: scn_wakana,
  after_nene: after_nene,
  after_meguru: after_meguru,
  after_tsumugi: after_tsumugi,
  after_touko: after_touko,
  after_wakana: after_wakana
};

var ROUTE_CLEAR_KEYS = {
  nene: 'nene',
  nene_restart: 'nene_restart',
  meguru: 'meguru',
  tsumugi: 'tsumugi',
  touko: 'touko',
  wakana: 'wakana'
};

var GAME_ZOOM_LEVELS = [
  { scale: 1.0, w: 390, h: 220, label: '1.0x' },
  { scale: 1.5, w: 585, h: 330, label: '1.5x' },
  { scale: 2.0, w: 780, h: 440, label: '2.0x' },
  { scale: 2.5, w: 975, h: 550, label: '2.5x' }
];

function dialoguePages(text) {
  var lines = [];
  var current = '';
  var width = 0;
  var chars = Array.from(text || '');
  for (var i = 0; i < chars.length; i++) {
    var c = chars[i];
    var units = c.charCodeAt(0) < 128 ? 0.6 : 1;
    if (c === '\n' || width + units > 14) {
      lines.push(current);
      current = '';
      width = 0;
      if (c === '\n') continue;
    }
    current += c;
    width += units;
  }
  if (current || !lines.length) lines.push(current);
  var pages = [];
  for (var start = 0; start < lines.length; start += 5) pages.push(lines.slice(start, start + 5).join('\n'));
  return pages;
}

function getActiveScenario(vm) {
  var key = (vm && vm.currentScenario) || 'main';
  if (SCENARIOS[key] && SCENARIOS[key].length) {
    return SCENARIOS[key];
  }
  if (vm && vm.currentScenarioData && vm.currentScenarioData.length) {
    return vm.currentScenarioData;
  }
  return chapter_all;
}

var STAND_HEROINE_NAMES = ['宁宁', '巡', '紬', '憧子', '和奏'];

function resolveFgSrc(charInfo) {
  if (!charInfo) return '';
  var c = charInfo.char || '';
  if (STAND_HEROINE_NAMES.indexOf(c) < 0) return '';
  return characterUrl('fg', c, charInfo.dress || '制服', charInfo.face || 1);
}

export var gameMethods = {
  initGame: function (scenarioKey, startLine) {
    if (scenarioKey) {
      this.currentScenario = scenarioKey;
    } else if (!this.currentScenario) {
      this.currentScenario = 'main';
    }
    this.clearAutoTimer();
    this.currentBgm = '';
    this.currentScenarioData = SCENARIOS[this.currentScenario] || chapter_all;
    this.currentLine = typeof startLine === 'number' ? startLine : 0;
    this.dialoguePage = 0;
    this.activeChoice = null;
    this.modalType = '';
    this.confirmModal = null;
    this.autoPlay = false;
    this.skipMode = false;
    this.zoomMode = false;
    this.gameZoomIndex = 0;
    this.gameImgPanX = 0;
    this.gameImgPanY = 0;
    this.historyFocusIndex = 0;
    this.savePage = 0;
    this.selectedSlot = 1;
    this.modalSaves = readAllSaves('sanoba_witch') || {};
    this.menuNotice = '';
    this.saveNotice = '';
    this.normalEnd = false;
    this.choiceSelections = this.choiceSelections || {};
    this.choiceFlags = this.choiceFlags || {};
    this.rebuildChoiceSkips();
    this.applyCurrentLine(true);
  },

  rebuildChoiceSkips: function () {
    this.pendingSkipStack = [];
    var path = choicePath(this, this.currentScenario || 'main');
    var cur = this.currentLine || 0;
    for (var i = 0; i < path.skips.length; i++) {
      var skip = path.skips[i];
      if (skip.skipToLine > cur) {
        this.pendingSkipStack.push(skip);
      }
    }
  },

  applyCurrentLine: function (playVoice) {
    var data = getActiveScenario(this);
    var row = data[this.currentLine];
    if (!row) return false;

    var speaker = row[1];
    var text = row[2];
    var voice = row[3];
    var bg = row[4];
    var bgm = row[5];
    var charInfo = row[6];
    var chapter = formatChapter(row[7] || getChapterByLine(this.currentLine));
    var cg = row[8];
    var sd = row[9];

    // 检查是否有未选选项
    var pendingChoice = findChoiceForLine(this.currentLine || 0, this.currentScenario);
    if (pendingChoice && !this.isChoiceSelected(pendingChoice)) {
      this.activeChoice = pendingChoice;
      this.autoPlay = false;
      this.skipMode = false;
      this.clearAutoTimer();
      var choiceGal = getGal();
      if (choiceGal) choiceGal.stopVoice();
      this.clearFx();
      return true;
    }
    this.activeChoice = null;
    this.dialoguePage = 0;

    pushBacklog({
      id: this.currentScenario + ':' + this.currentLine,
      scenario: this.currentScenario,
      line: this.currentLine,
      chapter: chapter,
      speaker: speaker || '',
      text: text || '',
      voice: voice || null,
      bgm: bgm || null
    });

    var G = getGal();
    if (G) {
      if (playVoice && voice) {
        G.stopVoice();
        var voiceFile = voice.toLowerCase().indexOf('.opus') >= 0 || voice.toLowerCase().indexOf('.ogg') >= 0 ? voice : voice + '.opus';
        G.playVoice(ASSET_ROOT + '/voice/' + voiceFile, 1.0);
        this.hasVoice = true;
      } else if (!voice) {
        this.hasVoice = false;
      }

      if (bgm && bgm !== this.currentBgm) {
        var bgmSettings = readSettings() || {};
        this.currentBgm = bgm;
        if (bgmSettings.bgmEnabled !== false) {
          var bgmFile = bgm.toLowerCase().indexOf('.opus') >= 0 || bgm.toLowerCase().indexOf('.ogg') >= 0 ? bgm : bgm + '.opus';
          G.playBgm(ASSET_ROOT + '/bgm/' + bgmFile, true, bgmSettings.bgmVolume);
        }
      }
    }

    this.applyFxForLine(this.currentLine);

    if (this.autoPlay) {
      this.scheduleAutoNext(text, voice);
    } else if (this.skipMode) {
      this.scheduleSkipNext();
    }
    return true;
  },

  scheduleAutoNext: function (text, voice) {
    this.clearAutoTimer();
    var waitMs = 2000;
    if (text) waitMs += text.length * 50;
    if (voice) waitMs = Math.max(waitMs, 2500);
    var self = this;
    this.autoTimer = setTimeout(function () {
      self.nextLine();
    }, waitMs);
  },

  scheduleSkipNext: function () {
    this.clearAutoTimer();
    var self = this;
    this.autoTimer = setTimeout(function () {
      self.nextLine();
    }, 80);
  },

  clearAutoTimer: function () {
    if (this.autoTimer) {
      clearTimeout(this.autoTimer);
      this.autoTimer = null;
    }
  },

  applyFxForLine: function (line) {
    var scenario = this.currentScenario || 'main';
    var fxObj = fx_events && fx_events[scenario] ? fx_events[scenario][line] : null;
    if (!fxObj) {
      this.clearFx();
      return;
    }
    this.fxShakeX = fxObj.shakeX || 0;
    this.fxShakeY = fxObj.shakeY || 0;
    this.fxWhite = fxObj.white || 0;
    this.fxBlack = fxObj.black || 0;
  },

  clearFx: function () {
    this.fxShakeX = 0;
    this.fxShakeY = 0;
    this.fxWhite = 0;
    this.fxBlack = 0;
  },

  isChoiceSelected: function (choiceOrKey) {
    if (!this.choiceSelections || !choiceOrKey) return false;
    var key = typeof choiceOrKey === 'string' ? choiceOrKey : choiceKey(choiceOrKey);
    return !!this.choiceSelections[key];
  },

  selectChoiceOption: function (option) {
    if (!this.activeChoice || !option) return;
    var choice = this.activeChoice;
    var key = choiceKey(choice);
    if (!this.choiceSelections) this.choiceSelections = {};
    if (!this.choiceFlags) this.choiceFlags = {};

    var prevIndex = this.choiceSelections[key];
    if (prevIndex !== undefined) {
      var prevOption = null;
      for (var i = 0; i < choice.options.length; i++) {
        if (choice.options[i].index === prevIndex) {
          prevOption = choice.options[i];
          break;
        }
      }
      if (prevOption) {
        applyChoiceOperations(this.choiceFlags, choiceOperations(prevOption.exp) || [], false, -1);
      }
    }

    this.choiceSelections[key] = option.index;
    applyChoiceOperations(this.choiceFlags, choiceOperations(option.exp) || [], false, 1);
    this.rebuildChoiceSkips();

    this.activeChoice = null;
    var target = resolveChoiceOptionLine(option, choice);
    if (typeof target === 'number' && target >= 0) {
      this.currentLine = target;
    } else {
      this.currentLine = (this.currentLine || 0) + 1;
    }
    this.applyCurrentLine(true);
  },

  enterRoute: function (routeKey) {
    if (!routeKey || !SCENARIOS[routeKey]) return false;
    var G = getGal();
    if (G && typeof G.stopBgm === 'function') G.stopBgm();
    this.currentScenario = routeKey;
    this.currentLine = 0;
    this.initGame(routeKey, 0);
    return true;
  },

  markRouteCleared: function () {
    var clearKey = ROUTE_CLEAR_KEYS[this.currentScenario] || this.currentScenario;
    if (!clearKey) return false;
    var settings = readSettings() || {};
    var cleared = settings.clearedRoutes || [];
    var next = [];
    for (var i = 0; i < cleared.length; i++) {
      if (next.indexOf(cleared[i]) < 0) next.push(cleared[i]);
    }
    if (next.indexOf(clearKey) < 0) next.push(clearKey);
    return writeSettings({ clearedRoutes: next });
  },

  resolveRouteBranchAt: function (line) {
    if (this.currentScenario !== 'main') return null;
    var data = getActiveScenario(this);
    if (line >= data.length - 1) {
      var flags = this.choiceFlags || {};
      var neneScore = flags.nen || 0;
      var meguruScore = flags.meg || 0;
      var tsumugiScore = flags.tsu || 0;
      var toukoScore = flags.tou || 0;
      var wakanaScore = flags.wak || 0;

      var bestScore = -1;
      var bestRoute = 'nene';
      var pairs = [
        ['nene', neneScore],
        ['meguru', meguruScore],
        ['tsumugi', tsumugiScore],
        ['touko', toukoScore],
        ['wakana', wakanaScore]
      ];
      for (var p = 0; p < pairs.length; p++) {
        if (pairs[p][1] > bestScore) {
          bestScore = pairs[p][1];
          bestRoute = pairs[p][0];
        }
      }
      return bestRoute;
    }
    return null;
  },

  nextLine: function () {
    if (this.activeChoice || this.modalType || this.confirmModal) return;
    if (this.normalEnd || this.zoomMode) return;
    var rows = getActiveScenario(this);
    var currentRow = rows[this.currentLine] || [];
    var pages = dialoguePages(currentRow[2]);
    if (!this.skipMode && (this.dialoguePage || 0) < pages.length - 1) {
      this.dialoguePage = (this.dialoguePage || 0) + 1;
      if (this.autoPlay) this.scheduleAutoNext(pages[this.dialoguePage], null);
      return;
    }
    var nextIndex = this.currentLine + 1;

    if (this.pendingSkipStack && this.pendingSkipStack.length) {
      for (var sIdx = this.pendingSkipStack.length - 1; sIdx >= 0; sIdx--) {
        var skip = this.pendingSkipStack[sIdx];
        if (this.currentLine === skip.skipAfterLine) {
          nextIndex = skip.skipToLine;
          this.pendingSkipStack.splice(sIdx, 1);
          break;
        }
      }
    }

    var branchRoute = this.resolveRouteBranchAt(this.currentLine);
    if (branchRoute) {
      this.enterRoute(branchRoute);
      return;
    }

    if (nextIndex >= rows.length) {
      this.markRouteCleared();
      this.normalEnd = true;
      this.autoPlay = false;
      this.skipMode = false;
      this.clearAutoTimer();
      var endGal = getGal();
      if (endGal) {
        endGal.stopVoice();
        endGal.stopBgm();
      }
      return;
    }

    this.currentLine = nextIndex;
    this.applyCurrentLine(true);
  },

  prevLine: function () {
    this.menuNotice = '';
    if (this.normalEnd) this.normalEnd = false;
    var line = this.currentLine || 0;
    if (line <= 0) {
      this.menuNotice = '已经是第一句';
      return false;
    }
    this.modalType = '';
    this.confirmModal = null;
    this.autoPlay = false;
    this.skipMode = false;
    this.clearAutoTimer();
    this.activeChoice = null;
    this.currentLine = previousChoicePosition(this, line);
    var backChoice = findChoiceForLine(this.currentLine, this.currentScenario);
    if (backChoice) {
      forgetChoice(this, backChoice);
    }
    this.rebuildChoiceSkips();
    this.applyCurrentLine(false);
    return true;
  },

  nextChoiceLine: function (scenario, startLine) {
    var scn = scenario || this.currentScenario || 'main';
    var path = choicePath(this, scn);
    var excluded = path ? path.excluded : [];
    var byLine = CHOICE_BY_SCENARIO[scn];
    var best = null;
    if (byLine) {
      for (var l in byLine) {
        var choice = byLine[l];
        var line = typeof choice.targetLine === 'number' ? choice.targetLine : choice.line;
        if (typeof line === 'number' && line >= startLine) {
          var isExcluded = false;
          for (var e = 0; e < excluded.length; e++) {
            if (line >= excluded[e].from && line < excluded[e].to) {
              isExcluded = true;
              break;
            }
          }
          if (!isExcluded) {
            if (best === null || line < best) best = line;
          }
        }
      }
    }
    return best;
  },

  jumpToNextChoice: function () {
    var scenario = this.currentScenario || 'main';
    var line = this.currentLine || 0;
    this.menuNotice = '';
    var target = this.nextChoiceLine(scenario, line + 1);
    if (target === null) {
      this.menuNotice = '后面没有可跳转的选择支';
      return false;
    }
    var targetChoice = findChoiceForLine(target, scenario);
    if (targetChoice) {
      forgetChoice(this, targetChoice);
    }
    this.activeChoice = null;
    this.modalType = '';
    this.confirmModal = null;
    this.autoPlay = false;
    this.skipMode = false;
    this.clearAutoTimer();
    this.currentLine = target;
    this.rebuildChoiceSkips();
    this.applyCurrentLine(true);
    return true;
  },

  toggleAutoPlay: function () {
    this.skipMode = false;
    this.autoPlay = !this.autoPlay;
    if (this.autoPlay) {
      var data = getActiveScenario(this);
      var row = data[this.currentLine];
      this.scheduleAutoNext(row ? row[2] : '', row ? row[3] : '');
    } else {
      this.clearAutoTimer();
    }
  },

  toggleSkipMode: function () {
    this.autoPlay = false;
    this.skipMode = !this.skipMode;
    if (this.skipMode) {
      this.scheduleSkipNext();
    } else {
      this.clearAutoTimer();
    }
  },

  replayVoice: function () {
    if (this.activeChoice) return;
    var data = getActiveScenario(this);
    var row = data[this.currentLine];
    if (!row) return;
    var voice = row[3];
    if (!voice) return;
    var G = getGal();
    if (G) {
      G.stopVoice();
      var voiceFile = voice.toLowerCase().indexOf('.opus') >= 0 || voice.toLowerCase().indexOf('.ogg') >= 0 ? voice : voice + '.opus';
      G.playVoice(ASSET_ROOT + '/voice/' + voiceFile, 1.0);
      this.hasVoice = true;
    }
  },

  toggleZoom: function () {
    if (this.activeChoice || this.modalType || this.normalEnd) return;
    this.zoomMode = !this.zoomMode;
    if (this.zoomMode) {
      this.autoPlay = false;
      this.skipMode = false;
      this.clearAutoTimer();
      this.resetGameZoom();
    }
  },

  cycleGameZoom: function () {
    if (this._gameZoomMoved) return;
    this.gameZoomIndex = (this.gameZoomIndex + 1) % GAME_ZOOM_LEVELS.length;
    this.gameImgPanX = 0;
    this.gameImgPanY = 0;
  },

  zoomInGameImg: function () {
    this.gameZoomIndex = Math.min(this.gameZoomIndex + 1, GAME_ZOOM_LEVELS.length - 1);
    this.gameImgPanX = 0;
    this.gameImgPanY = 0;
  },

  zoomOutGameImg: function () {
    this.gameZoomIndex = Math.max(this.gameZoomIndex - 1, 0);
    this.gameImgPanX = 0;
    this.gameImgPanY = 0;
  },

  resetGameZoom: function () {
    this.gameZoomIndex = 0;
    this.gameImgPanX = 0;
    this.gameImgPanY = 0;
  },

  onGameZoomStart: function (event) {
    var touch = event.changedTouches && event.changedTouches[0];
    if (!touch) return;
    this._gameZoomStartX = touch.pageX || touch.clientX || 0;
    this._gameZoomStartY = touch.pageY || touch.clientY || 0;
    this._gameZoomPanX = this.gameImgPanX || 0;
    this._gameZoomPanY = this.gameImgPanY || 0;
    this._gameZoomMoved = false;
  },

  onGameZoomMove: function (event) {
    var touch = event.changedTouches && event.changedTouches[0];
    if (!touch) return;
    var dx = (touch.pageX || touch.clientX || 0) - this._gameZoomStartX;
    var dy = (touch.pageY || touch.clientY || 0) - this._gameZoomStartY;
    if (Math.abs(dx) + Math.abs(dy) > 6) this._gameZoomMoved = true;
    var zoom = GAME_ZOOM_LEVELS[this.gameZoomIndex];
    var limitX = Math.max(0, (zoom.w - 664) / 2);
    var limitY = Math.max(0, (zoom.h - 220) / 2);
    this.gameImgPanX = Math.max(-limitX, Math.min(limitX, this._gameZoomPanX + dx));
    this.gameImgPanY = Math.max(-limitY, Math.min(limitY, this._gameZoomPanY + dy));
  },

  onGameZoomEnd: function () {
    var self = this;
    setTimeout(function () { self._gameZoomMoved = false; }, 120);
  },

  openGameModal: function (type) {
    this.autoPlay = false;
    this.skipMode = false;
    this.clearAutoTimer();
    this.modalType = type;
    this.menuNotice = '';
    this.saveNotice = '';
    this.confirmModal = null;
    if (type === 'save' || type === 'load') {
      this.modalSaves = readAllSaves('sanoba_witch') || {};
    }
  },

  closeGameModal: function () {
    this.modalType = '';
    this.confirmModal = null;
  },

  openModal: function (type) {
    this.openGameModal(type);
  },

  closeModal: function () {
    this.closeGameModal();
  },

  openHistoryModal: function () {
    this.openGameModal('history');
    this.historyList = getBacklog();
    this.historyFocusIndex = Math.max(0, this.historyList.length - 1);
  },

  scrollHistoryUp: function () {
    this.historyFocusIndex = Math.max(0, this.historyFocusIndex - 2);
  },

  scrollHistoryDown: function () {
    this.historyFocusIndex = Math.min(Math.max(0, this.historyList.length - 1), this.historyFocusIndex + 2);
  },

  playHistoryVoice: function (voice) {
    if (!voice) return;
    var G = getGal();
    if (G) {
      G.stopVoice();
      var voiceFile = voice.toLowerCase().indexOf('.opus') >= 0 || voice.toLowerCase().indexOf('.ogg') >= 0 ? voice : voice + '.opus';
      G.playVoice(ASSET_ROOT + '/voice/' + voiceFile, 1.0);
    }
  },

  selectSlotItem: function (slotNum) {
    this.selectedSlot = slotNum;
    if (this.modalType === 'save') {
      this.executeSave(slotNum);
    } else if (this.modalType === 'load') {
      this.executeLoad(slotNum);
    }
  },

  changeSavePage: function (delta) {
    var next = (this.savePage || 0) + delta;
    if (next < 0) next = 0;
    if (next > 4) next = 4;
    this.savePage = next;
    this.selectedSlot = next * 6 + 1;
  },

  executeSave: function (slotNum) {
    var data = getActiveScenario(this);
    var row = data[this.currentLine] || [];
    var speaker = row[1] || '';
    var text = row[2] || '';
    var chapter = formatChapter(row[7] || getChapterByLine(this.currentLine));
    var cg = row[8] || null;
    var bg = row[4] || null;

    var record = {
      slot: slotNum,
      scenario: this.currentScenario || 'main',
      line: this.currentLine,
      time: getNowDateStr(),
      text: text,
      speaker: speaker,
      chapter: chapter,
      cg: cg,
      bg: bg,
      sd: row[9] || '',
      extra: {
        choices: Object.assign({}, this.choiceSelections),
        flags: Object.assign({}, this.choiceFlags)
      }
    };
    saveSlotRecord(slotNum, record, 'sanoba_witch');
    this.saveNotice = '已存盘至 槽位 ' + slotNum;
    this.selectedSlot = slotNum;
    this.modalSaves = readAllSaves('sanoba_witch') || {};
  },

  executeLoad: function (slotNum) {
    var record = loadSlotRecord(slotNum, 'sanoba_witch');
    if (!record) {
      this.saveNotice = '槽位 ' + slotNum + ' 为空！';
      return false;
    }
    this.modalType = '';
    this.confirmModal = null;
    this.currentScenario = record.scenario || 'main';
    var extra = record.extra || {};
    this.choiceSelections = Object.assign({}, extra.choices || {});
    this.choiceFlags = Object.assign({}, extra.flags || {});
    this.initGame(this.currentScenario, record.line || 0);
    return true;
  },

  exitToTitle: function () {
    var G = getGal();
    if (G) {
      G.stopVoice();
      G.stopBgm();
    }
    this.autoPlay = false;
    this.skipMode = false;
    this.clearAutoTimer();
    this.modalType = '';
    this.confirmModal = null;
    this.view = 'title';
    if (typeof this.initTitle === 'function') {
      this.initTitle();
    }
  }
};

export function renderGame(vm, h) {
  var rows = getActiveScenario(vm);
  var lineIdx = vm.currentLine || 0;
  var row = rows[lineIdx] || [0, '', '……', null, '画面_黒', 'bgm01', null, 'CHAPTER 1-1'];
  var activeChoice = vm.activeChoice;
  var speaker = activeChoice ? '' : row[1];
  var pages = dialoguePages(row[2]);
  var pageIndex = Math.min(vm.dialoguePage || 0, pages.length - 1);
  var text = activeChoice ? (activeChoice.prompt || '请选择接下来的行动') : pages[pageIndex];
  var voice = row[3] || '';
  var bg = row[4] || '';
  var bgm = row[5] || '';
  var charInfo = row[6] || null;
  var currentChapter = formatChapter(row[7] || getChapterByLine(lineIdx));
  var cg = row[8] || '';
  var sd = row[9] || '';

  var bgSrc = cg
    ? 'file://' + ASSET_ROOT + '/cg/' + cg + '.png'
    : ((!bg || bg === '画面_黒') ? '' : 'file://' + ASSET_ROOT + '/bg/' + bg + '.png');
  var fgSrc = resolveFgSrc(charInfo);
  var sdSrc = sd ? 'file://' + ASSET_ROOT + '/sd/' + sd + '.png' : '';

  var speakerDisplay = activeChoice ? '【请选择】' : (speaker ? '【' + speaker + '】' : '【独 白】');
  var isNarration = !speaker && !activeChoice;
  var progressStr = (lineIdx + 1) + ' / ' + rows.length;

  var children = [
    // 1. 左侧画面舞台区（390px x 220px 纯净无遮挡）
    h('div', {
      staticStyle: S('game-stage-pane', {
        left: (vm.fxShakeX || 0) + 'px',
        top: (vm.fxShakeY || 0) + 'px'
      }),
      on: { click: function (event) { if (event && event.stopPropagation) event.stopPropagation(); vm.toggleZoom(); } }
    }, [
      bgSrc ? h('image', {
        staticStyle: S('game-stage-img'),
        attrs: { src: bgSrc, resize: 'contain' }
      }) : null,
      sdSrc ? h('image', {
        staticStyle: S('game-stage-sd'),
        attrs: { src: sdSrc, resize: 'contain' }
      }) : null,
      fgSrc ? h('image', {
        staticStyle: S('game-stage-char'),
        attrs: { src: fgSrc, resize: 'contain' }
      }) : null
    ]),

    // 2. 中间大字号剧情对话区（322px x 220px）
    h('div', {
      staticStyle: S('game-dialog-pane'),
      on: {
        click: function () {
          if (vm.activeChoice || vm.modalType || vm.confirmModal) return;
          vm.nextLine();
        }
      }
    }, [
      // 头部角色名牌与进度
      h('div', { staticStyle: S('game-dialog-header') }, [
        h('div', {
          staticStyle: S(isNarration ? 'game-speaker-badge game-speaker-badge-narration' : 'game-speaker-badge')
        }, [
          h('text', { staticStyle: S('game-speaker-name') }, speakerDisplay)
        ]),
        h('text', { staticStyle: S('game-dialog-progress') }, progressStr)
      ]),

      // 中部大字号台词正文
      h('div', { staticStyle: S('game-dialog-body') }, [
        h('text', { staticStyle: S('game-dialog-text') }, text)
      ]),

      // 底部操作提示与状态栏
      h('div', { staticStyle: S('game-dialog-footer') }, [
        h('div', { staticStyle: S('game-dialog-footer-left') }, [
          h('div', { staticStyle: S('game-sub-chapter-tag') }, [
            h('text', { staticStyle: S('game-sub-chapter-text') }, currentChapter)
          ]),
          h('div', {
            staticStyle: S('game-sub-zoom-tag'),
            on: { click: function (event) { if (event && event.stopPropagation) event.stopPropagation(); vm.toggleZoom(); } }
          }, [
            h('text', { staticStyle: S('game-sub-zoom-text') }, '轻触特写')
          ]),
          h('div', {
            staticStyle: S('game-sub-zoom-tag'),
            on: { click: function () { vm.openHistoryModal(); } }
          }, [
            h('text', { staticStyle: S('game-sub-zoom-text') }, '历史对话')
          ]),
          vm.hasVoice ? h('text', { staticStyle: S('game-voice-playing-hint') }, '♪ 发声') : null
        ]),
        h('text', {
          staticStyle: S('game-dialog-tap-hint')
        }, activeChoice ? '请选择分支' : ((pageIndex + 1) + '/' + pages.length + ' 轻触推进'))
      ])
    ]),

    // 3. 右侧大尺寸触控快捷栏（88px x 220px，4 个核心大按键）
    h('div', { staticStyle: S('game-ctrl-pane') }, [
      // (1) 语音
      h('div', {
        staticStyle: S('game-ctrl-btn'),
        on: { click: function () { vm.replayVoice(); } }
      }, [
        h('text', { staticStyle: S('game-ctrl-btn-title') }, '♪ 重听'),
        h('text', { staticStyle: S('game-ctrl-btn-sub') }, 'VOICE')
      ]),

      // (2) 自动
      h('div', {
        staticStyle: S(vm.autoPlay ? 'game-ctrl-btn game-ctrl-btn-active' : 'game-ctrl-btn'),
        on: { click: function () { vm.toggleAutoPlay(); } }
      }, [
        h('text', { staticStyle: S('game-ctrl-btn-title') }, vm.autoPlay ? '■ 停止' : '▶ 自动'),
        h('text', { staticStyle: S(vm.autoPlay ? 'game-ctrl-btn-sub-active' : 'game-ctrl-btn-sub') }, 'AUTO')
      ]),

      // (3) 快进
      h('div', {
        staticStyle: S(vm.skipMode ? 'game-ctrl-btn game-ctrl-btn-active' : 'game-ctrl-btn'),
        on: { click: function () { vm.toggleSkipMode(); } }
      }, [
        h('text', { staticStyle: S('game-ctrl-btn-title') }, vm.skipMode ? '■ 停止' : '» 快进'),
        h('text', { staticStyle: S(vm.skipMode ? 'game-ctrl-btn-sub-active' : 'game-ctrl-btn-sub') }, 'SKIP')
      ]),

      // (4) 菜单
      h('div', {
        staticStyle: S('game-ctrl-btn'),
        on: { click: function () { vm.openGameModal('menu'); } }
      }, [
        h('text', { staticStyle: S('game-ctrl-btn-title') }, '≡ 菜单'),
        h('text', { staticStyle: S('game-ctrl-btn-sub') }, 'MENU')
      ])
    ])
  ];

  // 转场特效覆盖层
  var blackOpacity = Number(vm.fxBlack) || 0;
  if (blackOpacity > 0.01) {
    children.push(h('div', {
      staticStyle: S('game-fx-black', {
        backgroundColor: '#000000',
        opacity: blackOpacity
      })
    }));
  }
  var whiteOpacity = Number(vm.fxWhite) || 0;
  if (whiteOpacity > 0.01) {
    children.push(h('div', {
      staticStyle: S('game-fx-white', {
        backgroundColor: '#ffffff',
        opacity: whiteOpacity
      })
    }));
  }

  // 全屏特写双翼缩放模式
  if (vm.zoomMode) {
    var z = GAME_ZOOM_LEVELS[vm.gameZoomIndex || 0];
    var gImgLeft = Math.round((664 - z.w) / 2 + (vm.gameImgPanX || 0));
    var gImgTop = Math.round((220 - z.h) / 2 + (vm.gameImgPanY || 0));

    children.push(
      h('div', { staticStyle: S('game-zoom-overlay') }, [
        // 左翼控制栏 (宽 68px: 退出特写)
        h('div', { staticStyle: S('game-zoom-left-wing') }, [
          h('div', {
            staticStyle: S('game-zoom-wing-btn-exit'),
            on: { click: function (event) { if (event && event.stopPropagation) event.stopPropagation(); vm.toggleZoom(); } }
          }, [
            h('text', { staticStyle: S('game-zoom-wing-btn-text') }, '退出\n特写')
          ])
        ]),

        // 中间大图视口 (宽 664px)
        h('div', {
          staticStyle: S('game-zoom-viewport'),
          on: {
            click: function () { vm.cycleGameZoom(); },
            touchstart: function (event) { vm.onGameZoomStart(event); },
            touchmove: function (event) { vm.onGameZoomMove(event); },
            touchend: function () { vm.onGameZoomEnd(); }
          }
        }, [
          bgSrc ? h('image', {
            staticStyle: S('game-zoom-img', {
              left: gImgLeft + 'px',
              top: gImgTop + 'px',
              width: z.w + 'px',
              height: z.h + 'px'
            }),
            attrs: { src: bgSrc, resize: 'contain' }
          }) : null,
          sdSrc ? h('image', {
            staticStyle: S('game-zoom-sd', {
              left: gImgLeft + 'px',
              top: gImgTop + 'px',
              width: z.w + 'px',
              height: z.h + 'px'
            }),
            attrs: { src: sdSrc, resize: 'contain' }
          }) : null,
          fgSrc ? h('image', {
            staticStyle: S('game-zoom-char', {
              left: gImgLeft + 'px',
              top: gImgTop + 'px',
              width: z.w + 'px',
              height: z.h + 'px'
            }),
            attrs: { src: fgSrc, resize: 'contain' }
          }) : null,

          // 顶部场景标题
          h('div', { staticStyle: S('game-zoom-header') }, [
            h('text', { staticStyle: S('game-zoom-header-text') }, '◆ 舞台特写 · ' + currentChapter + ' ◆')
          ])
        ]),

        // 右翼控制栏 (宽 68px: 缩放与重置)
        h('div', { staticStyle: S('game-zoom-right-wing') }, [
          h('div', {
            staticStyle: S('game-zoom-wing-btn'),
            on: { click: function () { vm.zoomInGameImg(); } }
          }, [
            h('text', { staticStyle: S('game-zoom-wing-btn-text') }, '+ 放大')
          ]),
          h('div', { staticStyle: S('game-zoom-wing-badge') }, [
            h('text', { staticStyle: S('game-zoom-wing-badge-text') }, z.label)
          ]),
          h('div', {
            staticStyle: S('game-zoom-wing-btn'),
            on: { click: function () { vm.zoomOutGameImg(); } }
          }, [
            h('text', { staticStyle: S('game-zoom-wing-btn-text') }, '- 缩小')
          ]),
          h('div', {
            staticStyle: S('game-zoom-wing-btn'),
            on: { click: function () { vm.resetGameZoom(); } }
          }, [
            h('text', { staticStyle: S('game-zoom-wing-btn-text') }, '重置')
          ])
        ])
      ])
    );
  }

  // 选项弹层
  if (vm.activeChoice && vm.activeChoice.options) {
    var opts = vm.activeChoice.options;
    var optVnodes = [];
    for (var oi = 0; oi < opts.length; oi++) {
      (function (opt) {
        optVnodes.push(h('div', {
          staticStyle: S('game-choice-option'),
          on: { click: function () { vm.selectChoiceOption(opt); } }
        }, [
          h('text', { staticStyle: S('game-choice-option-index') }, (oi + 1) + '.'),
          h('text', { staticStyle: S('game-choice-option-text') }, opt.text)
        ]));
      })(opts[oi]);
    }
    children.push(h('div', { staticStyle: S('game-choice-mask') }, [
      h('div', { staticStyle: S('game-choice-panel') }, [
        h('div', { staticStyle: S('game-choice-header') }, [
          h('text', { staticStyle: S('game-choice-title') }, '请选择接下来的行动'),
          h('text', { staticStyle: S('game-choice-notice') }, '轻触选项继续剧情')
        ]),
        h('text', { staticStyle: S('game-choice-prompt') }, vm.activeChoice.prompt || '面对此刻，你的心意是……'),
        h('div', { staticStyle: S('game-choice-options') }, optVnodes)
      ])
    ]));
  }

  // 结局展示弹层
  if (vm.normalEnd) {
    var endTitle = 'NORMAL END';
    var endSub = '本线已通关，相关结局与素材已解锁';
    var endBtnText = '返回标题';

    if (vm.currentScenario === 'nene') {
      endTitle = 'NORMAL END';
      endSub = '绫地宁宁 · 告别与遗忘 —— 已解锁【二周目重启 RESTART】与时空回溯';
      endBtnText = '返回主菜单 (开启二周目)';
    } else if (vm.currentScenario === 'nene_restart') {
      endTitle = 'TRUE END';
      endSub = '绫地宁宁 · 奇迹重逢 —— 真结局达成，已解锁【日后谈 AFTER】';
      endBtnText = '返回主菜单';
    }

    children.push(h('div', { staticStyle: S('game-normal-end') }, [
      h('text', { staticStyle: S('game-normal-end-kicker') }, '◆ 物语终章 ◆'),
      h('text', { staticStyle: S('game-normal-end-title') }, endTitle),
      h('text', { staticStyle: S('game-normal-end-sub') }, endSub),
      h('div', {
        staticStyle: S('game-normal-end-btn'),
        on: { click: function () { vm.exitToTitle(); } }
      }, [
        h('text', { staticStyle: S('game-normal-end-btn-text') }, endBtnText)
      ])
    ]));
  }

  // 系统菜单浮层
  if (vm.modalType === 'menu') {
    function menuBtn(title, sub, handler) {
      return h('div', {
        staticStyle: S('game-menu-action-btn'),
        on: { click: handler }
      }, [
        h('text', { staticStyle: S('game-menu-action-title') }, title),
        h('text', { staticStyle: S('game-menu-action-sub') }, sub)
      ]);
    }

    var modalContent = h('div', { staticStyle: S('game-menu-grid') }, [
      h('div', { staticStyle: S('game-menu-row') }, [
        menuBtn('回退上一句', 'PREV LINE', function () { vm.prevLine(); }),
        menuBtn('跳至选项', 'NEXT CHOICE', function () { vm.jumpToNextChoice(); }),
        menuBtn('历史对话', 'BACKLOG', function () { vm.openHistoryModal(); })
      ]),
      h('div', { staticStyle: S('game-menu-row') }, [
        menuBtn('保存进度', 'SAVE GAME', function () { vm.openGameModal('save'); }),
        menuBtn('读取进度', 'LOAD GAME', function () { vm.openGameModal('load'); }),
        menuBtn('返回标题', 'RETURN TITLE', function () { vm.exitToTitle(); })
      ]),
      h('text', { staticStyle: S('game-menu-notice') }, vm.menuNotice || ' ')
    ]);

    children.push(
      h('div', { staticStyle: S('game-modal-mask') }, [
        h('div', { staticStyle: S('game-modal-card') }, [
          h('div', { staticStyle: S('game-modal-header') }, [
            h('text', { staticStyle: S('game-modal-title') }, '≡ 系统菜单 ≡'),
            h('div', {
              staticStyle: S('game-modal-close-btn'),
              on: { click: function () { vm.closeGameModal(); } }
            }, [
              h('text', { staticStyle: S('game-modal-close-text') }, '✕')
            ])
          ]),
          modalContent
        ])
      ])
    );
  }

  // 历史对话浮层 (Backlog)
  if (vm.modalType === 'history' || vm.modalType === 'log') {
    var history = vm.historyList || [];
    var curIdx = history.length - 1;
    var focusIdx = Math.min(curIdx, Math.max(0, vm.historyFocusIndex || 0));
    var endIdx = focusIdx;
    var startIdx = Math.max(0, endIdx - 1);

    var historyItems = [];
    for (var hIdx = startIdx; hIdx <= endIdx; hIdx++) {
      (function (idx) {
        var hRow = history[idx];
        if (!hRow) return;
        var isLatest = (idx === curIdx);
        var hSpeaker = hRow.speaker;
        var hText = hRow.text;
        var hVoice = hRow.voice;

        var itemStyle = 'game-history-item';
        if (isLatest) itemStyle += ' game-history-item-latest';

        historyItems.push(
          h('div', {
            key: 'h_' + idx,
            staticStyle: S(itemStyle)
          }, [
            h('div', { staticStyle: S('game-history-main') }, [
              h('div', { staticStyle: S('game-history-item-head') }, [
                hSpeaker ? h('text', { staticStyle: S('game-history-speaker') }, '【' + hSpeaker + '】') : h('text', { staticStyle: S('game-history-speaker-narration') }, '【独 白】'),
                isLatest ? h('text', { staticStyle: S('game-history-latest-tag') }, ' 最新 ') : null,
                h('text', { staticStyle: S('game-history-line-num') }, '#' + (idx + 1))
              ]),
              h('text', { staticStyle: S('game-history-text') }, hText || '')
            ]),
            hVoice ? h('div', {
              staticStyle: S('game-history-voice-btn'),
              on: { click: function () { vm.playHistoryVoice(hVoice); } }
            }, [
              h('text', { staticStyle: S('game-history-voice-text') }, '♪ 重听')
            ]) : null
          ])
        );
      })(hIdx);
    }

    var rangeStr = '共 ' + (curIdx + 1) + ' 句 · 正在浏览 第 ' + (startIdx + 1) + ' ~ ' + (endIdx + 1) + ' 句';

    children.push(
      h('div', { staticStyle: S('game-modal-mask') }, [
        h('div', { staticStyle: S('game-history-card') }, [
          h('div', { staticStyle: S('game-history-header') }, [
            h('div', { staticStyle: S('game-history-title-box') }, [
              h('text', { staticStyle: S('game-history-title') }, '◆ 历史对话 BACKLOG ◆'),
              h('text', { staticStyle: S('game-history-sub') }, rangeStr)
            ]),
            h('div', {
              staticStyle: S('game-modal-close-btn'),
              on: { click: function () { vm.closeGameModal(); } }
            }, [
              h('text', { staticStyle: S('game-modal-close-text') }, '✕ 返回')
            ])
          ]),
          h('div', { staticStyle: S('game-history-viewport') }, [
            h('div', { staticStyle: S('game-history-list') }, historyItems)
          ]),
          h('div', { staticStyle: S('game-history-footer') }, [
            h('text', { staticStyle: S('game-history-tip') }, '点击上下按钮翻看历史 · 点击重听再听一次语音'),
            h('div', { staticStyle: S('game-history-navs') }, [
              h('div', {
                staticStyle: S('game-history-nav-btn'),
                on: { click: function () { vm.scrollHistoryUp(); } }
              }, [
                h('text', { staticStyle: S('game-history-nav-text') }, '▲ 上页')
              ]),
              h('div', {
                staticStyle: S('game-history-nav-btn'),
                on: { click: function () { vm.scrollHistoryDown(); } }
              }, [
                h('text', { staticStyle: S('game-history-nav-text') }, '▼ 下页')
              ])
            ])
          ])
        ])
      ])
    );
  }

  // 存读档弹层 (DATA SAVE / DATA LOAD)
  if (vm.modalType === 'save' || vm.modalType === 'load') {
    var isSave = vm.modalType === 'save';
    var page = vm.savePage || 0;
    var totalPages = 5;
    var pageStr = '000' + (page + 1) + ' / 000' + totalPages;
    var mSaves = vm.modalSaves || {};
    var selSlot = vm.selectedSlot || (page * 6 + 1);

    var selItem = mSaves['slot' + selSlot];
    var selBg = resolveSlotThumbnail(selItem, 'sanoba_witch');
    var selDate = selItem && selItem.time ? selItem.time : '——';
    var selChapter = formatChapter(selItem && selItem.chapter ? selItem.chapter : currentChapter);
    var selComment = selItem ? (selItem.speaker ? '【' + selItem.speaker + '】' : '') + selItem.text : 'NO DATA';

    var slotCards = [];
    var startNum = page * 6 + 1;
    for (var i = 0; i < 6; i++) {
      (function (slotNum) {
        var it = mSaves['slot' + slotNum];
        var codeStr = 's000' + (page + 1) + '-' + (slotNum < 10 ? '0' + slotNum : '' + slotNum);
        var timeStr = it && it.time ? it.time : '';
        var bgPath = resolveSlotThumbnail(it, 'sanoba_witch');
        var descStr = it ? (it.speaker ? '【' + it.speaker + '】' : '') + it.text : 'NO DATA';
        var isCurrentSelected = selSlot === slotNum;
        var cardClass = 'saveload-slot-card';
        if (isCurrentSelected) cardClass += ' saveload-slot-card-active';
        if (it) cardClass += ' saveload-slot-card-hasdata';

        slotCards.push(
          h('div', {
            staticStyle: S(cardClass),
            on: { click: function () { vm.selectSlotItem(slotNum); } }
          }, [
            h('div', { staticStyle: S('saveload-slot-header') }, [
              h('text', { staticStyle: S('saveload-slot-code') }, codeStr),
              h('text', { staticStyle: S('saveload-slot-time') }, timeStr)
            ]),
            h('div', { staticStyle: S('saveload-slot-body') }, [
              bgPath ? h('image', {
                staticStyle: S('saveload-slot-body-img'),
                attrs: { src: bgPath, resize: 'contain' }
              }) : h('text', { staticStyle: S('saveload-slot-noimage') }, 'NO IMAGE')
            ]),
            h('div', { staticStyle: S('saveload-slot-footer') }, [
              h('text', { staticStyle: S('saveload-slot-desc') }, descStr.substring(0, 16))
            ])
          ])
        );
      })(startNum + i);
    }

    children.push(
      h('div', { staticStyle: S('saveload-root') }, [
        h('div', { staticStyle: S('saveload-header') }, [
          h('div', { staticStyle: S('saveload-title-box') }, [
            h('text', { staticStyle: S('saveload-title-cloud') }, '✧'),
            h('text', { staticStyle: S('saveload-title-text') }, isSave ? 'DATA SAVE' : 'DATA LOAD')
          ]),
          h('div', { staticStyle: S('saveload-header-right') }, [
            h('div', { staticStyle: S('saveload-mode-tabs') }, [
              h('div', { staticStyle: S('saveload-mode-tab saveload-mode-tab-active') }, [
                h('div', { staticStyle: S('saveload-mode-dot') }),
                h('text', { staticStyle: S('saveload-mode-text-active') }, isSave ? '保存物语' : '读取物语')
              ])
            ]),
            h('div', { staticStyle: S('saveload-pager') }, [
              h('div', {
                staticStyle: S('saveload-pager-btn'),
                on: { click: function () { vm.changeSavePage(-1); } }
              }, [
                h('text', { staticStyle: S('saveload-pager-btn-text') }, '‹')
              ]),
              h('text', { staticStyle: S('saveload-pager-text') }, pageStr),
              h('div', {
                staticStyle: S('saveload-pager-btn'),
                on: { click: function () { vm.changeSavePage(1); } }
              }, [
                h('text', { staticStyle: S('saveload-pager-btn-text') }, '›')
              ])
            ]),
            h('div', {
              staticStyle: S('saveload-header-close-btn'),
              on: { click: function () { vm.closeGameModal(); } }
            }, [
              h('text', { staticStyle: S('saveload-header-close-text') }, '返回游戏')
            ])
          ])
        ]),

        h('div', { staticStyle: S('saveload-body') }, [
          h('div', { staticStyle: S('saveload-left-pane') }, [
            h('div', { staticStyle: S('saveload-preview-box') }, [
              selBg ? h('image', {
                staticStyle: S('saveload-preview-img'),
                attrs: { src: selBg, resize: 'contain' }
              }) : h('text', { staticStyle: S('saveload-preview-noimage') }, 'NO IMAGE')
            ]),
            h('div', { staticStyle: S('saveload-info-card') }, [
              h('div', { staticStyle: S('saveload-info-row') }, [
                h('text', { staticStyle: S('saveload-info-label') }, 'DATE :'),
                h('text', { staticStyle: S('saveload-info-val') }, selDate)
              ]),
              h('div', { staticStyle: S('saveload-info-row') }, [
                h('text', { staticStyle: S('saveload-info-label') }, 'CHAPTER :'),
                h('text', { staticStyle: S('saveload-info-val') }, selChapter)
              ]),
              h('div', { staticStyle: S('saveload-info-row') }, [
                h('text', { staticStyle: S('saveload-info-label') }, 'COMMENT :'),
                h('text', { staticStyle: S('saveload-info-val') }, selComment.substring(0, 18))
              ])
            ])
          ]),
          h('div', { staticStyle: S('saveload-right-grid') }, slotCards)
        ]),

        h('div', { staticStyle: S('saveload-bottom-bar') }, [
          h('text', { staticStyle: S('saveload-bottom-tip') }, vm.saveNotice || (isSave ? '✦ 轻触槽位卡片保存当前剧情进度 ✦' : '✦ 轻触有存档记录的槽位卡片载入游戏 ✦'))
        ])
      ])
    );
  }

  return h('div', { staticStyle: S('game-root') }, children);
}
