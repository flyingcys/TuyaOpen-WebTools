/**
 * T5AI信号控制器测试工具
 * 
 * 用于测试和验证T5AI跨平台串口信号控制的有效性
 * 可以手动测试每种复位策略，帮助诊断平台兼容性问题
 * 
 * @author Claude
 * @date 2024
 */

class T5AISignalControllerTester {
    constructor() {
        this.port = null;
        this.signalController = null;
        this.logContainer = null;
        this.isRunning = false;
    }
    
    /**
     * 初始化测试器UI
     */
    initializeUI() {
        // 创建测试面板
        const testPanel = document.createElement('div');
        testPanel.id = 't5ai-signal-tester';
        testPanel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 2px solid #333;
            border-radius: 8px;
            padding: 20px;
            z-index: 10000;
            min-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;
        
        testPanel.innerHTML = `
            <h2>T5AI信号控制器测试工具</h2>
            <div style="margin-bottom: 10px;">
                <strong>平台信息:</strong> <span id="platform-info">检测中...</span>
            </div>
            <div style="margin-bottom: 10px;">
                <strong>串口状态:</strong> <span id="port-status">未连接</span>
            </div>
            
            <h3>测试策略</h3>
            <div id="test-strategies" style="margin-bottom: 15px;">
                <button onclick="t5aiTester.testStrategy('standard')">标准复位(Windows)</button>
                <button onclick="t5aiTester.testStrategy('separated')">分离信号(Linux/Ubuntu)</button>
                <button onclick="t5aiTester.testStrategy('dtr_only')">DTR单独(macOS)</button>
                <button onclick="t5aiTester.testStrategy('rts_only')">RTS单独(备用)</button>
                <button onclick="t5aiTester.testStrategy('extended_timing')">扩展时序(兼容)</button>
                <button onclick="t5aiTester.testAutoReset()" style="background: #4CAF50; color: white;">自动复位测试</button>
            </div>
            
            <h3>手动控制</h3>
            <div style="margin-bottom: 15px;">
                <button onclick="t5aiTester.setSignal('dtr', true)">DTR高</button>
                <button onclick="t5aiTester.setSignal('dtr', false)">DTR低</button>
                <button onclick="t5aiTester.setSignal('rts', true)">RTS高</button>
                <button onclick="t5aiTester.setSignal('rts', false)">RTS低</button>
                <button onclick="t5aiTester.setSignal('both', true)">全部高</button>
                <button onclick="t5aiTester.setSignal('both', false)">全部低</button>
            </div>
            
            <h3>连续性测试</h3>
            <div style="margin-bottom: 15px;">
                <label>测试次数: <input type="number" id="test-count" value="10" min="1" max="100" style="width: 60px;"></label>
                <button onclick="t5aiTester.runContinuousTest()">开始连续测试</button>
                <button onclick="t5aiTester.stopTest()" style="background: #f44336; color: white;">停止测试</button>
            </div>
            
            <h3>测试日志</h3>
            <div id="test-log" style="
                background: #f5f5f5;
                border: 1px solid #ddd;
                border-radius: 4px;
                padding: 10px;
                height: 200px;
                overflow-y: auto;
                font-family: monospace;
                font-size: 12px;
            "></div>
            
            <div style="margin-top: 15px; text-align: right;">
                <button onclick="t5aiTester.clearLog()">清空日志</button>
                <button onclick="t5aiTester.exportLog()">导出日志</button>
                <button onclick="t5aiTester.close()" style="background: #666; color: white;">关闭</button>
            </div>
        `;
        
        document.body.appendChild(testPanel);
        this.logContainer = document.getElementById('test-log');
        
        // 更新平台信息
        this.updatePlatformInfo();
    }
    
    /**
     * 更新平台信息
     */
    updatePlatformInfo() {
        const platformSpan = document.getElementById('platform-info');
        if (this.signalController) {
            const info = this.signalController.getPlatformInfo();
            platformSpan.textContent = `${info.platform} - ${navigator.userAgent.substring(0, 50)}...`;
        } else {
            const platform = navigator.platform;
            platformSpan.textContent = platform;
        }
    }
    
    /**
     * 连接串口
     */
    async connectPort() {
        try {
            if (!this.port) {
                // 请求用户选择串口
                this.port = await navigator.serial.requestPort();
                await this.port.open({ baudRate: 115200 });
            }
            
            // 创建信号控制器
            this.signalController = new T5AISignalController(this.port, (level, message) => {
                this.log(level, message);
            });
            
            document.getElementById('port-status').textContent = '已连接';
            this.updatePlatformInfo();
            this.log('success', '串口连接成功');
            
            return true;
        } catch (error) {
            this.log('error', `串口连接失败: ${error.message}`);
            document.getElementById('port-status').textContent = '连接失败';
            return false;
        }
    }
    
