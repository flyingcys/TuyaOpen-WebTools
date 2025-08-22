/**
 * 复位策略管理器 - 管理多种T5AI设备复位策略
 * 用于解决Ubuntu系统上T5AI复位问题
 */

class ResetStrategyManager {
    constructor(port, platformConfig, debugCallback = null) {
        this.port = port;
        this.platformConfig = platformConfig;
        this.debugCallback = debugCallback;
        this.successfulStrategy = null; // 记录成功的策略
        this.attemptHistory = []; // 记录尝试历史
    }

    /**
     * 调试日志输出
     */
    debug(level, message, data = null) {
        if (this.debugCallback) {
            this.debugCallback(level, message, data);
        }
    }

    /**
     * 执行复位操作 - 按优先级尝试不同策略
     * @returns {Promise<boolean>} 复位是否成功
     */
    async executeReset() {
        this.debug('info', '开始执行复位策略管理器');
        this.debug('info', `平台配置: ${this.platformConfig.description}`);
        this.debug('info', `首选策略: ${this.platformConfig.preferredStrategy}`);

        // 获取策略执行顺序
        const strategies = this.getStrategyOrder();
        this.debug('info', `策略执行顺序: ${strategies.join(' -> ')}`);

        // 按顺序尝试每个策略
        for (let i = 0; i < strategies.length; i++) {
            const strategyName = strategies[i];
            this.debug('info', `尝试策略 ${i + 1}/${strategies.length}: ${strategyName}`);

            try {
                const success = await this.tryStrategy(strategyName);
                if (success) {
                    this.successfulStrategy = strategyName;
                    this.debug('info', `✅ 策略 ${strategyName} 执行成功`);
                    this.recordSuccess(strategyName);
                    return true;
                }
            } catch (error) {
                this.debug('warning', `策略 ${strategyName} 执行失败: ${error.message}`);
                this.recordFailure(strategyName, error.message);
            }
        }

        this.debug('error', '所有复位策略都失败了');
        return false;
    }

    /**
     * 获取策略执行顺序
     * @returns {Array<string>} 策略名称数组
     */
    getStrategyOrder() {
        const preferredStrategy = this.platformConfig.preferredStrategy;
        const allStrategies = ['original', 'esp32', 'extended'];
        
        // 如果有成功记录，优先使用成功的策略
        if (this.successfulStrategy && allStrategies.includes(this.successfulStrategy)) {
            const strategies = [this.successfulStrategy];
            allStrategies.forEach(strategy => {
                if (strategy !== this.successfulStrategy) {
                    strategies.push(strategy);
                }
            });
            return strategies;
        }

        // 将首选策略放在第一位
        const strategies = [preferredStrategy];
        allStrategies.forEach(strategy => {
            if (strategy !== preferredStrategy) {
                strategies.push(strategy);
            }
        });

        return strategies;
    }

    /**
     * 尝试执行指定的复位策略
     * @param {string} strategyName 策略名称
     * @returns {Promise<boolean>} 策略是否成功
     */
    async tryStrategy(strategyName) {
        const strategy = this.getStrategy(strategyName);
        if (!strategy) {
            throw new Error(`未知的复位策略: ${strategyName}`);
        }

        this.debug('info', `执行策略: ${strategy.name}`);
        this.debug('info', `策略描述: ${strategy.description}`);

        // 执行策略
        await strategy.execute(this.port, this.platformConfig, this.debug.bind(this));

        // 验证复位是否成功（这里返回true，实际验证在T5AI下载器中进行）
        return true;
    }

    /**
     * 获取指定名称的复位策略
     * @param {string} strategyName 策略名称
     * @returns {Object|null} 策略对象
     */
    getStrategy(strategyName) {
        const strategies = this.getResetStrategies();
        return strategies[strategyName] || null;
    }

