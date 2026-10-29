# 《魔女的夜宴》词典笔移植：接力给 Gemini 4 的说明

日期：2026-10-29  
工程：`/Volumes/500GB/sanoba-witch-ydpen-port`  
设备：`9DA2200007506350`（有道词典笔，逻辑视口 800×220）  
本轮执行者：Qoder（继续修复标题二周目、个人线入口、选择支与流程图交互）

## 0. 先读这一节（边界）

- 当前工作树**有未提交修改**，是用户正在验收的版本，**不要** `git reset --hard`、`git clean`、`git checkout .` 或覆盖 `app/`。
- 修改前先备份：本目录同级的 `/Volumes/500GB/qoder_cache/sanoba_asset_handoff_20261029/ui_choice_restart.patch` 保存了本轮 diff；`game.choicefix.js`、`title.choicefix.js` 是本轮源码副本。
- 不要删除或改写用户存档/设置。设备上的 `settings.json`、`saves.json` 测试前已备份到 `/Volumes/500GB/qoder_cache/sanoba_asset_handoff_20261029/settings_before_restart_test.json` 与 `saves_before_choice_test.json`。
- 需要改设备测试数据时，先 pull 备份，测试后原样 push 回去；当前设备已恢复 `settings.json`（`clearedRoutes: []`）和真实存档备份 `device_saves_before_v2.json`（slot1 / main 2340 / 2-1「我要一份伯爵茶」），**不是空存档**。
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
- **真机验证（2026-10-29 23:40，用备份存档 slot1：main 2340，原有选择 main:2337=1）**：
  - 继续游戏载入 2340，用菜单「回退上一句」退到 2337，选择层重新弹出，已选项 1 预高亮；点选另一项并「确定选择」后推进到 2338，台词变为「说实话，我觉得你穿着很好看啊……」，证明**选过的选择可以改**。
  - 返回标题 → 流程图 → 点共通线 2337 节点，选择层再次弹出且保留上次选择高亮，证明**流程图节点可以第二次进入并重选**。
  - 证据：`save_2340_continue.png`、`choice_reopened_2options.png`、`choice_2options_selected.png`、`choice_2options_changed.png`、`flowchart_common_route.png`、`flowchart_choice_reopened.png`。
  - 测试只改内存，未覆盖存档文件；`saves.json` 仍是 slot1=2340 的原始备份。

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
  4. 预渲染帧放在设备 `/userdisk/gal_data/sanoba_witch/sys/title_restart_fx_XX.png`（工具：`tools/generate_restart_fx.py --src-dir <官方 sys 素材目录> --out build_assets/sys`）；当前只用到 `_04/_06/_08/_10/_13`（已放入 `build_assets/sys`），其余 19 帧留在缓存/生成器输出中，供后续 canvas/视频方案使用。`build.py --install` 会自动把 `build_assets/sys` 与 `build_assets/se` 同步到笔上，不再依赖手工 push。
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
- 共通线 2337 节点已真机验证“第二次点击仍弹出选择层并保留上次高亮”（见 1.3 与 `flowchart_choice_reopened.png`）；仍需验证其余 6 条路线标签下的节点与跨线跳转。
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
- 星芒演出素材（sys/se）只允许在本机/设备使用，不能提交到公开仓库。

## 3. 文件所有权与禁止操作

- 可修改：`app/pages/game/game.js`、`game.css`、`app/pages/title/title.js`、`title.css`、`app/root.js`、`app/pages/flowchart/flowchart.js`（仅在需要处理重入/跳转时）、`tools/test_*.mjs`、`tools/generate_restart_fx.py`、`build.py`（仅限资源同步）。
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

