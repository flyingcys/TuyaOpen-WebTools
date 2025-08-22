/**
 * PlatformDetector 单元测试
 * 测试平台检测功能的准确性和配置的有效性
 */

// 导入PlatformDetector
let PlatformDetector;
if (typeof require !== 'undefined') {
    PlatformDetector = require('./platform-detector.js');
} else {
    PlatformDetector = window.PlatformDetector;
}

/**
 * 测试套件：平台配置功能
 */
function testPlatformConfig() {
    console.log('开始测试平台配置功能...');
    
    // 测试获取所有平台配置
    const allConfigs = PlatformDetector.getPlatformConfigs();
    console.assert(typeof allConfigs === 'object', '获取所有配置失败');
    console.assert('windows' in allConfigs, 'Windows配置缺失');
    console.assert('linux' in allConfigs, 'Linux配置缺失');
    console.assert('macos' in allConfigs, 'macOS配置缺失');
    console.assert('unknown' in allConfigs, '未知平台配置缺失');
    console.log('✓ 所有平台配置存在');
    
    // 测试Linux平台配置（重点测试）
    const linuxConfig = PlatformDetector.getPlatformConfig('linux');
    console.assert(linuxConfig.resetDelay === 500, `Linux复位延迟配置错误: ${linuxConfig.resetDelay}`);
    console.assert(linuxConfig.recoveryDelay === 10, `Linux恢复延迟配置错误: ${linuxConfig.recoveryDelay}`);
    console.assert(linuxConfig.preferredStrategy === 'esp32', `Linux首选策略配置错误: ${linuxConfig.preferredStrategy}`);
    console.log('✓ Linux平台配置正确');
    
    // 测试Windows平台配置
    const windowsConfig = PlatformDetector.getPlatformConfig('windows');
    console.assert(windowsConfig.resetDelay === 300, `Windows复位延迟配置错误: ${windowsConfig.resetDelay}`);
    console.assert(windowsConfig.preferredStrategy === 'original', `Windows首选策略配置错误: ${windowsConfig.preferredStrategy}`);
    console.log('✓ Windows平台配置正确');
    
    // 测试配置验证功能
    const validConfig = {
        resetDelay: 300,
        recoveryDelay: 4,
        linkCheckDelay: 1,
        maxRetries: 100,
        preferredStrategy: 'original'
    };
    console.assert(PlatformDetector.validateConfig(validConfig), '有效配置验证失败');
    console.log('✓ 有效配置验证正确');
    
    // 测试无效配置检测
    const invalidConfig = {
        resetDelay: -1, // 无效的负数
        recoveryDelay: 4,
        linkCheckDelay: 1,
        maxRetries: 100,
        preferredStrategy: 'invalid' // 无效的策略
    };
    console.assert(!PlatformDetector.validateConfig(invalidConfig), '无效配置验证失败');
    console.log('✓ 无效配置检测正确');
    
    console.log('平台配置功能测试完成\n');
}

/**
 * 测试套件：错误信息功能
 */
function testErrorMessages() {
    console.log('开始测试错误信息功能...');
    
    // 测试Linux错误信息
    const linuxErrors = PlatformDetector.getPlatformErrorMessages('linux');
    console.assert(typeof linuxErrors === 'object', 'Linux错误信息获取失败');
    console.assert('resetFailed' in linuxErrors, 'Linux复位失败信息缺失');
    console.assert('permissionDenied' in linuxErrors, 'Linux权限错误信息缺失');
    console.assert(linuxErrors.resetFailed.includes('dialout'), 'Linux错误信息不包含dialout组提示');
    console.log('✓ Linux错误信息正确');
    
    // 测试Windows错误信息
    const windowsErrors = PlatformDetector.getPlatformErrorMessages('windows');
    console.assert(typeof windowsErrors === 'object', 'Windows错误信息获取失败');
    console.assert('resetFailed' in windowsErrors, 'Windows复位失败信息缺失');
    console.assert('driverIssue' in windowsErrors, 'Windows驱动错误信息缺失');
    console.log('✓ Windows错误信息正确');
    
    // 测试未知平台错误信息
    const unknownErrors = PlatformDetector.getPlatformErrorMessages('unknown');
    console.assert(typeof unknownErrors === 'object', '未知平台错误信息获取失败');
    console.assert('resetFailed' in unknownErrors, '未知平台复位失败信息缺失');
    console.log('✓ 未知平台错误信息正确');
    
    console.log('错误信息功能测试完成\n');
}

/**
 * 测试配置参数的合理性
 */
function testConfigReasonableness() {
    console.log('开始测试配置参数合理性...');
    
    const configs = PlatformDetector.getPlatformConfigs();
    
    // 验证Linux配置针对Ubuntu问题的优化
    const linuxConfig = configs.linux;
    console.assert(linuxConfig.resetDelay > configs.windows.resetDelay, 'Linux复位延迟应该比Windows更长');
    console.assert(linuxConfig.recoveryDelay > configs.windows.recoveryDelay, 'Linux恢复延迟应该比Windows更长');
    console.assert(linuxConfig.preferredStrategy === 'esp32', 'Linux应该优先使用ESP32策略');
    console.log('✓ Linux配置针对Ubuntu问题进行了优化');
    
    // 验证所有配置的基本合理性
    Object.keys(configs).forEach(platform => {
        const config = configs[platform];
        console.assert(config.resetDelay > 0, `${platform}平台复位延迟必须大于0`);
        console.assert(config.recoveryDelay > 0, `${platform}平台恢复延迟必须大于0`);
        console.assert(config.maxRetries > 0, `${platform}平台最大重试次数必须大于0`);
        console.assert(['original', 'esp32', 'extended'].includes(config.preferredStrategy), 
                      `${platform}平台首选策略必须是有效值`);
    });
    console.log('✓ 所有平台配置参数合理');
    
    console.log('配置参数合理性测试完成\n');
}

/**
 * 运行所有测试
 */
function runAllTests() {
    console.log('=== PlatformDetector 单元测试开始 ===\n');
    
    try {
        testPlatformConfig();
        testErrorMessages();
        testConfigReasonableness();
        
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
        testPlatformConfig,
        testErrorMessages,
        testConfigReasonableness
    };
}