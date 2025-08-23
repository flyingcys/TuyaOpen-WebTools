/**
 * T5AI信号控制器
 * 解决跨平台DTR/RTS信号控制兼容性问题
 * 支持多种复位策略，自动平台检测和降级处理
 */
class T5AISignalController {
    constructor(serialManager, logger = null) {
        this.serialManager = serialManager;
        this.logger = logger;
        this.platform = this.detectPlatform();
        this.strategies = new Map();
        this.successfulStrategy = null; // 缓存成功的策略
        this.metrics = {
            resetAttempts: 0,
            resetSuccesses: 0,
            strategyUsage: new Map()
        };
        
        this.initStrategies();
        this.debugLog(`T5AI信号控制器初始化完成，检测到平台: ${this.platform}`);
    }

    /**
     * 设备复位 - 主要入口方法
     * @param {string} strategy - 复位策略 ('auto'|'standard'|'separated'|'dtr_only'|'extended_timing')
     * @returns {Promise<Object>} 复位结果
     */
    async resetDevice(strategy = 'auto') {
        this.metrics.resetAttempts++;
        const startTime = Date.now();
        
        try {
            if (strategy === 'auto') {
                strategy = this.selectBestStrategy();
            }

            this.debugLog(`开始设备复位，使用策略: ${strategy}`);
            
            const resetMethod = this.strategies.get(strategy);
            if (!resetMethod) {
                throw new Error(`未知的复位策略: ${strategy}`);
            }

            // 执行复位策略
            await resetMethod.execute();
            
            // 记录成功
            this.successfulStrategy = strategy;
            this.metrics.resetSuccesses++;
            this.updateStrategyMetrics(strategy, true);
            
            const duration = Date.now() - startTime;
            this.infoLog(`✅ 设备复位成功，策略: ${strategy}，耗时: ${duration}ms`);
            
            return { 
                success: true, 
                strategy, 
                duration,
                description: resetMethod.description 
            };
            
        } catch (error) {
            this.updateStrategyMetrics(strategy, false);
            this.warningLog(`策略 ${strategy} 失败: ${error.message}`);
            
            // 尝试降级处理
            return await this.fallbackReset(strategy, error, startTime);
        }
    }

    /**
     * 初始化复位策略
     */
    initStrategies() {
        // 标准组合控制（Windows优选）
        this.strategies.set('standard', {
            description: '标准DTR+RTS组合控制（Windows优选）',
            execute: async () => {
                const { port } = await this.serialManager.connectFlash();
                
                this.debugLog('执行标准复位: DTR=false, RTS=true');
                await port.setSignals({ dataTerminalReady: false, requestToSend: true });
                await this.delay(300);
                
                this.debugLog('执行标准复位: RTS=false');
                await port.setSignals({ requestToSend: false });
                await this.delay(4);
            }
        });

        // 分离控制（Ubuntu兼容）
        this.strategies.set('separated', {
            description: '分离DTR/RTS控制（Ubuntu/Linux兼容）',
            execute: async () => {
                const { port } = await this.serialManager.connectFlash();
                
                this.debugLog('执行分离复位: 步骤1 - DTR=false');
                await port.setSignals({ dataTerminalReady: false });
                await this.delay(100);
                
                this.debugLog('执行分离复位: 步骤2 - RTS=true');
                await port.setSignals({ requestToSend: true });
                await this.delay(300);
                
                this.debugLog('执行分离复位: 步骤3 - RTS=false');
                await port.setSignals({ requestToSend: false });
                await this.delay(100);
                
                this.debugLog('执行分离复位: 步骤4 - DTR=true');
                await port.setSignals({ dataTerminalReady: true });
                await this.delay(10);
            }
        });

        // DTR单独控制（macOS兼容）
        this.strategies.set('dtr_only', {
            description: 'DTR单独控制（macOS兼容）',
            execute: async () => {
                const { port } = await this.serialManager.connectFlash();
                
                this.debugLog('执行DTR复位: DTR=false');
                await port.setSignals({ dataTerminalReady: false });
                await this.delay(300);
                
                this.debugLog('执行DTR复位: DTR=true');
                await port.setSignals({ dataTerminalReady: true });
                await this.delay(100);
            }
        });

        // 扩展时序（硬件兼容）
        this.strategies.set('extended_timing', {
            description: '扩展时序控制（硬件兼容）',
            execute: async () => {
                const { port } = await this.serialManager.connectFlash();
                
                this.debugLog('执行扩展时序复位: DTR=false, RTS=true (500ms)');
                await port.setSignals({ dataTerminalReady: false, requestToSend: true });
                await this.delay(500);  // 扩展等待时间
                
                this.debugLog('执行扩展时序复位: RTS=false (100ms)');
                await port.setSignals({ requestToSend: false });
                await this.delay(100);
            }
        });

        // RTS单独控制（特殊硬件兼容）
        this.strategies.set('rts_only', {
            description: 'RTS单独控制（特殊硬件兼容）',
            execute: async () => {
                const { port } = await this.serialManager.connectFlash();
                
                this.debugLog('执行RTS复位: RTS=true');
                await port.setSignals({ requestToSend: true });
                await this.delay(300);
                
                this.debugLog('执行RTS复位: RTS=false');
                await port.setSignals({ requestToSend: false });
                await this.delay(100);
            }
        });
    }

