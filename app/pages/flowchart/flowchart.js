// pages/flowchart/flowchart.js —— 《魔女的夜宴》7大路线拓扑流程图
import { S, log } from '../../common.js';
import { flowchart_data } from '../../data/flowchart_data.js';

var FC_VIEW_WIDTH = 688;
var FC_VIEW_HEIGHT = 152;
var FC_CARD_WIDTH = 152;
var FC_CARD_HEIGHT = 40;
var FC_STEP_X = 168;
var FC_STEP_Y = 46;
var FC_COLUMNS = 4;

var FC_CHOICE_MAP = {};
var FC_DISPLAY_MAP = {};
var FC_EDGES = [];
var FC_ROUTES = ['共通', '宁宁', '宁宁·重启', '巡', '紬', '憧子', '和奏'];

var ROUTE_TO_KEY = {
  '共通': 'main',
  '宁宁': 'nene',
  '宁宁·重启': 'nene_restart',
  '巡': 'meguru',
  '紬': 'tsumugi',
  '憧子': 'touko',
  '和奏': 'wakana'
};

var KEY_TO_ROUTE = {
  'main': '共通',
  'nene': '宁宁',
  'nene_restart': '宁宁·重启',
  'meguru': '巡',
  'tsumugi': '紬',
  'touko': '憧子',
  'wakana': '和奏'
};

var allNodes = flowchart_data.nodes || [];
var allChoices = flowchart_data.choices || [];

for (var fc_j = 0; fc_j < allChoices.length; fc_j++) {
  var choice = allChoices[fc_j];
  // dummyselect IDs repeat in different scripts, even within a single route.
  FC_CHOICE_MAP[(choice.route || 'main') + ':' + choice.targetLine] = choice;
}

var FC_DISPLAY_NODES = [];
for (var fcDispI = 0; fcDispI < allNodes.length; fcDispI++) {
  var nd = allNodes[fcDispI];
  var rKey = nd.route || 'main';
  var display = {
    id: nd.id,
    route: KEY_TO_ROUTE[rKey] || rKey,
    chapter: nd.chapter || 'CHAPTER 1-1',
    title: nd.title || nd.id,
    type: nd.type || 'normal',
    targetLine: nd.targetLine !== undefined ? nd.targetLine : 0,
    scenario: nd.scenario || (flowchart_data.routeScenario || {})[rKey] || rKey,
    next: nd.next,
    chain: (flowchart_data.chain || {})[nd.id],
    choice: FC_CHOICE_MAP[rKey + ':' + nd.targetLine]
  };
  FC_DISPLAY_NODES.push(display);
  FC_DISPLAY_MAP[display.id] = display;
}

// Choices absent from the major-node overview remain accessible. Their line
// order is navigation only: it does not imply an undocumented story edge.
for (var fcChoiceI = 0; fcChoiceI < allChoices.length; fcChoiceI++) {
  var extraChoice = allChoices[fcChoiceI];
  var choiceRoute = extraChoice.route || 'main';
  var foundChoice = false;
  for (var fcMatchI = 0; fcMatchI < FC_DISPLAY_NODES.length; fcMatchI++) {
    if (FC_DISPLAY_NODES[fcMatchI].choice === extraChoice) foundChoice = true;
  }
  if (!foundChoice) {
    var choiceNode = {
      id: 'choice:' + choiceRoute + ':' + extraChoice.targetLine,
      route: KEY_TO_ROUTE[choiceRoute] || choiceRoute,
      chapter: '选择支 · ' + extraChoice.targetLine,
      title: '剧情选择 · ' + extraChoice.targetLine,
      type: 'select',
      targetLine: extraChoice.targetLine,
      scenario: (flowchart_data.routeScenario || {})[choiceRoute] || choiceRoute,
      choice: extraChoice
    };
    FC_DISPLAY_NODES.push(choiceNode);
    FC_DISPLAY_MAP[choiceNode.id] = choiceNode;
  }
}
// The major-node table only stores one or two milestones for some routes.
// Add their real chapter anchors from the transcoded scenario map so a route
// is a readable path rather than a lone "end" card.
function fcPrettyChapter(value) {
  return String(value || '').replace(/^chapter[\s\u3000]*/i, '').replace(/^[\s\u3000]+/, '').trim();
}

