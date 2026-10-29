# 《魔女的夜宴》词典笔移植：接力给 Gemini 4 的说明

日期：2026-10-29  
工程：`/Volumes/500GB/sanoba-witch-ydpen-port`  
设备：`9DA2200007506350`（有道词典笔，逻辑视口 800×220）  
本轮执行者：Qoder（继续修复标题二周目、个人线入口、选择支与流程图交互）

## 0. 先读这一节（边界）

- 当前工作树**有未提交修改**，是用户正在验收的版本，**不要** `git reset --hard`、`git clean`、`git checkout .` 或覆盖 `app/`。
- 修改前先备份：本目录同级的 `/Volumes/500GB/qoder_cache/sanoba_asset_handoff_20261029/ui_choice_restart.patch` 保存了本轮 diff；`game.choicefix.js`、`title.choicefix.js` 是本轮源码副本。
- 不要删除或改写用户存档/设置。设备上的 `settings.json`、`saves.json` 测试前已备份到 `/Volumes/500GB/qoder_cache/sanoba_asset_handoff_20261029/settings_before_restart_test.json` 与 `saves_before_choice_test.json`。
- 需要改设备测试数据时，先 pull 备份，测试后原样 push 回去；当前测试后已经恢复到 `clearedRoutes: []` 和空存档。
- 不要修改官方素材/剧本数据来“让测试过”。素材由另一个 Agent/用户负责。

## 1. 本轮已经完成并有真机证据

### 1.1 标题二周目
- 移除了“把新游戏替换成重启/新篇并直接进二周目”的做法。
- 现在主菜单始终有「开始游戏」；宁宁一周目已通关且二周目未通关时，额外出现独立的「重新开始 / RESTART」按钮（左侧第四个，带金色边框）。
- 顶部右上角保留「流程图」小入口；二周目按钮出现时流程图仍可访问。
- `startNewGame()` 固定从 `main` 开始；`startNeneRestart()` 单独进入 `nene_restart`。
- 关键文件：`app/pages/title/title.js:61`（startNewGame）、`:307`（开始游戏）、`:312`（restartButton）、`:396`（顶部流程图）；`app/root.js:62` 声明 `hasNeneCleared/hasNeneRestartCleared` 响应式字段。

真机截图（已读图确认）：
- `/Volumes/500GB/sanoba-witch-ydpen-port/test_results/multimodal_review/title_after_gallery_restart.png`：开始游戏 + 重新开始 + 右上流程图。
- `/Volumes/500GB/sanoba-witch-ydpen-port/test_results/multimodal_review/game_restart_clicked.png`：点击重新开始进入 `nene_restart` 第 0 句，章节 0-0，1/5507。

原版 `custom.ks` 的 `*restart_open`（约 329-353 行）星芒演出也已补上，见 1.6。原版 `sf.title_restart` 的一次性语义用 `settings.titleRestartSeen` 持久化；第二次进入标题不再重复播放。

### 1.2 选择支：四选项 + 右侧确认
- 选项不再“一点即生效”；点选项只高亮，右侧大按钮「✔ 确定选择 / CONFIRM」才执行。
- 未选中任何选项时，确认按钮半透明且不执行；选择后高亮金色边框。
- 面板 720×196，选项区 520px，最多 4 项；右侧确认按钮 148×86，避免 4 个按钮挤在一起误触。
- 图标：`choice_four_options_v2.png`、`choice_selected_v2.png`、`choice_confirm_result_v2.png`。
- 关键文件：`app/pages/game/game.js:618`（highlight）、`:623`（confirm）、`:626`（select）；`app/pages/game/game.js:1337` 选项渲染、`:1348` 确认按钮；`app/pages/game/game.css` 的 `game-choice-*` 段。

### 1.3 选过也能重选 / 流程图再次进入
- `applyCurrentLine` 现在进入选择行时总会弹出选择层，即使该选择已有历史答案；已选项会作为初始高亮/确认状态。
- 刚确认且目标行仍是同一行时，用 `_choiceJustConfirmed` 抑制同一选择再次弹出一次，避免死循环；随后正常显示该行台词。
- 流程图 `jumpFromFlowchart` 仍走 `initGame`，`initGame` 清除 `_choiceJustConfirmed`，所以再次点击同一选择节点会重新打开选择层，而不是被历史选择跳过。
- 关键文件：`game.js:461`（init 清除）、`:497-511`（抑制逻辑）、`:663`（确认后设置抑制）、`:698`（路线入口）、`:778`（prevLine 清除）；`flowchart.js:412`（jumpFromFlowchart）。
- 新增回归：选择重开、必须显式选择后确认、流程图重入、路线入口测试均已在 `tools/test_choices_ui.mjs` 通过。

