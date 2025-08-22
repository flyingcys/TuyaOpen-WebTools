/**
 * ResetStrategyManager 使用示例
 * 展示如何在T5AI固件烧录工具中使用复位策略管理器
 */

// 导入依赖
let ResetStrategyManager, PlatformDetector;
if (typeof require !== 'undefined') {
    ResetStrategyManager = require('./reset-strategy-manager.js');
    PlatformDetector = require('./platform-detector.js');
    
    // 导入测试用的模拟串口
    const { MockSerialPort } = require('./reset-strategy-manager.test.js');
    global.MockSerialPort = MockSerialPort;
} else {
    ResetStrategyManager = window.ResetStrategyManager;
    PlatformDetector = window.PlatformDetector;
}

/**
 * 示例：基本使用场景
 */
async function basicUsageExample() {
    console.log('=== 基本使用示例 ===');

    // 创建模拟串口
    const mockPort = new (global.MockSerialPort || MockSerialPort)();
    
    // 获取当前平台配置
    const platform = PlatformDetector.detectPlatform();
    const config = PlatformDetector.getPlatformConfig(platform);
    
    console.log(`当前平台: ${platform}`);
    console.log(`平台配置: ${config.description}`);
    
    // 创建调试回调
    const debugCallback = (level, message, data) => {
        console.log(`[${level.toUpperCase()}] ${message}`);
    };
    
    // 创建复位策略管理器
    const manager = new ResetStrategyManager(mockPort, config, debugCallback);
    
    // 执行复位
    console.log('\n开始执行复位...');
    const success = await manager.executeReset();
    console.log(`复位结果: ${success ? '成功' : '失败'}`);
    
    // 查看信号历史
    const signalHistory = mockPort.getSignalHistory();
    console.log(`\n串口信号操作次数: ${signalHistory.length}`);
    
    console.log('');
}

/**
 * 示例：Linux系统特定场景
 */
async function linuxSpecificExample() {
    console.log('=== Linux系统特定示例 ===');

    const mockPort = new (global.MockSerialPort || MockSerialPort)();
    const linuxConfig = PlatformDetector.getPlatformConfig('linux');
    
    console.log('Linux系统配置:');
    console.log(`- 复位延迟: ${linuxConfig.resetDelay}ms`);
    console.log(`- 恢复延迟: ${linuxConfig.recoveryDelay}ms`);
    console.log(`- 首选策略: ${linuxConfig.preferredStrategy}`);
    
    const debugLogs = [];
    const debugCallback = (level, message, data) => {
        debugLogs.push({ level, message, data });
        if (level === 'info' || level === 'warning' || level === 'error') {
            console.log(`[${level.toUpperCase()}] ${message}`);
        }
    };
    
    const manager = new ResetStrategyManager(mockPort, linuxConfig, debugCallback);
    
    // 显示策略执行顺序
    const strategyOrder = manager.getStrategyOrder();
    console.log(`\n策略执行顺序: ${strategyOrder.join(' -> ')}`);
    
    // 执行复位
    console.log('\n执行Linux优化的复位策略...');
    const success = await manager.executeReset();
    
    if (success) {
        console.log('✅ Linux系统复位成功！');
        console.log(`成功策略: ${manager.getLastSuccessfulStrategy()}`);
    } else {
        console.log('❌ Linux系统复位失败');
        
        // 显示错误建议
        const errorMessages = PlatformDetector.getPlatformErrorMessages('linux');
        console.log('\n故障排除建议:');
        console.log(errorMessages.resetFailed);
    }
    
    console.log('');
}

/**
 * 示例：策略历史和统计
 */
async function historyAndStatisticsExample() {
    console.log('=== 策略历史和统计示例 ===');

    const mockPort = new (global.MockSerialPort || MockSerialPort)();
    const config = PlatformDetector.getPlatformConfig('linux');
    const manager = new ResetStrategyManager(mockPort, config);

    // 模拟多次复位尝试
    console.log('模拟多次复位尝试...');
    
    // 模拟一些成功和失败的记录
    manager.recordSuccess('esp32');
    manager.recordSuccess('original');
    manager.recordFailure('extended', '设备无响应');
    manager.recordSuccess('esp32');
    manager.recordFailure('original', '信号异常');
    
    // 显示历史记录
    const history = manager.getAttemptHistory();
    console.log(`\n历史记录 (${history.length} 条):`);
    history.forEach((record, index) => {
        const status = record.result === 'success' ? '✅' : '❌';
        const error = record.error ? ` (${record.error})` : '';
        console.log(`${index + 1}. ${status} ${record.strategy}${error}`);
    });
    
    // 显示统计信息
    const stats = manager.getStatistics();
    console.log('\n统计信息:');
    console.log(`- 总尝试次数: ${stats.totalAttempts}`);
    console.log(`- 成功次数: ${stats.successCount}`);
    console.log(`- 失败次数: ${stats.failureCount}`);
    console.log(`- 成功率: ${stats.successRate}`);
    
    console.log('\n各策略统计:');
    Object.keys(stats.strategies).forEach(strategy => {
        const strategyStats = stats.strategies[strategy];
        console.log(`- ${strategy}: 成功${strategyStats.success}次, 失败${strategyStats.failure}次`);
    });
    
    // 显示最后成功的策略
    const lastSuccessful = manager.getLastSuccessfulStrategy();
    console.log(`\n最后成功策略: ${lastSuccessful}`);
    
    console.log('');
}