# 注意：tools/test_audio_settings.mjs 与 tools/test_engine_render.mjs 是早期
# 引擎测试，只 stub 了旧版 import 集合；当前 game.js 还有 chapter_all/scn_*/
# choices_all 等数据 import，会在这两个文件里报“仍有未 stub 的相对 import”。
# 它们不属于上面的 71 项回归集，不要误判为本轮 UI 回归。

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
4. 共通线 2 选项/流程图二次点击已真机验证；继续验证其余路线节点、5 选项/超长文本、存读档后重选。
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
- `test_results/multimodal_review/save_2340_continue.png`：真实存档 2340 继续游戏。
- `test_results/multimodal_review/choice_reopened_2options.png`：已选过的 2337 选择重新弹出（2 选项）。
- `test_results/multimodal_review/choice_2options_selected.png`：改选另一项后的金色高亮。
- `test_results/multimodal_review/choice_2options_changed.png`：确认改选后进入 2338 新台词。
- `test_results/multimodal_review/flowchart_common_route.png`：共通线流程图节点。
- `test_results/multimodal_review/flowchart_choice_reopened.png`：流程图点击 2337 节点再次弹出选择层。
- 之前的主线/流程图/鉴赏/存档截图仍在同一目录，可作为布局基线。

如果新的 Gemini 4 改动遇到不确定的原版行为，优先对照 `scenario_json/`、`scenario/main/custom.ks`、`other/locale/uipsd/cn/title_cn.csv`，不要根据当前 UI 猜原版。


---

## 7. Gemini 4 接力完成记录（2026-10-30 00:05）

### 7.1 已完成的 P0 / P1 / P2 核查与修复

1. **P0 — 五条女主路线的真实选项序列通关验证与和奏线阻断修复**：
   - 对照 `scenario_json/` 全量剧本与 `app/data/choices_all.js`，逐一核实共通线 12 个选择支的好感度与分支条件：
     - **宁宁线 (`nene`, `9220` 入口，`nen === 4`)**：`2864` 选 1 (`nen++`) $\to$ `6452` 选 2 (`nen++`) $\to$ `8702` 选 1 (`nen++`) $\to$ `8926` 选 2 (`nen++`)。
     - **巡线 (`meguru`, `9220` 入口，`meg === 4`)**：`2864` 选 2 (`meg++`) $\to$ `3877` 选 1 (`*009_01A`) $\to$ `3963` 选 2 (`meg++`) $\to$ `4298` 选 2 (`meg++`) $\to$ `8926` 选 1 (`meg++`)。
     - **紬线 (`tsumugi`, `9220` 入口，`tsu === 2`)**：`7666` 选 1 (`tsu++`) $\to$ `8926` 选 4 (`tsu++`)。
     - **憧子线 (`touko`, `9220` 入口，`tou === 3`)**：`7666` 选 2 (`tou++`) $\to$ `8896` 选 1 (`tou++`) $\to$ `8926` 选 3 (`tou++`)。
     - **和奏线 (`wakana`, `8485` 入口，`wak === 3`，需已通关任一主线女主)**：`2337` 选 1 (`wak++`) $\to$ `3877` 选 2 (`*009_01B`) $\to$ `4049` 选 2 (`*009_03B` 进入 `*dummy1`，原版 `009.共通－休日デート.ks.json` scene 12 的 `preevals` 执行 `f.wak_flag ++`) $\to$ `4993` 选 1 (`wak++`)。
   - **修复缺陷**：此前 `app/pages/game/game.js` 的 `CHOICE_SCRIPTS` 中 `009` 的 `*dummy1` 缺少 `'f.wak_flag ++'`，导致玩家通过真实选项最多只能拿到 2 点 `wak`（`2337` 和 `4993`），永远无法在 `8485` 进入和奏线。现已在 `CHOICE_SCRIPTS` 补齐 `['*dummy1',413,63,['*009_wak_com'],'f.wak_flag ++']`，并让 `choicePath()` 与 `resolveRouteBranchAt()` 根据已选选项完整重算跨脚本好感度（同时兼容直接设置 `vm.choiceFlags` 的旧测试）。
   - **新增回归测试**：在 `tools/test_choices_ui.mjs` 新增端到端测试 `all five heroine routes are reachable via real in-game choice sequences and unlock restart/afterstory`，覆盖一周目未通关时和奏线锁死、四条主线真实选项进线、宁宁一周目通关解锁标题页 `Restart` 与和奏线、和奏线真实选项在 `8485` 进线、以及 `nene_restart` 通关后解锁 `after_nene`。

