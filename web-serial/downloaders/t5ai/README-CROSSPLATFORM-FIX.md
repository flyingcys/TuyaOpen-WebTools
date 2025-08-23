# T5AI跨平台串口复位问题解决方案

## 问题描述
T5AI固件烧录在Windows下正常工作，但在Ubuntu/Linux和macOS上无法自动复位进入下载模式。这是由于不同操作系统的Web Serial API实现差异和串口驱动行为不同导致的。

## 解决方案架构

### 1. T5AISignalController（信号控制器）
提供多种复位策略，自动适配不同平台：
- **standard**: 标准DTR+RTS组合控制（Windows优选）
- **separated**: 分离DTR/RTS控制（Linux/Ubuntu兼容）
- **dtr_only**: DTR单独控制（macOS兼容）
- **rts_only**: RTS单独控制（备用策略）
- **extended_timing**: 扩展时序控制（最强兼容性）

### 2. T5AITransport（传输层）
类似esptool-js的Transport层，提供：
- 流锁定管理
- 读写器自动恢复
- 跨平台信号控制抽象
- 错误处理和降级机制

### 3. 改进的t5ai-downloader.js
- 集成Transport层
- 自动检测平台并选择合适策略
- 保持向后兼容性
- 策略失败时自动降级

## 使用方法

### 基本使用
```javascript
// 在HTML中引入新的脚本
<script src="downloaders/t5ai/T5AISignalController.js"></script>
<script src="downloaders/t5ai/T5AITransport.js"></script>
<script src="downloaders/t5ai/t5ai-downloader.js"></script>

// T5AI下载器会自动使用新的Transport层
const downloader = new T5Downloader(serialPort, debugCallback);
await downloader.connect(); // 自动处理跨平台复位
```

### 测试工具
```javascript
// 引入测试工具
<script src="downloaders/t5ai/T5AISignalControllerTester.js"></script>

// 在浏览器控制台运行
startT5AITester(); // 启动图形化测试工具
```

## 技术原理

### 平台差异分析
1. **Windows**: DTR/RTS信号立即生效，原子操作
2. **Linux/Ubuntu**: 信号可能被缓冲，需要分离控制
3. **macOS**: 某些驱动不支持RTS，需要DTR单独控制

### 自动适配流程
```
1. 检测操作系统平台
2. 选择默认策略：
   - Windows → standard
   - Linux/Ubuntu → separated
   - macOS → dtr_only
3. 执行复位策略
4. 如果失败，自动尝试其他策略
5. 记录成功的策略供下次使用
```

## 测试验证

### 手动测试步骤
1. 打开浏览器开发者工具
2. 运行 `startT5AITester()`
3. 连接T5AI设备
4. 点击"自动复位测试"验证跨平台兼容性
5. 使用"连续性测试"验证稳定性

### 预期结果
- Windows: 使用standard策略成功
- Ubuntu: 使用separated策略成功
- macOS: 使用dtr_only策略成功
- 其他平台: 自动降级到兼容策略

## 故障排除

### 常见问题
1. **所有策略都失败**
   - 检查USB连接
   - 确认串口驱动正确安装
   - 尝试不同的USB端口

2. **LinkCheck无响应**
   - 设备可能不在bootloader模式
   - 尝试手动按复位按钮
   - 检查波特率设置

3. **流锁定错误**
   - 刷新页面重新连接
   - 确保没有其他程序占用串口

## 性能优化

### 策略缓存
系统会记住成功的策略，下次优先使用：
```javascript
// 未来优化：本地存储成功策略
localStorage.setItem('t5ai_reset_strategy', successfulStrategy);
```

### 并行测试
可以同时测试多个策略，选择最快的：
```javascript
// 未来优化：并行策略测试
const results = await Promise.race(strategies.map(s => s.execute()));
```

## 贡献指南
欢迎提交新的复位策略或平台适配：
1. 在T5AISignalController中添加新策略
2. 更新platformDefaults映射
3. 使用测试工具验证
4. 提交PR并附上测试结果

## 版本历史
- v1.0.0 (2024): 初始版本，支持Windows/Linux/macOS
- 未来计划：ChromeOS支持、策略学习机制

## 许可证
MIT License