function fcAddChapterNodes(routeKey, routeName) {
  var prefix = routeKey + '_chapter';
  var chapterStart = flowchart_data.chapterStart || {};
  var existing = {};
  var existingMax = -1;
  for (var i = 0; i < FC_DISPLAY_NODES.length; i++) {
    if (FC_DISPLAY_NODES[i].scenario === routeKey) {
      existing[FC_DISPLAY_NODES[i].targetLine] = true;
      existingMax = Math.max(existingMax, FC_DISPLAY_NODES[i].targetLine);
    }
  }
  var added = [];
  var keys = Object.keys(chapterStart).sort(function (a, b) {
    return chapterStart[a] - chapterStart[b];
  });
  for (var k = 0; k < keys.length; k++) {
    var key = keys[k];
    if (key.indexOf(prefix) !== 0) continue;
    var line = chapterStart[key];
    if (typeof line !== 'number' || existing[line]) continue;
    var label = fcPrettyChapter(key.slice(prefix.length));
    if (!label) continue;
    var node = {
      id: 'chapter_node:' + routeKey + ':' + line,
      route: routeName,
      chapter: label,
      title: label + ' 章',
      type: 'chapter',
      targetLine: line,
      scenario: routeKey,
      next: null
    };
    existing[line] = true;
    added.push(node);
    FC_DISPLAY_NODES.push(node);
    FC_DISPLAY_MAP[node.id] = node;
  }
  added.sort(function (a, b) { return a.targetLine - b.targetLine; });
  for (var a = 0; a < added.length; a++) {
    if (a + 1 < added.length) added[a].next = added[a + 1].id;
    else if (existingMax > added[a].targetLine) {
      for (var j = 0; j < FC_DISPLAY_NODES.length; j++) {
        if (FC_DISPLAY_NODES[j].scenario === routeKey && FC_DISPLAY_NODES[j].targetLine > added[a].targetLine) {
          added[a].next = FC_DISPLAY_NODES[j].id;
          break;
        }
      }
    }
  }
}

var fcSparseRoutes = ['meguru', 'tsumugi', 'touko', 'wakana'];
for (var fcSparseI = 0; fcSparseI < fcSparseRoutes.length; fcSparseI++) {
  var fcSparseKey = fcSparseRoutes[fcSparseI];
  fcAddChapterNodes(fcSparseKey, KEY_TO_ROUTE[fcSparseKey]);
}

FC_DISPLAY_NODES.sort(function (a, b) {
  return FC_ROUTES.indexOf(a.route) - FC_ROUTES.indexOf(b.route) || a.targetLine - b.targetLine;
});

for (var fcEdgeI = 0; fcEdgeI < FC_DISPLAY_NODES.length; fcEdgeI++) {
  var source = FC_DISPLAY_NODES[fcEdgeI];
  var targets = [source.next, source.chain];
  for (var fcTargetI = 0; fcTargetI < targets.length; fcTargetI++) {
    var target = targets[fcTargetI];
    if (target && FC_DISPLAY_MAP[target] && (fcTargetI === 0 || target !== targets[0])) {
      FC_EDGES.push({ from: source.id, to: target, kind: 'next' });
    }
  }
}

function fcChapters(routeName) {
  var seen = {};
  var list = [];
  for (var i = 0; i < FC_DISPLAY_NODES.length; i++) {
    var n = FC_DISPLAY_NODES[i];
    if (n.route === routeName && !seen[n.chapter]) {
      seen[n.chapter] = true;
      list.push(n.chapter);
    }
  }
  return list.length ? list : ['CHAPTER 1-1'];
}

function fcClamp(val, min, max) {
  if (val < min) return min;
  if (val > max) return max;
  return val;
}

