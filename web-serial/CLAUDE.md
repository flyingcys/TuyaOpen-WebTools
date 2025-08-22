# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

TuyaOpen-WebSerial 是基于 Chrome Web Serial API 的现代化串口工具，支持串口调试、固件烧录和设备授权。这是一个纯前端项目，无需后端服务器，直接在浏览器中运行。

## 开发环境

### 系统要求
- Chrome 89+ / Edge 89+ 或其他基于 Chromium 的浏览器
- 支持 Web Serial API

### 启动项目
```bash
# 方式1: 直接打开 HTML 文件
open index.html

# 方式2: 使用本地服务器（推荐）
python -m http.server 8000
# 或
npx serve .
```

## 代码架构

### 项目结构
```
web-serial/
├── index.html                    # 主页面
├── authorization.html            # 授权页面
├── troubleshooting.html         # 故障排除页面
├── style.css                    # 样式文件
├── script-clean.js              # 原始版本（单文件）
├── flash-downloader.js          # 固件下载器
├── modules/                     # 模块化版本
│   ├── core/                    # 核心模块
│   │   ├── EventBus.js          # 事件总线
│   │   └── SerialTerminal.js    # 主控制器
│   ├── serial/                  # 串口模块
│   │   ├── SerialManager.js     # 串口管理
│   │   └── DataProcessor.js     # 数据处理
│   ├── firmware/                # 固件模块
│   │   ├── FlashManager.js      # 固件烧录管理
│   │   └── ProgressTracker.js   # 进度跟踪
│   ├── ui/                      # UI模块
│   │   ├── UIManager.js         # DOM管理
│   │   ├── ModalManager.js      # 模态框管理
│   │   ├── TabManager.js        # 标签页管理
│   │   └── FullscreenManager.js # 全屏管理
│   ├── i18n/                    # 国际化模块
│   │   ├── LanguageManager.js   # 语言管理
│   │   └── TextUpdater.js       # 文本更新
│   └── utils/                   # 工具模块
│       ├── Logger.js            # 日志系统
│       └── FileUtils.js         # 文件工具
├── downloaders/                 # 下载器模块
│   ├── base-downloader.js       # 基础下载器
│   ├── downloader-manager.js    # 下载器管理
│   ├── t5ai/                    # T5AI/T3 下载器
│   ├── esp32/                   # ESP32 下载器
│   ├── bk7231n/                 # BK7231N 下载器
│   └── ln882h/                  # LN882H 下载器
└── i18n/                        # 国际化文件
    ├── loader.js                # 语言加载器
    ├── validation.js            # 语言验证
    └── languages/               # 语言包
        ├── zh.js                # 简体中文（基准语言）
        ├── en.js                # 英语
        ├── zh-tw.js             # 繁体中文
        ├── ja.js                # 日语
        ├── ko.js                # 韩语
        └── es.js                # 西班牙语
```

### 核心架构模式

#### 1. 事件驱动架构
所有模块通过 EventBus 进行通信，实现解耦：
```javascript
// 发送事件
this.eventBus.emit('serial:connected', data);

// 监听事件  
this.eventBus.on('serial:connected', this.handleConnected.bind(this));
```

#### 2. 模块化设计
- **原始版本**: script-clean.js（单文件，2107行）
- **模块化版本**: modules/ 目录下的独立模块
- 两个版本功能完全一致，可选择使用

#### 3. 多语言支持
- 动态加载语言包
- 支持10种语言
- 异步切换，不阻塞UI

## 支持的设备类型

| 设备类型 | 下载器路径 | 状态 |
|---------|-----------|------|
| T5AI/T3 | downloaders/t5ai/ | 完全支持 |
| ESP32系列 | downloaders/esp32/ | 完全支持 |
| BK7231N | downloaders/bk7231n/ | 完全支持 |
| LN882H | downloaders/ln882h/ | 完全支持 |

## 开发指南

### 添加新的下载器
1. 继承 BaseDownloader 类
2. 实现必要的接口方法
3. 在 DownloaderManager 中注册

### 添加新语言
1. 在 i18n/languages/ 创建语言文件
2. 按照 zh.js 的格式翻译所有键值
3. 在 i18n/loader.js 中注册语言路径
4. 在 HTML 中添加语言选项

### 调试技巧
- 打开浏览器开发者工具
- 使用 Console 查看日志输出
- Network 标签查看语言文件加载状态
- 使用 localStorage.setItem('i18n_debug', 'true') 启用详细日志

## 技术特性

### Web Serial API
- 直接在浏览器中访问串口设备
- 支持多种波特率和配置
- 实时数据传输

### 固件烧录
- 支持 .bin 格式固件文件
- 实时进度显示
- 自动芯片检测
- 断点续传支持

### 安全性
- 纯前端实现，无服务器风险
- 本地文件处理
- Web Serial API 权限控制

## 故障排除

常见问题解决方案参考 troubleshooting.html 文件。

主要检查项：
1. 浏览器是否支持 Web Serial API
2. 设备驱动是否正确安装  
3. 串口是否被其他程序占用
4. 固件文件格式是否正确