### 1.4 个人线按原版条件进入
原版 `scenario_json` 的条件已核对，不再用“默认宁宁/按最高分猜”：

- `018` scene 2（`*chapter44`，起始 8476，结束 8485）：`f.wak_flag == 3` → 和奏线；代码在 `game.js:704`，行号 `WAKANA_ROUTE_LINE=8485`。
- `019` scene 11（`*019_02com`，起始 8955，结束 9220），顺序：
  - `f.nen_flag == 4` → 宁宁
  - `f.meg_flag == 4` → 巡
  - `f.tsu_flag == 2` → 紬
  - `f.tou_flag == 3` → 憧子
- 代码在 `game.js:706-711`，`MAIN_ROUTE_LINE=9220`。
- 未命中精确条件时不伪造默认女主路线，继续共通线；这是刻意选择，避免“所有选择都默认宁宁”。

### 1.5 CG 与图片压缩拉伸压扁（畸变）排查与修复
- **存读档槽位与预览图横向拉扁修正**：
  - 存档预览图 `saveload-preview-img`：原 `width: 230px; height: 94px;`（2.45:1 畸变），现修正为 16:9 等比居中 `width: 167px; height: 94px; position: absolute; left: 31px; top: 0;`。
  - 槽位缩略图 `saveload-slot-body-img`：原 `width: 164px; height: 36px;`（4.55:1 严重挤扁畸变），现修正为 16:9 等比居中 `width: 64px; height: 36px; position: absolute; left: 50px; top: 0;`。
- **`title.css` 补齐存档读档完整样式**：
  - 过去 `title.css` 缺失全部 `saveload-*` 规则，导致标题界面打开读取存档弹窗时无样式约束。现已完整同步与 `game.css` 对齐的 `saveload-*` 规则，保证等比居中渲染。
- **鉴赏界面背景与 CG 分组封面比例修正**：
  - 全屏立绘特写背景 `gallery-fs-bg`：原设为 `800x220`（3.63:1 畸变），现设为 `width: 391px; height: 220px; left: 204px;`，严格符合 16:9（1.777:1）居中显示，左右对称留黑边，杜绝拉伸。
  - CG 分组与立绘分组卡片封面 `g-group-card-bg`, `g-stand-group-img`：由 `120x88` 改为 `width: 156px; height: 88px; margin-left: -18px;`，以 16:9 比例在 120px 容器内居中裁切，不再被横向挤扁。
- **测试套件 Node.js ESM mock 兼容修复**：
  - 修复了 `tools/test_nene_restart.mjs` 中对 `../../media.js` import 的正则匹配；当前 7 套单测 71 项本地回归全部通过。

### 1.6 Restart 星芒“惊喜”演出（本轮新增）
- 触发条件：`view === 'title' && hasNeneCleared && !hasNeneRestartCleared && settings.titleRestartSeen !== true`。首次触发即写入 `titleRestartSeen`，等价于原版 `sf.title_restart` 的一次性演出。
- 演出内容：原版 `title_restart_eff1/eff2` 星芒 + 5 段收缩 + 白闪 + 原版 SE（`≪エフェクト19`、`≪エフェクト８`），随后显示金框「重新开始」。菜单不被永久替换，「开始游戏」始终保留。
- 关键实现：`title.js:playRestartEffect`（时间线 0/220/440/660/880ms + 白闪 + 1560ms 收尾）、`RESTART_FX_PHASES`、`title.js` render 中的 `title-restart-fx/title-restart-layer/title-restart-flash`；`media.js` 的 `sysUrl/seUrl`；`root.js` 的 `restartFx*` 字段。
- **Falcon 平台坑（务必牢记）**：
  1. 官方 `title_restart_eff1/2.png` 实际是 **WebP** 内容套 `.png` 扩展名，笔上按扩展名解码会直接失败（表现为只有白闪、没有星芒）。已用 `sips -s format png` 转成真 PNG。
  2. `<image>` 高度超过 220px 时整张不渲染，不能用原图直接放大铺屏。
  3. Falcon 对已挂载 `<image>` 的 `src`、`opacity`、`width/height` 更新都不生效。当前用“阶段越深、包装 div 层数越多”的方式强制重新挂载图片（`RESTART_FX_PHASES[].depth`），实现 5 段收缩。
  4. 预渲染帧放在设备 `/userdisk/gal_data/sanoba_witch/sys/title_restart_fx_XX.png`（24 张 800×220，工具：`tools/generate_restart_fx.py --src-dir <官方 sys 素材目录> --out build_assets/sys`）；当前只用到 `_04/_06/_08/_10/_13`，其余留给后续 canvas/视频方案。
  5. SE 放在 `/userdisk/gal_data/sanoba_witch/se/restart_eff1.ogg`、`restart_eff2.ogg`，通过 `gal.playVoice` 播放（标题页无语音，不会抢占语音通道）。