function fcOptionNode(source, option, index) {
  var target = FC_DISPLAY_MAP[option.targetNode];
  if (target) return target;
  var scenario = option.scenario || option.route || source.scenario;
  var line = option.targetLine;
  if (typeof line !== 'number' && option.targetNode) {
    var label = option.targetNode.replace(/^\*/, '');
    var labelKey = (scenario === 'main' ? '' : scenario + '_') + label;
    line = (flowchart_data.chapterStart || {})[labelKey];
  }
  var unresolved = typeof line !== 'number';
  return {
    id: source.id + ':option:' + index,
    route: KEY_TO_ROUTE[scenario] || source.route,
    chapter: source.chapter,
    title: option.text || ('选项 ' + (index + 1)),
    type: 'branch',
    targetLine: unresolved ? source.targetLine : line,
    scenario: unresolved ? source.scenario : scenario,
    choiceReturn: unresolved,
    optionIndex: index + 1
  };
}

function fcLayout(nodes) {
  var placed = {};
  var order = [];
  var local = {};
  var edges = [];
  function add(node, bridge) {
    if (placed[node.id]) return;
    placed[node.id] = { node: node, bridge: bridge, rank: 0, degree: 0, x: 0, y: 0 };
    order.push(node.id);
  }
  for (var i = 0; i < nodes.length; i++) {
    local[nodes[i].id] = true;
    add(nodes[i], false);
  }
  // Keep the route graph readable: choice options belong to the in-game
  // chooser, not to this overview. A choice milestone itself is the node that
  // jumps to the question; fanning out every option made a grid of duplicate
  // "返回选择" cards and obscured the actual route.
  // Keep both incoming and outgoing chapter/route boundaries as clickable
  // endpoint cards. Do not sever the graph when applying a chapter filter.
  for (var e = 0; e < FC_EDGES.length; e++) {
    var edge = FC_EDGES[e];
    if (!local[edge.from] && !local[edge.to]) continue;
    add(FC_DISPLAY_MAP[edge.from], !local[edge.from]);
    add(FC_DISPLAY_MAP[edge.to], !local[edge.to]);
    edges.push(edge);
  }
  for (var d = 0; d < edges.length; d++) placed[edges[d].to].degree++;
  var queue = [];
  for (var q = 0; q < order.length; q++) {
    if (!placed[order[q]].degree) queue.push(order[q]);
  }
  // Kahn ranks come only from declared edges, not input array positions.
  for (var cursor = 0; cursor < queue.length; cursor++) {
    var id = queue[cursor];
    for (var k = 0; k < edges.length; k++) {
      if (edges[k].from !== id) continue;
      var next = placed[edges[k].to];
      next.rank = Math.max(next.rank, placed[id].rank + 1);
      next.degree--;
      if (!next.degree) queue.push(edges[k].to);
    }
  }
  var width = FC_VIEW_WIDTH;
  var height = FC_VIEW_HEIGHT;
  var maxRow = 0;
  for (var p = 0; p < order.length; p++) {
    var item = placed[order[p]];
    var rank = Math.max(0, item.rank || 0);
    var row = Math.floor(rank / FC_COLUMNS);
    var col = row % 2 === 0 ? rank % FC_COLUMNS : FC_COLUMNS - 1 - (rank % FC_COLUMNS);
    item.x = 12 + col * FC_STEP_X;
    item.y = 8 + row * FC_STEP_Y;
    maxRow = Math.max(maxRow, row);
    width = Math.max(width, 12 + FC_COLUMNS * FC_STEP_X);
    height = Math.max(height, 8 + (maxRow + 1) * FC_STEP_Y);
  }
  var hasNext = false;
  for (var n = 0; n < edges.length; n++) {
    if (edges[n].kind === 'next' && local[edges[n].from]) hasNext = true;
  }
  return { placed: placed, order: order, edges: edges, width: width, height: height, hasNext: hasNext };
}

