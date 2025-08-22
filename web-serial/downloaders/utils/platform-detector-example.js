/**
 * PlatformDetector 使用示例
 * 展示如何在T5AI固件烧录工具中使用平台检测功能
 */

// 导入PlatformDetector
let PlatformDetector;
if (typeof require !== 'undefined') {
    PlatformDetector = require('./platform-detector.js');
} else {
    PlatformDetector = window.PlatformDetector;
}

/**
 * 示例：基本平台检测和配置获取
 */
function basicUsageExample() {
    console.log('=== 基本使用示例 ===');
    
    // 检测当前平台
    const platform = PlatformDetector.detectPlatform();
    console.log(`检测到平台: ${platform}`);
    
    // 获取平台特定配置
    const config = PlatformDetector.getPlatformConfig();
    console.log('平台配置:', config);
    
    // 获取平台详细信息
    const info = PlatformDetector.getPlatformInfo();
    console.log('平台详细信息:', {
        platform: info.platform,
        userAgent: info.userAgent.substring(0, 50) + '...',
        config: info.config.description
    });
    
    console.log('');
}

/**
 * 示例：在T5AI下载器中的使用场景
 */
function t5aiDownloaderExample() {
    console.log('=== T5AI下载器使用示例 ===');
    
    // 模拟T5AI下载器的初始化过程
    const platform = PlatformDetector.detectPlatform();
    const config = PlatformDetector.getPlatformConfig(platform);
    
    console.log(`T5AI下载器初始化 - 平台: ${platform}`);
    console.log(`使用配置: ${config.description}`);
    console.log(`复位延迟: ${config.resetDelay}ms`);
    console.log(`恢复延迟: ${config.recoveryDelay}ms`);
    console.log(`首选策略: ${config.preferredStrategy}`);
    
    // 根据平台选择不同的处理逻辑
    if (platform === 'linux') {
        console.log('检测到Linux系统，将使用Ubuntu优化配置');
        console.log('- 增加复位延迟以提高稳定性');
        console.log('- 优先使用ESP32风格复位策略');
        console.log('- 增加LinkCheck命令间隔');
    } else if (platform === 'windows') {
        console.log('检测到Windows系统，使用标准配置');
        console.log('- 使用原始T5AI复位策略');
        console.log('- 标准延迟参数');
    } else {
        console.log(`检测到${platform}系统，使用保守配置`);
        console.log('- 使用扩展复位策略');
        console.log('- 较长的延迟参数以确保兼容性');
    }
    
    console.log('');
}

/**
 * 示例：错误处理和用户提示
 */
function errorHandlingExample() {
    console.log('=== 错误处理示例 ===');
    
    const platform = PlatformDetector.detectPlatform();
    const errorMessages = PlatformDetector.getPlatformErrorMessages(platform);
    
    console.log(`${platform}系统的错误处理信息:`);
    
    // 模拟复位失败的情况
    console.log('\n模拟复位失败场景:');
    console.log(errorMessages.resetFailed);
    
    // 模拟权限问题（Linux特有）
    if (platform === 'linux') {
        console.log('\n模拟权限问题场景:');
        console.log(errorMessages.permissionDenied);
    }
    
    // 模拟设备未找到
    console.log('\n模拟设备未找到场景:');
    console.log(errorMessages.deviceNotFound);
    
    console.log('');
}

/**
 * 示例：配置验证
 */
function configValidationExample() {
    console.log('=== 配置验证示例 ===');
    
    // 测试有效配置
    const validConfig = {
        resetDelay: 500,
        recoveryDelay: 10,
        linkCheckDelay: 2,
        maxRetries: 100,
        preferredStrategy: 'esp32'
    };
    
    const isValid = PlatformDetector.validateConfig(validConfig);
    console.log('有效配置验证结果:', isValid ? '通过' : '失败');
    
    // 测试无效配置
    const invalidConfig = {
        resetDelay: -100, // 无效的负数
        recoveryDelay: 10,
        linkCheckDelay: 2,
        maxRetries: 100,
        preferredStrategy: 'unknown_strategy' // 无效策略
    };
    
    const isInvalid = PlatformDetector.validateConfig(invalidConfig);
    console.log('无效配置验证结果:', isInvalid ? '通过（错误）' : '失败（正确）');
    
    console.log('');
}

/**
 * 运行所有示例
 */
function runAllExamples() {
    console.log('PlatformDetector 使用示例\n');
    
    basicUsageExample();
    t5aiDownloaderExample();
    errorHandlingExample();
    configValidationExample();
    
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
        t5aiDownloaderExample,
        errorHandlingExample,
        configValidationExample
    };
}