/**
 * 增强版T5AI芯片下载器 - 集成平台检测和多策略复位功能
 * 解决Ubuntu系统上T5AI复位问题
 */

// 导入依赖模块
let PlatformDetector, ResetStrategyManager;
if (typeof require !== 'undefined') {
    PlatformDetector = require('../utils/platform-detector.js');
    ResetStrategyManager = require('../utils/reset-strategy-manager.js');
} else {
    // 浏览器环境，假设已经加载了相关脚本
    PlatformDetector = window.PlatformDetector;
    ResetStrategyManager = window.ResetStrategyManager;
}

/**
 * 增强版T5AI下载器类
 * 继承原有T5Downloader的所有功能，并添加平台检测和多策略复位
 */
class EnhancedT5Downloader extends T5Downloader {
    constructor(serialPort, debugCallback) {
        super(serialPort, debugCallback);
        
        // 平台检测和配置
        this.platform = PlatformDetector.detectPlatform();
        this.platformConfig = PlatformDetector.getPlatformConfig(this.platform);
        this.platformInfo = PlatformDetector.getPlatformInfo();
        
        // 复位策略管理器
        this.resetStrategyManager = null;
        
        // 增强功能标志
        this.enhancedResetEnabled = true;
        this.resetAttemptHistory = [];
        
        // 初始化日志
        this.infoLog(`检测到平台: ${this.platform}`);
        this.infoLog(`使用平台配置: ${this.platformConfig.description}`);
        this.debugLog(`平台详细信息: ${JSON.stringify(this.platformInfo, null, 2)}`);
    }

    /**
     * 初始化复位策略管理器
     */
    initializeResetStrategyManager() {
        if (!this.resetStrategyManager) {
            this.resetStrategyManager = new ResetStrategyManager(
                this.port, 
                this.platformConfig, 
                this.debug.bind(this)
            );
            this.debugLog('复位策略管理器初始化完成');
        }
    }

