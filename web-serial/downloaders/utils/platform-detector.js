/**
 * 平台检测器 - 检测当前运行的操作系统并提供平台特定配置
 * 用于T5AI固件烧录工具的跨平台兼容性
 */

class PlatformDetector {
    /**
     * 检测当前运行的操作系统平台
     * @returns {string} 平台标识: 'windows', 'macos', 'linux', 'unknown'
     */
    static detectPlatform() {
        const userAgent = navigator.userAgent.toLowerCase();
        const platform = navigator.platform.toLowerCase();
        
        // 检测Windows
        if (userAgent.includes('windows') || platform.includes('win')) {
            return 'windows';
        }
        
        // 检测macOS
        if (userAgent.includes('mac') || platform.includes('mac')) {
            return 'macos';
        }
        
        // 检测Linux
        if (userAgent.includes('linux') || platform.includes('linux')) {
            return 'linux';
        }
        
        // 未知平台
        return 'unknown';
    }
    
    /**
     * 获取平台特定的配置参数
     * @param {string} platform 平台标识
     * @returns {Object} 平台配置对象
     */
    static getPlatformConfig(platform = null) {
        if (!platform) {
            platform = this.detectPlatform();
        }
        
        const configs = this.getPlatformConfigs();
        return configs[platform] || configs.unknown;
    }
    
    /**
     * 获取所有平台的配置定义
     * @returns {Object} 所有平台配置
     */
    static getPlatformConfigs() {
        return {
            windows: {
                resetDelay: 300,           // 复位信号持续时间(ms)
                recoveryDelay: 4,          // 复位后恢复时间(ms)
                linkCheckDelay: 1,         // LinkCheck命令间隔(ms)
                maxRetries: 100,           // 最大重试次数
                preferredStrategy: 'original',  // 首选复位策略
                description: 'Windows平台配置'
            },
            linux: {
                resetDelay: 500,           // Linux需要更长的复位延迟
                recoveryDelay: 10,         // Linux需要更长的恢复时间
                linkCheckDelay: 2,         // Linux需要更长的LinkCheck间隔
                maxRetries: 100,
                preferredStrategy: 'esp32', // Linux优先使用ESP32风格复位
                description: 'Linux平台配置 - 针对Ubuntu系统优化'
            },
            macos: {
                resetDelay: 300,
                recoveryDelay: 4,
                linkCheckDelay: 1,
                maxRetries: 100,
                preferredStrategy: 'original',
                description: 'macOS平台配置'
            },
            unknown: {
                resetDelay: 400,           // 未知平台使用保守配置
                recoveryDelay: 8,
                linkCheckDelay: 2,
                maxRetries: 100,
                preferredStrategy: 'extended', // 未知平台使用扩展策略
                description: '未知平台默认配置'
            }
        };
    }
    
    /**
     * 获取当前平台的详细信息
     * @returns {Object} 平台详细信息
     */
    static getPlatformInfo() {
        const platform = this.detectPlatform();
        const config = this.getPlatformConfig(platform);
        
        return {
            platform: platform,
            userAgent: navigator.userAgent,
            navigatorPlatform: navigator.platform,
            config: config,
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * 验证平台配置的有效性
     * @param {Object} config 配置对象
     * @returns {boolean} 配置是否有效
     */
    static validateConfig(config) {
        const requiredFields = ['resetDelay', 'recoveryDelay', 'linkCheckDelay', 'maxRetries', 'preferredStrategy'];
        
        for (const field of requiredFields) {
            if (!(field in config)) {
                return false;
            }
            
            // 检查数值字段的有效性
            if (['resetDelay', 'recoveryDelay', 'linkCheckDelay', 'maxRetries'].includes(field)) {
                if (typeof config[field] !== 'number' || config[field] < 0) {
                    return false;
                }
            }
            
            // 检查策略字段的有效性
            if (field === 'preferredStrategy') {
                const validStrategies = ['original', 'esp32', 'extended'];
                if (!validStrategies.includes(config[field])) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    /**
     * 获取平台特定的错误信息和建议
     * @param {string} platform 平台标识
     * @returns {Object} 错误信息配置
     */
    static getPlatformErrorMessages(platform = null) {
        if (!platform) {
            platform = this.detectPlatform();
        }
        
        const errorMessages = {
            linux: {
                resetFailed: '在Linux系统上复位失败。建议检查：\n1. USB线缆连接是否牢固\n2. 设备权限设置（将用户添加到dialout组）\n3. 尝试手动复位设备\n4. 检查是否有其他程序占用串口',
                permissionDenied: 'Linux系统串口权限不足。请执行以下命令：\nsudo usermod -a -G dialout $USER\n然后重新登录系统',
                deviceNotFound: 'Linux系统未找到T5AI设备。请检查：\n1. 设备是否正确连接\n2. USB驱动是否安装\n3. 使用 lsusb 命令查看设备列表',
                troubleshooting: '如果问题持续存在，请尝试：\n1. 更换USB线缆\n2. 使用不同的USB端口\n3. 重启设备和计算机\n4. 检查内核日志：dmesg | tail'
            },
            windows: {
                resetFailed: '在Windows系统上复位失败。建议检查：\n1. 驱动程序是否正确安装\n2. 设备管理器中的串口状态\n3. 是否有其他程序占用串口\n4. 尝试重新插拔设备',
                driverIssue: 'Windows驱动程序问题。请：\n1. 重新安装USB串口驱动\n2. 更新设备驱动程序\n3. 检查设备管理器中的错误标识',
                deviceNotFound: 'Windows系统未找到T5AI设备。请检查：\n1. 设备是否正确连接\n2. 驱动程序是否安装\n3. 设备管理器中是否显示设备',
                troubleshooting: '如果问题持续存在，请尝试：\n1. 以管理员身份运行程序\n2. 禁用防病毒软件的实时保护\n3. 更换USB线缆或端口'
            },
            macos: {
                resetFailed: '在macOS系统上复位失败。建议检查：\n1. 系统权限设置\n2. USB线缆连接\n3. 是否有其他程序占用串口\n4. 安全设置是否阻止访问',
                permissionDenied: 'macOS系统权限不足。请：\n1. 在系统偏好设置中允许程序访问串口\n2. 检查安全与隐私设置\n3. 可能需要重启浏览器',
                deviceNotFound: 'macOS系统未找到T5AI设备。请检查：\n1. 设备是否正确连接\n2. 系统是否识别设备\n3. 使用 system_profiler SPUSBDataType 查看USB设备',
                troubleshooting: '如果问题持续存在，请尝试：\n1. 重置SMC和NVRAM\n2. 更换USB线缆\n3. 检查控制台应用中的错误日志'
            },
            unknown: {
                resetFailed: '在当前系统上复位失败。通用建议：\n1. 检查USB连接\n2. 确认设备驱动正常\n3. 尝试手动复位设备\n4. 重启浏览器和设备',
                permissionDenied: '系统权限不足。请检查：\n1. 用户权限设置\n2. 浏览器权限配置\n3. 系统安全设置',
                deviceNotFound: '未找到T5AI设备。请检查：\n1. 设备连接状态\n2. 驱动程序安装\n3. 设备是否被其他程序占用',
                troubleshooting: '通用故障排除步骤：\n1. 重新连接设备\n2. 重启浏览器\n3. 检查系统日志\n4. 尝试不同的USB端口'
            }
        };
        
        return errorMessages[platform] || errorMessages.unknown;
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlatformDetector;
} else if (typeof window !== 'undefined') {
    window.PlatformDetector = PlatformDetector;
}