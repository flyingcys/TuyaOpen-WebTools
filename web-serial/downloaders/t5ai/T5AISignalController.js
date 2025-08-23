/**
 * T5AI信号控制器 - 跨平台串口信号控制抽象层
 * 
 * 解决T5AI在不同操作系统上的串口复位兼容性问题
 * 支持Windows、Linux/Ubuntu、macOS等平台
 * 
 * @author Claude
 * @date 2024
 */

class T5AISignalController {
    constructor(port, debugCallback) {
        this.port = port;
        this.debugCallback = debugCallback || (() => {});
        this.platform = this.detectPlatform();
        this.strategies = this.initializeStrategies();
        this.currentStrategyIndex = 0;
        
        // 平台特定的默认策略
        this.platformDefaults = {
            'Windows': 'standard',
            'Linux': 'separated',
            'Ubuntu': 'separated',
            'macOS': 'dtr_only',
            'Unknown': 'standard'
        };
        
        this.log('info', `T5AI信号控制器初始化 - 平台: ${this.platform}`);
    }
    
    /**
     * 检测当前操作系统平台
     */
    detectPlatform() {
        const userAgent = navigator.userAgent.toLowerCase();
        const platform = navigator.platform.toLowerCase();
        
        if (platform.indexOf('win') !== -1) {
            return 'Windows';
        } else if (platform.indexOf('linux') !== -1 || userAgent.indexOf('ubuntu') !== -1) {
            // 特别检测Ubuntu
            if (userAgent.indexOf('ubuntu') !== -1) {
                return 'Ubuntu';
            }
            return 'Linux';
        } else if (platform.indexOf('mac') !== -1) {
            return 'macOS';
        }
        
        return 'Unknown';
    }
    
    /**
     * 初始化所有复位策略
     */
    initializeStrategies() {
        return {
            'standard': {
                name: '标准DTR+RTS组合控制',
                description: 'Windows平台优选策略',
                execute: async () => await this.standardReset()
            },
            'separated': {
                name: '分离DTR/RTS控制',
                description: 'Linux/Ubuntu兼容策略',
                execute: async () => await this.separatedSignalReset()
            },
            'dtr_only': {
                name: 'DTR单独控制',
                description: 'macOS兼容策略',
                execute: async () => await this.dtrOnlyReset()
            },
            'rts_only': {
                name: 'RTS单独控制',
                description: '备用策略',
                execute: async () => await this.rtsOnlyReset()
            },
            'extended_timing': {
                name: '扩展时序控制',
                description: '兼容性最强但速度较慢',
                execute: async () => await this.extendedTimingReset()
            }
        };
    }
    
    /**
     * 执行复位操作 - 自动选择和降级
     */
    async executeReset() {
        this.log('info', `开始T5AI复位序列 - ${this.platform}平台`);
        
        // 获取平台默认策略
        const defaultStrategy = this.platformDefaults[this.platform] || 'standard';
        const strategyOrder = this.getStrategyOrder(defaultStrategy);
        
        // 尝试每个策略
        for (let i = 0; i < strategyOrder.length; i++) {
            const strategyName = strategyOrder[i];
            const strategy = this.strategies[strategyName];
            
            if (!strategy) {
                this.log('warning', `策略 ${strategyName} 不存在，跳过`);
                continue;
            }
            
            this.log('info', `尝试策略 ${i + 1}/${strategyOrder.length}: ${strategy.name}`);
            this.log('debug', `策略描述: ${strategy.description}`);
            
            try {
                const success = await strategy.execute();
                if (success) {
                    this.log('success', `✅ 复位成功 - 使用策略: ${strategy.name}`);
                    return true;
                } else {
                    this.log('warning', `策略 ${strategy.name} 未成功，尝试下一个`);
                }
            } catch (error) {
                this.log('error', `策略 ${strategy.name} 执行失败: ${error.message}`);
            }
            
            // 策略间延迟
            if (i < strategyOrder.length - 1) {
                await this.delay(100);
            }
        }
        
        this.log('error', '❌ 所有复位策略都失败了');
        return false;
    }
    
    /**
     * 获取策略执行顺序
     */
    getStrategyOrder(defaultStrategy) {
        const order = [defaultStrategy];
        const allStrategies = Object.keys(this.strategies);
        
        // 添加其他策略作为降级选项
        for (const strategy of allStrategies) {
            if (!order.includes(strategy)) {
                order.push(strategy);
            }
        }
        
        return order;
    }
    
    /**
     * 标准复位策略 - Windows优化
     */
    async standardReset() {
        try {
            this.log('debug', '执行标准DTR+RTS组合复位');
            
            // 标准复位序列：DTR=false, RTS=true
            await this.setSignals({ dataTerminalReady: false, requestToSend: true });
            await this.delay(300);
            
            // RTS=false
            await this.setSignals({ requestToSend: false });
            await this.delay(4);
            
            return true;
        } catch (error) {
            this.log('error', `标准复位失败: ${error.message}`);
            return false;
        }
    }
    