    /**
     * 增强版获取总线控制权 - 集成多策略复位
     * 保持向后兼容性，同时添加新的复位策略
     */
    async getBusControl() {
        this.mainLog('=== 步骤1: 获取总线控制权 ===');
        this.infoLog(`平台: ${this.platform}, 配置: ${this.platformConfig.description}`);
        
        // 初始化复位策略管理器
        this.initializeResetStrategyManager();
        
        const maxTryCount = this.platformConfig.maxRetries;
        this.debugLog(`最大尝试次数: ${maxTryCount}`);
        
        for (let attempt = 1; attempt <= maxTryCount && !this.stopFlag; attempt++) {
            if (attempt % 10 === 1) {
                this.commLog(`尝试 ${attempt}/${maxTryCount} (${this.platform}平台)`);
            }
            
            // 记录尝试开始
            const attemptStart = Date.now();
            
            try {
                // 使用增强复位策略
                const resetSuccess = await this.executeEnhancedReset(attempt);
                
                if (resetSuccess) {
                    // 执行LinkCheck验证
                    const linkCheckSuccess = await this.doLinkCheckEx(60);
                    
                    if (linkCheckSuccess) {
                        const attemptDuration = Date.now() - attemptStart;
                        this.mainLog(`✅ 第${attempt}次尝试成功获取总线控制权 (耗时: ${attemptDuration}ms)`);
                        
                        // 记录成功信息
                        this.recordResetAttempt(attempt, true, attemptDuration, null);
                        
                        // 显示成功的策略信息
                        const successfulStrategy = this.resetStrategyManager.getLastSuccessfulStrategy();
                        if (successfulStrategy) {
                            this.infoLog(`成功策略: ${successfulStrategy}`);
                        }
                        
                        return true;
                    } else {
                        this.debugLog(`第${attempt}次尝试: 复位成功但LinkCheck失败`);
                    }
                } else {
                    this.debugLog(`第${attempt}次尝试: 复位失败`);
                }
                
            } catch (error) {
                const attemptDuration = Date.now() - attemptStart;
                this.warningLog(`第${attempt}次尝试失败: ${error.message}`);
                this.recordResetAttempt(attempt, false, attemptDuration, error.message);
            }
            
            // 如果不是最后一次尝试，等待一段时间再重试
            if (attempt < maxTryCount && !this.stopFlag) {
                const retryDelay = Math.min(100 + attempt * 10, 500); // 递增延迟，最大500ms
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }
        
        // 所有尝试都失败了
        this.errorLog('所有复位策略都失败了');
        this.showResetFailureGuidance();
        return false;
    }

    /**
     * 执行增强复位策略
     * @param {number} attempt 当前尝试次数
     * @returns {Promise<boolean>} 复位是否成功
     */
    async executeEnhancedReset(attempt) {
        if (!this.enhancedResetEnabled) {
            // 如果禁用了增强复位，使用原始方法
            return await this.executeOriginalReset();
        }

        this.debugLog(`执行增强复位策略 (尝试 ${attempt})`);
        
        try {
            // 使用复位策略管理器执行复位
            const success = await this.resetStrategyManager.executeReset();
            
            if (success) {
                this.debugLog('增强复位策略执行成功');
                return true;
            } else {
                this.debugLog('增强复位策略执行失败，尝试原始复位方法');
                // 如果增强策略失败，回退到原始方法
                return await this.executeOriginalReset();
            }
            
        } catch (error) {
            this.warningLog(`增强复位策略异常: ${error.message}`);
            // 异常时回退到原始方法
            return await this.executeOriginalReset();
        }
    }

    /**
     * 执行原始复位方法（向后兼容）
     * @returns {Promise<boolean>} 复位是否成功
     */
    async executeOriginalReset() {
        this.debugLog('执行原始T5AI复位方法');
        
        try {
            // 原始复位逻辑：DTR=false, RTS=true -> RTS=false
            await this.port.setSignals({ dataTerminalReady: false, requestToSend: true });
            await new Promise(resolve => setTimeout(resolve, this.platformConfig.resetDelay));
            await this.port.setSignals({ requestToSend: false });
            await new Promise(resolve => setTimeout(resolve, this.platformConfig.recoveryDelay));
            
            this.debugLog('原始复位方法执行完成');
            return true;
            
        } catch (error) {
            this.warningLog(`原始复位方法失败: ${error.message}`);
            return false;
        }
    }

    /**
     * 增强版LinkCheck - 使用平台特定的延迟参数
     */
    async doLinkCheckEx(maxTryCount = 60) {
        const linkCheckDelay = this.platformConfig.linkCheckDelay;
        this.debugLog(`执行LinkCheck验证，最大尝试${maxTryCount}次，延迟${linkCheckDelay}ms`);
        
        for (let cnt = 0; cnt < maxTryCount && !this.stopFlag; cnt++) {
            await this.clearBuffer();
            await this.sendCommand([0x01, 0xE0, 0xFC, 0x01, 0x00], 'LinkCheck');
            
            // 使用平台特定的超时时间
            const response = await this.receiveResponse(8, linkCheckDelay);
            if (response.length >= 8) {
                const r = response.slice(0, 8);
                if (r[0] === 0x04 && r[1] === 0x0E && r[2] === 0x05 && 
                    r[3] === 0x01 && r[4] === 0xE0 && r[5] === 0xFC && 
                    r[6] === 0x01 && r[7] === 0x00) {
                    this.debugLog(`LinkCheck成功 (尝试${cnt + 1}次)`);
                    return true;
                }
            }
        }
        
        this.debugLog(`LinkCheck失败 (尝试${maxTryCount}次)`);
        return false;
    }

    /**
     * 记录复位尝试历史
     */
    recordResetAttempt(attempt, success, duration, error) {
        const record = {
            attempt: attempt,
            success: success,
            duration: duration,
            error: error,
            platform: this.platform,
            strategy: this.resetStrategyManager ? this.resetStrategyManager.getLastSuccessfulStrategy() : 'original',
            timestamp: new Date().toISOString()
        };
        
        this.resetAttemptHistory.push(record);
        
        // 保持历史记录不超过20条
        if (this.resetAttemptHistory.length > 20) {
            this.resetAttemptHistory.shift();
        }
        
        this.debugLog(`记录复位尝试: ${JSON.stringify(record)}`);
    }

    /**
     * 显示复位失败的故障排除指导
     */
    showResetFailureGuidance() {
        const errorMessages = PlatformDetector.getPlatformErrorMessages(this.platform);
        
        this.errorLog('=== 复位失败故障排除指导 ===');
        this.errorLog(errorMessages.resetFailed);
        
        // 显示尝试统计
        if (this.resetStrategyManager) {
            const stats = this.resetStrategyManager.getStatistics();
            this.infoLog(`复位尝试统计: 总计${stats.totalAttempts}次, 成功${stats.successCount}次, 失败${stats.failureCount}次`);
            
            if (Object.keys(stats.strategies).length > 0) {
                this.infoLog('各策略统计:');
                Object.keys(stats.strategies).forEach(strategy => {
                    const strategyStats = stats.strategies[strategy];
                    this.infoLog(`- ${strategy}: 成功${strategyStats.success}次, 失败${strategyStats.failure}次`);
                });
            }
        }
        
        // 平台特定的额外建议
        if (this.platform === 'linux') {
            this.errorLog('\nLinux系统额外建议:');
            this.errorLog('1. 检查用户是否在dialout组: groups $USER');
            this.errorLog('2. 添加用户到dialout组: sudo usermod -a -G dialout $USER');
            this.errorLog('3. 检查设备权限: ls -l /dev/ttyUSB* /dev/ttyACM*');
            this.errorLog('4. 查看内核日志: dmesg | tail -20');
        }
    }

    /**
     * 获取平台信息
     */
    getPlatformInfo() {
        return {
            platform: this.platform,
            config: this.platformConfig,
            info: this.platformInfo
        };
    }

    /**
     * 获取复位尝试历史
     */
    getResetAttemptHistory() {
        return [...this.resetAttemptHistory];
    }

    /**
     * 获取复位策略统计
     */
    getResetStrategyStatistics() {
        if (this.resetStrategyManager) {
            return this.resetStrategyManager.getStatistics();
        }
        return null;
    }

    /**
     * 启用/禁用增强复位功能
     */
    setEnhancedResetEnabled(enabled) {
        this.enhancedResetEnabled = enabled;
        this.infoLog(`增强复位功能: ${enabled ? '启用' : '禁用'}`);
    }

    /**
     * 清除复位历史记录
     */
    clearResetHistory() {
        this.resetAttemptHistory = [];
        if (this.resetStrategyManager) {
            this.resetStrategyManager.clearHistory();
        }
        this.infoLog('已清除复位历史记录');
    }

    /**
     * 获取诊断信息
     */
    getDiagnosticInfo() {
        const diagnostics = {
            platform: this.getPlatformInfo(),
            resetHistory: this.getResetAttemptHistory(),
            strategyStats: this.getResetStrategyStatistics(),
            enhancedResetEnabled: this.enhancedResetEnabled,
            timestamp: new Date().toISOString()
        };
        
        return diagnostics;
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedT5Downloader;
} else if (typeof window !== 'undefined') {
    window.EnhancedT5Downloader = EnhancedT5Downloader;
}