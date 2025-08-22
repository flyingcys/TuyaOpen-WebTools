/**
 * ResetStrategyManager 单元测试
 * 测试复位策略管理器的功能
 */

// 导入依赖
let ResetStrategyManager, PlatformDetector;
if (typeof require !== 'undefined') {
    ResetStrategyManager = require('./reset-strategy-manager.js');
    PlatformDetector = require('./platform-detector.js');
} else {
    ResetStrategyManager = window.ResetStrategyManager;
    PlatformDetector = window.PlatformDetector;
}

/**
 * 模拟串口对象
 */
class MockSerialPort {
    constructor() {
        this.signals = {};
        this.signalHistory = [];
    }

    async setSignals(signals) {
        this.signals = { ...this.signals, ...signals };
        this.signalHistory.push({
            signals: { ...signals },
            timestamp: Date.now()
        });
        
        // 模拟串口操作延迟
        await new Promise(resolve => setTimeout(resolve, 1));
    }

    getSignalHistory() {
        return [...this.signalHistory];
    }

    clearHistory() {
        this.signalHistory = [];
    }
}

/**
 * 测试套件：基本功能测试
 */
function testBasicFunctionality() {
    console.log('开始测试基本功能...');

    const mockPort = new MockSerialPort();
    const linuxConfig = PlatformDetector.getPlatformConfig('linux');
    const manager = new ResetStrategyManager(mockPort, linuxConfig);

    // 测试策略获取
    const strategies = manager.getResetStrategies();
    console.assert(typeof strategies === 'object', '策略获取失败');
    console.assert('original' in strategies, '原始策略缺失');
    console.assert('esp32' in strategies, 'ESP32策略缺失');
    console.assert('extended' in strategies, '扩展策略缺失');
    console.log('✓ 策略定义正确');

    // 测试策略顺序
    const order = manager.getStrategyOrder();
    console.assert(Array.isArray(order), '策略顺序不是数组');
    console.assert(order.length === 3, '策略数量不正确');
    console.assert(order[0] === 'esp32', 'Linux首选策略应该是esp32');
    console.log('✓ 策略顺序正确');

    console.log('基本功能测试完成\n');
}

/**
 * 测试套件：策略执行测试
 */
async function testStrategyExecution() {
    console.log('开始测试策略执行...');

    const mockPort = new MockSerialPort();
    const linuxConfig = PlatformDetector.getPlatformConfig('linux');
    
    // 创建调试回调
    const debugLogs = [];
    const debugCallback = (level, message, data) => {
        debugLogs.push({ level, message, data });
    };
    
    const manager = new ResetStrategyManager(mockPort, linuxConfig, debugCallback);

    // 测试原始策略执行
    console.log('测试原始策略执行...');
    mockPort.clearHistory();
    await manager.tryStrategy('original');
    
    const originalHistory = mockPort.getSignalHistory();
    console.assert(originalHistory.length >= 2, '原始策略信号操作次数不足');
    
    // 检查信号序列
    const firstSignal = originalHistory[0].signals;
    const secondSignal = originalHistory[1].signals;
    console.assert(firstSignal.dataTerminalReady === false, '原始策略第一步DTR应该为false');
    console.assert(firstSignal.requestToSend === true, '原始策略第一步RTS应该为true');
    console.assert(secondSignal.requestToSend === false, '原始策略第二步RTS应该为false');
    console.log('✓ 原始策略执行正确');

    // 测试ESP32策略执行
    console.log('测试ESP32策略执行...');
    mockPort.clearHistory();
    await manager.tryStrategy('esp32');
    
    const esp32History = mockPort.getSignalHistory();
    console.assert(esp32History.length >= 2, 'ESP32策略信号操作次数不足');
    
    const esp32FirstSignal = esp32History[0].signals;
    const esp32SecondSignal = esp32History[1].signals;
    console.assert(esp32FirstSignal.dataTerminalReady === false, 'ESP32策略第一步DTR应该为false');
    console.assert(esp32SecondSignal.dataTerminalReady === true, 'ESP32策略第二步DTR应该为true');
    console.log('✓ ESP32策略执行正确');

    // 测试扩展策略执行
    console.log('测试扩展策略执行...');
    mockPort.clearHistory();
    await manager.tryStrategy('extended');
    
    const extendedHistory = mockPort.getSignalHistory();
    console.assert(extendedHistory.length >= 4, '扩展策略信号操作次数不足');
    console.log('✓ 扩展策略执行正确');

    console.log('策略执行测试完成\n');
}

/**
 * 测试套件：历史记录和统计
 */