function fcRefreshLayout(vm) {
  var nodes = vm.getFcChapterNodes();
  var layout = fcLayout(nodes);
  vm._fcLayout = layout;
  vm.flowPanMaxX = Math.max(0, layout.width - FC_VIEW_WIDTH);
  vm.flowPanMaxY = Math.max(0, layout.height - FC_VIEW_HEIGHT);
  vm.flowPanX = fcClamp(Number(vm.flowPanX) || 0, -vm.flowPanMaxX, 0);
  vm.flowPanY = fcClamp(Number(vm.flowPanY) || 0, -vm.flowPanMaxY, 0);
}

function fcEnsure(vm) {
  if (FC_ROUTES.indexOf(vm.flowRoute) < 0) vm.flowRoute = '共通';
  var chs = fcChapters(vm.flowRoute);
  vm.flowChapterIndex = fcClamp(Number(vm.flowChapterIndex) || 0, 0, Math.max(0, chs.length - 1));
  if (typeof vm.flowNotice !== 'string') vm.flowNotice = '轻触卡片跳转剧情节点';
}

function fcTypeName(type) {
  if (type === 'select') return '选项';
  if (type === 'branch') return '分歧';
  if (type === 'warp') return '轮回';
  if (type === 'chapter') return '章节';
  return '剧情';
}