2. **P1 — 流程图二次点击重选与选择支 UI 边界核验**：
   - 真机实测从流程图点击 `2337` 选择支节点进入游戏、完成两步选择（点选高亮 + 右侧确定）推进到台词后，再次打开流程图点击同一 `2337` 节点：确认能够再次弹出选项框、自动恢复上次所选项的金色高亮，并支持改选另一项后推进到新分支（`2337` 选 1 为 `2338/9348` 柊史台词，改选 2 后跳至 `2341/9348` 宁宁台词）。
   - 核查全剧所有选择支选项数量：仅存在 2 选项与 4 选项（无 3 选项或 5 选项），最长选项文本为 19 个汉字（`8926` 选项 4：「现在我满脑子都是乐队的事，没空想这个」），在 `13px` 字号与 `476px` 文本区内仅占 `247px`，单行完整显示无截断。

3. **P1 — 标题菜单与原版 `allbtns2` 布局校正**：
   - 修改 `app/pages/title/title.js`：右上角「流程图」胶囊按钮仅在二周目 `restartButton` 出现（占据左列第 4 格）时显示；一周目左列第 4 格本身就是「流程图」按钮时不再重复渲染右上角胶囊，画面更加干净。

### 7.2 自动化测试与构建校验结果

- `tools/test_core_ui.mjs`：11/11 通过
- `tools/test_choices_ui.mjs`：16/16 通过（含新增 5 路线真实选项通关测试）
- `tools/test_afterstory_ui.mjs`：7/7 通过
- `tools/test_flowchart_ui.mjs`：14/14 通过
- `tools/test_gallery_ui.mjs`：9/9 通过
- `tools/test_nene_restart.mjs`：4/4 通过
- `tools/test_title.mjs`：11/11 通过
- **合计**：72/72 项 JS 单元测试全部通过；`python3 tools/test_ui_build.py`（5/5）与 `python3 build.py --check`（377 个样式类）全部通过。

### 7.3 新增真机多模态验证截图索引

- `test_results/multimodal_review/gemini4_title_1st_run.png`：一周目标题页（左列第 4 格为流程图，右上角无重复胶囊按钮）。
- `test_results/multimodal_review/gemini4_title_restart_revealed.png`：宁宁一周目通关后标题页（左列第 1 格保留「开始游戏」，第 4 格显示金框「重新开始 RESTART」，右上角显示「流程图」胶囊）。
- `test_results/multimodal_review/gemini4_nene_restart_line0.png`：点击「重新开始」进入 `nene_restart` 第 0 句（`1 / 5507`）。
- `test_results/multimodal_review/gemini4_flowchart_main.png`：共通线流程图（13 个节点与蛇形连线）。
- `test_results/multimodal_review/gemini4_choice_2337_first_open.png`：流程图点击 `2337` 节点首次打开 2 选项弹层（未点选时右侧确定按钮半透明禁用）。
- `test_results/multimodal_review/gemini4_choice_2337_opt1_highlighted.png`：点选第 1 项后金色高亮与右侧确定按钮激活。
- `test_results/multimodal_review/gemini4_choice_2337_after_confirm.png`：点击右侧确定后推进至 `2338 / 9348`。
- `test_results/multimodal_review/gemini4_choice_2337_second_open_reselect.png`：从流程图第二次点击 `2337` 节点，成功重新弹出选择支并保留第 1 项高亮。
- `test_results/multimodal_review/gemini4_choice_2337_opt2_highlighted.png`：改选第 2 项高亮。
- `test_results/multimodal_review/gemini4_choice_2337_changed_to_opt2.png`：确认改选后跳转至 `2341 / 9348` 宁宁立绘台词。
- `test_results/multimodal_review/gemini4_wakana_branch_8485_before.png`：真实选项组合 `[2337:1, 3877:2, 4049:2, 4993:1]` 推进至 `8485`（显示 `8486 / 9348`）。
- `test_results/multimodal_review/gemini4_wakana_route_entered_line0.png`：在 `8485` 点击推进后精确进入和奏线 `wakana:0`（显示 `1 / 3588`）。
- `test_results/multimodal_review/gemini4_choice_8926_4options.png` & `gemini4_choice_8926_opt2_highlighted.png`：`8926` 处 4 选项弹层与点选高亮实机效果。
- `test_results/multimodal_review/gemini4_restored_clean_title.png`：测试结束后恢复设备原始 `settings.json`（`clearedRoutes: []`）与 `saves.json` 后的标题页状态。
