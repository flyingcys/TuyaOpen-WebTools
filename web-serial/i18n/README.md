# TuyaOpen串口工具 - 多语言系统

## 🌍 概述

本项目采用模块化多语言架构，支持动态加载语言包，确保高性能和易于维护。

## 📁 文件结构

```
i18n/
├── README.md                    # 本文档
├── loader.js                   # 多语言加载器 (核心)
├── validation.js               # 语言验证工具
└── languages/                  # 语言文件目录
    ├── zh.js                   # 简体中文 (基准语言)
    ├── en.js                   # 英语
    ├── zh-tw.js               # 繁体中文
    ├── ja.js                   # 日语
    ├── ko.js                   # 韩语
    ├── es.js                   # 西班牙语
    ├── ru.js                   # 俄语 (待添加)
    ├── pt.js                   # 葡萄牙语 (待添加)
    ├── de.js                   # 德语 (待添加)
    └── fr.js                   # 法语 (待添加)
```

## 🚀 特性

### ✅ 已完成功能
- **动态加载**: 按需加载语言文件，提升性能
- **异步支持**: 完全异步的语言切换机制
- **回退机制**: 自动回退到中文（基准语言）
- **缓存机制**: 已加载的语言会被缓存
- **占位符支持**: 支持 `{0}`, `{1}` 等参数替换
- **HTML自动更新**: 自动更新带有 `data-i18n` 属性的元素

### 🔧 当前支持的语言

| 语言 | 代码 | 状态 | 完成度 |
|------|------|------|--------|
| 简体中文 | `zh` | ✅ 完成 | 100% |
| English | `en` | ✅ 完成 | 100% |
| 繁體中文 | `zh-tw` | ✅ 完成 | 100% |
| 日本語 | `ja` | ✅ 完成 | 100% |
| 한국어 | `ko` | ✅ 完成 | 100% |
| Español | `es` | ✅ 完成 | 100% |
| Русский | `ru` | ⏳ 待添加 | 0% |
| Português | `pt` | ⏳ 待添加 | 0% |
| Deutsch | `de` | ⏳ 待添加 | 0% |
| Français | `fr` | ⏳ 待添加 | 0% |

## 📖 使用方法

### 基本用法

```javascript
// 获取翻译文本
const message = i18n.t('serial_connected');

// 带参数的翻译
const error = i18n.t('connect_failed', errorMessage);

// 异步切换语言
await i18n.setLanguage('en');

// 获取当前语言
const currentLang = i18n.getCurrentLanguage();
```

### HTML中的使用

```html
<!-- 文本内容自动翻译 -->
<h1 data-i18n="title">TuyaOpen串口工具(内测版)</h1>

<!-- 占位符文本自动翻译 -->
<input data-i18n-placeholder="input_placeholder" placeholder="输入要发送的数据...">

<!-- 选择框选项 -->
<option value="none" data-i18n="parity_none">无</option>
```

### JavaScript中的高级用法

```javascript
// 预加载多种语言
await i18nLoader.preloadLanguages(['zh', 'en', 'ja']);

// 检查语言是否已加载
if (i18nLoader.isLanguageLoaded('ja')) {
    console.log('日语已加载');
}

// 获取已加载的语言列表
const loadedLangs = i18nLoader.getLoadedLanguages();

// 获取所有可用语言
const availableLangs = i18nLoader.getAvailableLanguages();
```

## 🔧 开发指南

### 添加新语言

1. **创建语言文件**
   ```bash
   # 在 i18n/languages/ 目录下创建新文件
   touch i18n/languages/fr.js
   ```

2. **编写语言配置**
   ```javascript
   // Français (fr-FR)
   const fr = {
       title: "Outil Série TuyaOpen Bêta",
       subtitle: "Outil de développement tout-en-un basé sur l'API série Web Chrome",
       // ... 其他翻译键值对
   };
   
   // 导出到全局
   if (typeof window !== 'undefined') {
       window.i18nLanguages = window.i18nLanguages || {};
       window.i18nLanguages.fr = fr;
   }
   ```

3. **更新加载器配置**
   ```javascript
   // 在 i18n/loader.js 中添加语言路径
   this.availableLanguages = {
       // ... 现有语言
       'fr': 'i18n/languages/fr.js'
   };
   ```

4. **更新HTML语言选项**
   ```html
<div class="lang-option" data-lang="fr">
    <span class="lang-name">Français</span>
</div>
   ```

### 翻译规范

#### 必须包含的键值对

所有语言文件必须包含以下类别的翻译：

