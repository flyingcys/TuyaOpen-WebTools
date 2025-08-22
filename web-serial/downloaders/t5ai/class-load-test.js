/**
 * 测试T5Downloader类是否能正确加载
 */

console.log('开始测试T5Downloader类加载...');

try {
    // 1. 加载依赖
    const PlatformDetector = require('../utils/platform-detector.js');
    const ResetStrategyManager = require('../utils/reset-strategy-manager.js');
    console.log('✓ 依赖模块加载成功');
    
    // 2. 设置全局变量
    global.PlatformDetector = PlatformDetector;
    global.ResetStrategyManager = ResetStrategyManager;
    
    // 3. 模拟BaseDownloader
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
    console.log('✓ BaseDownloader模拟完成');
    
    // 4. 直接require T5Downloader
    try {
        const T5Downloader = require('./t5ai-downloader.js');
        console.log('✓ T5Downloader require成功');
        console.log(`✓ T5Downloader类型: ${typeof T5Downloader}`);
        console.log(`✓ T5Downloader是否为函数: ${typeof T5Downloader === 'function'}`);
        
        // 5. 尝试创建实例
        const mockPort = {
            setSignals: async (signals) => {},
            readable: { getReader: () => ({ read: async () => ({ done: true }) }) },
            writable: { getWriter: () => ({ write: async () => {}, releaseLock: () => {} }) }
        };
        
        const instance = new T5Downloader(mockPort, console.log);
        console.log('✓ T5Downloader实例创建成功');
        console.log(`✓ 实例类型: ${typeof instance}`);
        console.log(`✓ 增强功能: ${instance.hasEnhancedFeatures}`);
        console.log(`✓ 平台: ${instance.platform}`);
        
        console.log('🎉 T5Downloader类加载测试成功！');
        
    } catch (requireError) {
        console.error('❌ require T5Downloader失败:', requireError.message);
        throw requireError;
    }
    
} catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error(error.stack);
    process.exit(1);
}