export var flowchartMethods = {
  initFlowchart: function () {
    this.flowPanX = 0;
    this.flowPanY = 0;
    this.flowRoute = '共通';
    this.flowChapterIndex = 0;
    this.flowSelectedNodeId = null;
    this.flowNotice = '轻触节点跳转剧情；右侧切换路线';
    this._fcStartX = 0;
    this._fcStartY = 0;
    this._fcStartPanX = 0;
    this._fcStartPanY = 0;
    this._fcMoved = false;
    this._fcTouchActive = false;
    fcRefreshLayout(this);
  },
  getFcChapters: function () {
    fcEnsure(this);
    return fcChapters(this.flowRoute);
  },
  getFcChapterNodes: function () {
    fcEnsure(this);
    var nodes = [];
    for (var i = 0; i < FC_DISPLAY_NODES.length; i++) {
      if (FC_DISPLAY_NODES[i].route === this.flowRoute) nodes.push(FC_DISPLAY_NODES[i]);
    }
    return nodes;
  },
  getFcRouteNodes: function () {
    return this.getFcChapterNodes();
  },
  selectFcRoute: function (route) {
    if (FC_ROUTES.indexOf(route) < 0) return;
    this.flowRoute = route;
    this.flowChapterIndex = 0;
    this.flowSelectedNodeId = null;
    this.flowNotice = route + '线 · ' + this.getFcChapterNodes().length + ' 个节点';
    this.resetFcPan();
    fcRefreshLayout(this);
  },
  setFcChapter: function (index) {
    // Kept for callers that still jump to a chapter; the visible graph now
    // always shows the whole route, so this only focuses the viewport.
    fcEnsure(this);
    var count = fcChapters(this.flowRoute).length;
    this.flowChapterIndex = fcClamp(Number(index) || 0, 0, Math.max(0, count - 1));
    this.flowSelectedNodeId = null;
    this.flowNotice = '章节：' + fcChapters(this.flowRoute)[this.flowChapterIndex];
    this.resetFcPan();
    fcRefreshLayout(this);
  },
  selectFcChapter: function (chapter) {
    var index = this.getFcChapters().indexOf(chapter);
    if (index >= 0) this.setFcChapter(index);
  },
  prevFcChapter: function () {
    this.setFcChapter(this.flowChapterIndex - 1);
  },
  nextFcChapter: function () {
    this.setFcChapter(this.flowChapterIndex + 1);
  },
  activateFcNode: function (node) {
    if (!node || this._fcMoved) return;
    this.flowSelectedNodeId = node.id;
    var line = typeof node.targetLine === 'number' ? node.targetLine : 0;
    var scenario = node.scenario || ROUTE_TO_KEY[node.route] || 'main';
    log('flowchart node jump to: ' + scenario + ' line=' + line);
    this.jumpFromFlowchart(scenario, line);
  },
  onFcTouchStart: function (e) {
    if (e && e.changedTouches && e.changedTouches[0]) {
      var t = e.changedTouches[0];
      this._fcStartX = typeof t.pageX === 'number' ? t.pageX : (t.clientX || 0);
      this._fcStartY = typeof t.pageY === 'number' ? t.pageY : (t.clientY || 0);
      this._fcStartPanX = this.flowPanX || 0;
      this._fcStartPanY = this.flowPanY || 0;
      this._fcMoved = false;
      this._fcTouchActive = true;
    }
  },
  onFcTouchMove: function (e) {
    if (this._fcTouchActive && e && e.changedTouches && e.changedTouches[0]) {
      var t = e.changedTouches[0];
      var cx = typeof t.pageX === 'number' ? t.pageX : (t.clientX || 0);
      var cy = typeof t.pageY === 'number' ? t.pageY : (t.clientY || 0);
      var dx = cx - this._fcStartX;
      var dy = cy - this._fcStartY;
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) this._fcMoved = true;
      this.flowPanX = fcClamp(this._fcStartPanX + dx, -(this.flowPanMaxX || 0), 0);
      this.flowPanY = fcClamp(this._fcStartPanY + dy, -(this.flowPanMaxY || 0), 0);
    }
  },
  onFcTouchEnd: function (e) {
    this.onFcTouchMove(e);
    this._fcTouchActive = false;
    // Native click can arrive much later than touchend. Only a fresh touch
    // starts a new tap; a timer must not re-enable the previous drag's click.
  },
  onFcTouchCancel: function () {
    this._fcTouchActive = false;
    this._fcMoved = true;
  },
  panFcBy: function (dx, dy) {
    this.flowPanX = fcClamp((this.flowPanX || 0) + dx, -(this.flowPanMaxX || 0), 0);
    this.flowPanY = fcClamp((this.flowPanY || 0) + dy, -(this.flowPanMaxY || 0), 0);
  },
  resetFcPan: function () {
    this.flowPanX = 0;
    this.flowPanY = 0;
  },
  jumpFromFlowchart: function (scenario, line) {
    if (typeof scenario !== 'string' || !scenario) scenario = 'main';
    var l = typeof line === 'number' ? Math.floor(line) : 0;
    if (l < 0) l = 0;
    log('jump from flowchart to ' + scenario + ' line ' + l);
    this.currentScenario = scenario;
    this.currentScenarioData = null;
    this.view = 'game';
    if (typeof this.initGame === 'function') this.initGame(scenario, l);
  },
  returnToTitleFromFc: function () {
    this.view = 'title';
    if (typeof this.initTitle === 'function') this.initTitle();
  }
};

function fcText(h, style, value) {
  return h('text', { staticStyle: S(style) }, value);
}

function fcButton(h, style, label, action) {
  return h('div', { staticStyle: S(style), on: { click: action } }, [fcText(h, style + '-text', label)]);
}

function fcRenderNode(vm, h, placed) {
  var node = placed.node;
  var selected = vm.flowSelectedNodeId === node.id;
  var style = 'fc-node fc-node-' + node.type + (placed.bridge ? ' fc-node-bridge' : '') + (selected ? ' fc-node-selected' : '');
  var type = placed.bridge ? '接续·' + node.route : fcTypeName(node.type);
  if (node.optionIndex) type = node.optionIndex + (node.choiceReturn ? '·返回选择' : '·选项目标');
  return h('div', {
    key: node.id,
    staticStyle: S(style, {
      left: (placed.x + (vm.flowPanX || 0)) + 'px',
      top: (placed.y + (vm.flowPanY || 0)) + 'px'
    }),
    on: { click: function () { vm.activateFcNode(node); } }
  }, [
    h('div', { staticStyle: S('fc-node-top') }, [
      fcText(h, 'fc-node-type', type),
      fcText(h, 'fc-node-line', node.targetLine + '句')
    ]),
    fcText(h, 'fc-node-title', (placed.bridge ? node.chapter + ' · ' : '') + (node.title || node.id))
  ]);
}

