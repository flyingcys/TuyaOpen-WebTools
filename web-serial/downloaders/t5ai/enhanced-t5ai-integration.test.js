/**
 * 增强版T5AI下载器集成测试
 * 测试平台检测和复位策略管理器的集成功能
 */

// 导入依赖
let T5Downloader, PlatformDetector, ResetStrategyManager;
if (typeof require !== 'undefined') {
    // 需要先加载依赖模块
    PlatformDetector = require('../utils/platform-detector.js');
    ResetStrategyManager = require('../utils/reset-strategy-manager.js');
    
    // 设置全局变量以供T5Downloader使用
    global.PlatformDetector = PlatformDetector;
    global.ResetStrategyManager = ResetStrategyManager;
    
    // 模拟BaseDownloader类
    global.BaseDownloader = class BaseDownloader {
        constructor(serialPort, debugCallback) {
            this.port = serialPort;
            this.debug = debugCallback || (() => {});
            this.stopFlag = false;
        }
        
        isPortDisconnectionError(error) {
            return error.message && error.message.includes('disconnected');
        }
    };
    
    // 现在加载T5Downloader
    eval(require('fs').readFileSync('./t5ai-downloader.js', 'utf8'));
    T5Downloader = global.T5Downloader;
} else {
    T5Downloader = window.T5Downloader;
    PlatformDetector = window.PlatformDetector;
    ResetStrategyManager = window.ResetStrategyManager;
}

/**
 * 模拟串口对象
 */