    /**
     * 测试特定策略
     */
    async testStrategy(strategyName) {
        if (!await this.ensureConnected()) return;
        
        this.log('info', `\n=== 测试策略: ${strategyName} ===`);
        
        const strategies = this.signalController.strategies;
        const strategy = strategies[strategyName];
        
        if (!strategy) {
            this.log('error', `策略 ${strategyName} 不存在`);
            return;
        }
        
        this.log('info', `执行: ${strategy.name}`);
        this.log('debug', `描述: ${strategy.description}`);
        
        try {
            const startTime = Date.now();
            const success = await strategy.execute();
            const elapsed = Date.now() - startTime;
            
            if (success) {
                this.log('success', `✅ 策略执行成功 (耗时: ${elapsed}ms)`);
                
                // 发送LinkCheck测试实际效果
                await this.testLinkCheck();
            } else {
                this.log('warning', `⚠️ 策略执行失败 (耗时: ${elapsed}ms)`);
            }
        } catch (error) {
            this.log('error', `❌ 策略执行错误: ${error.message}`);
        }
    }
    
    /**
     * 测试自动复位
     */
    async testAutoReset() {
        if (!await this.ensureConnected()) return;
        
        this.log('info', '\n=== 测试自动复位（带降级） ===');
        
        try {
            const startTime = Date.now();
            const success = await this.signalController.executeReset();
            const elapsed = Date.now() - startTime;
            
            if (success) {
                this.log('success', `✅ 自动复位成功 (总耗时: ${elapsed}ms)`);
                
                // 发送LinkCheck测试实际效果
                await this.testLinkCheck();
            } else {
                this.log('error', `❌ 所有策略都失败了 (总耗时: ${elapsed}ms)`);
            }
        } catch (error) {
            this.log('error', `❌ 自动复位错误: ${error.message}`);
        }
    }
    