- 真机证据：`test_results/multimodal_review/title_restart_fx_giant.png`、`title_restart_fx_shrink.png`、`title_restart_fx_flash.png`、`title_restart_fx_done.png`；点击「重新开始」进入二周目第 0 句：`game_restart_verified.png`。
- 已知限制：不是逐帧 60fps 旋转，而是 5 个预渲染尺寸 + 白闪；Falcon 若未来开放 canvas 2D 或视频叠加，可按 24 帧序列升级为连续旋转动画。

### 1.7 其他已验证
- 根响应式字段 `selectedChoiceIndex`、`hasNeneCleared`、`hasNeneRestartCleared` 已补到 `app/root.js`，否则点选高亮/重开按钮不会刷新。
- 全部本地测试：**71 项 JS 全部通过**（title/choice/core/afterstory/flowchart/gallery）；`python3 build.py --check` 通过（377 个样式类）。
- 本轮最新包已编译安装；修改后请重新 `build.py --install` 再验收，不能拿旧包截图。

## 2. 仍需 Gemini 4 完成（按优先级）

### P1（可选）：把 5 段星芒升级为连续动画
现版本已能演出，但受 Falcon `<image>` 限制只有 5 个离散尺寸。若后续确认 `<canvas>` 2D 或 `gal.openVideo` 在本机稳定，可把 `sys/title_restart_fx_01..24.png` 作为 24 帧连续播放（16fps），替换 `title.js` 的 5 段 `RESTART_FX_PHASES`。不要为此回退现有可见效果；先在独立页面验证 canvas/video 不黑屏、不与 BGM 抢声卡。

### P0：五条路线的真实通关验证
当前 `resolveRouteBranchAt` 的精确条件有单元测试，但没有用真实选择组合跑完每条线。请：

- 从共通线实际选择出 `wak=3`，确认 8485 进入和奏线；
- 分别构造/实际选择出 nen=4、meg=4、tsu=2、tou=3，确认 9220 进入对应路线；
- 验证 `nene` 通常结局后能解锁 `nene_restart`，再进入二周目；
- 检查每条路线结束后的 `clearedRoutes` 和标题入口；
- 关注 `choices_all` 中重复 id、route/targetLine、跳空格子是否在新状态机下仍正确（`test_choices_ui.mjs` 是基准）。

### P1：流程图第二次点击与所有路线节点
- 在真机从标题进入流程图，点一次选择节点并选一个答案，退出/回到流程图，再点同一节点，必须再次弹出选择层（本轮已有单元测试，缺真机多路线验收）。
- 检查所有 7 个路线标签下的节点点击：节点跳转行号是否落在正确 scenario；节点是否因平移/裁剪点不到；选项目标节点与选择节点是否混淆。
- 如果选项节点点击后只跳到普通台词，而用户期望重新选，请额外给选择里程碑节点明确“重新选择”入口，不要静默跳过。

### P1：选择界面边界
- 2/3/4/5 选项（当前数据有 4 项；原版可能有更多）和超长中文选项文本；
- 右侧确认按钮在所有数量下都可点、不遮挡、不超出 800×220；
- 已选状态点“确认”能推进；未选状态点“确认”无动作；
- 存读档恢复 `selectedChoiceIndex`/已选高亮，继续游戏后能重新选；
- 触控拖拽不应误触确认；确认按钮建议至少 36px 物理触控高度。

### P1：标题菜单与原版布局对照
- 当前为了保留流程图，在右上加了自定义「流程图」小按钮；原版 `title_cn.csv` 的 `allbtns2` 是 `restart/start/load/continue/extra/after/system/exit`，没有流程图。
- 若用户要求严格原版：保留原版 8 个按钮，另找不遮挡的方式放流程图；不要再次用「重启/新篇」替换「开始游戏」。
- 对照 `title_cn.csv` 与 `title_cn@allbtns2%cref;normal.png`，检查按钮文案、顺序、留白。

### P2：体验与视觉
- 标题顶部流程图 pill 与人物/Logo 的遮挡；
- 重开按钮在不同背景下的金色边框是否足够清楚；
- 选项确认是否要加“双击确认/取消选择”以防误触；目前是点选 + 确认，不再一点即生效；
- 原版重启演出的音效/特效资源是否可用于本移植（不能把素材提交到公开仓库）。

## 3. 文件所有权与禁止操作