```javascript
{
    // 页面基本信息
    title: "页面标题",
    subtitle: "页面副标题", 
    browser_requirement: "浏览器要求说明",
    beta_notice: "测试版本说明",
    
    // 项目信息
    project_info: "项目介绍",
    current_project: "当前项目名称",
    main_project: "主项目名称",
    
    // 界面元素
    tab_serial: "串口调试标签",
    tab_flash: "固件下载标签",
    connect: "连接按钮",
    disconnect: "断开按钮",
    
    // 状态信息
    status_connected: "已连接状态",
    status_disconnected: "未连接状态",
    
    // 错误和消息
    error: "错误",
    serial_connected: "连接成功消息",
    
    // 版权信息
    powered_by: "提供商",
    all_rights_reserved: "版权声明"
}
```

#### 占位符规范

使用 `{0}`, `{1}`, `{2}` 等作为参数占位符：

```javascript
// 正确
"connect_failed": "连接失败: {0}"
"erase_progress": "擦除进度: {0}/{1}"

// 错误 - 不要使用命名参数
"connect_failed": "连接失败: {error}"
```

#### 文本长度考虑

- 界面按钮文字尽量简洁（<10字符）
- 提示消息可以稍长，但注意换行
- 确认对话框可以使用多行文字

## 🧪 验证和测试

### 使用验证工具

```javascript
// 创建验证器
const validator = new I18nValidator();

// 添加所有语言数据
validator.addLanguage('zh', window.i18nLanguages.zh);
validator.addLanguage('en', window.i18nLanguages.en);
// ... 添加其他语言

// 验证
const result = validator.validate();

// 生成报告
const report = validator.generateReport();
console.log(report);
```

### 常见验证错误

1. **缺失键值**
   ```
   Language 'en': Missing key 'flash_config'
   ```

2. **占位符不匹配**
   ```
   Language 'en', key 'connect_failed': Placeholder count mismatch. Expected 1, got 0
   ```

3. **空值警告**
   ```
   Language 'fr': Empty value for key 'title'
   ```

## 🐛 故障排除

### 常见问题

#### 1. 语言切换失败
```javascript
// 检查语言文件是否正确加载
console.log('Available languages:', i18nLoader.getAvailableLanguages());
console.log('Loaded languages:', i18nLoader.getLoadedLanguages());
```

#### 2. 翻译显示为键名
```javascript
// 检查当前语言数据
console.log('Current language:', i18n.getCurrentLanguage());
console.log('Language data:', window.i18nLanguages[i18n.getCurrentLanguage()]);
```

#### 3. 占位符不替换
```javascript
// 检查翻译调用
const text = i18n.t('connect_failed', 'Network error');
console.log('Translated text:', text);
```

### 调试技巧

1. **启用详细日志**
   ```javascript
   // 在控制台中启用调试
   localStorage.setItem('i18n_debug', 'true');
   ```

2. **检查网络请求**
   ```javascript
   // 查看语言文件加载状态
   // 在浏览器开发者工具的 Network 标签中查看
   ```

3. **验证语言数据**
   ```javascript
   // 手动验证特定语言
   Object.keys(window.i18nLanguages.zh).forEach(key => {
       if (!window.i18nLanguages.en[key]) {
           console.warn(`English missing key: ${key}`);
       }
   });
   ```

## 📈 性能优化

### 已实现的优化

1. **按需加载**: 只在需要时加载语言文件
2. **缓存机制**: 避免重复加载同一语言
3. **预加载**: 可预加载常用语言
4. **异步处理**: 不阻塞主线程

### 性能监控

```javascript
// 监控语言加载时间
console.time('language-load');
await i18n.setLanguage('ja');
console.timeEnd('language-load');

// 监控翻译性能
console.time('translation');
const text = i18n.t('very_long_text_key');
console.timeEnd('translation');
```

## 🤝 贡献指南

### 贡献新语言翻译

1. Fork 本项目
2. 创建语言文件 `i18n/languages/{lang}.js`
3. 完整翻译所有键值对
4. 运行验证工具确保无错误
5. 提交 Pull Request

### 翻译质量标准

- ✅ **准确性**: 翻译准确，符合语境
- ✅ **一致性**: 术语翻译前后一致
- ✅ **本地化**: 符合目标语言习惯
- ✅ **完整性**: 所有键值都有翻译
- ✅ **格式**: 保持占位符和格式标记

## 📋 TODO

- [ ] 添加俄语翻译 (ru)
- [ ] 添加葡萄牙语翻译 (pt) 
- [ ] 添加德语翻译 (de)
- [ ] 添加法语翻译 (fr)
- [ ] 实现语言包的版本控制
- [ ] 添加翻译缓存到 localStorage
- [ ] 实现翻译的模糊匹配
- [ ] 添加 RTL 语言支持

## 📞 联系方式

如有问题或建议，请：
1. 创建 GitHub Issue
2. 提交 Pull Request
3. 联系维护团队

---

> 📝 **注意**: 本文档会随着项目发展持续更新。请定期查看最新版本。 