// Native Falcon primitives only. Clip the segments numerically as well as at
// the viewport; logical graph extents never become native container sizes.
function fcRenderEdge(vm, h, edge, children) {
  var layout = vm._fcLayout;
  var from = layout.placed[edge.from];
  var to = layout.placed[edge.to];
  if (!from || !to) return;
  var panX = vm.flowPanX || 0;
  var panY = vm.flowPanY || 0;
  var fromCx = from.x + FC_CARD_WIDTH / 2 + panX;
  var fromCy = from.y + FC_CARD_HEIGHT / 2 + panY;
  var toCx = to.x + FC_CARD_WIDTH / 2 + panX;
  var toCy = to.y + FC_CARD_HEIGHT / 2 + panY;
  var key = edge.from + '>' + edge.to;
  var arrow = '→';
  var arrowX = toCx - 7;
  var arrowY = toCy - 7;

  function segment(x, y, width, height, cls, suffix) {
    var right = Math.min(FC_VIEW_WIDTH, x + width);
    var bottom = Math.min(FC_VIEW_HEIGHT, y + height);
    x = Math.max(0, x);
    y = Math.max(0, y);
    if (right <= x || bottom <= y) return;
    children.push(h('div', {
      key: key + suffix,
      staticStyle: S(cls, { left: x + 'px', top: y + 'px', width: (right - x) + 'px', height: (bottom - y) + 'px' })
    }));
  }

  if (Math.abs(fromCy - toCy) < 1) {
    // Same row: snake rows alternate direction.
    if (toCx >= fromCx) {
      segment(from.x + FC_CARD_WIDTH + panX, fromCy, to.x + panX - (from.x + FC_CARD_WIDTH + panX), 1, 'fc-edge-h', ':h');
    } else {
      segment(to.x + FC_CARD_WIDTH + panX, toCy, from.x + panX - (to.x + FC_CARD_WIDTH + panX), 1, 'fc-edge-h', ':h');
      arrow = '←';
      arrowX = to.x + FC_CARD_WIDTH + panX - 1;
    }
  } else if (Math.abs(fromCx - toCx) < 1) {
    // End of a snake row: connect the two row endpoints vertically.
    if (toCy > fromCy) {
      segment(fromCx, from.y + FC_CARD_HEIGHT + panY, 1, to.y + panY - (from.y + FC_CARD_HEIGHT + panY), 'fc-edge-v', ':v');
      arrow = '↓';
      arrowY = to.y + panY - 1;
      arrowX = toCx - 7;
    } else {
      segment(toCx, to.y + FC_CARD_HEIGHT + panY, 1, from.y + panY - (to.y + FC_CARD_HEIGHT + panY), 'fc-edge-v', ':v');
      arrow = '↑';
      arrowY = to.y + FC_CARD_HEIGHT + panY - 1;
      arrowX = toCx - 7;
    }
  } else {
    // Cross-route / bridge: orthogonal L path from the source bottom to target.
    segment(fromCx, from.y + FC_CARD_HEIGHT + panY, 1, toCy - (from.y + FC_CARD_HEIGHT + panY), 'fc-edge-v', ':v');
    segment(Math.min(fromCx, toCx), toCy, Math.abs(toCx - fromCx) + 1, 1, 'fc-edge-h', ':h');
    arrow = toCx >= fromCx ? '→' : '←';
    arrowX = toCx >= fromCx ? toCx - 7 : toCx + 1;
  }

  if (arrowX >= 0 && arrowX <= FC_VIEW_WIDTH - 10 && arrowY >= 0 && arrowY <= FC_VIEW_HEIGHT - 14) {
    children.push(h('text', {
      key: key + ':arrow', staticStyle: S('fc-arrow', { left: arrowX + 'px', top: arrowY + 'px' })
    }, arrow));
  }
  if (edge.kind === 'next' && from.node.route !== to.node.route) {
    var labelX = Math.max(0, Math.min(FC_VIEW_WIDTH - 48, toCx - 24));
    var labelY = Math.max(0, Math.min(FC_VIEW_HEIGHT - 12, toCy + 8));
    children.push(h('text', {
      key: key + ':label', staticStyle: S('fc-edge-label', { left: labelX + 'px', top: labelY + 'px' })
    }, '跨线'));
  }
}