    /**
     * 获取所有复位策略定义
     * @returns {Object} 所有策略定义
     */
    getResetStrategies() {
        return {
            original: {
                name: 'T5AI Original',
                description: 'DTR=false, RTS=true -> RTS=false (原始T5AI复位策略)',
                execute: async (port, config, debugFn) => {
                    debugFn('debug', '执行原始T5AI复位策略');
                    debugFn('debug', `复位延迟: ${config.resetDelay}ms, 恢复延迟: ${config.recoveryDelay}ms`);
                    
                    // 设置复位信号: DTR=false, RTS=true
                    await port.setSignals({ dataTerminalReady: false, requestToSend: true });
                    debugFn('debug', '设置信号: DTR=false, RTS=true');
                    
                    // 等待复位延迟
                    await new Promise(resolve => setTimeout(resolve, config.resetDelay));
                    
                    // 释放复位信号: RTS=false
                    await port.setSignals({ requestToSend: false });
                    debugFn('debug', '设置信号: RTS=false');
                    
                    // 等待恢复延迟
                    await new Promise(resolve => setTimeout(resolve, config.recoveryDelay));
                    
                    debugFn('debug', '原始T5AI复位策略执行完成');
                }
            },
            esp32: {
                name: 'ESP32 Style',
                description: 'DTR=false -> DTR=true (ESP32风格复位策略)',
                execute: async (port, config, debugFn) => {
                    debugFn('debug', '执行ESP32风格复位策略');
                    debugFn('debug', `复位延迟: ${config.resetDelay}ms, 恢复延迟: ${config.recoveryDelay}ms`);
                    
                    // 设置复位信号: DTR=false
                    await port.setSignals({ dataTerminalReady: false });
                    debugFn('debug', '设置信号: DTR=false');
                    
                    // 等待复位延迟
                    await new Promise(resolve => setTimeout(resolve, config.resetDelay));
                    
                    // 释放复位信号: DTR=true
                    await port.setSignals({ dataTerminalReady: true });
                    debugFn('debug', '设置信号: DTR=true');
                    
                    // 等待恢复延迟
                    await new Promise(resolve => setTimeout(resolve, config.recoveryDelay));
                    
                    debugFn('debug', 'ESP32风格复位策略执行完成');
                }
            },
            extended: {
                name: 'Extended Timing',
                description: '扩展时序复位策略 (更长延迟 + 多次尝试)',
                execute: async (port, config, debugFn) => {
                    debugFn('debug', '执行扩展时序复位策略');
                    
                    // 扩展延迟参数
                    const extendedResetDelay = config.resetDelay * 2;
                    const extendedRecoveryDelay = config.recoveryDelay * 3;
                    
                    debugFn('debug', `扩展复位延迟: ${extendedResetDelay}ms, 扩展恢复延迟: ${extendedRecoveryDelay}ms`);
                    
                    // 多次复位尝试
                    for (let attempt = 1; attempt <= 2; attempt++) {
                        debugFn('debug', `扩展复位尝试 ${attempt}/2`);
                        
                        // 组合复位策略: 先ESP32风格，再原始策略
                        
                        // ESP32风格复位
                        await port.setSignals({ dataTerminalReady: false });
                        debugFn('debug', '设置信号: DTR=false');
                        await new Promise(resolve => setTimeout(resolve, extendedResetDelay / 2));
                        
                        await port.setSignals({ dataTerminalReady: true });
                        debugFn('debug', '设置信号: DTR=true');
                        await new Promise(resolve => setTimeout(resolve, extendedRecoveryDelay / 2));
                        
                        // 原始T5AI复位
                        await port.setSignals({ dataTerminalReady: false, requestToSend: true });
                        debugFn('debug', '设置信号: DTR=false, RTS=true');
                        await new Promise(resolve => setTimeout(resolve, extendedResetDelay / 2));
                        
                        await port.setSignals({ requestToSend: false });
                        debugFn('debug', '设置信号: RTS=false');
                        await new Promise(resolve => setTimeout(resolve, extendedRecoveryDelay / 2));
                        
                        if (attempt < 2) {
                            // 尝试间隔
                            await new Promise(resolve => setTimeout(resolve, 100));
                        }
                    }
                    
                    debugFn('debug', '扩展时序复位策略执行完成');
                }
            }
        };
    }

    /**
     * 记录策略成功
     * @param {string} strategyName 策略名称
     */
    recordSuccess(strategyName) {
        const record = {
            strategy: strategyName,
            result: 'success',
            timestamp: new Date().toISOString(),
            platform: this.platformConfig.description
        };
        
        this.attemptHistory.push(record);
        this.debug('info', `记录成功策略: ${strategyName}`);
        
        // 保持历史记录不超过10条
        if (this.attemptHistory.length > 10) {
            this.attemptHistory.shift();
        }
    }

    /**
     * 记录策略失败
     * @param {string} strategyName 策略名称
     * @param {string} error 错误信息
     */
    recordFailure(strategyName, error) {
        const record = {
            strategy: strategyName,
            result: 'failure',
            error: error,
            timestamp: new Date().toISOString(),
            platform: this.platformConfig.description
        };
        
        this.attemptHistory.push(record);
        this.debug('warning', `记录失败策略: ${strategyName} - ${error}`);
        
        // 保持历史记录不超过10条
        if (this.attemptHistory.length > 10) {
            this.attemptHistory.shift();
        }
    }

    /**
     * 获取尝试历史
     * @returns {Array} 历史记录数组
     */
    getAttemptHistory() {
        return [...this.attemptHistory];
    }

    /**
     * 获取最后成功的策略
     * @returns {string|null} 策略名称
     */
    getLastSuccessfulStrategy() {
        const successRecords = this.attemptHistory.filter(record => record.result === 'success');
        if (successRecords.length > 0) {
            return successRecords[successRecords.length - 1].strategy;
        }
        return null;
    }

    /**
     * 清除历史记录
     */
    clearHistory() {
        this.attemptHistory = [];
        this.successfulStrategy = null;
        this.debug('info', '已清除复位策略历史记录');
    }

    /**
     * 获取策略统计信息
     * @returns {Object} 统计信息
     */
    getStatistics() {
        const stats = {
            totalAttempts: this.attemptHistory.length,
            successCount: 0,
            failureCount: 0,
            strategies: {}
        };

        this.attemptHistory.forEach(record => {
            if (record.result === 'success') {
                stats.successCount++;
            } else {
                stats.failureCount++;
            }

            if (!stats.strategies[record.strategy]) {
                stats.strategies[record.strategy] = { success: 0, failure: 0 };
            }
            stats.strategies[record.strategy][record.result]++;
        });

        stats.successRate = stats.totalAttempts > 0 ? 
            (stats.successCount / stats.totalAttempts * 100).toFixed(1) + '%' : '0%';

        return stats;
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResetStrategyManager;
} else if (typeof window !== 'undefined') {
    window.ResetStrategyManager = ResetStrategyManager;
}