- 可修改：`app/pages/game/game.js`、`game.css`、`app/pages/title/title.js`、`title.css`、`app/root.js`、`app/pages/flowchart/flowchart.js`（仅在需要处理重入/跳转时）、`tools/test_*.mjs`。
- 不要修改：`app/data/`（剧本/选择/流程图生成数据）、`build_assets/`、`app/app_icon.png`、设备美术资源；除非用户明确要求且先备份。
- 不要删除 `test_results/multimodal_review/` 中已有证据图。
- 不要 `git reset`/`clean`；不要覆盖未提交改动；不要在没有备份的情况下改设备 `settings.json`/`saves.json`。
- 不要将商业剧本、图片、音频或字体提交到公开仓库。

## 4. 验证命令

```bash
cd /Volumes/500GB/sanoba-witch-ydpen-port

# 全量本地回归（本轮 71 项通过）
node --experimental-vm-modules --test --test-timeout=8000 \
  tools/test_core_ui.mjs \
  tools/test_choices_ui.mjs \
  tools/test_afterstory_ui.mjs \
  tools/test_flowchart_ui.mjs \
  tools/test_gallery_ui.mjs \
  tools/test_nene_restart.mjs

python3 build.py --check

# 设备构建安装（先确认设备独占）
python3 build.py --serial 9DA2200007506350 --install

# 真机截图（逻辑坐标点击）
adb -s 9DA2200007506350 shell "miniapp_cli capture /tmp/cap.png"
adb -s 9DA2200007506350 pull /tmp/cap.png test_results/multimodal_review/<name>.png
```

测试设置/存档样本（已在缓存目录）：

- 二周目标题：`/Volumes/500GB/qoder_cache/sanoba_asset_handoff_20261029/settings_nene_only.json`（`clearedRoutes:["nene"]`）
- 四选项选择：`/Volumes/500GB/qoder_cache/sanoba_asset_handoff_20261029/test_save_8926.json`
- 原始设置/存档：`settings_before_restart_test.json`、`saves_before_choice_test.json`

设备测试时注意：当前标题 `initTitle` 读取设置有缓存；push `settings.json` 后需要从鉴赏/设置返回标题或重开应用触发一次 `initTitle`，不能只在旧页面截图。测试完恢复原始设置/存档。

## 5. 建议的下一步顺序

1. 先跑全量测试 + `build.py --check`，确认基线没有回归。
2. 真机验收 Restart 星芒：准备 `clearedRoutes:["nene"]` 且无 `titleRestartSeen` 的设置，从鉴赏返回标题录屏确认星芒/白闪/按钮出现；再点「重新开始」确认 1/5507。
3. 用真实选择组合验证 8485/9220 五个路线入口；记录每条线的 `choiceFlags`、跳转行和截图。
4. 真机验证流程图第二次点击同一节点、4 选项确认、2/3 选项边界、存读档后重选。
5. 校正标题菜单与原版 `allbtns2` 的差异，最后再处理视觉打磨；如确认 canvas/video 可用，再升级为 24 帧连续动画。
6. 每完成一批改动，在 `/Volumes/500GB/qoder_cache/sanoba_asset_handoff_20261029/AGENT_COMM.txt` 追加时间、测试结果和截图路径。

## 6. 当前证据截图索引

- `test_results/multimodal_review/title_after_gallery_restart.png`：开始游戏 + 重新开始 + 顶部流程图。
- `test_results/multimodal_review/game_restart_clicked.png`：二周目重启第 0 句。
- `test_results/multimodal_review/title_restart_fx_giant.png`：星芒巨幅登场（真机录制帧）。
- `test_results/multimodal_review/title_restart_fx_shrink.png`：星芒收缩阶段。
- `test_results/multimodal_review/title_restart_fx_flash.png`：白闪收尾。
- `test_results/multimodal_review/title_restart_fx_done.png`：演出结束，金框「重新开始」出现。
- `test_results/multimodal_review/game_restart_verified.png`：点击重新开始进入二周目第 0 句（1/5507）。
- `test_results/multimodal_review/choice_four_options_v2.png`：4 选项 + 右侧确认。
- `test_results/multimodal_review/choice_selected_v2.png`：选项高亮。
- `test_results/multimodal_review/choice_confirm_result_v2.png`：确认后进入 8927。
- 之前的主线/流程图/鉴赏/存档截图仍在同一目录，可作为布局基线。

如果新的 Gemini 4 改动遇到不确定的原版行为，优先对照 `scenario_json/`、`scenario/main/custom.ks`、`other/locale/uipsd/cn/title_cn.csv`，不要根据当前 UI 猜原版。