/**
 * 示例：跨平台兼容性
 */
async function crossPlatformExample() {
    console.log('=== 跨平台兼容性示例 ===');

    const platforms = ['windows', 'linux', 'macos', 'unknown'];
    
    for (const platform of platforms) {
        console.log(`\n--- ${platform.toUpperCase()} 平台 ---`);
        
        const config = PlatformDetector.getPlatformConfig(platform);
        const mockPort = new (global.MockSerialPort || MockSerialPort)();
        const manager = new ResetStrategyManager(mockPort, config);
        
        console.log(`配置: ${config.description}`);
        console.log(`首选策略: ${config.preferredStrategy}`);
        console.log(`复位延迟: ${config.resetDelay}ms`);
        console.log(`恢复延迟: ${config.recoveryDelay}ms`);
        
        const strategyOrder = manager.getStrategyOrder();
        console.log(`策略顺序: ${strategyOrder.join(' -> ')}`);
        
        // 模拟执行第一个策略
        try {
            await manager.tryStrategy(strategyOrder[0]);
            console.log(`✅ ${strategyOrder[0]} 策略执行成功`);
        } catch (error) {
            console.log(`❌ ${strategyOrder[0]} 策略执行失败: ${error.message}`);
        }
    }
    
    console.log('');
}

/**
 * 示例：集成到T5AI下载器的场景
 */
async function t5aiIntegrationExample() {
    console.log('=== T5AI下载器集成示例 ===');

    // 模拟T5AI下载器的复位流程
    const platform = PlatformDetector.detectPlatform();
    const config = PlatformDetector.getPlatformConfig(platform);
    const mockPort = new (global.MockSerialPort || MockSerialPort)();
    
    console.log('T5AI下载器初始化...');
    console.log(`检测到平台: ${platform}`);
    console.log(`使用配置: ${config.description}`);
    
    // 创建复位策略管理器
    const debugCallback = (level, message, data) => {
        if (level === 'info') {
            console.log(`[T5AI] ${message}`);
        } else if (level === 'warning' || level === 'error') {
            console.log(`[T5AI-${level.toUpperCase()}] ${message}`);
        }
    };
    
    const resetManager = new ResetStrategyManager(mockPort, config, debugCallback);
    
    // 模拟获取总线控制权的过程
    console.log('\n=== 步骤1: 获取总线控制权 ===');
    
    const maxTryCount = 3; // 简化示例，只尝试3次
    let busControlSuccess = false;
    
    for (let attempt = 1; attempt <= maxTryCount; attempt++) {
        console.log(`尝试 ${attempt}/${maxTryCount}`);
        
        // 执行复位
        const resetSuccess = await resetManager.executeReset();
        
        if (resetSuccess) {
            // 模拟LinkCheck验证
            console.log('执行LinkCheck验证...');
            
            // 模拟成功概率（实际中这取决于设备响应）
            const linkCheckSuccess = Math.random() > 0.3; // 70%成功率
            
            if (linkCheckSuccess) {
                console.log('✅ LinkCheck成功，获取总线控制权');
                busControlSuccess = true;
                break;
            } else {
                console.log('❌ LinkCheck失败，继续尝试');
            }
        } else {
            console.log('❌ 复位失败，继续尝试');
        }
        
        if (attempt < maxTryCount) {
            console.log('等待后重试...');
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    
    if (busControlSuccess) {
        console.log('\n🎉 T5AI设备连接成功！');
        
        // 显示成功的策略
        const successfulStrategy = resetManager.getLastSuccessfulStrategy();
        console.log(`成功策略: ${successfulStrategy}`);
        
        // 显示统计信息
        const stats = resetManager.getStatistics();
        console.log(`复位尝试统计: 成功${stats.successCount}次, 失败${stats.failureCount}次`);
        
    } else {
        console.log('\n❌ T5AI设备连接失败');
        
        // 显示故障排除建议
        const errorMessages = PlatformDetector.getPlatformErrorMessages(platform);
        console.log('\n故障排除建议:');
        console.log(errorMessages.resetFailed);
    }
    
    console.log('');
}

/**
 * 运行所有示例
 */
async function runAllExamples() {
    console.log('ResetStrategyManager 使用示例\n');

    await basicUsageExample();
    await linuxSpecificExample();
    await historyAndStatisticsExample();
    await crossPlatformExample();
    await t5aiIntegrationExample();

    console.log('所有示例运行完成！');
}

// 如果直接运行此文件，执行示例
if (typeof require !== 'undefined' && require.main === module) {
    runAllExamples();
}

// 导出示例函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runAllExamples,
        basicUsageExample,
        linuxSpecificExample,
        historyAndStatisticsExample,
        crossPlatformExample,
        t5aiIntegrationExample
    };
}