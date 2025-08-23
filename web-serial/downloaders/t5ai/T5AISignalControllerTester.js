/**
 * T5AI信号控制器测试工具
 * 用于测试和验证跨平台兼容性
 */
class T5AISignalControllerTester {
    constructor() {
        this.results = [];
        this.isRunning = false;
    }

    /**
     * 运行所有测试
     */
    async runAllTests() {
        if (this.isRunning) {
            throw new Error('测试正在进行中');
        }

        this.isRunning = true;
        this.results = [];
        
        try {
            // 获取T5AI下载器实例
            const t5aiDownloader = this.getT5AIDownloader();
            if (!t5aiDownloader) {
                throw new Error('T5AI下载器未初始化');
            }

            const signalController = t5aiDownloader.signalController;
            if (!signalController) {
                throw new Error('T5AI信号控制器未初始化');
            }

            console.log('🧪 开始T5AI信号控制器兼容性测试...');

            // 测试1：平台检测
            await this.testPlatformDetection(signalController);

            // 测试2：策略选择
            await this.testStrategySelection(signalController);

            // 测试3：复位策略测试
            await this.testResetStrategies(signalController);

            // 测试4：降级机制测试
            await this.testFallbackMechanism(signalController);

            // 输出测试结果
            this.outputTestResults();

            return {
                success: true,
                results: this.results,
                summary: this.generateSummary()
            };

        } catch (error) {
            console.error('❌ 测试过程中发生错误:', error);
            return {
                success: false,
                error: error.message,
                results: this.results
            };
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * 测试平台检测功能
     */
    async testPlatformDetection(signalController) {
        console.log('🔍 测试1: 平台检测...');
        
        try {
            const platform = signalController.platform;
            const detectedPlatform = signalController.detectPlatform();
            
            this.addResult('平台检测', {
                cached: platform,
                detected: detectedPlatform,
                userAgent: navigator.userAgent,
                consistent: platform === detectedPlatform
            }, true);

            console.log(`✅ 平台检测成功: ${platform}`);
        } catch (error) {
            this.addResult('平台检测', { error: error.message }, false);
            console.error('❌ 平台检测失败:', error);
        }
    }

    /**
     * 测试策略选择功能
     */
    async testStrategySelection(signalController) {
        console.log('🎯 测试2: 策略选择...');
        
        try {
            const bestStrategy = signalController.selectBestStrategy();
            const availableStrategies = Array.from(signalController.strategies.keys());
            
            this.addResult('策略选择', {
                selectedStrategy: bestStrategy,
                availableStrategies,
                platform: signalController.platform,
                hasStrategy: signalController.strategies.has(bestStrategy)
            }, signalController.strategies.has(bestStrategy));

            console.log(`✅ 策略选择成功: ${bestStrategy}`);
        } catch (error) {
            this.addResult('策略选择', { error: error.message }, false);
            console.error('❌ 策略选择失败:', error);
        }
    }

    /**
     * 测试复位策略（模拟测试，不实际执行复位）
     */
    async testResetStrategies(signalController) {
        console.log('🔄 测试3: 复位策略验证...');
        
        const strategies = Array.from(signalController.strategies.keys());
        const strategyResults = {};

        for (const strategy of strategies) {
            try {
                const strategyInfo = signalController.strategies.get(strategy);
                
                // 验证策略配置
                const isValid = strategyInfo && 
                               typeof strategyInfo.execute === 'function' && 
                               typeof strategyInfo.description === 'string';

                strategyResults[strategy] = {
                    valid: isValid,
                    description: strategyInfo ? strategyInfo.description : 'N/A'
                };

                if (isValid) {
                    console.log(`  ✅ ${strategy}: ${strategyInfo.description}`);
                } else {
                    console.log(`  ❌ ${strategy}: 配置无效`);
                }
            } catch (error) {
                strategyResults[strategy] = {
                    valid: false,
                    error: error.message
                };
                console.log(`  ❌ ${strategy}: ${error.message}`);
            }
        }

        const validStrategies = Object.values(strategyResults).filter(r => r.valid).length;
        const totalStrategies = strategies.length;

        this.addResult('复位策略验证', {
            strategies: strategyResults,
            validCount: validStrategies,
            totalCount: totalStrategies,
            coverage: `${validStrategies}/${totalStrategies}`
        }, validStrategies > 0);

        console.log(`✅ 复位策略验证完成: ${validStrategies}/${totalStrategies} 个策略有效`);
    }

    /**
     * 测试降级机制
     */
    async testFallbackMechanism(signalController) {
        console.log('🔀 测试4: 降级机制验证...');
        
        try {
            const platform = signalController.platform;
            const fallbackOrder = signalController.getFallbackOrder('nonexistent_strategy');
            
            this.addResult('降级机制', {
                platform,
                fallbackOrder,
                orderLength: fallbackOrder.length,
                hasValidStrategies: fallbackOrder.every(s => signalController.strategies.has(s))
            }, fallbackOrder.length > 0);

            console.log(`✅ 降级机制验证成功: ${fallbackOrder.length} 个备选策略`);
            console.log(`  降级顺序: ${fallbackOrder.join(' → ')}`);
        } catch (error) {
            this.addResult('降级机制', { error: error.message }, false);
            console.error('❌ 降级机制验证失败:', error);
        }
    }

    /**
     * 添加测试结果
     */
    addResult(testName, data, success) {
        this.results.push({
            test: testName,
            success,
            data,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * 生成测试摘要
     */
    generateSummary() {
        const total = this.results.length;
        const passed = this.results.filter(r => r.success).length;
        const failed = total - passed;

        return {
            total,
            passed,
            failed,
            passRate: total > 0 ? (passed / total * 100).toFixed(2) + '%' : '0%',
            timestamp: new Date().toISOString()
        };
    }

    /**
     * 输出测试结果
     */
    outputTestResults() {
        console.log('\n📊 T5AI信号控制器测试结果:');
        console.log('=' * 50);
        
        this.results.forEach((result, index) => {
            const status = result.success ? '✅' : '❌';
            console.log(`${index + 1}. ${status} ${result.test}`);
            
            if (!result.success && result.data.error) {
                console.log(`   错误: ${result.data.error}`);
            }
        });

        const summary = this.generateSummary();
        console.log('\n📈 测试摘要:');
        console.log(`   总测试数: ${summary.total}`);
        console.log(`   通过: ${summary.passed}`);
        console.log(`   失败: ${summary.failed}`);
        console.log(`   通过率: ${summary.passRate}`);
        console.log('=' * 50);
    }

    /**
     * 获取T5AI下载器实例
     */
    getT5AIDownloader() {
        // 尝试从全局范围获取
        if (typeof window !== 'undefined') {
            // 从下载器管理器获取
            if (window.downloaderManager && window.downloaderManager.downloaders) {
                for (const downloader of Object.values(window.downloaderManager.downloaders)) {
                    if (downloader.chipName === 'T5AI') {
                        return downloader;
                    }
                }
            }
            
            // 从全局变量获取
            if (window.t5aiDownloader) {
                return window.t5aiDownloader;
            }
        }
        
        return null;
    }

    /**
     * 实际执行单个策略测试（需要连接设备）
     */
    async testSingleStrategy(strategy) {
        if (this.isRunning) {
            throw new Error('其他测试正在进行中');
        }

        const t5aiDownloader = this.getT5AIDownloader();
        if (!t5aiDownloader || !t5aiDownloader.signalController) {
            throw new Error('T5AI信号控制器未初始化');
        }

        console.log(`🔄 测试复位策略: ${strategy}`);
        
        try {
            const result = await t5aiDownloader.signalController.resetDevice(strategy);
            console.log(`✅ 策略 ${strategy} 测试成功:`, result);
            return result;
        } catch (error) {
            console.error(`❌ 策略 ${strategy} 测试失败:`, error);
            throw error;
        }
    }

    /**
     * 获取性能统计
     */
    getPerformanceStats() {
        const t5aiDownloader = this.getT5AIDownloader();
        if (!t5aiDownloader || !t5aiDownloader.signalController) {
            return null;
        }

        return t5aiDownloader.signalController.getMetrics();
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = T5AISignalControllerTester;
} else if (typeof window !== 'undefined') {
    window.T5AISignalControllerTester = T5AISignalControllerTester;
    
    // 添加全局测试函数，便于调试
    window.testT5AISignalController = async function() {
        const tester = new T5AISignalControllerTester();
        return await tester.runAllTests();
    };
    
    window.testT5AIResetStrategy = async function(strategy = 'auto') {
        const tester = new T5AISignalControllerTester();
        return await tester.testSingleStrategy(strategy);
    };
    
    window.getT5AIPerformanceStats = function() {
        const tester = new T5AISignalControllerTester();
        return tester.getPerformanceStats();
    };
}