function testHistoryAndStatistics() {
    console.log('开始测试历史记录和统计...');

    const mockPort = new MockSerialPort();
    const windowsConfig = PlatformDetector.getPlatformConfig('windows');
    const manager = new ResetStrategyManager(mockPort, windowsConfig);

    // 测试成功记录
    manager.recordSuccess('original');
    manager.recordSuccess('esp32');
    manager.recordFailure('extended', '测试失败');

    const history = manager.getAttemptHistory();
    console.assert(history.length === 3, '历史记录数量不正确');
    console.assert(history[0].result === 'success', '第一条记录应该是成功');
    console.assert(history[2].result === 'failure', '第三条记录应该是失败');
    console.log('✓ 历史记录功能正确');

    // 测试统计信息
    const stats = manager.getStatistics();
    console.assert(stats.totalAttempts === 3, '总尝试次数不正确');
    console.assert(stats.successCount === 2, '成功次数不正确');
    console.assert(stats.failureCount === 1, '失败次数不正确');
    console.assert(stats.successRate === '66.7%', '成功率计算不正确');
    console.log('✓ 统计信息功能正确');

    // 测试最后成功策略
    const lastSuccessful = manager.getLastSuccessfulStrategy();
    console.assert(lastSuccessful === 'esp32', '最后成功策略不正确');
    console.log('✓ 最后成功策略记录正确');

    // 测试清除历史
    manager.clearHistory();
    const clearedHistory = manager.getAttemptHistory();
    console.assert(clearedHistory.length === 0, '历史记录清除失败');
    console.log('✓ 历史记录清除功能正确');

    console.log('历史记录和统计测试完成\n');
}

/**
 * 测试套件：平台特定配置
 */
function testPlatformSpecificConfig() {
    console.log('开始测试平台特定配置...');

    // 测试Linux配置
    const mockPort = new MockSerialPort();
    const linuxConfig = PlatformDetector.getPlatformConfig('linux');
    const linuxManager = new ResetStrategyManager(mockPort, linuxConfig);
    
    const linuxOrder = linuxManager.getStrategyOrder();
    console.assert(linuxOrder[0] === 'esp32', 'Linux应该优先使用ESP32策略');
    console.log('✓ Linux平台配置正确');

    // 测试Windows配置
    const windowsConfig = PlatformDetector.getPlatformConfig('windows');
    const windowsManager = new ResetStrategyManager(mockPort, windowsConfig);
    
    const windowsOrder = windowsManager.getStrategyOrder();
    console.assert(windowsOrder[0] === 'original', 'Windows应该优先使用原始策略');
    console.log('✓ Windows平台配置正确');

    // 测试未知平台配置
    const unknownConfig = PlatformDetector.getPlatformConfig('unknown');
    const unknownManager = new ResetStrategyManager(mockPort, unknownConfig);
    
    const unknownOrder = unknownManager.getStrategyOrder();
    console.assert(unknownOrder[0] === 'extended', '未知平台应该优先使用扩展策略');
    console.log('✓ 未知平台配置正确');

    console.log('平台特定配置测试完成\n');
}

/**
 * 测试套件：错误处理
 */
async function testErrorHandling() {
    console.log('开始测试错误处理...');

    const mockPort = new MockSerialPort();
    const config = PlatformDetector.getPlatformConfig('linux');
    const manager = new ResetStrategyManager(mockPort, config);

    // 测试未知策略
    try {
        await manager.tryStrategy('unknown_strategy');
        console.assert(false, '应该抛出未知策略错误');
    } catch (error) {
        console.assert(error.message.includes('未知的复位策略'), '错误信息不正确');
        console.log('✓ 未知策略错误处理正确');
    }

    console.log('错误处理测试完成\n');
}

/**
 * 运行所有测试
 */
async function runAllTests() {
    console.log('=== ResetStrategyManager 单元测试开始 ===\n');

    try {
        testBasicFunctionality();
        await testStrategyExecution();
        testHistoryAndStatistics();
        testPlatformSpecificConfig();
        await testErrorHandling();

        console.log('=== 所有测试通过！ ===');
        return true;
    } catch (error) {
        console.error('测试失败:', error);
        console.log('=== 测试失败！ ===');
        return false;
    }
}

// 如果直接运行此文件，执行测试
if (typeof require !== 'undefined' && require.main === module) {
    runAllTests();
}

// 导出测试函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runAllTests,
        testBasicFunctionality,
        testStrategyExecution,
        testHistoryAndStatistics,
        testPlatformSpecificConfig,
        testErrorHandling,
        MockSerialPort
    };
}