# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

TuyaOpen-WebSerial 是一个基于Chrome Web Serial API的现代化Web串口工具，支持串口调试、固件烧录和TuyaOpen设备授权。项目采用纯前端JavaScript实现，无需构建步骤，可直接在浏览器中运行。

## 开发环境和命令

### 启动本地服务器
```bash
# 在webserial-downloader目录下
npx http-server . -p 8080

# 或者直接打开index.html文件
```

### 无构建步骤
- 项目是纯静态文件，直接打开 `index.html` 即可使用
- 所有脚本都在HTML中直接引用
- 支持本地开发和生产部署

### 浏览器要求
- Chrome 89+ 或其他基于Chromium的浏览器
- 必须支持Web Serial API（Safari、Firefox不支持）

## 核心架构

### 技术栈
- **前端框架**: 原生JavaScript ES6+ + 模块化架构
- **串口通信**: Chrome Web Serial API
- **固件烧录**: 集成esptool-js和自研下载器系统
- **国际化**: 自研i18n系统，支持10种语言
- **UI**: 响应式CSS + 现代化设计

### 支持的芯片类型
1. **T5AI/T3 系列** (TuyaOpen芯片)
   - 自研下载器实现
   - 跨平台兼容性优化 (Ubuntu/Windows/macOS)
   - 多策略复位机制

2. **ESP32 全系列**
   - 基于官方esptool-js
   - 自动芯片检测
   - 支持ESP32/ESP32-S2/S3/C3等全系列

## 项目结构

### 双架构并存
项目同时维护两套架构：

1. **单文件版本** (兼容性)
   - `index.html` + `script-clean.js` (2107行)
   - 向后兼容，稳定可靠

2. **模块化版本** (推荐)
   - `index-modules.html` + `modules/` 目录
   - 事件驱动架构，易于维护和扩展

### 模块化架构详解
```
modules/
├── config/           # 配置模块
│   └── Constants.js     # 全局配置常量
├── core/             # 核心模块
│   ├── EventBus.js      # 事件总线（模块间通信）
│   └── SerialTerminal.js # 主控制器
├── utils/            # 工具模块
│   ├── Logger.js        # 统一日志系统
│   └── FileUtils.js     # 文件操作工具
├── serial/           # 串口模块
│   ├── SerialManager.js  # 串口连接管理
│   └── DataProcessor.js # 数据处理与显示
├── firmware/         # 固件模块
│   ├── FlashManager.js   # 固件烧录管理
│   └── ProgressTracker.js # 进度跟踪
├── ui/               # UI模块
│   ├── UIManager.js      # DOM管理与基础交互
│   ├── ModalManager.js   # 模态框管理
│   ├── TabManager.js     # 标签页管理
│   └── FullscreenManager.js # 全屏管理
└── i18n/             # 国际化模块
    ├── LanguageManager.js # 语言管理
    └── TextUpdater.js    # 文本更新
```

### 下载器插件系统
```
downloaders/
├── base-downloader.js      # 基础下载器抽象类
├── downloader-manager.js   # 下载器管理器
├── t5ai/
│   ├── t5ai-downloader.js  # T5AI系列下载器
│   ├── T5AISignalController.js # 信号控制器
│   └── T5AISignalControllerTester.js # 测试工具
├── esp32/
│   └── esp32-esptool-js-wrapper.js # ESP32下载器包装
├── bk7231n/
│   └── bk7231n-downloader.js # 博通芯片支持
└── ln882h/
    ├── ln882h-downloader.js # 联盛德芯片支持
    └── ln882h-ram-bin.js
```

## 核心设计模式

### 1. 事件驱动架构
所有模块通过 `EventBus` 进行通信，实现完全解耦：

```javascript
// 模块A发送事件
this.eventBus.emit('serial:connected', data);

// 模块B监听事件
this.eventBus.on('serial:connected', (data) => {
    // 处理连接事件
});
```

### 2. 依赖注入
所有模块都通过构造函数接收依赖：

```javascript
class SerialManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.bindEvents();
    }
}
```

### 3. 插件化下载器系统
```javascript
// 添加新的芯片支持
class NewChipDownloader extends BaseDownloader {
    constructor(port, debugCallback) {
        super(port, debugCallback);
    }
    
    async download(file, options) {
        // 实现具体的下载逻辑
    }
}

// 注册下载器
DownloaderManager.register('NEW_CHIP', NewChipDownloader);
```

## T5AI跨平台优化

### 信号控制策略
T5AI下载器集成了跨平台信号控制器，自动解决不同平台的兼容性问题：

1. **standard**: 标准DTR+RTS组合控制（Windows优选）
2. **separated**: 分离DTR/RTS控制（Ubuntu/Linux兼容）
3. **dtr_only**: DTR单独控制（macOS兼容）
4. **extended_timing**: 扩展时序控制（硬件兼容）
5. **rts_only**: RTS单独控制（特殊硬件兼容）

### 平台检测和降级机制
- 自动识别Windows、Ubuntu/Linux、macOS平台
- 策略失败时自动尝试其他策略
- 详细的错误诊断和日志记录

## 开发指南

### 添加新的芯片支持

1. 创建下载器类继承 `BaseDownloader`:
```javascript
class NewChipDownloader extends BaseDownloader {
    constructor(port, debugCallback) {
        super(port, debugCallback);
        this.chipName = 'NEW_CHIP';
    }
    
    async connect() {
        // 实现连接逻辑
    }
    
    async download(file, options) {
        // 实现下载逻辑
    }
}
```

2. 在 `downloader-manager.js` 中注册：
```javascript
DownloaderManager.register('NEW_CHIP', NewChipDownloader);
```

3. 在UI中添加对应的选项

### 添加新的模块

1. 创建模块文件，实现标准接口：
```javascript
class NewModule {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.bindEvents();
    }
    
    bindEvents() {
        this.eventBus.on('some:event', this.handleEvent.bind(this));
    }
    
    destroy() {
        this.eventBus = null;
    }
}
```

2. 在 `SerialTerminal.js` 中初始化模块

### 调试和测试

- 开启调试模式：`window.serialTerminal.debugMode = true`
- 使用内置Logger系统记录日志
- T5AI信号控制器提供专门的测试工具

## 国际化

### 支持的语言
简体中文、繁体中文、English、Français、Deutsch、日本語、한국어、Español、Português、Русский

### 添加新语言
1. 在 `i18n/languages/` 目录添加语言文件
2. 在 `i18n/loader.js` 中注册新语言
3. 在HTML中添加语言选项

## 重要注意事项

### Web Serial API限制
- 仅支持基于Chromium的浏览器
- 需要用户手动授权串口访问
- 必须在HTTPS或localhost环境下运行

### 平台兼容性
- T5AI在Ubuntu下需要特殊的信号控制策略
- ESP32烧录依赖esptool-js库
- 不同平台的串口驱动可能存在差异

### 安全考虑
- 所有固件文件仅在本地处理
- 不上传任何用户数据
- TuyaOpen授权信息仅用于设备配置

## 文件导航
- 主入口：`index.html` (单文件版本) 或 `index-modules.html` (模块化版本)
- 核心控制器：`script-clean.js` 或 `modules/core/SerialTerminal.js`
- T5AI下载器：`downloaders/t5ai/t5ai-downloader.js`
- ESP32下载器：`downloaders/esp32/esp32-esptool-js-wrapper.js`
- 跨平台优化：`downloaders/t5ai/T5AISignalController.js`