    /**
     * 测试LinkCheck命令
     */
    async testLinkCheck() {
        this.log('info', '发送LinkCheck命令测试连接...');
        
        try {
            // 清空缓冲区
            await this.clearBuffer();
            
            // 发送LinkCheck命令
            const command = [0x01, 0xE0, 0xFC, 0x01, 0x00];
            const writer = this.port.writable.getWriter();
            await writer.write(new Uint8Array(command));
            writer.releaseLock();
            
            // 读取响应
            const reader = this.port.readable.getReader();
            const timeout = 100;
            const startTime = Date.now();
            const buffer = [];
            
            while (buffer.length < 8 && Date.now() - startTime < timeout) {
                const readPromise = reader.read();
                const timeoutPromise = new Promise(resolve => 
                    setTimeout(() => resolve({ done: true }), timeout - (Date.now() - startTime))
                );
                
                const result = await Promise.race([readPromise, timeoutPromise]);
                
                if (result.done) break;
                if (result.value) {
                    buffer.push(...result.value);
                }
            }
            
            reader.releaseLock();
            
            if (buffer.length >= 8) {
                const r = buffer.slice(0, 8);
                if (r[0] === 0x04 && r[1] === 0x0E && r[2] === 0x05 && 
                    r[3] === 0x01 && r[4] === 0xE0 && r[5] === 0xFC && 
                    r[6] === 0x01 && r[7] === 0x00) {
                    this.log('success', '✅ LinkCheck响应正确，设备已进入下载模式');
                    return true;
                } else {
                    this.log('warning', `⚠️ LinkCheck响应格式错误: ${r.map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
                }
            } else {
                this.log('warning', `⚠️ LinkCheck无响应或响应不完整 (收到${buffer.length}字节)`);
            }
        } catch (error) {
            this.log('error', `LinkCheck测试失败: ${error.message}`);
        }
        
        return false;
    }
    
    /**
     * 手动设置信号
     */
    async setSignal(signal, value) {
        if (!await this.ensureConnected()) return;
        
        try {
            if (signal === 'dtr') {
                await this.port.setSignals({ dataTerminalReady: value });
                this.log('info', `设置DTR = ${value}`);
            } else if (signal === 'rts') {
                await this.port.setSignals({ requestToSend: value });
                this.log('info', `设置RTS = ${value}`);
            } else if (signal === 'both') {
                await this.port.setSignals({ dataTerminalReady: value, requestToSend: value });
                this.log('info', `设置DTR = ${value}, RTS = ${value}`);
            }
        } catch (error) {
            this.log('error', `设置信号失败: ${error.message}`);
        }
    }
    
    /**
     * 连续性测试
     */
    async runContinuousTest() {
        if (!await this.ensureConnected()) return;
        
        const count = parseInt(document.getElementById('test-count').value) || 10;
        this.log('info', `\n=== 开始连续性测试 (${count}次) ===`);
        
        this.isRunning = true;
        let successCount = 0;
        let failCount = 0;
        
        for (let i = 1; i <= count && this.isRunning; i++) {
            this.log('info', `\n--- 第 ${i}/${count} 次测试 ---`);
            
            const success = await this.signalController.executeReset();
            
            if (success) {
                const linkSuccess = await this.testLinkCheck();
                if (linkSuccess) {
                    successCount++;
                    this.log('success', `✅ 测试 ${i} 成功`);
                } else {
                    failCount++;
                    this.log('warning', `⚠️ 测试 ${i} 复位成功但LinkCheck失败`);
                }
            } else {
                failCount++;
                this.log('error', `❌ 测试 ${i} 失败`);
            }
            
            // 测试间延迟
            if (i < count && this.isRunning) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        
        this.isRunning = false;
        this.log('info', `\n=== 测试完成 ===`);
        this.log('info', `成功: ${successCount}/${count} (${(successCount/count*100).toFixed(1)}%)`);
        this.log('info', `失败: ${failCount}/${count} (${(failCount/count*100).toFixed(1)}%)`);
    }
    
    /**
     * 停止测试
     */
    stopTest() {
        this.isRunning = false;
        this.log('warning', '测试已停止');
    }
    
    /**
     * 清空缓冲区
     */
    async clearBuffer() {
        try {
            const reader = this.port.readable.getReader();
            const timeout = 50;
            const startTime = Date.now();
            
            while (Date.now() - startTime < timeout) {
                const readPromise = reader.read();
                const timeoutPromise = new Promise(resolve => 
                    setTimeout(() => resolve({ done: true }), 5)
                );
                
                const result = await Promise.race([readPromise, timeoutPromise]);
                if (result.done) break;
            }
            
            reader.releaseLock();
        } catch (error) {
            // 忽略错误
        }
    }
    
    /**
     * 确保串口已连接
     */
    async ensureConnected() {
        if (!this.port || !this.port.readable) {
            return await this.connectPort();
        }
        return true;
    }
    
    /**
     * 日志输出
     */
    log(level, message) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        
        const colors = {
            'info': '#333',
            'success': '#4CAF50',
            'warning': '#FF9800',
            'error': '#f44336',
            'debug': '#666'
        };
        
        logEntry.style.color = colors[level] || '#333';
        logEntry.textContent = `[${timestamp}] ${message}`;
        
        if (this.logContainer) {
            this.logContainer.appendChild(logEntry);
            this.logContainer.scrollTop = this.logContainer.scrollHeight;
        }
        
        console.log(`[T5AI-Tester] ${message}`);
    }
    
    /**
     * 清空日志
     */
    clearLog() {
        if (this.logContainer) {
            this.logContainer.innerHTML = '';
        }
        this.log('info', '日志已清空');
    }
    
    /**
     * 导出日志
     */
    exportLog() {
        if (!this.logContainer) return;
        
        const logText = this.logContainer.textContent;
        const blob = new Blob([logText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `t5ai-signal-test-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.log('info', '日志已导出');
    }
    
    /**
     * 关闭测试器
     */
    async close() {
        this.stopTest();
        
        if (this.port) {
            try {
                await this.port.close();
            } catch (error) {
                // 忽略关闭错误
            }
        }
        
        const panel = document.getElementById('t5ai-signal-tester');
        if (panel) {
            panel.remove();
        }
        
        window.t5aiTester = null;
    }
}

// 创建全局实例
if (typeof window !== 'undefined') {
    window.T5AISignalControllerTester = T5AISignalControllerTester;
    
    // 自动启动测试器的快捷方法
    window.startT5AITester = function() {
        if (window.t5aiTester) {
            window.t5aiTester.close();
        }
        
        window.t5aiTester = new T5AISignalControllerTester();
        window.t5aiTester.initializeUI();
        
        console.log('T5AI信号控制器测试工具已启动');
        console.log('使用 window.t5aiTester 访问测试器实例');
    };
    
    console.log('T5AI信号控制器测试工具已加载');
    console.log('运行 startT5AITester() 启动测试工具');
}