    /**
     * 分离信号复位策略 - Linux/Ubuntu优化
     */
    async separatedSignalReset() {
        try {
            this.log('debug', '执行分离DTR/RTS信号复位');
            
            // 分别设置DTR和RTS，避免同时设置导致的问题
            await this.setSignals({ dataTerminalReady: false });
            await this.delay(10);
            
            await this.setSignals({ requestToSend: true });
            await this.delay(300);
            
            await this.setSignals({ requestToSend: false });
            await this.delay(10);
            
            // 恢复DTR
            await this.setSignals({ dataTerminalReady: true });
            await this.delay(4);
            
            return true;
        } catch (error) {
            this.log('error', `分离信号复位失败: ${error.message}`);
            return false;
        }
    }
    
    /**
     * DTR单独控制策略 - macOS优化
     */
    async dtrOnlyReset() {
        try {
            this.log('debug', '执行DTR单独控制复位');
            
            // 仅使用DTR进行复位
            await this.setSignals({ dataTerminalReady: false });
            await this.delay(300);
            
            await this.setSignals({ dataTerminalReady: true });
            await this.delay(50);
            
            await this.setSignals({ dataTerminalReady: false });
            await this.delay(4);
            
            return true;
        } catch (error) {
            this.log('error', `DTR单独复位失败: ${error.message}`);
            return false;
        }
    }
    
    /**
     * RTS单独控制策略 - 备用策略
     */
    async rtsOnlyReset() {
        try {
            this.log('debug', '执行RTS单独控制复位');
            
            // 仅使用RTS进行复位
            await this.setSignals({ requestToSend: true });
            await this.delay(300);
            
            await this.setSignals({ requestToSend: false });
            await this.delay(50);
            
            await this.setSignals({ requestToSend: true });
            await this.delay(4);
            
            await this.setSignals({ requestToSend: false });
            
            return true;
        } catch (error) {
            this.log('error', `RTS单独复位失败: ${error.message}`);
            return false;
        }
    }
    
    /**
     * 扩展时序复位策略 - 最大兼容性
     */
    async extendedTimingReset() {
        try {
            this.log('debug', '执行扩展时序复位（慢速但兼容性强）');
            
            // 初始化信号状态
            await this.setSignals({ dataTerminalReady: true, requestToSend: false });
            await this.delay(100);
            
            // 复位序列with更长的延迟
            await this.setSignals({ dataTerminalReady: false });
            await this.delay(100);
            
            await this.setSignals({ requestToSend: true });
            await this.delay(500); // 更长的复位时间
            
            await this.setSignals({ requestToSend: false });
            await this.delay(100);
            
            await this.setSignals({ dataTerminalReady: true });
            await this.delay(50);
            
            return true;
        } catch (error) {
            this.log('error', `扩展时序复位失败: ${error.message}`);
            return false;
        }
    }
    
    /**
     * 设置串口信号 - 带错误处理和兼容性适配
     */
    async setSignals(signals) {
        try {
            // 尝试直接设置
            if (this.port.setSignals) {
                await this.port.setSignals(signals);
                return true;
            }
            
            // 尝试分别设置DTR和RTS
            if (signals.dataTerminalReady !== undefined && this.port.setDTR) {
                await this.port.setDTR(signals.dataTerminalReady);
            }
            
            if (signals.requestToSend !== undefined && this.port.setRTS) {
                await this.port.setRTS(signals.requestToSend);
            }
            
            return true;
        } catch (error) {
            this.log('warning', `信号设置警告: ${error.message}`);
            // 某些平台可能不支持信号控制，但不应该阻止继续尝试
            return false;
        }
    }
    
    /**
     * 延迟函数
     */
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * 日志输出
     */
    log(level, message) {
        const prefix = '[T5AI-Signal]';
        const fullMessage = `${prefix} ${message}`;
        
        // 调用外部调试回调
        if (this.debugCallback) {
            this.debugCallback(level, message);
        }
        
        // 控制台输出
        switch (level) {
            case 'info':
                console.log(fullMessage);
                break;
            case 'debug':
                console.debug(fullMessage);
                break;
            case 'warning':
                console.warn(fullMessage);
                break;
            case 'error':
                console.error(fullMessage);
                break;
            case 'success':
                console.log(`%c${fullMessage}`, 'color: green; font-weight: bold;');
                break;
            default:
                console.log(fullMessage);
        }
    }
    
    /**
     * 获取平台信息
     */
    getPlatformInfo() {
        return {
            platform: this.platform,
            userAgent: navigator.userAgent,
            defaultStrategy: this.platformDefaults[this.platform],
            availableStrategies: Object.keys(this.strategies)
        };
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = T5AISignalController;
} else if (typeof window !== 'undefined') {
    window.T5AISignalController = T5AISignalController;
}