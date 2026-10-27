# 有道词典笔《魔女的夜宴》移植版 (Sabbat of the Witch for Youdao Pen)

面向**网易有道词典笔 X6 Pro**（Rockchip RK3562 / aarch64 Linux / Weston Wayland / 960×266 物理屏 / 800×220 微前端视口）的《魔女的夜宴》（サノバウィッチ / Sabbat of the Witch）视觉小说移植工程与资源转换工具链。

底层基于通用视觉小说引擎 [**RibbonEngine**](https://github.com/RS114514/RibbonEngine) 构建，在此基础上实现针对《魔女的夜宴》全角色路线、高保真画质、双声道 PCM 软混音与自动化资产转码流水线。

本项目采用**纯净开源引擎 + 自动化资产适配流水线**架构：仓库本身仅包含应用前端逻辑、原生软件混音插件、打包脚本与资源转换工具，**不附带、不分发任何受版权保护的商业游戏剧本、音频或美术素材**。

---

## 声明与重要提醒

### 1. 游戏资源与版权
- 请自觉支持正版游戏（Yuzusoft / 柚子社），所有提取产物仅限个人研究与学习使用。
- 本项目不包含商业游戏原始版权素材，所有媒体资源均需使用者持有正版游戏后在本地转换生成。

### 2. 词典笔调试授权
- **有道词典笔官方系统的 ADB 接口默认设有密码验证与授权保护。**
- 本项目不提供破解工具。使用者需自行获取词典笔的 ADB 调试授权。
- 确认 `adb devices` 能够正常识别并授权设备后，方可使用本工程提供的自动安装与素材推送功能。

---

## 特性亮点

1. **超宽带鱼屏黄金分割布局（800 × 220）**：
   - 390px 舞台区：背景自适应、角色立绘差分、SD Q版演出小人、全屏 CG 浏览；
   - 322px 文本区：姓名标牌、打字机推进、历史回溯 Backlog、章节提示；
   - 88px 侧边栏：菜单、快进（Skip）、自动播放（Auto）、语音重播。
2. **多声道 PCM 软件混音引擎**：
   - RK3562 词典笔专用原生混音动态库（`libjsapi_gal.so`），基于 GStreamer `appsrc`/`appsink` 软件 PCM 混音，解决硬件声卡独占冲突；
   - 原生支持背景音乐（BGM）与角色语音（Voice）并发播放、台词重播与自动避让（Ducking）。
3. **Retina 级高清画质适配**：
   - 场景背景缩放至 960×540（16:9 标准高清）；
   - 角色立绘差分适配 780×440 高清舞台画布；
   - 全屏事件 CG（944×532）与 SD Q版小人图层展示。
4. **全自动资产解包与转换流水线**：
   - 纯 Python 实现的 XP3 解包器；
   - 剧本、立绘、CG、SD、音频转换脚本；
   - 完整性审计对账工具（`audit_assets.py`）。

---

## 环境准备

在进行资产转换与构建前，请确保您的电脑已安装以下依赖：

- **Python 3.9+**
- **FFmpeg**：用于音视频转码与图像处理
  ```bash
  # macOS
  brew install ffmpeg
  ```
- **Mono**：用于运行 PSB 资产反编译器
  ```bash
  # macOS
  brew install mono
  ```
- **Android SDK Platform-Tools (ADB)**：用于连接词典笔安装

---

## 目录结构说明

```text
sanoba-witch-ydpen-port/
├── README.md                      # 项目说明
├── LICENSE                        # MIT 许可证
├── SECURITY.md                    # 安全与合规说明
├── build.py                       # 词典笔 Miniapp 构建与打包脚本
├── import_and_install.py          # 全自动资产适配流水线入口
├── app/                           # 词典笔 Miniapp 前端工程代码
│   ├── manifest.json              # 应用元数据与权限
│   ├── app.json                   # 页面路由注册
│   ├── app.js                     # 全局生命周期与错误捕获
│   ├── base-page.js               # 页面基类
│   ├── common.js                  # 通用工具函数
│   ├── storage.js                 # 存档与持久化管理
│   ├── media.js                   # 媒体与音频状态控制
│   ├── pages/                     # 游戏各界面（game, title, gallery, flowchart, afterstory）
│   └── data/                      # 剧情与选择支数据模块（story_data.js 等）
├── native/                        # RK3562 原生软件 PCM 混音库源码 (gal_gs.c)
├── libs/                          # 预编译 aarch64 动态链接库 (libjsapi_gal.so)
└── tools/                         # 全套解包、转码、立绘合成与音频同步工具集
    ├── unpack_xp3.py              # XP3 解包器
    ├── convert_scenario.py        # 剧本与选择支转换引擎
    ├── convert_all_bgs.py         # 场景背景高清缩放工具 (960x540)
    ├── composite_all_fgs.py       # 角色立绘多图层差分多核合成工具
    ├── convert_all_cgs.py         # 全屏 CG 提取转码工具 (944x532)
    ├── convert_all_sds.py         # SD 二头身 Q版小人 RGBA 转码工具
    ├── sync_all_audio.py          # 语音、BGM与音效同步工具
    ├── audit_assets.py            # 全量资产完整性审计对账工具
    ├── build_data.py              # ESM 剧本与鉴赏数据打包工具
    ├── pack_amr.py                # .amr 打包器
    └── FreeMote/ & tlg2bmp        # 底层二进制解码辅助组件
```

---

## 开源协议

- 本项目代码部分以 **MIT License** 开源。
- 《魔女的夜宴》（サノバウィッチ / Sabbat of the Witch）一切著作权、角色形象、剧本、音乐与美术所有权归 **Yuzusoft（柚子社）** 所有。
- 请勿将游戏原始版权素材打包发布到任何公共代码仓库或网络公开网盘。