export function renderFlowchart(vm, h) {
  fcEnsure(vm);
  if (!vm._fcLayout) fcRefreshLayout(vm);
  var layout = vm._fcLayout;
  var nodeCount = vm.getFcRouteNodes().length;

  var graphChildren = [];
  for (var e = 0; e < layout.edges.length; e++) fcRenderEdge(vm, h, layout.edges[e], graphChildren);
  for (var n = 0; n < layout.order.length; n++) {
    var p = layout.placed[layout.order[n]];
    var px = p.x + (vm.flowPanX || 0);
    var py = p.y + (vm.flowPanY || 0);
    if (px + FC_CARD_WIDTH > 0 && px < FC_VIEW_WIDTH && py + FC_CARD_HEIGHT > 0 && py < FC_VIEW_HEIGHT) {
      graphChildren.push(fcRenderNode(vm, h, p));
    }
  }

  var routeButtons = [];
  for (var r = 0; r < FC_ROUTES.length; r++) {
    (function (route) {
      routeButtons.push(h('div', {
        key: route,
        staticStyle: S(route === vm.flowRoute ? 'fc-route fc-route-active' : 'fc-route'),
        on: { click: function () { vm.selectFcRoute(route); } }
      }, [fcText(h, 'fc-route-text', route)]));
    })(FC_ROUTES[r]);
  }

  return h('div', { staticStyle: S('fc-root') }, [
    h('image', {
      staticStyle: S('fc-bg-img'),
      attrs: { src: 'file:///userdisk/gal_data/sanoba_witch/bg/title_bg_v3.png' }
    }),
    h('div', { staticStyle: S('fc-header') }, [
      fcText(h, 'fc-title', '剧情流程图'),
      fcText(h, 'fc-header-chapter', vm.flowRoute + '线 · ' + nodeCount + ' 个节点 · 拖动查看完整路线'),
      fcButton(h, 'fc-back', '返回标题', function () { vm.returnToTitleFromFc(); })
    ]),
    h('div', {
      staticStyle: S('fc-viewport'),
      on: {
        touchstart: function (event) { vm.onFcTouchStart(event); },
        touchmove: function (event) { vm.onFcTouchMove(event); },
        touchend: function (event) { vm.onFcTouchEnd(event); },
        touchcancel: function () { vm.onFcTouchCancel(); }
      }
    }, [
      h('div', { staticStyle: S('fc-canvas') }, graphChildren)
    ]),
    h('div', { staticStyle: S('fc-toolbar') }, [
      fcText(h, 'fc-notice', layout.hasNext ? '拖动 / 方向键查看连线；轻触节点跳转剧情' : '该路线数据仅提供这一处节点'),
      fcButton(h, 'fc-pan-button', '←', function () { vm.panFcBy(70, 0); }),
      fcButton(h, 'fc-pan-button', '→', function () { vm.panFcBy(-70, 0); }),
      fcButton(h, 'fc-pan-button', '↑', function () { vm.panFcBy(0, 45); }),
      fcButton(h, 'fc-pan-button', '↓', function () { vm.panFcBy(0, -45); }),
      fcButton(h, 'fc-reset', '复位', function () { vm.resetFcPan(); })
    ]),
    h('div', { staticStyle: S('fc-sidebar') }, [
      h('div', { staticStyle: S('fc-route-list') }, routeButtons),
      h('div', { staticStyle: S('fc-route-art') }, [
        fcText(h, 'fc-route-caption', vm.flowRoute)
      ])
    ])
  ]);
}
