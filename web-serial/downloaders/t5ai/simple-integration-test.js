/**
 * 简单的T5AI下载器集成测试
 * 验证平台检测和复位策略管理器的集成
 */

// 加载依赖模块
const PlatformDetector = require('../utils/platform-detector.js');
const ResetStrategyManager = require('../utils/reset-strategy-manager.js');

// 模拟串口
class MockSerialPort {
    constructor() {
        this.signals = { dataTerminalReady: false, requestToSend: false };
        this.signalHistory = [];
    }
    
    async setSignals(signals) {
        Object.assign(this.signals, signals);
        this.signalHistory.push({ ...this.signals, timestamp: Date.now() });
    }
    
    getSignalHistory() {
        return this.signalHistory;
    }
}

// 模拟BaseDownloader
class BaseDownloader {
    constructor(serialPort, debugCallback) {
        this.port = serialPort;
        this.debug = debugCallback || (() => {});
        this.stopFlag = false;
    }
    
    isPortDisconnectionError(error) {
        return error.message && error.message.includes('disconnected');
    }
}

// 设置全局变量
global.BaseDownloader = BaseDownloader;
global.PlatformDetector = PlatformDetector;
global.ResetStrategyManager = ResetStrategyManager;

// 加载T5Downloader
const fs = require('fs');
const t5aiCode = fs.readFileSync('./t5ai-downloader.js', 'utf8');
eval(t5aiCode);

// 测试函数
async function testIntegration() {
    console.log('=== T5AI下载器集成测试开始 ===\\n');
    
    try {
        // 1. 测试平台检测
        console.log('1. 测试平台检测...');
        const platform = PlatformDetector.detectPlatform();
        const config = PlatformDetector.getPlatformConfig(platform);
        console.log(`✓ 检测到平台: ${platform}`);
        console.log(`✓ 平台配置: ${config.description}`);
        console.log(`✓ 首选策略: ${config.preferredStrategy}\\n`);
        
        // 2. 测试T5Downloader初始化
        console.log('2. 测试T5Downloader初始化...');
        const mockPort = new MockSerialPort();
        const debugCallback = (level, message) => {
            if (level === 'info' || level === 'main') {
                console.log(`[${level.toUpperCase()}] ${message}`);
            }
        };
        
        const downloader = new T5Downloader(mockPort, debugCallback);
        console.log(`✓ T5Downloader创建成功`);
        console.log(`✓ 增强功能状态: ${downloader.hasEnhancedFeatures ? '启用' : '禁用'}`);
        console.log(`✓ 检测平台: ${downloader.platform}`);
        console.log(`✓ 平台配置: ${downloader.platformConfig.description}\\n`);
        
        // 3. 测试复位策略管理器初始化
        console.log('3. 测试复位策略管理器...');
        downloader.initializeResetStrategyManager();
        
        if (downloader.resetStrategyManager) {
            const strategies = downloader.resetStrategyManager.getAllStrategies();
            console.log(`✓ 复位策略管理器初始化成功`);
            console.log(`✓ 可用策略数量: ${strategies.length}`);
            strategies.forEach(strategy => {
                console.log(`  - ${strategy.id}: ${strategy.name}`);
            });
        } else {
            console.log('⚠️ 复位策略管理器未初始化（可能是增强功能不可用）');
        }
        console.log('');
        
        // 4. 测试复位功能（模拟）
        console.log('4. 测试复位功能...');
        const resetSuccess = await downloader.executeReset(1);
        console.log(`✓ 复位执行结果: ${resetSuccess ? '成功' : '失败'}`);
        
        const signalHistory = mockPort.getSignalHistory();
        console.log(`✓ 串口信号变化次数: ${signalHistory.length}`);
        if (signalHistory.length > 0) {
            console.log('  信号变化历史:');
            signalHistory.forEach((signal, index) => {
                console.log(`    ${index + 1}. DTR=${signal.dataTerminalReady}, RTS=${signal.requestToSend}`);
            });
        }
        console.log('');
        
        // 5. 测试平台信息获取
        console.log('5. 测试平台信息获取...');
        const platformInfo = downloader.getPlatformInfo();
        console.log(`✓ 平台信息获取成功:`);
        console.log(`  - 平台: ${platformInfo.platform}`);
        console.log(`  - 增强功能: ${platformInfo.enhancedFeatures}`);
        console.log(`  - 配置描述: ${platformInfo.config.description}`);
        console.log('');
        
        // 6. 测试诊断信息
        console.log('6. 测试诊断信息...');
        const diagnostics = downloader.getDiagnosticInfo();
        console.log(`✓ 诊断信息获取成功:`);
        console.log(`  - 增强功能状态: ${diagnostics.hasEnhancedFeatures}`);
        console.log(`  - 增强复位启用: ${diagnostics.enhancedResetEnabled}`);
        console.log(`  - 复位历史记录数: ${diagnostics.resetHistory.length}`);
        console.log('');
        
        console.log('🎉 所有集成测试通过！');
        return true;
        
    } catch (error) {
        console.error(`❌ 集成测试失败: ${error.message}`);
        console.error(error.stack);
        return false;
    }
}

// 运行测试
if (require.main === module) {
    testIntegration().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = { testIntegration };