class MockSerialPort {
    constructor() {
        this.signals = {};
        this.signalHistory = [];
        this.readable = {
            getReader: () => ({
                read: async () => ({ value: new Uint8Array([0x04, 0x0E, 0x05, 0x01, 0xE0, 0xFC, 0x01, 0x00]), done: false }),
                releaseLock: () => {}
            })
        };
        this.writable = {
            getWriter: () => ({
                write: async (data) => {},
                releaseLock: () => {}
            })
        };
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
 * 测试套件：基本集成功能
 */
async function testBasicIntegration() {
    console.log('开始测试基本集成功能...');

    const mockPort = new MockSerialPort();
    const debugLogs = [];
    const debugCallback = (level, message, data) => {
        debugLogs.push({ level, message, data });
    };

    // 创建增强版T5AI下载器
    const downloader = new T5Downloader(mockPort, debugCallback);

    // 验证增强功能初始化
    console.assert(typeof downloader.platform === 'string', '平台检测失败');
    console.assert(typeof downloader.platformConfig === 'object', '平台配置获取失败');
    console.assert(typeof downloader.hasEnhancedFeatures === 'boolean', '增强功能标志缺失');
    console.log('✓ 增强功能初始化正确');

    // 验证平台信息
    const platformInfo = downloader.getPlatformInfo();
    console.assert(typeof platformInfo === 'object', '平台信息获取失败');
    console.assert('platform' in platformInfo, '平台信息缺少platform字段');
    console.assert('config' in platformInfo, '平台信息缺少config字段');
    console.log('✓ 平台信息获取正确');

    console.log('基本集成功能测试完成\n');
}

/**
 * 测试套件：复位功能集成
 */
async function testResetIntegration() {
    console.log('开始测试复位功能集成...');

    const mockPort = new MockSerialPort();
    const debugLogs = [];
    const debugCallback = (level, message, data) => {
        debugLogs.push({ level, message, data });
        if (level === 'info' || level === 'main') {
            console.log(`[${level.toUpperCase()}] ${message}`);
        }
    };

    const downloader = new T5Downloader(mockPort, debugCallback);

    // 测试复位策略管理器初始化
    downloader.initializeResetStrategyManager();
    console.assert(downloader.resetStrategyManager !== null, '复位策略管理器初始化失败');
    console.log('✓ 复位策略管理器初始化正确');

    // 测试增强复位执行
    console.log('\n执行增强复位测试...');
    const resetSuccess = await downloader.executeEnhancedReset(1);
    console.assert(resetSuccess === true, '增强复位执行失败');
    console.log('✓ 增强复位执行成功');

    // 验证信号历史
    const signalHistory = mockPort.getSignalHistory();
    console.assert(signalHistory.length > 0, '没有记录到串口信号操作');
    console.log(`✓ 记录到${signalHistory.length}次串口信号操作`);

    console.log('复位功能集成测试完成\n');
}

/**
 * 测试套件：平台特定配置
 */
async function testPlatformSpecificConfig() {
    console.log('开始测试平台特定配置...');

    // 模拟不同平台环境
    const platforms = ['linux', 'windows', 'macos'];
    
    for (const platform of platforms) {
        console.log(`\n测试${platform}平台配置...`);
        
        const mockPort = new MockSerialPort();
        const debugCallback = (level, message, data) => {};
        
        // 临时修改平台检测结果
        const originalDetectPlatform = PlatformDetector.detectPlatform;
        PlatformDetector.detectPlatform = () => platform;
        
        const downloader = new T5Downloader(mockPort, debugCallback);
        
        // 验证平台特定配置
        console.assert(downloader.platform === platform, `${platform}平台检测失败`);
        
        const config = downloader.platformConfig;
        if (platform === 'linux') {
            console.assert(config.resetDelay === 500, 'Linux复位延迟配置错误');
            console.assert(config.preferredStrategy === 'esp32', 'Linux首选策略配置错误');
        } else if (platform === 'windows') {
            console.assert(config.resetDelay === 300, 'Windows复位延迟配置错误');
            console.assert(config.preferredStrategy === 'original', 'Windows首选策略配置错误');
        }
        
        console.log(`✓ ${platform}平台配置正确`);
        
        // 恢复原始方法
        PlatformDetector.detectPlatform = originalDetectPlatform;
    }

    console.log('平台特定配置测试完成\n');
}

/**
 * 测试套件：向后兼容性
 */
async function testBackwardCompatibility() {
    console.log('开始测试向后兼容性...');

    const mockPort = new MockSerialPort();
    const debugCallback = (level, message, data) => {};

    const downloader = new T5Downloader(mockPort, debugCallback);

    // 测试原始方法仍然可用
    console.assert(typeof downloader.setProgressCallback === 'function', 'setProgressCallback方法缺失');
    console.assert(typeof downloader.setDebugMode === 'function', 'setDebugMode方法缺失');
    console.assert(typeof downloader.mainLog === 'function', 'mainLog方法缺失');
    console.assert(typeof downloader.clearBuffer === 'function', 'clearBuffer方法缺失');
    console.log('✓ 原始方法保持可用');

    // 测试原始复位方法
    const originalResetSuccess = await downloader.executeOriginalReset();
    console.assert(originalResetSuccess === true, '原始复位方法执行失败');
    console.log('✓ 原始复位方法正常工作');

    // 测试禁用增强功能
    downloader.setEnhancedResetEnabled(false);
    console.assert(downloader.enhancedResetEnabled === false, '增强功能禁用失败');
    console.log('✓ 增强功能可以正确禁用');

    console.log('向后兼容性测试完成\n');
}

/**
 * 测试套件：错误处理
 */
async function testErrorHandling() {
    console.log('开始测试错误处理...');

    const mockPort = new MockSerialPort();
    const debugLogs = [];
    const debugCallback = (level, message, data) => {
        debugLogs.push({ level, message, data });
    };

    const downloader = new T5Downloader(mockPort, debugCallback);

    // 测试诊断信息获取
    const diagnostics = downloader.getDiagnosticInfo();
    console.assert(typeof diagnostics === 'object', '诊断信息获取失败');
    console.assert('platform' in diagnostics, '诊断信息缺少平台信息');
    console.assert('resetHistory' in diagnostics, '诊断信息缺少复位历史');
    console.assert('timestamp' in diagnostics, '诊断信息缺少时间戳');
    console.log('✓ 诊断信息获取正确');

    // 测试历史记录功能
    downloader.recordResetAttempt(1, true, 100, null);
    downloader.recordResetAttempt(2, false, 200, '测试错误');
    
    const history = downloader.getResetAttemptHistory();
    console.assert(history.length === 2, '历史记录数量不正确');
    console.assert(history[0].success === true, '第一条历史记录不正确');
    console.assert(history[1].success === false, '第二条历史记录不正确');
    console.log('✓ 历史记录功能正确');

    // 测试清除历史记录
    downloader.clearResetHistory();
    const clearedHistory = downloader.getResetAttemptHistory();
    console.assert(clearedHistory.length === 0, '历史记录清除失败');
    console.log('✓ 历史记录清除功能正确');

    console.log('错误处理测试完成\n');
}

/**
 * 测试套件：性能和资源管理
 */
async function testPerformanceAndResources() {
    console.log('开始测试性能和资源管理...');

    const mockPort = new MockSerialPort();
    const debugCallback = (level, message, data) => {};

    // 创建多个下载器实例测试资源使用
    const downloaders = [];
    for (let i = 0; i < 5; i++) {
        downloaders.push(new T5Downloader(mockPort, debugCallback));
    }

    // 验证每个实例都有独立的配置
    downloaders.forEach((downloader, index) => {
        console.assert(downloader.platformConfig !== null, `下载器${index}配置缺失`);
        console.assert(Array.isArray(downloader.resetAttemptHistory), `下载器${index}历史记录初始化失败`);
    });
    console.log('✓ 多实例资源管理正确');

    // 测试内存使用 - 历史记录限制
    const downloader = downloaders[0];
    
    // 添加超过限制的历史记录
    for (let i = 0; i < 25; i++) {
        downloader.recordResetAttempt(i, i % 2 === 0, 100, null);
    }
    
    const history = downloader.getResetAttemptHistory();
    console.assert(history.length <= 20, '历史记录限制失效');
    console.log('✓ 历史记录内存限制正确');

    console.log('性能和资源管理测试完成\n');
}

/**
 * 运行所有测试
 */
async function runAllTests() {
    console.log('=== 增强版T5AI下载器集成测试开始 ===\n');

    try {
        await testBasicIntegration();
        await testResetIntegration();
        await testPlatformSpecificConfig();
        await testBackwardCompatibility();
        await testErrorHandling();
        await testPerformanceAndResources();

        console.log('=== 所有集成测试通过！ ===');
        return true;
    } catch (error) {
        console.error('集成测试失败:', error);
        console.log('=== 集成测试失败！ ===');
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
        testBasicIntegration,
        testResetIntegration,
        testPlatformSpecificConfig,
        testBackwardCompatibility,
        testErrorHandling,
        testPerformanceAndResources,
        MockSerialPort
    };
}