    /**
     * 平台检测
     */
    detectPlatform() {
        const userAgent = navigator.userAgent.toLowerCase();
        
        if (userAgent.includes('linux')) {
            return 'linux';
        } else if (userAgent.includes('mac')) {
            return 'macos';
        } else if (userAgent.includes('win')) {
            return 'windows';
        } else {
            return 'unknown';
        }
    }

    /**
     * 选择最佳策略
     */
    selectBestStrategy() {
        // 如果有成功的策略，优先使用
        if (this.successfulStrategy) {
            this.debugLog(`使用缓存的成功策略: ${this.successfulStrategy}`);
            return this.successfulStrategy;
        }

        // 根据平台选择默认策略
        switch (this.platform) {
            case 'linux':
                return 'separated';  // Ubuntu/Linux优选分离控制
            case 'macos':
                return 'dtr_only';   // macOS优选DTR控制
            case 'windows':
                return 'standard';   // Windows默认标准控制
            default:
                return 'standard';   // 未知平台使用标准控制
        }
    }

    /**
     * 降级处理
     */
    async fallbackReset(failedStrategy, originalError, startTime) {
        this.warningLog(`策略 ${failedStrategy} 失败，开始降级处理`);
        
        // 定义降级顺序，优先尝试与当前平台兼容的策略
        const fallbackOrder = this.getFallbackOrder(failedStrategy);
        
        for (const strategy of fallbackOrder) {
            if (strategy === failedStrategy) continue;
            
            try {
                this.debugLog(`尝试降级策略: ${strategy}`);
                
                const resetMethod = this.strategies.get(strategy);
                await resetMethod.execute();
                
                // 降级成功
                this.successfulStrategy = strategy;
                this.metrics.resetSuccesses++;
                this.updateStrategyMetrics(strategy, true);
                
                const duration = Date.now() - startTime;
                this.infoLog(`✅ 降级复位成功，策略: ${strategy}，耗时: ${duration}ms`);
                
                return { 
                    success: true, 
                    strategy, 
                    duration,
                    fallbackFrom: failedStrategy,
                    description: resetMethod.description 
                };
                
            } catch (fallbackError) {
                this.updateStrategyMetrics(strategy, false);
                this.debugLog(`降级策略 ${strategy} 也失败: ${fallbackError.message}`);
                continue;
            }
        }
        
        // 所有策略都失败
        const duration = Date.now() - startTime;
        const errorMsg = `所有复位策略都失败了。最初错误: ${originalError.message}`;
        this.errorLog(errorMsg);
        
        throw new Error(errorMsg);
    }

    /**
     * 获取降级顺序
     */
    getFallbackOrder(failedStrategy) {
        // 根据平台和失败的策略智能选择降级顺序
        switch (this.platform) {
            case 'linux':
                return ['separated', 'dtr_only', 'extended_timing', 'rts_only', 'standard'];
            case 'macos':
                return ['dtr_only', 'separated', 'standard', 'extended_timing', 'rts_only'];
            case 'windows':
                return ['standard', 'extended_timing', 'separated', 'dtr_only', 'rts_only'];
            default:
                return ['standard', 'separated', 'dtr_only', 'extended_timing', 'rts_only'];
        }
    }

    /**
     * 更新策略使用统计
     */
    updateStrategyMetrics(strategy, success) {
        if (!this.metrics.strategyUsage.has(strategy)) {
            this.metrics.strategyUsage.set(strategy, { attempts: 0, successes: 0 });
        }
        
        const stats = this.metrics.strategyUsage.get(strategy);
        stats.attempts++;
        if (success) {
            stats.successes++;
        }
    }

    /**
     * 获取性能统计
     */
    getMetrics() {
        const strategyStats = {};
        for (const [strategy, stats] of this.metrics.strategyUsage) {
            strategyStats[strategy] = {
                attempts: stats.attempts,
                successes: stats.successes,
                successRate: stats.attempts > 0 ? (stats.successes / stats.attempts * 100).toFixed(2) + '%' : '0%'
            };
        }
        
        return {
            platform: this.platform,
            totalResetAttempts: this.metrics.resetAttempts,
            totalResetSuccesses: this.metrics.resetSuccesses,
            overallSuccessRate: this.metrics.resetAttempts > 0 ? 
                (this.metrics.resetSuccesses / this.metrics.resetAttempts * 100).toFixed(2) + '%' : '0%',
            successfulStrategy: this.successfulStrategy,
            strategyStats
        };
    }

    /**
     * 重置统计信息
     */
    resetMetrics() {
        this.metrics = {
            resetAttempts: 0,
            resetSuccesses: 0,
            strategyUsage: new Map()
        };
        this.successfulStrategy = null;
    }

    /**
     * 延时函数
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 日志方法
    debugLog(message) {
        if (this.logger && this.logger.debug) {
            this.logger.debug(`[T5AI信号控制器] ${message}`);
        } else {
            console.debug(`[T5AI信号控制器] ${message}`);
        }
    }

    infoLog(message) {
        if (this.logger && this.logger.info) {
            this.logger.info(message);
        } else {
            console.info(`[T5AI信号控制器] ${message}`);
        }
    }

    warningLog(message) {
        if (this.logger && this.logger.warning) {
            this.logger.warning(message);
        } else {
            console.warn(`[T5AI信号控制器] ${message}`);
        }
    }

    errorLog(message) {
        if (this.logger && this.logger.error) {
            this.logger.error(message);
        } else {
            console.error(`[T5AI信号控制器] ${message}`);
        }
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = T5AISignalController;
} else if (typeof window !== 'undefined') {
    window.T5AISignalController = T5AISignalController;
}