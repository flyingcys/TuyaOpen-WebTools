/**
 * T5AI芯片下载器 - 基于成功测试的逻辑实现
 * 完全按照t5-flash-test.html中调试成功的协议逻辑
 * 
 * 版本: v1.2.0-ubuntu-debug
 * 修改日期: 2025-08-21
 * 修改内容: 增强Ubuntu兼容性和调试日志
 */

// 版本标识和系统检测
console.log('🔧 T5AI下载器版本: v1.2.0-ubuntu-debug (2025-08-21)');
console.log('🔧 检测到的用户代理:', navigator.userAgent);
console.log('🔧 检测到的平台:', navigator.platform);
console.log('🔧 Web Serial API 支持:', 'serial' in navigator ? '✅ 支持' : '❌ 不支持');

class T5Downloader extends BaseDownloader {
    constructor(serialPort, debugCallback) {
        super(serialPort, debugCallback);
        this.chipName = 'T5AI';
        
        // 系统环境检测日志
        this.debugLog('🔧 T5AI下载器初始化开始...');
        this.debugLog('🖥️ 检测到的操作系统:', this.detectOS());
        this.debugLog('🌐 浏览器类型:', this.detectBrowser());
        this.debugLog('📱 设备类型:', this.detectDevice());
        
        // 串口状态检测
        if (serialPort) {
            this.debugLog('🔌 串口对象状态检测:');
            this.debugLog(`  - 串口对象存在: ${!!serialPort}`);
            this.debugLog(`  - readable可用: ${!!(serialPort.readable)}`);
            this.debugLog(`  - writable可用: ${!!(serialPort.writable)}`);
            
            // 获取串口信息（如果可用）
            this.getPortInfo(serialPort);
        } else {
            this.debugLog('❌ 串口对象为null或未定义');
        }
        
        // Flash芯片数据库 - 完全按照测试版本的数据
        this.flashDatabase = {
            // 完全按照Python flash_info.py的数据
            0x00134051: { name: 'MD25D40D', manufacturer: 'GD', size: 4 * 1024 * 1024 },
            0x001340c8: { name: 'GD25Q41B', manufacturer: 'GD', size: 4 * 1024 * 1024 },
            0x00144051: { name: 'MD25D80D', manufacturer: 'GD', size: 8 * 1024 * 1024 },
            0x001464c8: { name: 'GD25WD80E', manufacturer: 'GD', size: 8 * 1024 * 1024 },
            0x001440c8: { name: 'GD25Q80C', manufacturer: 'GD', size: 8 * 1024 * 1024 },
            0x001540c8: { name: 'GD25Q16C', manufacturer: 'GD', size: 16 * 1024 * 1024 },
            0x001565c8: { name: 'GD25WQ16E', manufacturer: 'GD', size: 16 * 1024 * 1024 },
            0x001640c8: { name: 'GD25Q32C', manufacturer: 'GD', size: 32 * 1024 * 1024 },
            0x001665c8: { name: 'GD25WQ32E', manufacturer: 'GD', size: 32 * 1024 * 1024 },
            0x001740c8: { name: 'GD25Q64C', manufacturer: 'GD', size: 64 * 1024 * 1024 },
            0x001765c8: { name: 'GD25WQ64E', manufacturer: 'GD', size: 64 * 1024 * 1024 },
            0x001840c8: { name: 'GD25Q128C', manufacturer: 'GD', size: 128 * 1024 * 1024 },
            // TH系列
            0x001260eb: { name: 'TH25D20HA', manufacturer: 'TH', size: 2 * 1024 * 1024 },
            0x001360cd: { name: 'TH25Q40HB', manufacturer: 'TH', size: 4 * 1024 * 1024 },
            0x001460cd: { name: 'TH25Q80HB', manufacturer: 'TH', size: 8 * 1024 * 1024 },
            0x001560eb: { name: 'TH25Q16HB', manufacturer: 'TH', size: 16 * 1024 * 1024 },
            0x001760eb: { name: 'TH25Q64HA', manufacturer: 'TH', size: 64 * 1024 * 1024 },
            // XTX系列
            0x0015400b: { name: 'XT25F16B', manufacturer: 'XTX', size: 16 * 1024 * 1024 },
            0x0016400b: { name: 'XT25F32B', manufacturer: 'XTX', size: 32 * 1024 * 1024 },
            // BY系列
            0x001440e0: { name: 'BY25Q80A', manufacturer: 'BY', size: 8 * 1024 * 1024 },
            0x001340e0: { name: 'BY25Q40A', manufacturer: 'BY', size: 4 * 1024 * 1024 },
            // PY系列
            0x00124485: { name: 'PY25D22U', manufacturer: 'PY', size: 2 * 1024 * 1024 },
            0x00124585: { name: 'PY25D24U', manufacturer: 'PY', size: 2 * 1024 * 1024 },
            0x00136085: { name: 'PY25Q40H', manufacturer: 'PY', size: 4 * 1024 * 1024 },
            0x00146085: { name: 'PY25Q80H', manufacturer: 'PY', size: 8 * 1024 * 1024 },
            0x00156085: { name: 'PY25Q16H', manufacturer: 'PY', size: 16 * 1024 * 1024 },
            0x00154285: { name: 'PY25Q16SH', manufacturer: 'PY', size: 16 * 1024 * 1024 },
            0x00166085: { name: 'PY25Q32H', manufacturer: 'PY', size: 32 * 1024 * 1024 },
            // UC系列
            0x001260b3: { name: 'UC25HQ20', manufacturer: 'UC', size: 2 * 1024 * 1024 },
            0x001360b3: { name: 'UC25HQ40', manufacturer: 'UC', size: 4 * 1024 * 1024 },
            // GT系列
            0x001240c4: { name: 'GT25Q20D', manufacturer: 'GT', size: 2 * 1024 * 1024 },
            0x001340c4: { name: 'GT25Q40D', manufacturer: 'GT', size: 4 * 1024 * 1024 }
        };
        
        // 设备信息
        this.chipId = null;
        this.flashId = null;
        this.flashConfig = null;
    }

    /**
     * 设置进度回调函数
     */
    setProgressCallback(callback) {
        this.onProgress = callback;
    }

    /**
     * 设置调试模式
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
    }

    /**
     * 主流程日志输出（总是显示）- 用于关键进度和状态信息
     */
    mainLog(message) {
        this.debug('main', message);
    }

    /**
     * 信息日志输出（总是显示）- 用于重要的操作信息
     */
    infoLog(message) {
        this.debug('info', message);
    }

    /**
     * 调试日志输出（仅在调试模式下显示）- 用于详细的技术信息
     */
    debugLog(message, data = null) {
        if (this.debugMode) {
            this.debug('debug', message, data);
        }
    }

    /**
     * 警告日志输出（总是显示）
     */
    warningLog(message) {
        this.debug('warning', message);
    }

    /**
     * 错误日志输出（总是显示）
     */
    errorLog(message) {
        this.debug('error', message);
    }

    /**
     * 通信日志输出（总是显示）- 用于基本的通信状态信息
     */
    commLog(message) {
        this.debug('comm', message);
    }

    /**
     * 停止操作
     */
    stop() {
        this.stopFlag = true;
        this.debugLog('收到停止信号，将中断所有正在进行的操作', null);
    }

    /**
     * 检测操作系统
     */
    detectOS() {
        const platform = navigator.platform.toLowerCase();
        const userAgent = navigator.userAgent.toLowerCase();
        
        if (platform.includes('linux') || userAgent.includes('linux')) {
            return 'Linux';
        } else if (platform.includes('win') || userAgent.includes('windows')) {
            return 'Windows';
        } else if (platform.includes('mac') || userAgent.includes('mac')) {
            return 'macOS';
        } else {
            return `未知 (platform: ${platform})`;
        }
    }

    /**
     * 检测浏览器类型
     */
    detectBrowser() {
        const userAgent = navigator.userAgent;
        
        if (userAgent.includes('Chrome') && !userAgent.includes('Edge')) {
            return 'Chrome';
        } else if (userAgent.includes('Firefox')) {
            return 'Firefox';
        } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
            return 'Safari';
        } else if (userAgent.includes('Edge')) {
            return 'Edge';
        } else {
            return '未知浏览器';
        }
    }

    /**
     * 检测设备类型
     */
    detectDevice() {
        const userAgent = navigator.userAgent.toLowerCase();
        
        if (userAgent.includes('mobile') || userAgent.includes('android') || userAgent.includes('iphone')) {
            return '移动设备';
        } else {
            return '桌面设备';
        }
    }

    /**
     * 检查是否为串口断开错误
     */
    isPortDisconnectionError(error) {
        if (!error) return false;
        
        const errorMessage = error.message || error.toString();
        const disconnectionErrors = [
            'The device has been lost',
            'Device disconnected',
            'Failed to execute \'read\'',
            'Failed to execute \'write\'',
            'The port is already closed',
            'NetworkError',
            'DOMException',
            'Pipe closed',
            'Stream closed'
        ];
        
        return disconnectionErrors.some(msg => errorMessage.includes(msg));
    }

    /**
     * 获取串口信息
     */
    getPortInfo(port) {
        try {
            this.debugLog('🔍 获取串口详细信息:');
            
            // Web Serial API 的 port 对象信息
            if (port.getInfo) {
                const info = port.getInfo();
                this.debugLog(`  - VID: ${info.usbVendorId ? '0x' + info.usbVendorId.toString(16) : '未知'}`);
                this.debugLog(`  - PID: ${info.usbProductId ? '0x' + info.usbProductId.toString(16) : '未知'}`);
            }
            
            // 检查串口状态
            this.debugLog(`  - 串口已打开: ${port.readable && port.writable}`);
            this.debugLog(`  - readable锁定状态: ${port.readable && port.readable.locked ? '已锁定' : '未锁定'}`);
            this.debugLog(`  - writable锁定状态: ${port.writable && port.writable.locked ? '已锁定' : '未锁定'}`);
            
        } catch (error) {
            this.debugLog(`⚠️ 获取串口信息失败: ${error.message}`);
        }
    }

    /**
     * 清空接收缓冲区 - 完全按照测试版本的逻辑
     */
    async clearBuffer() {
        this.debugLog('开始清空接收缓冲区...');
        let reader = null;
        let totalBytesCleared = 0;
        let readAttempts = 0;
        
        try {
            // 检查串口状态
            if (!this.port || !this.port.readable) {
                this.debugLog('❌ 串口不可用，无法清空缓冲区');
                return;
            }
            
            this.debugLog('📖 获取串口readable reader...');
            reader = this.port.readable.getReader();
            this.debugLog('✅ reader获取成功');
            
            while (true) {
                readAttempts++;
                this.debugLog(`📥 清理缓冲区第${readAttempts}次尝试...`);
                
                const { value, done } = await Promise.race([
                    reader.read(),
                    new Promise(resolve => setTimeout(() => resolve({ done: true, timedOut: true }), 50))
                ]);
                
                if (done || !value || value.length === 0) {
                    if (value && value.length > 0) {
                        totalBytesCleared += value.length;
                        const hexData = Array.from(value).map(b => b.toString(16).padStart(2, '0')).join(' ');
                        this.debugLog(`🗑️ 清理数据: ${value.length}字节 - ${hexData}`);
                    } else {
                        this.debugLog(`⏰ 第${readAttempts}次尝试：${done ? '流结束' : '超时'}`);
                    }
                    break;
                } else {
                    totalBytesCleared += value.length;
                    const hexData = Array.from(value).map(b => b.toString(16).padStart(2, '0')).join(' ');
                    this.debugLog(`🗑️ 清理数据: ${value.length}字节 - ${hexData}`);
                    
                    // 尝试解析为文本，检测设备状态
                    try {
                        const text = new TextDecoder().decode(value);
                        if (text.includes('tuya>') || text.includes('\r\ntuya>')) {
                            this.debugLog('⚠️ 检测到应用程序提示符 "tuya>" - 设备未在bootloader模式！');
                        }
                        if (text.length > 0 && text.trim().length > 0) {
                            this.debugLog(`📝 文本内容: "${text.replace(/\r/g, '\\r').replace(/\n/g, '\\n')}"`);
                        }
                    } catch (e) {
                        // 忽略解码错误
                    }
                }
            }
            
            this.debugLog(`✅ 缓冲区清理完成，共清理${totalBytesCleared}字节，尝试${readAttempts}次`);
        } catch (error) {
            this.debugLog(`❌ 清理缓冲区时发生错误: ${error.message}`);
            // 检查是否为串口异常断开
            if (this.isPortDisconnectionError(error)) {
                throw new Error('设备连接已断开，请检查USB连接后重试');
            }
            // 其他错误忽略
        } finally {
            if (reader) {
                try { 
                    this.debugLog('🔓 释放reader锁定...');
                    reader.releaseLock(); 
                    this.debugLog('✅ reader锁定已释放');
                } catch (e) {
                    this.debugLog(`⚠️ 释放reader锁定失败: ${e.message}`);
                }
            }
        }
    }

    /**
     * 清空缓冲区并返回内容（用于检测命令行模式）
     */
    async clearBufferWithReturn() {
        let allData = '';
        let reader = null;
        let totalBytesCleared = 0;
        
        try {
            if (!this.port || !this.port.readable) {
                return '';
            }
            
            reader = this.port.readable.getReader();
            
            for (let i = 0; i < 5; i++) {
                const { value, done } = await Promise.race([
                    reader.read(),
                    new Promise(resolve => setTimeout(() => resolve({ done: true }), 50))
                ]);
                
                if (done || !value || value.length === 0) break;
                
                totalBytesCleared += value.length;
                
                // 尝试转换为文本
                try {
                    const text = new TextDecoder().decode(value);
                    allData += text;
                } catch (e) {
                    // 忽略解码错误
                }
                
                this.debugLog(`🗑️ 清理数据: ${value.length}字节 - ${Array.from(value).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
            }
            
            if (totalBytesCleared > 0) {
                this.debugLog(`✅ 缓冲区清理完成，共清理${totalBytesCleared}字节`);
                if (allData.includes('tuya>')) {
                    this.debugLog('⚠️ 检测到命令行提示符 "tuya>"');
                }
            }
        } catch (error) {
            // 忽略错误
        } finally {
            if (reader) {
                try { 
                    reader.releaseLock(); 
                } catch (e) {
                    // 忽略
                }
            }
        }
        
        return allData;
    }

    /**
     * 进入下载模式 - 增强的诊断日志版本
     */
    async enterDownloadMode() {
        const startTime = Date.now();
        const platform = navigator.platform.toLowerCase();
        const isLinux = platform.includes('linux');
        const isWindows = platform.includes('win');
        
        this.debugLog('🚀 ========== 开始进入下载模式序列 ==========');
        this.debugLog(`💻 运行平台: ${navigator.platform}`);
        this.debugLog(`🖥️ 操作系统: Linux=${isLinux}, Windows=${isWindows}`);
        this.debugLog(`⏰ 开始时间戳: ${startTime}`);
        
        try {
            // 步骤1：检查当前缓冲区状态
            this.debugLog('📋 步骤1: 检查当前缓冲区状态...');
            const bufferContent = await this.clearBufferWithReturn();
            if (bufferContent.includes('tuya>')) {
                this.debugLog('⚠️ 检测到设备在应用程序模式 (tuya>)，需要强制复位');
            } else {
                this.debugLog('✅ 缓冲区干净，设备可能已在bootloader模式');
            }
            this.debugLog(`⏱️ 缓冲区检查耗时: ${Date.now() - startTime}ms`);
            
            // 步骤2：发送多个Ctrl+C退出任何运行状态
            const ctrlCTime = Date.now();
            this.debugLog('📋 步骤2: 发送Ctrl+C中断信号...');
            const writer = this.port.writable.getWriter();
            await writer.write(new Uint8Array([0x03, 0x03, 0x03])); // Ctrl+C x3
            writer.releaseLock();
            this.debugLog(`✅ Ctrl+C发送完成，耗时: ${Date.now() - ctrlCTime}ms`);
            
            // 等待Ctrl+C生效
            const ctrlCWaitTime = isLinux ? 50 : 100; // Linux减少等待时间
            this.debugLog(`⏳ 等待Ctrl+C生效: ${ctrlCWaitTime}ms`);
            await new Promise(resolve => setTimeout(resolve, ctrlCWaitTime));
            
            // 清理可能的响应
            const clearTime = Date.now();
            this.debugLog('📋 步骤3: 清理Ctrl+C响应...');
            await this.clearBuffer();
            this.debugLog(`✅ 清理完成，耗时: ${Date.now() - clearTime}ms`);
            
            // 步骤4：T5AI特殊复位序列
            const resetTime = Date.now();
            this.debugLog('📋 步骤4: 执行T5AI DTR/RTS复位序列...');
            this.debugLog(`⏱️ 从开始到复位: ${resetTime - startTime}ms`);
            
            // 初始状态：DTR和RTS都设为高
            const initSignalTime = Date.now();
            this.debugLog('📌 4.1 初始化信号: DTR=HIGH, RTS=HIGH');
            await this.port.setSignals({ 
                dataTerminalReady: true,
                requestToSend: true
            });
            this.debugLog(`✅ 初始化完成，耗时: ${Date.now() - initSignalTime}ms`);
            
            // 初始化等待
            const initWaitTime = isLinux ? 20 : 50; // Linux减少等待
            this.debugLog(`⏳ 初始化等待: ${initWaitTime}ms`);
            await new Promise(resolve => setTimeout(resolve, initWaitTime));
            
            // 触发复位
            const triggerResetTime = Date.now();
            this.debugLog('📌 4.2 触发复位: DTR=LOW, RTS=LOW');
            await this.port.setSignals({ 
                dataTerminalReady: false,  // DTR低电平触发复位
                requestToSend: false       // RTS低电平
            });
            this.debugLog(`✅ 复位触发完成，耗时: ${Date.now() - triggerResetTime}ms`);
            
            // 复位保持时间 - 这是关键！
            const resetHoldTime = isLinux ? 50 : 100; // Linux可能需要更短的复位时间
            this.debugLog(`⏳ 复位保持时间: ${resetHoldTime}ms`);
            await new Promise(resolve => setTimeout(resolve, resetHoldTime));
            
            // 释放复位，进入下载模式
            const releaseResetTime = Date.now();
            this.debugLog('📌 4.3 释放复位进入下载模式: DTR=HIGH, RTS=LOW');
            await this.port.setSignals({ 
                dataTerminalReady: true,   // DTR高电平释放复位
                requestToSend: false        // RTS保持低（下载模式）
            });
            this.debugLog(`✅ 复位释放完成，耗时: ${Date.now() - releaseResetTime}ms`);
            
            // 关键：等待设备进入bootloader的时间窗口
            // 这是最重要的时间参数！！！
            const bootloaderWaitTime = isLinux ? 20 : 200; // Linux必须快速发送LinkCheck
            this.debugLog(`⏳ 等待设备进入bootloader: ${bootloaderWaitTime}ms`);
            this.debugLog('⚠️ 注意：这个等待时间至关重要！太长设备会进入应用程序');
            await new Promise(resolve => setTimeout(resolve, bootloaderWaitTime));
            
            // 立即检查缓冲区状态
            const checkTime = Date.now();
            this.debugLog('📋 步骤5: 立即检查设备状态...');
            const postResetBuffer = await this.clearBufferWithReturn();
            if (postResetBuffer.includes('tuya>')) {
                this.debugLog('❌ 错误：设备进入了应用程序模式！');
                this.debugLog('❌ 可能原因：等待时间太长或复位序列不正确');
            } else if (postResetBuffer.length > 0) {
                this.debugLog(`📝 复位后缓冲区内容: "${postResetBuffer.replace(/\r/g, '\\r').replace(/\n/g, '\\n')}"`);
            } else {
                this.debugLog('✅ 缓冲区为空，设备可能在bootloader模式');
            }
            this.debugLog(`✅ 状态检查完成，耗时: ${Date.now() - checkTime}ms`);
            
            const totalTime = Date.now() - startTime;
            this.debugLog('✅ ========== 下载模式复位序列完成 ==========');
            this.debugLog(`⏱️ 总耗时: ${totalTime}ms`);
            
            // 如果是Linux且检测到应用模式，尝试备用方案
            if (isLinux && postResetBuffer.includes('tuya>')) {
                this.debugLog('🔄 Linux平台检测到失败，尝试备用复位方案...');
                await this.tryAlternativeReset();
            }
            
        } catch (error) {
            this.debugLog(`❌ 进入下载模式时出错: ${error.message}`);
            this.debugLog(`❌ 错误堆栈: ${error.stack}`);
        }
    }
    
    /**
     * 备用复位方案 - 用于Linux平台
     */
    async tryAlternativeReset() {
        const startTime = Date.now();
        this.debugLog('🔄 ========== 开始备用复位方案 ==========');
        
        try {
            // 方案B：使用RTS控制复位
            this.debugLog('📌 备用方案: 使用RTS控制复位');
            
            // 发送Ctrl+C
            const writer = this.port.writable.getWriter();
            await writer.write(new Uint8Array([0x03, 0x03, 0x03]));
            writer.releaseLock();
            await new Promise(resolve => setTimeout(resolve, 20));
            
            // 清理缓冲区
            await this.clearBuffer();
            
            // RTS复位序列
            this.debugLog('📌 设置: DTR=LOW, RTS=HIGH (RTS复位)');
            await this.port.setSignals({ 
                dataTerminalReady: false,
                requestToSend: true    // RTS高电平触发复位
            });
            await new Promise(resolve => setTimeout(resolve, 50));
            
            this.debugLog('📌 释放: DTR=LOW, RTS=LOW (进入bootloader)');
            await this.port.setSignals({ 
                dataTerminalReady: false,
                requestToSend: false   // RTS低电平释放复位
            });
            
            // 极短等待 - Linux关键！
            await new Promise(resolve => setTimeout(resolve, 10));
            
            // 立即发送LinkCheck探测
            this.debugLog('📤 立即发送LinkCheck探测...');
            await this.sendCommand([0x01, 0xE0, 0xFC, 0x01, 0x00], 'QuickLinkCheck');
            
            const totalTime = Date.now() - startTime;
            this.debugLog(`✅ 备用方案完成，耗时: ${totalTime}ms`);
            
        } catch (error) {
            this.debugLog(`❌ 备用复位方案失败: ${error.message}`);
        }
    }

    /**
     * 发送命令 - 完全按照测试版本的逻辑
     */
    async sendCommand(command, commandName) {
        // 检查停止标志
        if (this.stopFlag) {
            this.debugLog(`检测到停止信号，取消发送${commandName}`, null);
            throw new Error(`操作已被用户取消`);
        }
        
        this.commLog(`发送${commandName}`);
        this.debugLog(`📤 准备发送${commandName}: ${command.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')} (${command.length}字节)`);
        
        let writer = null;
        try {
            // 检查串口状态
            if (!this.port || !this.port.writable) {
                this.debugLog('❌ 串口不可用，无法发送命令');
                throw new Error('串口不可用');
            }
            
            this.debugLog('✍️ 获取串口writable writer...');
            writer = this.port.writable.getWriter();
            this.debugLog('✅ writer获取成功');
            
            // 检查writer状态
            if (!writer) {
                this.debugLog('❌ writer为null');
                throw new Error('无法获取串口writer');
            }
            
            this.debugLog('📡 开始发送数据...');
            const commandData = new Uint8Array(command);
            await writer.write(commandData);
            this.debugLog('✅ 数据发送完成');
            
        } catch (error) {
            this.debugLog(`❌ 发送${commandName}时发生错误: ${error.message}`);
            this.debugLog(`❌ 错误详情:`, error);
            throw new Error(`发送${commandName}失败: ${error.message}`);
        } finally {
            if (writer) {
                try { 
                    this.debugLog('🔓 释放writer锁定...');
                    writer.releaseLock(); 
                    this.debugLog('✅ writer锁定已释放');
                } catch (e) {
                    this.debugLog(`⚠️ 释放writer锁定失败: ${e.message}`);
                }
            }
        }
    }

    /**
     * 接收响应 - 完全按照Python的wait_for_cmd_response机制实现
     * Python逻辑：
     * def wait_for_cmd_response(self, expect_length, timeout_sec=0.1):
     *     timeout = serial.Timeout(timeout_sec)
     *     read_buf = b''
     *     while not timeout.expired():
     *         buf = self.ser.read(expect_length-len(read_buf))  # 阻塞读取
     *         read_buf += buf
     *         if len(read_buf) == expect_length:
     *             break
     *     return read_buf
     */
    async receiveResponse(expectedLength, timeout = 100) {  // Python默认0.1秒即100ms
        const isDebugReceive = this.debugMode && expectedLength === 8; // 只对LinkCheck(8字节)做详细日志
        if (isDebugReceive) {
            this.debugLog(`📥 ========== 开始接收响应 ==========`);
            this.debugLog(`  - 期望长度: ${expectedLength}字节`);
            this.debugLog(`  - 超时设置: ${timeout}ms`);
            this.debugLog(`  - 平台: ${navigator.platform}`);
        } else {
            this.debugLog(`📥 开始接收响应，期望长度: ${expectedLength}字节，超时: ${timeout}ms`);
        }
        let reader = null;
        let readAttempts = 0;
        
        try {
            // 检查串口状态
            if (!this.port || !this.port.readable) {
                this.debugLog('❌ 串口不可用，无法接收响应');
                throw new Error('串口不可用');
            }
            
            this.debugLog('📖 获取串口readable reader...');
            reader = this.port.readable.getReader();
            this.debugLog('✅ reader获取成功');
            
            const responseBuffer = [];
            const startTime = Date.now();
            
            // Python式的阻塞读取循环
            while (responseBuffer.length < expectedLength && Date.now() - startTime < timeout && !this.stopFlag) {
                readAttempts++;
                const elapsedTime = Date.now() - startTime;
                const remainingBytes = expectedLength - responseBuffer.length;
                const remainingTime = timeout - elapsedTime;
                
                if (isDebugReceive && readAttempts === 1) {
                    this.debugLog(`📥 第${readAttempts}次读取尝试`);
                    this.debugLog(`  - 已过时间: ${elapsedTime}ms`);
                    this.debugLog(`  - 已收到: ${responseBuffer.length}字节`);
                    this.debugLog(`  - 剩余时间: ${remainingTime}ms`);
                } else if (!isDebugReceive) {
                    this.debugLog(`📥 第${readAttempts}次读取尝试，已用时: ${elapsedTime}ms，已收到: ${responseBuffer.length}字节`);
                }
                
                if (remainingTime <= 0) break;
                
                // 检查停止标志
                if (this.stopFlag) {
                    this.debugLog('检测到停止信号，中断接收响应操作', null);
                    break;
                }
                
                try {
                    // 模拟Python的阻塞读取：期望读取remainingBytes，但可能读到更少
                    const readPromise = reader.read();
                    const timeoutPromise = new Promise(resolve => 
                        setTimeout(() => resolve({ done: true, timedOut: true }), remainingTime)
                    );
                    
                    const result = await Promise.race([readPromise, timeoutPromise]);
                    
                    if (result.timedOut || result.done) {
                        // 超时或流结束，但Python会继续尝试直到总超时
                        if (result.timedOut) {
                            if (isDebugReceive) {
                                this.debugLog(`⏰ 读取超时`);
                                this.debugLog(`  - 剩余时间: ${remainingTime}ms`);
                                this.debugLog(`  - 读取次数: ${readAttempts}`);
                            } else {
                                this.debugLog(`⏰ 读取超时，剩余时间: ${remainingTime}ms，退出循环`);
                            }
                            break; // 总超时，退出
                        }
                        if (!isDebugReceive) {
                            this.debugLog(`📞 串口流结束(done)，等待1ms后继续尝试...`);
                        }
                        // 如果是done但不是超时，短暂等待后继续尝试
                        await new Promise(resolve => setTimeout(resolve, 1));
                        continue;
                    }
                    
                    if (result.value && result.value.length > 0) {
                        responseBuffer.push(...result.value);
                        this.debugLog(`📦 接收: ${Array.from(result.value).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')} (新增${result.value.length}字节，累计${responseBuffer.length}字节)`);
                        
                        // Python逻辑：收到期望长度立即返回
                        if (responseBuffer.length >= expectedLength) {
                            this.commLog(`✅ 接收响应完成: ${responseBuffer.length}字节`);
                            this.debugLog(`✅ 响应数据完整: ${responseBuffer.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')}`);
                            break;
                        }
                    } else {
                        this.debugLog(`📭 读取结果为空，继续尝试...`);
                    }
                } catch (error) {
                    // 检查是否为串口异常断开
                    if (this.isPortDisconnectionError(error)) {
                        throw new Error('设备连接已断开，请检查USB连接后重试');
                    }
                    this.debugLog(`读取错误: ${error.message}`);
                    // Python在读取错误时会继续尝试，直到超时
                    await new Promise(resolve => setTimeout(resolve, 1));
                }
            }
            
            const finalLength = responseBuffer.length;
            const totalTime = Date.now() - startTime;
            
            if (isDebugReceive) {
                if (finalLength < expectedLength) {
                    this.debugLog(`⚠️ ========== 接收不完整 ==========`);
                    this.debugLog(`  - 期望: ${expectedLength}字节`);
                    this.debugLog(`  - 实际: ${finalLength}字节`);
                    this.debugLog(`  - 耗时: ${totalTime}ms`);
                    this.debugLog(`  - 尝试: ${readAttempts}次`);
                    this.debugLog(`  - 可能原因: 设备未响应或串口通信问题`);
                } else {
                    this.debugLog(`✅ 接收完成: ${finalLength}字节, ${totalTime}ms, ${readAttempts}次`);
                }
            } else {
                if (finalLength < expectedLength) {
                    this.debugLog(`⚠️ 接收不完整: 期望${expectedLength}字节，实际收到${finalLength}字节，用时${totalTime}ms，尝试${readAttempts}次`);
                } else {
                    this.debugLog(`✅ 接收完成: 收到${finalLength}字节，用时${totalTime}ms，尝试${readAttempts}次`);
                }
            }
            
            return responseBuffer;
        } catch (error) {
            this.debugLog(`❌ 接收响应时发生错误: ${error.message}`);
            this.debugLog(`❌ 错误详情:`, error);
            throw new Error(`接收响应失败: ${error.message}`);
        } finally {
            if (reader) {
                try { 
                    this.debugLog('🔓 释放reader锁定...');
                    reader.releaseLock(); 
                    this.debugLog('✅ reader锁定已释放');
                } catch (e) {
                    this.debugLog(`⚠️ 释放reader锁定失败: ${e.message}`);
                }
            }
        }
    }

    /**
     * 步骤1：获取总线控制权 - 增强Linux兼容性
     */
    async getBusControl() {
        this.mainLog('=== 步骤1: 获取总线控制权 ===');
        
        // 步骤1：先尝试快速模式（适合已在下载模式的设备）
        this.debugLog('🚀 尝试快速模式连接...');
        for (let quickTry = 1; quickTry <= 3; quickTry++) {
            await this.clearBuffer();
            await this.sendCommand([0x01, 0xE0, 0xFC, 0x01, 0x00], 'LinkCheck');
            const quickResponse = await this.receiveResponse(8, 50);
            
            if (quickResponse.length === 8 && 
                quickResponse[0] === 0x04 && quickResponse[1] === 0x0E &&
                quickResponse[6] === 0x01 && quickResponse[7] === 0x00) {
                this.mainLog(`✅ 快速模式：第${quickTry}次尝试成功`);
                return true;
            }
        }
        
        // 步骤2：快速模式失败，执行完整流程
        this.mainLog('快速模式失败，开始完整连接流程...');
        
        const maxTryCount = 100;
        for (let attempt = 1; attempt <= maxTryCount && !this.stopFlag; attempt++) {
            if (attempt % 10 === 1) {
                this.commLog(`尝试 ${attempt}/${maxTryCount}`);
            }
            
            // 每10次尝试或第一次尝试时，执行完整复位
            if (attempt === 1 || attempt % 10 === 1) {
                const resetStartTime = Date.now();
                this.debugLog(`📊 ===== 复位尝试 ${attempt}/${maxTryCount} =====`);
                
                // 检查是否在命令行模式
                const bufferCheckTime = Date.now();
                const bufferData = await this.clearBufferWithReturn();
                this.debugLog(`⏱️ 缓冲区检查耗时: ${Date.now() - bufferCheckTime}ms`);
                
                if (bufferData.includes('tuya>')) {
                    this.debugLog('⚠️ 检测到命令行模式 "tuya>"，执行强制进入下载模式序列');
                    this.debugLog(`📝 缓冲区内容: "${bufferData.substring(0, 50)}..."`);
                } else if (bufferData.length > 0) {
                    this.debugLog(`📝 缓冲区有其他内容: "${bufferData.substring(0, 50)}..."`);
                } else {
                    this.debugLog('✅ 缓冲区为空，可能已在bootloader模式');
                }
                
                // 执行复位序列
                this.debugLog(`🔄 执行复位流程 (第${attempt}次尝试)`);
                await this.enterDownloadMode();
                
                this.debugLog(`⏱️ 复位总耗时: ${Date.now() - resetStartTime}ms`);
            }
            
            // 执行LinkCheck
            const linkCheckSuccess = await this.doLinkCheckEx(60);
            if (linkCheckSuccess) {
                this.mainLog(`✅ 第${attempt}次尝试成功获取总线控制权`);
                return true;
            }
            
            // 如果连续失败，尝试不同的复位方法
            if (attempt % 20 === 0) {
                this.debugLog('🔄 尝试备用复位序列...');
                // 备用序列：RTS控制复位
                await this.port.setSignals({ 
                    dataTerminalReady: false,
                    requestToSend: true    // RTS高电平
                });
                await new Promise(resolve => setTimeout(resolve, 300));
                await this.port.setSignals({ 
                    dataTerminalReady: false,
                    requestToSend: false   // RTS低电平释放复位
                });
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        return false;
    }

    /**
     * do_link_check_ex - 完全按照Python版本实现
     * Python: max_try_count=60, timeout_sec=0.001
     */
    async doLinkCheckEx(maxTryCount = 60) {
        this.debugLog(`🔗 ========== 开始LinkCheck ========== `);
        this.debugLog(`📋 最多尝试: ${maxTryCount}次`);
        this.debugLog(`💻 平台: ${navigator.platform}`);
        
        let totalResponseBytes = 0;
        let validResponses = 0;
        let timeouts = 0;
        let noResponseCount = 0;
        const startTime = Date.now();
        
        for (let cnt = 0; cnt < maxTryCount && !this.stopFlag; cnt++) {
            const attemptStart = Date.now();
            
            // 每10次显示详细日志
            if (cnt === 0 || cnt % 10 === 0) {
                this.debugLog(`🔗 LinkCheck第${cnt + 1}/${maxTryCount}次尝试`);
                this.debugLog(`⏱️ 已经过: ${Date.now() - startTime}ms`);
            }
            
            try {
                // 清理缓冲区
                const clearStart = Date.now();
                await this.clearBuffer();
                const clearTime = Date.now() - clearStart;
                if (cnt === 0) {
                    this.debugLog(`⏱️ 清理缓冲区耗时: ${clearTime}ms`);
                }
                
                // 发送LinkCheck命令
                const sendStart = Date.now();
                await this.sendCommand([0x01, 0xE0, 0xFC, 0x01, 0x00], 'LinkCheck');
                const sendTime = Date.now() - sendStart;
                if (cnt === 0) {
                    this.debugLog(`⏱️ 发送命令耗时: ${sendTime}ms`);
                }
                
                // 增加超时时间以兼容Linux系统（从1ms增加到10ms）
                const receiveStart = Date.now();
                const response = await this.receiveResponse(8, 10);
                const receiveTime = Date.now() - receiveStart;
                const attemptTime = Date.now() - attemptStart;
                
                totalResponseBytes += response.length;
                
                // 详细记录每次尝试的结果
                if (response.length > 0) {
                    validResponses++;
                    this.debugLog(`📦 第${cnt + 1}次收到响应: 长度=${response.length}, 用时=${attemptTime}ms`);
                    this.debugLog(`📦 响应数据: ${response.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')}`);
                    this.debugLog(`⏱️ 接收耗时: ${receiveTime}ms`);
                } else {
                    timeouts++;
                    noResponseCount++;
                    if (cnt === 0 || cnt === 1 || cnt % 10 === 9) { // 前两次和每10次记录
                        this.debugLog(`⏰ 第${cnt + 1}次LinkCheck无响应`);
                        this.debugLog(`  - 总耗时: ${attemptTime}ms`);
                        this.debugLog(`  - 清理: ${clearTime}ms, 发送: ${sendTime}ms, 等待: ${receiveTime}ms`);
                        this.debugLog(`  - 累计无响应: ${noResponseCount}次`);
                    }
                }
                
                // 检查响应是否正确
                if (response.length >= 8) {
                    const r = response.slice(0, 8);
                    const expectedPattern = [0x04, 0x0E, 0x05, 0x01, 0xE0, 0xFC, 0x01, 0x00];
                    
                    // 逐字节检查
                    let patternMatch = true;
                    for (let i = 0; i < 8; i++) {
                        if (r[i] !== expectedPattern[i]) {
                            patternMatch = false;
                            this.debugLog(`❌ 字节${i}不匹配: 期望0x${expectedPattern[i].toString(16).padStart(2, '0').toUpperCase()}, 实际0x${r[i].toString(16).padStart(2, '0').toUpperCase()}`);
                        }
                    }
                    
                    if (patternMatch) {
                        const totalTime = Date.now() - startTime;
                        this.debugLog(`✅ LinkCheck成功！`);
                        this.debugLog(`✅ 统计信息: 尝试${cnt + 1}次, 总用时${totalTime}ms, 有效响应${validResponses}次, 超时${timeouts}次`);
                        return true;
                    } else {
                        this.debugLog(`❌ 响应模式不匹配`);
                        this.debugLog(`❌ 期望: ${expectedPattern.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')}`);
                        this.debugLog(`❌ 实际: ${r.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')}`);
                    }
                } else if (response.length > 0) {
                    this.debugLog(`❌ 响应长度不足: ${response.length}字节 < 8字节`);
                }
                
            } catch (error) {
                this.debugLog(`❌ LinkCheck第${cnt + 1}次尝试异常: ${error.message}`);
            }
        }
        
        const totalTime = Date.now() - startTime;
        this.debugLog(`❌ ========== LinkCheck最终失败 ==========`);
        this.debugLog(`❌ 最终统计:`);
        this.debugLog(`  - 尝试次数: ${maxTryCount}次`);
        this.debugLog(`  - 总耗时: ${totalTime}ms`);
        this.debugLog(`  - 平均每次: ${Math.round(totalTime/maxTryCount)}ms`);
        this.debugLog(`  - 有效响应: ${validResponses}次`);
        this.debugLog(`  - 超时/无响应: ${timeouts}次`);
        this.debugLog(`  - 总接收字节: ${totalResponseBytes}`);
        this.debugLog(`⚠️ 可能原因: 设备未进入bootloader模式或DTR/RTS信号问题`);
        return false;
    }

    /**
     * 步骤2：获取芯片ID - 完全按照测试版本的逻辑
     */
    async getChipId() {
        this.mainLog('=== 步骤2: 获取芯片ID ===');
        this.commLog('正在获取芯片ID...');
        
        const command = [0x01, 0xE0, 0xFC, 0x05, 0x03, 0x04, 0x00, 0x01, 0x44];
        
        await this.clearBuffer();
        await this.sendCommand(command, 'GetChipId');
        
        const response = await this.receiveResponse(15, 500); // Python使用0.5秒超时
        if (response.length >= 15) {
            const r = response.slice(0, 15);
            this.debugLog(`完整响应: ${r.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')}`);
            
            if (r[0] === 0x04 && r[1] === 0x0E && r[3] === 0x01 && 
                r[4] === 0xE0 && r[5] === 0xFC && r[6] === 0x03) {
                
                const chipIdBytes = r.slice(-4);
                const chipId = chipIdBytes[0] | (chipIdBytes[1] << 8) | (chipIdBytes[2] << 16) | (chipIdBytes[3] << 24);
                
                this.mainLog(`✅ 芯片ID: 0x${chipId.toString(16).toUpperCase().padStart(8, '0')}`);
                this.chipId = chipId;
                return chipId;
            }
        }
        
        throw new Error('获取芯片ID失败');
    }

    /**
     * 步骤3：获取Flash ID - 完全按照测试版本的逻辑
     */
    async getFlashId() {
        this.mainLog('=== 步骤3: 获取Flash ID ===');
        this.commLog('正在获取Flash ID...');
        
        // 使用正确的Flash协议格式：[0x01, 0xE0, 0xFC, 0xFF, 0xF4, payload_length_low, payload_length_high, cmd, reg_addr, 0, 0, 0]
        // 其中: payload_length = 5 (cmd + 4字节地址), cmd = 0x0e, reg_addr = 0x9f
        const command = [0x01, 0xE0, 0xFC, 0xFF, 0xF4, 0x05, 0x00, 0x0e, 0x9f, 0x00, 0x00, 0x00];
        
        await this.clearBuffer();
        await this.sendCommand(command, 'FlashGetMID');
        
        // 期望响应格式：[0x04, 0x0e, 0xff, 0x01, 0xe0, 0xfc, 0xf4, len_low, len_high, cmd, status, flash_id_bytes...]
        // 最少响应长度：11字节（基础头部） + 4字节（Flash ID数据）= 15字节
        const response = await this.receiveResponse(15); // 使用默认超时时间100ms
        if (response.length >= 11) {
            const r = response;
            this.debug('debug', `完整响应: ${r.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')}`);
            
            // 检查基本Flash协议格式：04 0E FF 01 E0 FC F4
            if (r[0] === 0x04 && r[1] === 0x0E && r[2] === 0xFF && 
                r[3] === 0x01 && r[4] === 0xE0 && r[5] === 0xFC && r[6] === 0xF4) {
                
                // 检查命令响应 (位置9应该是0x0e)
                if (r[9] === 0x0e) {
                    // 检查状态码 (位置10)
                    const status = r[10];
                    this.debug('debug', `状态码: 0x${status.toString(16).padStart(2, '0').toUpperCase()}`);
                    
                    if (status === 0x00) {
                        // 状态正常，提取Flash ID - 完全按照Python逻辑
                        if (response.length >= 15) {
                            // Python代码: struct.unpack("<I", response_content[11:])[0] >> 8
                            // 从位置11开始取4字节，小端序解析为32位整数，然后右移8位
                            const flashIdData = response.slice(11, 15);
                            this.debug('debug', `Flash ID原始数据: ${flashIdData.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')}`);
                            
                            // 小端序解析为32位整数
                            const flashId32 = flashIdData[0] | (flashIdData[1] << 8) | (flashIdData[2] << 16) | (flashIdData[3] << 24);
                            this.debug('debug', `32位整数 (小端序): 0x${flashId32.toString(16).toUpperCase().padStart(8, '0')}`);
                            
                            // 右移8位得到最终Flash ID
                            const flashId = flashId32 >>> 8;
                            this.debug('debug', `Flash ID (右移8位): 0x${flashId.toString(16).toUpperCase().padStart(6, '0')}`);
                            
                            // 查找数据库中的配置
                            const config = this.flashDatabase[flashId];
                            
                            this.flashId = flashId;
                            this.flashConfig = config;
                            
                            if (config) {
                                this.debug('info', `✅ 识别Flash: ${config.manufacturer} ${config.name} (${config.size / 1048576}MB)`);
                                return { flashId, config };
                            } else {
                                this.warningLog(`⚠️ 未知Flash ID: 0x${flashId.toString(16).toUpperCase().padStart(6, '0')}`);
                                return { flashId, config: null };
                            }
                        } else {
                            throw new Error(`响应长度不足，期望15字节，实际${response.length}字节`);
                        }
                    } else {
                        // 状态码错误，查找错误信息
                        const statusInfo = [
                            { code: 0x0, desc: 'normal' },
                            { code: 0x1, desc: 'FLASH_STATUS_BUSY' },
                            { code: 0x2, desc: 'spi timeout' },
                            { code: 0x3, desc: 'flash operate timeout' },
                            { code: 0x4, desc: 'package payload length error' },
                            { code: 0x5, desc: 'package length error' },
                            { code: 0x6, desc: 'flash operate PARAM_ERROR' },
                            { code: 0x7, desc: 'unknown cmd' },
                        ];
                        
                        const errorInfo = statusInfo.find(info => info.code === status);
                        const errorDesc = errorInfo ? errorInfo.desc : `未知错误码 0x${status.toString(16)}`;
                        throw new Error(`Flash操作失败: ${errorDesc} (状态码: 0x${status.toString(16).padStart(2, '0').toUpperCase()})`);
                    }
                } else {
                    throw new Error(`命令响应码错误，期望0x0e，实际0x${r[9].toString(16).padStart(2, '0').toUpperCase()}`);
                }
            } else {
                throw new Error(`Flash协议头部格式错误`);
            }
        } else {
            throw new Error(`响应长度不足，期望至少11字节，实际${response.length}字节`);
        }
    }

    /**
     * 连接设备并初始化 - 完全按照测试版本的三步流程
     */
    async connect() {
        try {
            this.infoLog('开始T5AI设备连接和初始化流程...');
            
            // 执行三个步骤
            if (!await this.getBusControl()) {
                throw new Error('获取总线控制权失败');
            }
            
            await this.getChipId();
            const flashResult = await this.getFlashId();
            
            this.infoLog('✅ T5AI设备连接和初始化流程完成！');
            this.infoLog(`芯片ID: 0x${this.chipId.toString(16).toUpperCase().padStart(8, '0')}`);
            this.infoLog(`Flash ID: 0x${this.flashId.toString(16).toUpperCase().padStart(6, '0')}`);
            if (this.flashConfig) {
                this.infoLog(`Flash型号: ${this.flashConfig.manufacturer} ${this.flashConfig.name} (${this.flashConfig.size / 1048576}MB)`);
            }
            
            if (this.onProgress) {
                this.onProgress({
                    stage: 'connected',
                    message: 'T5AI设备连接成功',
                    chipId: this.chipId,
                    flashId: this.flashId,
                    flashConfig: this.flashConfig
                });
            }
            
            return true;
        } catch (error) {
            this.errorLog(`T5AI设备连接失败: ${error.message}`);
            if (this.onProgress) {
                this.onProgress({ 
                    stage: 'error', 
                    message: `连接失败: ${error.message}` 
                });
            }
            return false;
        }
    }

    /**
     * 下载固件 - 逐步实现完整功能
     */
    async downloadFirmware(fileData, startAddr = 0x00) {
        if (!this.chipId || !this.flashId) {
            throw new Error('设备未连接，请先调用connect()');
        }
        
        try {
            this.infoLog(i18n.t('starting_firmware_download_process'));
            this.infoLog(`文件大小: ${fileData.length} 字节`);
            this.infoLog(`起始地址: 0x${startAddr.toString(16).padStart(8, '0')}`);
            this.infoLog(`目标Flash: ${this.flashConfig ? this.flashConfig.manufacturer + ' ' + this.flashConfig.name : '未知型号'}`);
            
            if (this.onProgress) {
                this.onProgress({ 
                    stage: 'downloading', 
                    message: '开始下载固件...',
                    progress: 0,
                    total: fileData.length
                });
            }
            
            // 步骤1: 设置高速波特率 - 从用户串口配置获取波特率
            this.mainLog('=== 步骤1: 设置高速波特率 ===');
            if (this.onProgress) {
                this.onProgress({ 
                    stage: 'downloading', 
                    message: '设置高速波特率...',
                    progress: Math.round(fileData.length * 0.1),
                    total: fileData.length
                });
            }
            
            // 获取用户配置的波特率（与Python版本逻辑一致）
            const userBaudrate = this.getUserConfiguredBaudrate();
            this.infoLog(`用户配置的波特率: ${userBaudrate} bps`);
            
            await this.setBaudrate(userBaudrate);
            this.infoLog(`✅ 高速波特率设置完成: ${userBaudrate} bps`);
            
            // 步骤2: 擦除Flash - 完全按照Python erase()方法实现
            this.mainLog('=== 步骤2: 擦除Flash ===');
            if (this.onProgress) {
                this.onProgress({ 
                    stage: 'downloading', 
                    message: '擦除Flash...',
                    progress: Math.round(fileData.length * 0.2),
                    total: fileData.length
                });
            }
            
            // Python: erase()方法开始 - 先调用unprotect_flash()
            if (this.onProgress) {
                this.onProgress({ 
                    stage: 'downloading', 
                    message: 'Flash解保护...',
                    progress: Math.round(fileData.length * 0.25),
                    total: fileData.length
                });
            }
            
            await this.unprotectFlash();
            this.infoLog('✅ Flash解保护完成');
            
            // 解保护后验证通信状态
            this.debugLog('验证Flash解保护后通信状态...');
            if (await this.doLinkCheck()) {
                this.infoLog('✅ Flash解保护后通信正常');
            } else {
                throw new Error('Flash解保护后通信异常');
            }
            
            if (this.onProgress) {
                this.onProgress({ 
                    stage: 'downloading', 
                    message: '开始擦除...',
                    progress: Math.round(fileData.length * 0.3),
                    total: fileData.length
                });
            }
            
            const eraseStartAddr = startAddr; // Python: start_addr = self.start_addr
            const eraseEndAddr = eraseStartAddr + fileData.length; // Python: end_addr = start_addr + self.binfil['len']
            this.infoLog(`擦除起始地址: 0x${eraseStartAddr.toString(16).padStart(8, '0')}`);
            this.infoLog(`擦除结束地址: 0x${eraseEndAddr.toString(16).padStart(8, '0')}`);
            
            // Python逻辑: 地址按4K对齐
            // Python: if start_addr & 0xfff: start_addr = int((start_addr+0x1000)/0x1000)*0x1000  # 向上对齐
            let alignedStartAddr = eraseStartAddr;
            if (eraseStartAddr & 0xfff) {
                alignedStartAddr = Math.floor((eraseStartAddr + 0x1000) / 0x1000) * 0x1000; // 向上对齐
            }
            
            // Python: if end_addr & 0xfff: end_addr = int(end_addr/0x1000)*0x1000  # 向下对齐
            let alignedEndAddr = eraseEndAddr;
            if (eraseEndAddr & 0xfff) {
                alignedEndAddr = Math.floor(eraseEndAddr / 0x1000) * 0x1000; // 向下对齐
            }
            
            const eraseSize = alignedEndAddr - alignedStartAddr;
            this.infoLog(`实际擦除大小: 0x${eraseSize.toString(16)} 字节`);
            
            // Python擦除逻辑: 优先使用64K块擦除，剩余部分使用4K扇区擦除，带重试机制
            const retry = 5; // Python: self.retry = 5
            let eraseI = 0;
            while (eraseI < eraseSize) {
                if (this.stopFlag) break;
                
                const currentAddr = alignedStartAddr + eraseI;
                const remaining = eraseSize - eraseI;
                this.debug('debug', `擦除地址: 0x${currentAddr.toString(16).padStart(8, '0')}`);
                
                // Python: if erase_size-i > 0x10000:  (注意是大于号，不是大于等于)
                if (remaining > 0x10000) {
                    // 64K块擦除 - Python: erase_custom_size(start_addr+i, 0xd8 or 0xdc)
                    const eraseCmd = this.flashConfig && this.flashConfig.size >= 256 * 1024 * 1024 ? 0xdc : 0xd8;
                    
                    // Python重试逻辑
                    let cnt = retry;
                    let ret = false;
                    while (cnt > 0 && !ret) {
                        try {
                            await this.eraseCustomSize(currentAddr, eraseCmd);
                            ret = true;
                        } catch (error) {
                            this.warningLog(`擦除失败，剩余重试次数: ${cnt-1}, 错误: ${error.message}`);
                            cnt--;
                            if (cnt === 0) {
                                throw new Error(`擦除64K块失败: 0x${currentAddr.toString(16).padStart(8, '0')}`);
                            }
                        }
                    }
                    eraseI += 0x10000;
                } else {
                    // 4K扇区擦除 - Python: erase_custom_size(start_addr+i, 0x20 or 0x21)
                    const eraseCmd = this.flashConfig && this.flashConfig.size >= 256 * 1024 * 1024 ? 0x21 : 0x20;
                    
                    // Python重试逻辑
                    let cnt = retry;
                    let ret = false;
                    while (cnt > 0 && !ret) {
                        try {
                            await this.eraseCustomSize(currentAddr, eraseCmd);
                            ret = true;
                        } catch (error) {
                            this.warningLog(`擦除失败，剩余重试次数: ${cnt-1}, 错误: ${error.message}`);
                            cnt--;
                            if (cnt === 0) {
                                throw new Error(`擦除4K扇区失败: 0x${currentAddr.toString(16).padStart(8, '0')}`);
                            }
                        }
                    }
                    eraseI += 0x1000;
                }
                
                // 更新进度
                const eraseProgress = (eraseI / eraseSize) * 0.4; // 擦除占40%进度
                if (this.onProgress) {
                    this.onProgress({ 
                        stage: 'downloading', 
                        message: '擦除Flash...',  // 移除消息中的百分比
                        progress: Math.round(fileData.length * (0.3 + eraseProgress)),
                        total: fileData.length,
                        percent: (0.3 + eraseProgress) * 100  // 将百分比作为单独字段提供
                    });
                }
            }
            
            this.infoLog('✅ Flash擦除完成');
            
            // 步骤3: 写入固件 - 完全按照Python write()方法实现
            this.mainLog('=== 步骤3: 写入固件 ===');
            if (this.onProgress) {
                this.onProgress({ 
                    stage: 'downloading', 
                    message: '写入固件...',
                    progress: Math.round(fileData.length * 0.7),
                    total: fileData.length
                });
            }
            
            // Python: start_addr = self.start_addr
            let writeStartAddr = startAddr;
            
            // Python: wbuf = self.binfil['bin']
            // Python: file_len = self.binfil['len']
            let wbuf = new Uint8Array(fileData);
            let file_len = wbuf.length;
            
            // Python: align 0x100 bytes
            // Python: if file_len % 0x100: wbuf += b'\xff' * (0x100 - file_len % 0x100); file_len = len(wbuf)
            if (file_len % 0x100) {
                const paddingSize = 0x100 - (file_len % 0x100);
                const paddedBuffer = new Uint8Array(file_len + paddingSize);
                paddedBuffer.set(wbuf);
                paddedBuffer.fill(0xff, file_len);
                wbuf = paddedBuffer;
                file_len = wbuf.length;
                this.debugLog(`数据256字节对齐: ${fileData.length} -> ${file_len}`);
            }
            
            // Python: end_addr = start_addr + file_len
            const end_addr = writeStartAddr + file_len;
            // Python: flash_size = self._flash_cfg.flash_size
            const flash_size = this.flashConfig ? this.flashConfig.size : 4 * 1024 * 1024;
            
            this.debugLog(`write flash ${writeStartAddr.toString(16).padStart(8, '0')}(${file_len})`);
            
            // Python 关键逻辑1: 起始地址对齐检查和处理
            // Python: if start_addr & 0xfff:
            if (writeStartAddr & 0xfff) {
                this.debugLog("write align start ...");
                // Python: if not self.ser_handle.align_sector_address_for_write(start_addr, True, wbuf, flash_size):
                if (!await this.alignSectorAddressForWrite(writeStartAddr, true, wbuf, flash_size)) {
                    throw new Error(`Align start address ${writeStartAddr.toString(16).padStart(8, '0')} fail.`);
                }
                // Python: wbuf = wbuf[(0x1000-start_addr & 0xfff):]
                const skipBytes = (0x1000 - writeStartAddr & 0xfff);
                wbuf = wbuf.slice(skipBytes);
                // Python: start_addr = int((start_addr+0x1000)/0x1000)*0x1000
                writeStartAddr = Math.floor((writeStartAddr + 0x1000) / 0x1000) * 0x1000;
                // Python: file_len = len(wbuf)
                file_len = wbuf.length;
            }
            
            // Python 关键逻辑2: 结束地址对齐检查和处理
            // Python: if end_addr & 0xfff:
            if (end_addr & 0xfff) {
                this.debugLog("write align end ...");
                // Python: if not self.ser_handle.align_sector_address_for_write(end_addr, False, wbuf, flash_size):
                if (!await this.alignSectorAddressForWrite(end_addr, false, wbuf, flash_size)) {
                    throw new Error(`Align end address ${end_addr.toString(16).padStart(8, '0')} fail.`);
                }
                // Python: wbuf = wbuf[:len(wbuf)-(end_addr & 0xfff)]
                const trimBytes = end_addr & 0xfff;
                wbuf = wbuf.slice(0, wbuf.length - trimBytes);
                // Python: end_addr = int(end_addr/0x1000)*0x1000
                const new_end_addr = Math.floor(end_addr / 0x1000) * 0x1000;
                // Python: file_len = len(wbuf)
                file_len = wbuf.length;
            }
            
            this.infoLog(`最终写入起始地址: 0x${writeStartAddr.toString(16).padStart(8, '0')}`);
            this.infoLog(`最终写入数据长度: ${file_len} 字节`);
            
            // Python: 写入主循环
            // Python: i = 0; while i < file_len:
            let writeI = 0;
            while (writeI < file_len) {
                if (this.stopFlag) break;
                
                // Python: self.logger.debug(f"write at {(i+start_addr):08x} ...")
                const currentAddr = writeI + writeStartAddr;
                this.debug('debug', `write at ${currentAddr.toString(16).padStart(8, '0')} ...`);
                
                // Python: if not is_buf_all_0xff(wbuf[i:i+0x1000]):
                const sectorData = wbuf.slice(writeI, writeI + 0x1000);
                if (!this.isBufferAllFF(sectorData)) {
                    // Python: if not self.ser_handle.write_and_check_sector(wbuf[i:i+0x1000], i+start_addr, flash_size):
                    if (!await this.writeAndCheckSector(sectorData, currentAddr, flash_size)) {
                        // Python: self.logger.warning(f"Retry write at {(i+start_addr):08x}")
                        this.warningLog(`Retry write at ${currentAddr.toString(16).padStart(8, '0')}`);
                        
                        // Python: if not self.ser_handle.retry_write_sector(i+start_addr, wbuf[i:i+0x1000], flash_size, self.retry, self.check_stop):
                        if (!await this.retryWriteSector(currentAddr, sectorData, flash_size, 5)) {
                            // Python: self.logger.error(f"Error write at {(i+start_addr):08x}"); return False
                            throw new Error(`Error write at ${currentAddr.toString(16).padStart(8, '0')}`);
                        }
                    }
                }
                
                // Python: i += 0x1000
                writeI += 0x1000;
                
                // 更新进度
                const writeProgress = (writeI / file_len) * 0.2; // 写入占20%进度
                if (this.onProgress) {
                    this.onProgress({ 
                        stage: 'downloading', 
                        message: '写入固件...',  // 移除消息中的百分比
                        progress: Math.round(fileData.length * (0.7 + writeProgress)),
                        total: fileData.length,
                        percent: (0.7 + writeProgress) * 100  // 将百分比作为单独字段提供
                    });
                }
            }
            
            this.infoLog('✅ 固件写入完成');
            
            // 步骤4: Flash保护 - 完全按照Python逻辑实现
            this.mainLog('=== 步骤4: Flash保护 ===');
            if (this.onProgress) {
                this.onProgress({ 
                    stage: 'downloading', 
                    message: 'Flash保护...',
                    progress: Math.round(fileData.length * 0.95),
                    total: fileData.length
                });
            }
            
            await this.protectFlash();
            this.infoLog('✅ Flash保护完成');
            
            // 步骤5: 自动重启设备 - 与Python版本保持一致
            this.mainLog('=== 步骤5: 重启设备 ===');
            if (this.onProgress) {
                this.onProgress({ 
                    stage: 'downloading', 
                    message: '重启设备...',
                    progress: Math.round(fileData.length * 0.98),
                    total: fileData.length
                });
            }
            
            // Python版本在下载完成后会自动调用reboot()
            await this.reboot();
            this.infoLog('✅ 设备重启完成');
            
            this.infoLog('✅ T5AI固件烧录完成');
            if (this.onProgress) {
                this.onProgress({ 
                    stage: 'completed', 
                    message: '固件烧录完成，设备已重启',
                    progress: fileData.length,
                    total: fileData.length
                });
            }
            
        } catch (error) {
            this.errorLog(`固件下载失败: ${error.message}`);
            if (this.onProgress) {
                this.onProgress({ 
                    stage: 'error', 
                    message: `下载失败: ${error.message}` 
                });
            }
            throw error;
        } finally {
            // 关键修复：无论下载成功还是失败，都将串口重置回115200
            // 这样下次下载时就能正常从115200开始连接
            try {
                this.infoLog('重置串口波特率到115200...');
                await this.setBaudrate(115200);
                this.infoLog('✅ 串口波特率已重置到115200');
            } catch (resetError) {
                this.warningLog(`重置串口波特率失败: ${resetError.message}`);
                // 即使重置失败，也尝试直接重新配置串口
                try {
                    await this.port.close();
                    await this.port.open({
                        baudRate: 115200,
                        dataBits: 8,
                        stopBits: 1,
                        parity: 'none'
                    });
                    this.currentBaudrate = 115200;
                    this.infoLog('✅ 串口已直接重置到115200');
                } catch (directResetError) {
                    this.warningLog(`直接重置串口也失败: ${directResetError.message}`);
                }
            }
        }
    }

    /**
     * 获取用户配置的波特率 - 与Python版本逻辑一致
     * Python版本中通过argv.baudrate传入，这里从串口配置获取
     */
    getUserConfiguredBaudrate() {
        // 从全局串口终端获取固件下载独立配置的波特率
        if (window.serialTerminal && window.serialTerminal.flashBaudRateSelect) {
            const configuredBaudrate = parseInt(window.serialTerminal.flashBaudRateSelect.value);
            this.debugLog(`从固件下载配置获取波特率: ${configuredBaudrate}`);
            
            // 验证波特率是否在有效范围内
            const validBaudrates = [115200, 230400, 460800, 921600, 1152000, 1500000, 2000000, 3000000];
            if (validBaudrates.includes(configuredBaudrate)) {
                return configuredBaudrate;
            } else {
                this.warningLog(`无效的波特率配置: ${configuredBaudrate}，使用默认值921600`);
                return 921600;
            }
        }
        
        // 如果无法获取用户配置，使用默认的921600（与Python配置一致）
        this.warningLog('无法获取固件下载串口配置，使用默认波特率921600');
        return 921600;
    }

    /**
     * 设置波特率 - 完全按照Python T5协议实现
     */
    async setBaudrate(baudrate, delayMs = 20) {
        this.infoLog(`设置波特率为: ${baudrate} bps`);
        this.commLog(`正在设置波特率: ${baudrate} bps`);
        
        // 使用BaseBootRomProtocol格式生成SetBaudrate命令
        // Python: self.command_generate(0x0f, [baudrate & 0xff, (baudrate >> 8) & 0xff, (baudrate >> 16) & 0xff, (baudrate >> 24) & 0xff, delay_ms & 0xff])
        // base_tx_type_and_opcode = [0x01, 0xe0, 0xfc]
        const payload = [
            baudrate & 0xFF,
            (baudrate >> 8) & 0xFF,
            (baudrate >> 16) & 0xFF,
            (baudrate >> 24) & 0xFF,
            delayMs & 0xFF
        ];
        const command = [0x01, 0xE0, 0xFC, 1 + payload.length, 0x0F, ...payload];
        
        await this.clearBuffer();
        await this.sendCommand(command, 'SetBaudrate');
        
        // Python逻辑: time.sleep(delay_ms/2000)
        await new Promise(resolve => setTimeout(resolve, delayMs / 2));
        
        // 重新配置串口波特率
        this.debugLog('重新配置串口波特率...');
        await this.port.close();
        await this.port.open({
            baudRate: baudrate,
            dataBits: 8,
            stopBits: 1,
            parity: 'none'
        });
        
        // 期望响应长度: rx_expect_length(5) = len([0x04, 0x0e]) + 1 + len([0x01, 0xe0, 0xfc]) + 1 + 5 = 2 + 1 + 3 + 1 + 5 = 12
        const response = await this.receiveResponse(12, delayMs + 500);
        
        if (response.length >= 12) {
            this.debugLog(`波特率设置响应: ${response.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')}`);
            
            // Python响应检查逻辑:
            // 1. check_response_header_seg: response_content.startswith([0x04, 0x0e])
            // 2. check_response_length_seg: response_content[2] == len(response_content) - 3
            // 3. check_response_tx_header_seg: response_content[3:6] == [0x01, 0xe0, 0xfc]
            // 4. get_response_payload: response_content[7:][:4] == baudrate_bytes
            
            if (response[0] === 0x04 && response[1] === 0x0E) {
                this.debugLog('✅ 响应头部正确');
                
                // 检查长度字段
                const expectedLength = response.length - 3;
                if (response[2] === expectedLength) {
                    this.debugLog('✅ 响应长度正确');
                    
                    // 检查TX头部
                    if (response[3] === 0x01 && response[4] === 0xE0 && response[5] === 0xFC) {
                        this.debugLog('✅ TX头部正确');
                        
                        // 检查命令码 (位置6应该是0x0F)
                        if (response[6] === 0x0F) {
                            this.debugLog('✅ 命令码正确');
                            
                            // 检查返回的波特率 (位置7-10)
                            const returnedBaudrate = response[7] | (response[8] << 8) | (response[9] << 16) | (response[10] << 24);
                            
                            if (returnedBaudrate === baudrate) {
                                this.infoLog(`✅ 波特率设置成功: ${baudrate} bps`);
                                this.currentBaudrate = baudrate; // 记录当前波特率
                                return true;
                            } else {
                                this.warningLog(`波特率不匹配: 期望${baudrate}, 实际${returnedBaudrate}`);
                            }
                        } else {
                            this.errorLog(`命令码错误: 期望0x0F, 实际0x${response[6].toString(16).padStart(2, '0')}`);
                        }
                    } else {
                        this.errorLog(`TX头部错误: 期望[01 E0 FC], 实际[${response.slice(3, 6).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')}]`);
                    }
                } else {
                    this.errorLog(`响应长度错误: 期望${expectedLength}, 实际${response[2]}`);
                }
            } else {
                this.errorLog(`响应头部错误: 期望[04 0E], 实际[${response.slice(0, 2).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')}]`);
            }
        }
        
        // 如果响应检查失败，尝试LinkCheck验证连接
        this.debugLog('波特率响应不完整，尝试LinkCheck验证...');
        if (await this.doLinkCheck()) {
            this.infoLog(`✅ 波特率设置成功: ${baudrate} bps (通过LinkCheck验证)`);
            this.currentBaudrate = baudrate; // 记录当前波特率
            return true;
        }
        
        throw new Error('设置波特率失败');
    }

    /**
     * Flash解保护 - 完全按照Python unprotect_flash方法实现
     */
    async unprotectFlash() {
        this.infoLog('Flash解保护操作...');
        
        // 波特率切换后，先测试通信是否正常
        this.debugLog('波特率切换后测试通信...');
        await this.clearBuffer();
        
        // 发送LinkCheck确认通信正常
        if (await this.doLinkCheck()) {
            this.infoLog('✅ 高速通信正常');
        } else {
            this.warningLog('高速通信测试失败，继续尝试Flash操作...');
        }
        
        // Python逻辑: unprotect_flash()
        // unprotect_reg_val = [0, 0]
        // mask = [124, 64]  # 0x7c, 0x40
        const unprotectRegVal = [0, 0];
        const mask = [124, 64]; // 0x7c, 0x40
        
        this.debugLog(`解保护目标值: [${unprotectRegVal.map(v => '0x' + v.toString(16).padStart(2, '0')).join(', ')}]`);
        this.debugLog(`解保护掩码: [${mask.map(v => '0x' + v.toString(16).padStart(2, '0')).join(', ')}]`);
        
        // Python: reg_val = self._read_flash_status_reg_val()
        const regVal = await this.readFlashStatusRegVal();
        this.debugLog(`读取到状态寄存器值: [${regVal.map(v => '0x' + v.toString(16).padStart(2, '0')).join(', ')}]`);
        
        // Python: if self.compare_register_value(reg_val, unprotect_reg_val, mask):
        if (this.compareRegisterValue(regVal, unprotectRegVal, mask)) {
            this.infoLog('✅ Flash已经解保护');
            return true;
        } else {
            this.infoLog('Flash需要解保护，计算写入值...');
            
            // 详细显示比较过程
            for (let i = 0; i < regVal.length && i < unprotectRegVal.length && i < mask.length; i++) {
                const srcMasked = regVal[i] & mask[i];
                const destMasked = unprotectRegVal[i] & mask[i];
                this.debug('debug', `寄存器${i}: 读取值=0x${regVal[i].toString(16).padStart(2, '0')}, 掩码=0x${mask[i].toString(16).padStart(2, '0')}, 读取值&掩码=0x${srcMasked.toString(16).padStart(2, '0')}, 目标值&掩码=0x${destMasked.toString(16).padStart(2, '0')}, 匹配=${srcMasked === destMasked ? '是' : '否'}`);
            }
            
            // Python: write_val = unprotect_reg_val
            // for _ in range(len(write_val)):
            //     write_val[_] = write_val[_] | (reg_val[_] & (mask[_] ^ 0xff))
            const writeVal = [...unprotectRegVal];
            for (let i = 0; i < writeVal.length; i++) {
                const invertedMask = mask[i] ^ 0xff;
                const preserved = regVal[i] & invertedMask;
                writeVal[i] = writeVal[i] | preserved;
                this.debug('debug', `计算写入值${i}: 目标=0x${unprotectRegVal[i].toString(16).padStart(2, '0')}, 反掩码=0x${invertedMask.toString(16).padStart(2, '0')}, 保留位=0x${preserved.toString(16).padStart(2, '0')}, 最终写入=0x${writeVal[i].toString(16).padStart(2, '0')}`);
            }
            this.debug('debug', `计算写入值: [${writeVal.map(v => '0x' + v.toString(16).padStart(2, '0')).join(', ')}]`);
            
            // Python: self._write_flash_status_reg_val(write_val)
            await this.writeFlashStatusRegVal(writeVal);
            
            // Python: reg_val = self._read_flash_status_reg_val()
            const newRegVal = await this.readFlashStatusRegVal();
            this.debug('debug', `写入后状态寄存器值: [${newRegVal.map(v => '0x' + v.toString(16).padStart(2, '0')).join(', ')}]`);
            
            // Python: if self.compare_register_value(reg_val, unprotect_reg_val, mask):
            if (this.compareRegisterValue(newRegVal, unprotectRegVal, mask)) {
                this.debug('info', '✅ Flash解保护成功');
                return true;
            } else {
                // 详细显示验证失败的原因
                for (let i = 0; i < newRegVal.length && i < unprotectRegVal.length && i < mask.length; i++) {
                    const srcMasked = newRegVal[i] & mask[i];
                    const destMasked = unprotectRegVal[i] & mask[i];
                    this.debug('error', `验证失败 - 寄存器${i}: 写入后值=0x${newRegVal[i].toString(16).padStart(2, '0')}, 掩码=0x${mask[i].toString(16).padStart(2, '0')}, 实际&掩码=0x${srcMasked.toString(16).padStart(2, '0')}, 期望&掩码=0x${destMasked.toString(16).padStart(2, '0')}`);
                }
                throw new Error('Flash解保护失败：写入后验证不通过');
            }
        }
    }
    
    /**
     * 读取Flash状态寄存器值 - 完全按照Python _read_flash_status_reg_val实现
     */
    async readFlashStatusRegVal(retry = 5) {
        // Python: read_reg_code = [5, 53]
        const readRegCode = [5, 53];
        const srVal = [];
        
        this.debug('debug', `开始读取Flash状态寄存器，寄存器代码: [${readRegCode.join(', ')}]`);
        
        for (let regIndex = 0; regIndex < readRegCode.length; regIndex++) {
            const tmpReg = readRegCode[regIndex];
            let tmpVal = null;
            
            this.debug('debug', `读取寄存器${tmpReg}...`);
            
            for (let retryCount = 0; retryCount < retry; retryCount++) {
                try {
                    // Python: frsp.cmd(tmp_reg) - FlashReadSRProtocol
                    // cmd格式: command_generate(0x0c, [reg_addr])
                    const payload = [tmpReg];
                    const payloadLength = 1 + payload.length;
                    const command = [0x01, 0xE0, 0xFC, 0xFF, 0xF4, payloadLength & 0xFF, (payloadLength >> 8) & 0xFF, 0x0c, ...payload];
                    
                    this.debug('debug', `发送读取寄存器${tmpReg}命令: ${command.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')}`);
                    
                    await this.clearBuffer();
                    await this.sendCommand(command, `ReadFlashSR-${tmpReg}`);
                    
                    // Python: frsp.expect_length = rx_expect_length(2) = 7 + 2 + 1 + 1 + 2 = 13
                    const expectedLength = 13;
                    const response = await this.receiveResponse(expectedLength, 100);
                    
                    this.debug('debug', `读取寄存器${tmpReg}响应: 长度=${response.length}, 数据=${response.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')}`);
                    
                    if (response.length >= expectedLength) {
                        // Python: frsp.response_check(content, tmp_reg) and frsp.get_status_regist_val(content)
                        const expectedHeader = [0x04, 0x0E, 0xFF, 0x01, 0xE0, 0xFC, 0xF4];
                        const headerMatch = expectedHeader.every((byte, index) => response[index] === byte);
                        
                        if (headerMatch) {
                            this.debug('debug', `✅ 寄存器${tmpReg}响应头部正确`);
                            
                            // 检查状态码 (位置10)
                            if (response[10] === 0x00) {
                                this.debug('debug', `✅ 寄存器${tmpReg}状态码正确`);
                                
                                // 检查寄存器地址回显 (位置11)
                                if (response[11] === tmpReg) {
                                    // Python: get_status_regist_val(response_content): return response_content[12]
                                    tmpVal = response[12];
                                    this.debug('debug', `✅ 读取寄存器${tmpReg}成功: 0x${tmpVal.toString(16).padStart(2, '0')}`);
                                    break;
                                } else {
                                    this.debug('warning', `寄存器${tmpReg}地址回显错误: 期望0x${tmpReg.toString(16).padStart(2, '0')}, 实际0x${response[11].toString(16).padStart(2, '0')}，重试...`);
                                }
                            } else {
                                this.debug('warning', `寄存器${tmpReg}状态码错误: 0x${response[10].toString(16).padStart(2, '0')}，重试...`);
                            }
                        } else {
                            this.debug('warning', `寄存器${tmpReg}响应头部错误: 期望[${expectedHeader.map(b => '0x' + b.toString(16).padStart(2, '0')).join(', ')}], 实际[${response.slice(0, 7).map(b => '0x' + b.toString(16).padStart(2, '0')).join(', ')}]，重试...`);
                        }
                    } else {
                        this.debug('warning', `读取寄存器${tmpReg}响应长度不足: ${response.length} < ${expectedLength}，重试...`);
                    }
                } catch (error) {
                    // 检查是否为串口异常断开
                    if (this.isPortDisconnectionError(error)) {
                        throw new Error('设备连接已断开，请检查USB连接后重试');
                    }
                    this.debug('warning', `读取寄存器${tmpReg}失败: ${error.message}，重试...`);
                }
            }
            
            if (tmpVal === null) {
                throw new Error(`读取Flash状态寄存器${tmpReg}失败`);
            } else {
                srVal.push(tmpVal);
            }
        }
        
        this.debug('debug', `Flash状态寄存器读取完成: [${srVal.map(v => '0x' + v.toString(16).padStart(2, '0')).join(', ')}]`);
        return srVal;
    }
    
    /**
     * 写入Flash状态寄存器值 - 完全按照Python _write_flash_status_reg_val实现
     */
    async writeFlashStatusRegVal(writeVal, retry = 5) {
        // Python: write_reg_code = [1, 49]
        const writeRegCode = [1, 49];
        
        this.debug('debug', `开始写入Flash状态寄存器，寄存器代码: [${writeRegCode.join(', ')}], 写入值: [${writeVal.map(v => '0x' + v.toString(16).padStart(2, '0')).join(', ')}]`);
        
        if (writeRegCode.length === 1) {
            // 单寄存器写入
            let tmpRes = false;
            const regAddr = writeRegCode[0];
            
            this.debug('debug', `单寄存器写入模式: 寄存器${regAddr}`);
            
            for (let retryCount = 0; retryCount < retry; retryCount++) {
                try {
                    // Python: fwsp.cmd(write_reg_code[0], write_val) - FlashWriteSRProtocol
                    // cmd格式: command_generate(0x0d, [reg_addr] + val)
                    const payload = [regAddr, ...writeVal];
                    const payloadLength = 1 + payload.length;
                    const command = [0x01, 0xE0, 0xFC, 0xFF, 0xF4, payloadLength & 0xFF, (payloadLength >> 8) & 0xFF, 0x0d, ...payload];
                    
                    this.debug('debug', `发送写入寄存器${regAddr}命令: ${command.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')}`);
                    
                    await this.clearBuffer();
                    await this.sendCommand(command, `WriteFlashSR-${regAddr}`);
                    
                    // Python: fwsp.expect_length(len(write_val)) = rx_expect_length(1 + len(write_val))
                    const expectedLength = 7 + 2 + 1 + 1 + (1 + writeVal.length);
                    const response = await this.receiveResponse(expectedLength, 100);
                    
                    this.debug('debug', `写入寄存器${regAddr}响应: 长度=${response.length}, 数据=${response.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')}`);
                    
                    if (response.length >= expectedLength) {
                        // Python: fwsp.response_check(content, write_reg_code[0])
                        const expectedHeader = [0x04, 0x0E, 0xFF, 0x01, 0xE0, 0xFC, 0xF4];
                        const headerMatch = expectedHeader.every((byte, index) => response[index] === byte);
                        
                        if (headerMatch && response[10] === 0x00 && response[11] === regAddr) {
                            tmpRes = true;
                            this.debug('debug', `✅ 写入寄存器${regAddr}成功`);
                            break;
                        } else {
                            this.debug('warning', `写入寄存器${regAddr}响应格式错误，重试...`);
                        }
                    } else {
                        this.debug('warning', `写入寄存器${regAddr}响应长度不足: ${response.length} < ${expectedLength}，重试...`);
                    }
                } catch (error) {
                    // 检查是否为串口异常断开
                    if (this.isPortDisconnectionError(error)) {
                        throw new Error('设备连接已断开，请检查USB连接后重试');
                    }
                    this.debug('warning', `写入寄存器${regAddr}失败: ${error.message}，重试...`);
                }
                
                if (!tmpRes) {
                    await new Promise(resolve => setTimeout(resolve, 10)); // Python: time.sleep(0.01)
                }
            }
            
            if (!tmpRes) {
                throw new Error('写入Flash状态寄存器失败');
            }
        } else {
            // 多寄存器分别写入
            this.debug('debug', `多寄存器写入模式: ${writeRegCode.length}个寄存器`);
            
            for (let idx = 0; idx < writeRegCode.length; idx++) {
                let tmpRes = false;
                const regAddr = writeRegCode[idx];
                const regVal = [writeVal[idx]];
                
                this.debug('debug', `写入寄存器${regAddr}: 0x${regVal[0].toString(16).padStart(2, '0')}`);
                
                for (let retryCount = 0; retryCount < retry; retryCount++) {
                    try {
                        // Python: fwsp.cmd(write_reg_code[idx], [write_val[idx]])
                        const payload = [regAddr, ...regVal];
                        const payloadLength = 1 + payload.length;
                        const command = [0x01, 0xE0, 0xFC, 0xFF, 0xF4, payloadLength & 0xFF, (payloadLength >> 8) & 0xFF, 0x0d, ...payload];
                        
                        this.debug('debug', `发送写入寄存器${regAddr}命令: ${command.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')}`);
                        
                        await this.clearBuffer();
                        await this.sendCommand(command, `WriteFlashSR-${regAddr}`);
                        
                        // Python: fwsp.expect_length(1) = rx_expect_length(1 + 1)
                        const expectedLength = 7 + 2 + 1 + 1 + 2;
                        const response = await this.receiveResponse(expectedLength, 100);
                        
                        this.debug('debug', `写入寄存器${regAddr}响应: 长度=${response.length}, 数据=${response.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')}`);
                        
                        if (response.length >= expectedLength) {
                            const expectedHeader = [0x04, 0x0E, 0xFF, 0x01, 0xE0, 0xFC, 0xF4];
                            const headerMatch = expectedHeader.every((byte, index) => response[index] === byte);
                            
                            if (headerMatch && response[10] === 0x00 && response[11] === regAddr) {
                                tmpRes = true;
                                this.debug('debug', `✅ 写入寄存器${regAddr}成功: 0x${regVal[0].toString(16).padStart(2, '0')}`);
                                break;
                            } else {
                                this.debug('warning', `写入寄存器${regAddr}响应格式错误，重试...`);
                            }
                        } else {
                            this.debug('warning', `写入寄存器${regAddr}响应长度不足: ${response.length} < ${expectedLength}，重试...`);
                        }
                    } catch (error) {
                        // 检查是否为串口异常断开
                        if (this.isPortDisconnectionError(error)) {
                            throw new Error('设备连接已断开，请检查USB连接后重试');
                        }
                        this.debug('warning', `写入寄存器${regAddr}失败: ${error.message}，重试...`);
                    }
                    
                    if (!tmpRes) {
                        await new Promise(resolve => setTimeout(resolve, 10)); // Python: time.sleep(0.01)
                    }
                }
                
                if (!tmpRes) {
                    throw new Error(`写入Flash状态寄存器${regAddr}失败`);
                }
                
                await new Promise(resolve => setTimeout(resolve, 10)); // Python: time.sleep(0.01)
            }
        }
        
        this.debug('debug', `Flash状态寄存器写入完成`);
    }
    
    /**
     * 比较寄存器值 - 完全按照Python compare_register_value实现
     */
    compareRegisterValue(src, dest, mask) {
        // Python逻辑：检查src[i] & mask[i] == dest[i] & mask[i]
        for (let i = 0; i < src.length && i < dest.length && i < mask.length; i++) {
            if ((src[i] & mask[i]) !== (dest[i] & mask[i])) {
                return false;
            }
        }
        return true;
    }

    /**
     * 执行LinkCheck - 按照Python协议实现
     */
    async doLinkCheck() {
        try {
            // LinkCheckProtocol: command_generate(0x00)
            const command = [0x01, 0xE0, 0xFC, 0x01, 0x00];
            
            await this.clearBuffer();
            await this.sendCommand(command, 'LinkCheck');
            
            // 期望响应长度: rx_expect_length(1) = 2 + 1 + 3 + 1 + 1 = 8
            const response = await this.receiveResponse(8, 100);
            
            if (response.length >= 8) {
                // Python响应检查:
                // get_response_cmd(response_content) == bytes([0x01]) and get_response_payload(response_content) == bytes([0x00])
                // get_response_cmd: response_content[6:7] = response[6]
                // get_response_payload: response_content[7:] = response[7]
                
                if (response[0] === 0x04 && response[1] === 0x0E && 
                    response[3] === 0x01 && response[4] === 0xE0 && response[5] === 0xFC &&
                    response[6] === 0x01 && response[7] === 0x00) {
                    return true;
                }
            }
            return false;
        } catch (error) {
            return false;
        }
    }

    /**
     * 断开连接
     */
    async disconnect() {
        this.stopFlag = true;
        this.debug('info', '开始断开T5AI下载器...');
        
        // 首先确保所有正在进行的异步操作被中断
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // 重置串口波特率到115200，为下次连接做准备
        try {
            this.debug('info', '断开连接时重置串口波特率到115200...');
            await this.setBaudrate(115200);
            this.debug('info', '✅ 串口波特率已重置到115200');
        } catch (error) {
            this.debug('warning', `重置串口波特率失败: ${error.message}`);
            // 即使重置失败，也尝试直接重新配置串口
            try {
                if (this.port) {
                    await this.port.close();
                    await this.port.open({
                        baudRate: 115200,
                        dataBits: 8,
                        stopBits: 1,
                        parity: 'none'
                    });
                    this.currentBaudrate = 115200;
                    this.debug('info', '✅ 串口已直接重置到115200');
                }
            } catch (directResetError) {
                this.debug('warning', `直接重置串口也失败: ${directResetError.message}`);
            }
        }
        
        // 清理内部状态
        this.chipId = null;
        this.flashId = null;
        this.flashConfig = null;
        
        // 注意：在固件下载场景下，不关闭串口，让主系统管理
        this.debug('info', 'T5AI下载器已断开');
    }

    // 擦除Flash - 完全按照Python erase_custom_size方法实现
    async eraseCustomSize(addr, eraseCmd) {
        // Python: FlashCustomEraseProtocol使用0x0f命令，格式：[size, addr_bytes...]
        // cmd参数：normal,4k/32k/64k->0x20/0x52/0xd8；ext,4k/32k/64k->0x21/0x5c/0xdc
        
        // Python: erase_flash_protocol.cmd(flash_addr, cmd)
        // FlashCustomEraseProtocol.cmd(self, addr, size):
        //     return self.command_generate(0x0f, [size, addr & 0xff, (addr >> 8) & 0xff, (addr >> 16) & 0xff, (addr >> 24) & 0xff])
        
        const payload = [
            eraseCmd,  // size命令 (0x20/0x21/0x52/0x5c/0xd8/0xdc)
            addr & 0xff,
            (addr >> 8) & 0xff,
            (addr >> 16) & 0xff,
            (addr >> 24) & 0xff
        ];
        
        // 使用BaseBootRomFlashProtocol格式：[0x01, 0xe0, 0xfc, 0xff, 0xf4, len_low, len_high, cmd, payload...]
        const payloadLength = 1 + payload.length; // cmd(0x0f) + payload(5字节)
        const command = [0x01, 0xE0, 0xFC, 0xFF, 0xF4, payloadLength & 0xFF, (payloadLength >> 8) & 0xFF, 0x0f, ...payload];
        
        this.debug('debug', `擦除命令详情: 地址=0x${addr.toString(16).padStart(8, '0')}, 命令=0x${eraseCmd.toString(16).padStart(2, '0')}`);
        
        await this.clearBuffer();
        await this.sendCommand(command, 'EraseCustomSize');
        
        // Python: expect_length = rx_expect_length(5) = 7 + 2 + 1 + 1 + 5 = 16
        const expectedLength = 16;
        
        // Python使用0.5秒超时，这是关键！恢复Python的原始超时设置
        const timeout = 500; // Python使用0.5秒超时，不是5秒
        
        this.debug('debug', `等待擦除响应，期望长度: ${expectedLength}, 超时: ${timeout}ms`);
        const response = await this.receiveResponse(expectedLength, timeout);
        
        this.debug('debug', `擦除响应: 长度=${response.length}, 数据=${response.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')}`);
        
        if (response.length >= expectedLength) {
            // Python: response_check(response_content, size_cmd, flash_addr)检查
            // 1. check_response_base_header: response_content.startswith([0x04, 0x0e, 0xff, 0x01, 0xe0, 0xfc, 0xf4])
            const expectedHeader = [0x04, 0x0E, 0xFF, 0x01, 0xE0, 0xFC, 0xF4];
            const headerMatch = expectedHeader.every((byte, index) => response[index] === byte);
            
            if (headerMatch) {
                this.debug('debug', '✅ 响应头部正确');
                
                // 2. check_response_length_seg: response_content[7:9] == [(len(response_content) - 9) & 0xff, ((len(response_content) - 9) >> 8) & 0xff]
                const responsePayloadLength = response.length - 9;
                const expectedLengthBytes = [responsePayloadLength & 0xFF, (responsePayloadLength >> 8) & 0xFF];
                
                if (response[7] === expectedLengthBytes[0] && response[8] === expectedLengthBytes[1]) {
                    this.debug('debug', '✅ 响应长度字段正确');
                    
                    // 3. check_response_status: response_content[10] == 0x0
                    if (response[10] === 0x00) {
                        this.debug('debug', '✅ 响应状态码正确');
                        
                        // 4. 检查命令码和参数 - Python: response_content[11:12] == bytes([size_cmd]) and response_content[12:] == bytes([flash_addr & 0xff, ...])
                        if (response[9] === 0x0f && response[11] === eraseCmd) {
                            this.debug('debug', '✅ 响应命令码正确');
                            
                            const addrBytes = [
                                addr & 0xff,
                                (addr >> 8) & 0xff,
                                (addr >> 16) & 0xff,
                                (addr >> 24) & 0xff
                            ];
                            
                            if (response.slice(12, 16).every((byte, index) => byte === addrBytes[index])) {
                                this.commLog(`✅ 擦除成功: 0x${addr.toString(16).padStart(8, '0')}`);
                                return;
                            } else {
                                throw new Error(`擦除响应地址不匹配: 期望[${addrBytes.map(b => '0x' + b.toString(16).padStart(2, '0')).join(', ')}], 实际[${response.slice(12, 16).map(b => '0x' + b.toString(16).padStart(2, '0')).join(', ')}]`);
                            }
                        } else {
                            throw new Error(`擦除响应命令码错误: 期望0x0f和0x${eraseCmd.toString(16)}, 实际0x${response[9].toString(16)}和0x${response[11].toString(16)}`);
                        }
                    } else {
                        throw new Error(`擦除操作失败，状态码: 0x${response[10].toString(16).padStart(2, '0')}`);
                    }
                } else {
                    throw new Error(`擦除响应长度字段错误: 期望[${expectedLengthBytes.map(b => '0x' + b.toString(16).padStart(2, '0')).join(', ')}], 实际[0x${response[7].toString(16).padStart(2, '0')}, 0x${response[8].toString(16).padStart(2, '0')}]`);
                }
            } else {
                throw new Error(`擦除响应头部格式错误: 期望[${expectedHeader.map(b => '0x' + b.toString(16).padStart(2, '0')).join(', ')}], 实际[${response.slice(0, 7).map(b => '0x' + b.toString(16).padStart(2, '0')).join(', ')}]`);
            }
        } else {
            // 如果响应长度为0，可能是通信问题，尝试再次检查通信状态
            if (response.length === 0) {
                this.warningLog('擦除命令无响应，检查通信状态...');
                if (await this.doLinkCheck()) {
                    this.commLog('通信正常，可能是擦除操作超时');
                } else {
                    throw new Error('擦除后通信异常');
                }
            }
            throw new Error(`擦除响应长度不足: ${response.length} < ${expectedLength}`);
        }
    }
    
    // 写使能 - 移除，Python中没有单独的write_enable操作
    async writeEnable() {
        // Python中没有单独的write_enable方法，这个功能已集成在其他操作中
        // 暂时保留空实现
    }
    
    // 检查Flash忙状态 - 移除，Python中没有单独的check_busy操作
    async checkFlashBusy() {
        // Python中没有单独的check_busy方法，这个功能已集成在协议响应中
        // 暂时保留空实现
    }
    
    // 检查缓冲区是否全为0xFF - Python逻辑
    isBufferAllFF(buffer) {
        for (let i = 0; i < buffer.length; i++) {
            if (buffer[i] !== 0xff) {
                return false;
            }
        }
        return true;
    }
    
    // 写入并检查扇区 - 完全按照Python write_and_check_sector逻辑
    async writeAndCheckSector(sectorData, addr, flashSize) {
        // Python: def write_and_check_sector(self, buf_sec: bytes, addr: int, flash_size: int):
        //     length = len(buf_sec)
        //     if not self.write_sector(addr, buf_sec, flash_size):
        //         return False
        //     if not self.check_crc_ver2(buf_sec, addr, length, flash_size):
        //         return False
        //     return True
        
        const length = sectorData.length;
        
        // Python: if not self.write_sector(addr, buf_sec, flash_size): return False
        if (!await this.writeSector(addr, sectorData, flashSize)) {
            return false;
        }
        
        // Python: if not self.check_crc_ver2(buf_sec, addr, length, flash_size): return False
        if (!await this.checkCrcVer2(sectorData, addr, length, flashSize)) {
            return false;
        }
        
        // Python: return True
        return true;
    }
    
    // 写入扇区 - 完全按照Python write_sector方法实现
    async writeSector(flashAddr, buf, flashSize) {
        // Python: FlashWrite4kProtocol or FlashWrite4kExtProtocol
        const isExt = flashSize >= 256 * 1024 * 1024;
        
        // Python: 0x07 for normal, 0x0e7 for ext
        // 重要：Python中0x0e7被转换为0xE7 (231 & 0xFF)
        const cmd = isExt ? 0xE7 : 0x07;
        
        this.debug('debug', `使用协议: ${isExt ? 'FlashWrite4kExtProtocol' : 'FlashWrite4kProtocol'}`);
        this.debug('debug', `命令码: 0x${cmd.toString(16).padStart(2, '0')}`);
        
        // Python协议生成逻辑:
        // FlashWrite4kProtocol.cmd(self, addr, data):
        //     payload = [addr & 0xff, (addr >> 8) & 0xff, (addr >> 16) & 0xff, (addr >> 24) & 0xff]
        //     payload.extend(data)
        //     return self.command_generate(cmd, payload)
        
        // BaseBootRomFlashProtocol.command_generate(self, cmd, payload=[]):
        //     command = bytearray()
        //     command.extend(self.base_tx_header)  # [0x01, 0xe0, 0xfc, 0xff, 0xf4]
        //     command.extend([(1 + len(payload)) & 0xff, ((1 + len(payload)) >> 8) & 0xff])
        //     command.append(cmd)
        //     command.extend(payload)
        //     return command
        
        const addrBytes = [
            flashAddr & 0xff,
            (flashAddr >> 8) & 0xff,
            (flashAddr >> 16) & 0xff,
            (flashAddr >> 24) & 0xff
        ];
        
        // payload = 地址(4字节) + 数据(buf.length字节)
        const payload = [...addrBytes, ...buf];
        
        // 关键修正：Python的长度计算是 1 + len(payload)，表示cmd(1字节) + payload
        const totalCmdLength = 1 + payload.length;
        
        // Python的command格式：[base_tx_header] + [length_low, length_high] + [cmd] + [payload]
        const command = [
            0x01, 0xE0, 0xFC, 0xFF, 0xF4,                    // base_tx_header
            totalCmdLength & 0xFF,                            // length_low
            (totalCmdLength >> 8) & 0xFF,                     // length_high  
            cmd,                                              // cmd
            ...payload                                        // payload
        ];
        
        this.debug('debug', `命令长度: ${totalCmdLength}, payload长度: ${payload.length}`);
        this.debug('debug', `发送写入命令长度: ${command.length}字节`);
        
        await this.clearBuffer();
        await this.sendCommand(command, `WriteSector`);
        
        // Python: expect_length = rx_expect_length(4) 
        // BaseBootRomFlashProtocol.rx_expect_length(self, payload_lenth):
        //     return len(self.base_rx_header) + 2 + 1 + 1 + payload_lenth
        //     = 7 + 2 + 1 + 1 + 4 = 15
        const expectedLength = 15;
        
        // Python使用0.5秒超时
        const response = await this.receiveResponse(expectedLength, 500);
        
        this.debug('debug', `写入响应分析: 长度=${response.length}, 期望=${expectedLength}`);
        this.debug('debug', `响应内容: ${response.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')}`);
        
        if (response.length >= expectedLength) {
            // Python: response_check逻辑
            // BaseBootRomFlashProtocol.response_check(self, response_content):
            //     res = self.check_response_base_header(response_content) \
            //         and self.check_response_length_seg(response_content) \
            //         and self.check_response_status(response_content)
            //     return res
            
            // 1. check_response_base_header: 检查[0x04, 0x0e, 0xff, 0x01, 0xe0, 0xfc, 0xf4]
            const expectedBaseHeader = [0x04, 0x0E, 0xFF, 0x01, 0xE0, 0xFC, 0xF4];
            const headerMatch = expectedBaseHeader.every((byte, index) => response[index] === byte);
            
            if (!headerMatch) {
                this.debug('error', `响应头部不匹配: 期望[${expectedBaseHeader.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')}]`);
                this.debug('error', `实际收到[${response.slice(0, 7).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')}]`);
                throw new Error('写入响应头部格式错误');
            }
            
            // 2. check_response_length_seg: 检查长度字段
            const responseLength = response[7] | (response[8] << 8);
            const expectedResponseLength = response.length - 9;
            if (responseLength !== expectedResponseLength) {
                this.debug('error', `响应长度字段不匹配: 期望${expectedResponseLength}, 实际${responseLength}`);
                throw new Error('写入响应长度字段错误');
            }
            
            // 3. check_response_status: 检查状态码 (位置10)
            const statusCode = response[10];
            if (statusCode !== 0x00) {
                // 根据Python STATUS_INFO解析错误
                const statusInfo = [
                    { code: 0x0, desc: 'normal' },
                    { code: 0x1, desc: 'FLASH_STATUS_BUSY' },
                    { code: 0x2, desc: 'spi timeout' },
                    { code: 0x3, desc: 'flash operate timeout' },
                    { code: 0x4, desc: 'package payload length error' },
                    { code: 0x5, desc: 'package length error' },
                    { code: 0x6, desc: 'flash operate PARAM_ERROR' },
                    { code: 0x7, desc: 'unknown cmd' },
                ];
                
                const errorInfo = statusInfo.find(info => info.code === statusCode);
                const errorDesc = errorInfo ? errorInfo.desc : `未知错误码 0x${statusCode.toString(16).padStart(2, '0')}`;
                throw new Error(`Flash写入失败: ${errorDesc} (状态码: 0x${statusCode.toString(16).padStart(2, '0')})`);
            }
            
            // 4. 协议特定检查
            if (isExt) {
                // Python FlashWrite4kExtProtocol.response_check: 返回True
                // 扩展协议不需要额外检查，只要基础检查通过即可
                this.debug('debug', `✅ 写入成功 (扩展协议): 0x${flashAddr.toString(16).padStart(8, '0')}`);
                return true;
            } else {
                // Python FlashWrite4kProtocol.response_check: 需要检查地址匹配
                // response_content[11:15] == bytes([flash_addr & 0xff, ...])
                const responseAddr = response.slice(11, 15);
                if (responseAddr.every((byte, index) => byte === addrBytes[index])) {
                    this.debug('debug', `✅ 写入成功 (普通协议): 0x${flashAddr.toString(16).padStart(8, '0')}`);
                    return true;
                } else {
                    this.debug('error', `响应地址不匹配: 期望[${addrBytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')}]`);
                    this.debug('error', `实际收到[${responseAddr.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')}]`);
                    throw new Error(`写入响应地址不匹配`);
                }
            }
        } else if (response.length >= 7) {
            // 短响应错误分析
            this.debug('warning', `收到短响应，分析错误原因...`);
            
            // 检查是否是Flash协议的错误响应
            if (response[0] === 0x04 && response[1] === 0x0E) {
                // 可能的Flash协议错误响应
                if (response.length >= 11 && response[2] === 0xFF && 
                    response[3] === 0x01 && response[4] === 0xE0 && response[5] === 0xFC && response[6] === 0xF4) {
                    // 这是Flash协议响应，检查状态码
                    if (response.length >= 11) {
                        const statusCode = response[10];
                        const statusInfo = [
                            { code: 0x0, desc: 'normal' },
                            { code: 0x1, desc: 'FLASH_STATUS_BUSY' },
                            { code: 0x2, desc: 'spi timeout' },
                            { code: 0x3, desc: 'flash operate timeout' },
                            { code: 0x4, desc: 'package payload length error' },
                            { code: 0x5, desc: 'package length error' },
                            { code: 0x6, desc: 'flash operate PARAM_ERROR' },
                            { code: 0x7, desc: 'unknown cmd' },
                        ];
                        
                        const errorInfo = statusInfo.find(info => info.code === statusCode);
                        const errorDesc = errorInfo ? errorInfo.desc : `未知错误码 0x${statusCode.toString(16).padStart(2, '0')}`;
                        throw new Error(`Flash写入失败: ${errorDesc} (状态码: 0x${statusCode.toString(16).padStart(2, '0')})`);
                    }
                } else if (response.length >= 7) {
                    // 可能是BaseBootRom协议的错误响应: [04 0E length 01 E0 FC status]
                    if (response[3] === 0x01 && response[4] === 0xE0 && response[5] === 0xFC) {
                        const statusCode = response[6];
                        const statusInfo = [
                            { code: 0x0, desc: 'normal' },
                            { code: 0x1, desc: 'FLASH_STATUS_BUSY' },
                            { code: 0x2, desc: 'spi timeout' },
                            { code: 0x3, desc: 'flash operate timeout' },
                            { code: 0x4, desc: 'package payload length error' },
                            { code: 0x5, desc: 'package length error' },
                            { code: 0x6, desc: 'flash operate PARAM_ERROR' },
                            { code: 0x7, desc: 'unknown cmd' },
                        ];
                        
                        const errorInfo = statusInfo.find(info => info.code === statusCode);
                        const errorDesc = errorInfo ? errorInfo.desc : `未知错误码 0x${statusCode.toString(16).padStart(2, '0')}`;
                        throw new Error(`Flash写入失败: ${errorDesc} (状态码: 0x${statusCode.toString(16).padStart(2, '0')})`);
                    }
                }
            }
            
            throw new Error(`写入响应长度不足且格式未知: ${response.length} < ${expectedLength}`);
        } else {
            throw new Error(`写入响应长度不足: ${response.length} < ${expectedLength}`);
        }
    }
    
    // CRC校验 - 完全按照Python check_crc_ver2方法实现  
    async checkCrcVer2(buf, flashAddr, bufLen, flashSize, timeout = 0.1, recnt = 5) {
        // Python: CheckCrcProtocol or CheckCrcExtProtocol
        const isExt = flashSize >= 256 * 1024 * 1024;
        const cmd = isExt ? 0x13 : 0x10;
        
        // Python: crc_me = crc32_ver2(0xffffffff, buf)
        const crcMe = this.crc32Ver2(0xffffffff, buf);
        
        for (let i = 0; i < recnt; i++) {
            // Python: crc_protocol.cmd(flash_addr, flash_addr+buf_len-1)
            const startAddr = flashAddr;
            const endAddr = flashAddr + bufLen - 1;
            
            const payload = [
                startAddr & 0xff,
                (startAddr >> 8) & 0xff,
                (startAddr >> 16) & 0xff,
                (startAddr >> 24) & 0xff,
                endAddr & 0xff,
                (endAddr >> 8) & 0xff,
                (endAddr >> 16) & 0xff,
                (endAddr >> 24) & 0xff
            ];
            
            // 关键修正：CRC协议使用BaseBootRomProtocol格式，不是Flash协议！
            // Python: CheckCrcProtocol(BaseBootRomProtocol)
            // command_generate格式: [0x01, 0xe0, 0xfc, len, cmd, payload...]
            const command = [0x01, 0xE0, 0xFC, 1 + payload.length, cmd, ...payload];
            
            await this.clearBuffer();
            await this.sendCommand(command, 'CheckCrc');
            
            // Python: expect_length = rx_expect_length(4) = 2 + 1 + 3 + 1 + 4 = 11
            const expectedLength = 11;
            const response = await this.receiveResponse(expectedLength, timeout * 1000);
            
            if (response.length >= expectedLength) {
                // Python: response_check for BaseBootRomProtocol
                if (response[0] === 0x04 && response[1] === 0x0E &&
                    response[3] === 0x01 && response[4] === 0xE0 && response[5] === 0xFC) {
                    
                    // Python CheckCrcExtProtocol关键差异：
                    // CheckCrcExtProtocol.response_check(self, response_content): 返回True
                    // 扩展协议不做额外检查！
                    if (isExt) {
                        // 扩展协议直接提取CRC值
                        const crcRead = response[7] | (response[8] << 8) | (response[9] << 16) | (response[10] << 24);
                        
                        if (crcMe === crcRead) {
                            this.debug('debug', `✅ CRC校验成功 (扩展协议): 计算值=0x${crcMe.toString(16)}, 读取值=0x${crcRead.toString(16)}`);
                            return true;
                        } else {
                            this.debug('warning', `CRC不匹配 (扩展协议): 计算值0x${crcMe.toString(16)}, 读取值0x${crcRead.toString(16)}`);
                        }
                    } else {
                        // 普通协议需要完整的响应检查
                        // Python: super().response_check(response_content)
                        if (response[6] === cmd) { // 检查命令码
                            const crcRead = response[7] | (response[8] << 8) | (response[9] << 16) | (response[10] << 24);
                            
                            if (crcMe === crcRead) {
                                this.debug('debug', `✅ CRC校验成功 (普通协议): 计算值=0x${crcMe.toString(16)}, 读取值=0x${crcRead.toString(16)}`);
                                return true;
                            } else {
                                this.debug('warning', `CRC不匹配 (普通协议): 计算值0x${crcMe.toString(16)}, 读取值0x${crcRead.toString(16)}`);
                            }
                        } else {
                            this.debug('warning', `CRC响应命令码错误: 期望0x${cmd.toString(16)}, 实际0x${response[6]?.toString(16) || 'unknown'}`);
                        }
                    }
                } else {
                    this.debug('warning', `CRC响应格式错误`);
                }
            } else {
                this.debug('warning', `CRC响应长度不足: ${response.length} < ${expectedLength}`);
            }
        }
        
        return false;
    }
    
    // CRC32计算 - 完全按照Python crc32_ver2实现
    crc32Ver2(crc, buf) {
        // Python CRC32表
        const crcTable = this.makeCrc32Table();
        
        for (let i = 0; i < buf.length; i++) {
            crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
        }
        
        return crc;
    }
    
    // 生成CRC32表 - 完全按照Python make_crc32_table实现
    makeCrc32Table() {
        if (this._crcTable) return this._crcTable;
        
        const table = new Array(256);
        
        for (let i = 0; i < 256; i++) {
            let crc = i;
            for (let j = 0; j < 8; j++) {
                if (crc & 1) {
                    crc = 0xedb88320 ^ (crc >>> 1);
                } else {
                    crc = crc >>> 1;
                }
            }
            table[i] = crc;
        }
        
        this._crcTable = table;
        return table;
    }
    
    // 读取Flash数据 - 移除，按照Python逻辑重新实现
    async readFlashData(addr, length) {
        // Python中使用read_sector方法按4K读取
        // 这里简化实现，实际Python是按扇区读取并校验
        throw new Error('readFlashData已移除，请使用Python协议的read_sector方法');
    }
    
    /**
     * 读取扇区 - 完全按照Python read_sector方法实现
     */
    async readSector(flashAddr, flashSize) {
        // Python: read_flash_protocol = FlashRead4kProtocol() or FlashRead4kExtProtocol()
        const isExt = flashSize >= 256 * 1024 * 1024;
        // 重大修正：Python FlashRead4kProtocol使用0x09，FlashRead4kExtProtocol使用0xe9
        const cmd = isExt ? 0xe9 : 0x09;
        
        // Python: read_flash_protocol.cmd(flash_addr)
        const payload = [
            flashAddr & 0xff,
            (flashAddr >> 8) & 0xff,
            (flashAddr >> 16) & 0xff,
            (flashAddr >> 24) & 0xff
        ];
        
        // 使用BaseBootRomFlashProtocol格式
        const command = [0x01, 0xE0, 0xFC, 0xFF, 0xF4, (1 + payload.length) & 0xFF, ((1 + payload.length) >> 8) & 0xFF, cmd, ...payload];
        
        await this.clearBuffer();
        await this.sendCommand(command, 'ReadSector');
        
        // Python: expect_length = rx_expect_length(4 + 4096) = 7 + 2 + 1 + 1 + (4 + 4096) = 4111
        const expectedLength = 7 + 2 + 1 + 1 + 4 + 4096;
        const response = await this.receiveResponse(expectedLength, 500);
        
        if (response.length >= expectedLength) {
            // Python: response_check and get_read_content
            const expectedHeader = [0x04, 0x0E, 0xFF, 0x01, 0xE0, 0xFC, 0xF4];
            const headerMatch = expectedHeader.every((byte, index) => response[index] === byte);
            
            if (headerMatch && response[10] === 0x00) { // 检查状态码
                if (isExt) {
                    // Python FlashRead4kExtProtocol.response_check(): 返回True
                    // Python get_read_content(): 与普通协议相同，但没有地址检查
                    // Python get_read_content(response_content): 返回response_content[15:]
                    return response.slice(15, 15 + 0x1000);
                } else {
                    // Python FlashRead4kProtocol需要检查地址匹配
                    // Python: response_content[11:15] == bytes([flash_addr & 0xff, ...])
                    const responseAddr = response.slice(11, 15);
                    const expectedAddr = [
                        flashAddr & 0xff,
                        (flashAddr >> 8) & 0xff,
                        (flashAddr >> 16) & 0xff,
                        (flashAddr >> 24) & 0xff
                    ];
                    
                    if (responseAddr.every((byte, index) => byte === expectedAddr[index])) {
                        // Python get_read_content(response_content): 返回response_content[15:]
                        return response.slice(15, 15 + 0x1000);
                    } else {
                        this.debug('error', `读取扇区地址不匹配: 期望[${expectedAddr.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')}], 实际[${responseAddr.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')}]`);
                    }
                }
            } else {
                this.debug('error', `读取扇区响应格式错误: 头部匹配=${headerMatch}, 状态码=0x${response[10]?.toString(16).padStart(2, '0') || 'unknown'}`);
            }
        } else {
            this.debug('error', `读取扇区响应长度不足: ${response.length} < ${expectedLength}`);
        }
        
        return null;
    }
    
    /**
     * 读取并检查扇区 - 完全按照Python read_and_check_sector方法实现  
     */
    async readAndCheckSector(addr, flashSize, recnt = 5) {
        // Python: cnt = recnt; while cnt > 0:
        let cnt = recnt;
        while (cnt > 0) {
            // Python: ret = self.read_sector(addr, flash_size)
            const ret = await this.readSector(addr, flashSize);
            
            // Python: if ret and self.check_crc_ver2(ret, addr, 0x1000, flash_size, recnt=recnt):
            if (ret && await this.checkCrcVer2(ret, addr, 0x1000, flashSize, 0.1, recnt)) {
                return ret;
            }
            cnt--;
        }
        return null;
    }
    
    /**
     * 擦除扇区 - 完全按照Python erase_sector方法实现
     */
    async eraseSector(flashAddr, flashSize) {
        // Python: erase_flash_protocol = FlashErase4kProtocol() or FlashErase4kExtProtocol()
        const isExt = flashSize >= 256 * 1024 * 1024;
        const cmd = isExt ? 0xeb : 0x0b; // FlashErase4kExtProtocol : FlashErase4kProtocol
        
        // Python: erase_flash_protocol.cmd(flash_addr)
        const payload = [
            flashAddr & 0xff,
            (flashAddr >> 8) & 0xff,
            (flashAddr >> 16) & 0xff,
            (flashAddr >> 24) & 0xff
        ];
        
        const command = [0x01, 0xE0, 0xFC, 0xFF, 0xF4, (1 + payload.length) & 0xFF, ((1 + payload.length) >> 8) & 0xFF, cmd, ...payload];
        
        try {
            await this.clearBuffer();
            await this.sendCommand(command, 'EraseSector');
            
            // Python: expect_length = rx_expect_length(4) = 7 + 2 + 1 + 1 + 4 = 15
            const expectedLength = 15;
            const response = await this.receiveResponse(expectedLength, 500);
            
            if (response.length >= expectedLength) {
                // Python: response_check
                const expectedHeader = [0x04, 0x0E, 0xFF, 0x01, 0xE0, 0xFC, 0xF4];
                const headerMatch = expectedHeader.every((byte, index) => response[index] === byte);
                
                if (headerMatch && response[10] === 0x00) { // 检查状态码
                    if (isExt) {
                        // Python FlashErase4kExtProtocol.response_check(): 返回True
                        return true;
                    } else {
                        // Python FlashErase4kProtocol需要检查地址匹配
                        // Python: response_content[11:15] == bytes([flash_addr & 0xff, ...])
                        const responseAddr = response.slice(11, 15);
                        const expectedAddr = [
                            flashAddr & 0xff,
                            (flashAddr >> 8) & 0xff,
                            (flashAddr >> 16) & 0xff,
                            (flashAddr >> 24) & 0xff
                        ];
                        
                        return responseAddr.every((byte, index) => byte === expectedAddr[index]);
                    }
                }
            }
            return false;
        } catch (error) {
            return false;
        }
    }
    
    /**
     * 地址对齐写入 - 完全按照Python align_sector_address_for_write方法实现
     */
    async alignSectorAddressForWrite(addr, startOrEnd, content, flashSize) {
        // Python: erase_addr = int(addr/0x1000)*0x1000
        const eraseAddr = Math.floor(addr / 0x1000) * 0x1000;
        // Python: baudrate_backup = self.ser.baudrate
        // 使用用户配置的波特率作为备份，而不是硬编码值
        const baudrateBackup = this.currentBaudrate || this.getUserConfiguredBaudrate();
        
        try {
            // Python: if not self.set_baudrate(500000): return False
            if (!await this.setBaudrate(500000)) {
                return false;
            }
            
            // Python: time.sleep(0.1)
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Python: ret = self.read_sector(erase_addr, flash_size)
            const ret = await this.readSector(eraseAddr, flashSize);
            if (ret === null) {
                return false;
            }
            
            // Python: res = self.erase_custom_size(erase_addr, cmd)
            const eraseCmd = flashSize >= 256 * 1024 * 1024 ? 0x21 : 0x20;
            try {
                await this.eraseCustomSize(eraseAddr, eraseCmd);
            } catch (error) {
                return false;
            }
            
            // Python: if not self.set_baudrate(baudrate_backup): return False
            if (!await this.setBaudrate(baudrateBackup)) {
                return false;
            }
            
            // Python: 重新组合数据
            let newData;
            if (startOrEnd) {
                // Python: ret = ret[:(addr & 0xfff)] + content[:(0x1000 - addr & 0xfff)]
                const keepBytes = addr & 0xfff;
                const contentBytes = 0x1000 - (addr & 0xfff);
                newData = new Uint8Array(0x1000);
                newData.set(ret.slice(0, keepBytes), 0);
                newData.set(content.slice(0, contentBytes), keepBytes);
            } else {
                // Python: ret = content[-(addr & 0xfff):] + ret[(addr & 0xfff):]
                const trimBytes = addr & 0xfff;
                newData = new Uint8Array(0x1000);
                newData.set(content.slice(-trimBytes), 0);
                newData.set(ret.slice(trimBytes), trimBytes);
            }
            
            // Python: if not self.write_and_check_sector(ret, erase_addr, flash_size): return False
            if (!await this.writeAndCheckSector(newData, eraseAddr, flashSize)) {
                return false;
            }
            
            return true;
        } catch (error) {
            this.debug('error', `地址对齐写入失败: ${error.message}`);
            return false;
        }
    }
    
    /**
     * 重试写入扇区 - 完全按照Python retry_write_sector方法实现
     */
    async retryWriteSector(flashAddr, buf, flashSize, recnt = 5) {
        // Python: baudrate_backup = self.ser.baudrate
        // 使用用户配置的波特率作为备份，而不是硬编码值
        const baudrateBackup = this.currentBaudrate || this.getUserConfiguredBaudrate();
        
        try {
            // Python: self.reset(baudrate=115200)
            this.debug('debug', '重试: 重置到115200波特率');
            await this.setBaudrate(115200);
            
            // Python: if self.get_bus(is_stop): return False
            // 注意：Python中get_bus返回True表示失败！
            this.debug('debug', '重试: 重新获取总线控制');
            if (!await this.getBusControl()) {
                return false;
            }
            
            // Python: time.sleep(0.01)
            await new Promise(resolve => setTimeout(resolve, 10));
            
            // Python: if not self.set_baudrate(baudrate_backup): return False
            this.debug('debug', `重试: 恢复波特率${baudrateBackup}`);
            if (!await this.setBaudrate(baudrateBackup)) {
                return false;
            }
            
            // Python: if not self.erase_sector(flash_addr, flash_size): return False
            this.debug('debug', '重试: 擦除扇区');
            if (!await this.eraseSector(flashAddr, flashSize)) {
                return false;
            }
            
            // Python: if not self.write_and_check_sector(buf, flash_addr, flash_size): return False
            this.debug('debug', '重试: 写入并检查扇区');
            if (!await this.writeAndCheckSector(buf, flashAddr, flashSize)) {
                return false;
            }
            
            return true;
        } catch (error) {
            this.debug('error', `重试写入扇区失败: ${error.message}`);
            return false;
        }
    }

    /**
     * Flash保护 - 完全按照Python protect_flash逻辑实现
     */
    async protectFlash() {
        this.debug('info', 'Flash保护操作...');
        
        // Python: protect_reg_val, mask = self._flash_cfg.protect_register_value
        const { protectRegVal, mask } = this.getFlashProtectConfig();
        
        this.debug('debug', `保护目标值: [${protectRegVal.map(v => '0x' + v.toString(16).padStart(2, '0')).join(', ')}]`);
        this.debug('debug', `保护掩码: [${mask.map(v => '0x' + v.toString(16).padStart(2, '0')).join(', ')}]`);
        
        // Python: reg_val = self.ser_handle._read_flash_status_reg_val()
        const regVal = await this.readFlashStatusRegVal();
        this.debug('debug', `读取到状态寄存器值: [${regVal.map(v => '0x' + v.toString(16).padStart(2, '0')).join(', ')}]`);
        
        // Python: if not self.ser_handle.compare_register_value(reg_val, protect_reg_val, mask):
        if (!this.compareRegisterValue(regVal, protectRegVal, mask)) {
            this.debug('info', 'Flash需要保护，计算写入值...');
            
            // 详细显示比较过程
            for (let i = 0; i < regVal.length && i < protectRegVal.length && i < mask.length; i++) {
                const srcMasked = regVal[i] & mask[i];
                const destMasked = protectRegVal[i] & mask[i];
                this.debug('debug', `寄存器${i}: 读取值=0x${regVal[i].toString(16).padStart(2, '0')}, 掩码=0x${mask[i].toString(16).padStart(2, '0')}, 读取值&掩码=0x${srcMasked.toString(16).padStart(2, '0')}, 目标值&掩码=0x${destMasked.toString(16).padStart(2, '0')}, 匹配=${srcMasked === destMasked ? '是' : '否'}`);
            }
            
            // Python: write_val = protect_reg_val
            // for _ in range(len(write_val)):
            //     write_val[_] = write_val[_] | (reg_val[_] & (mask[_] ^ 0xff))
            const writeVal = [...protectRegVal];
            for (let i = 0; i < writeVal.length; i++) {
                const invertedMask = mask[i] ^ 0xff;
                const preserved = regVal[i] & invertedMask;
                writeVal[i] = writeVal[i] | preserved;
                this.debug('debug', `计算写入值${i}: 目标=0x${protectRegVal[i].toString(16).padStart(2, '0')}, 反掩码=0x${invertedMask.toString(16).padStart(2, '0')}, 保留位=0x${preserved.toString(16).padStart(2, '0')}, 最终写入=0x${writeVal[i].toString(16).padStart(2, '0')}`);
            }
            this.debug('debug', `计算写入值: [${writeVal.map(v => '0x' + v.toString(16).padStart(2, '0')).join(', ')}]`);
            
            // Python: self.ser_handle._write_flash_status_reg_val(write_val)
            await this.writeFlashStatusRegVal(writeVal);
            
            // Python: reg_val = self.ser_handle._read_flash_status_reg_val()
            const newRegVal = await this.readFlashStatusRegVal();
            this.debug('debug', `写入后状态寄存器值: [${newRegVal.map(v => '0x' + v.toString(16).padStart(2, '0')).join(', ')}]`);
            
            // Python: if not self.ser_handle.compare_register_value(reg_val, protect_reg_val, mask):
            if (!this.compareRegisterValue(newRegVal, protectRegVal, mask)) {
                // 详细显示验证失败的原因
                for (let i = 0; i < newRegVal.length && i < protectRegVal.length && i < mask.length; i++) {
                    const srcMasked = newRegVal[i] & mask[i];
                    const destMasked = protectRegVal[i] & mask[i];
                    this.debug('error', `验证失败 - 寄存器${i}: 写入后值=0x${newRegVal[i].toString(16).padStart(2, '0')}, 掩码=0x${mask[i].toString(16).padStart(2, '0')}, 实际&掩码=0x${srcMasked.toString(16).padStart(2, '0')}, 期望&掩码=0x${destMasked.toString(16).padStart(2, '0')}`);
                }
                throw new Error('Flash保护失败：写入后验证不通过');
            } else {
                this.debug('info', '✅ Flash保护成功');
            }
        } else {
            this.debug('info', '✅ Flash已经保护');
        }
    }
    
    /**
     * 获取Flash保护配置 - 根据Flash ID获取保护寄存器配置
     */
    getFlashProtectConfig() {
        // 简化的Flash保护配置，基于Python flash_config.py的逻辑
        // 这里实现一个基础版本，实际应该根据Flash配置文件解析
        
        if (!this.flashConfig) {
            // 默认保护配置
            return {
                protectRegVal: [0x1c, 0x40], // 默认保护值
                mask: [0x7c, 0x40]           // 默认掩码
            };
        }
        
        // 根据Flash厂商和型号返回相应的保护配置
        // 这里简化实现，实际应该从完整的Flash配置数据库中获取
        const flashId = this.flashId;
        
        // GD系列Flash的保护配置
        if (flashId === 0x001340c8 || flashId === 0x001440c8 || flashId === 0x001540c8 || 
            flashId === 0x001640c8 || flashId === 0x001740c8 || flashId === 0x001840c8) {
            // GD25QxxC系列：16位保护配置
            return {
                protectRegVal: [0x1c, 0x40], // [null, 0, null, null, null, null, null, null, null, 0, 0, 1, 1, 1, null, null]
                mask: [0x1c, 0x40]           // 对应的掩码
            };
        }
        
        // PY系列Flash的保护配置  
        if (flashId === 0x00124485 || flashId === 0x00124585) {
            // PY25DxxU系列：8位保护配置
            return {
                protectRegVal: [0x1c], // [null, 0, 0, 1, 1, 1, null, null]
                mask: [0x1c]           // 对应的掩码
            };
        }
        
        // 其他Flash使用默认配置
        return {
            protectRegVal: [0x1c, 0x40],
            mask: [0x7c, 0x40]
        };
    }

    /**
     * 重启设备 - 完全按照Python RebootProtocol实现
     */
    async reboot() {
        this.debug('info', '重启设备...');
        
        try {
            // Python: RebootProtocol().cmd() = command_generate(0x0e, [0xa5])
            // BaseBootRomProtocol格式: [0x01, 0xe0, 0xfc, len, cmd, payload...]
            const command = [0x01, 0xE0, 0xFC, 0x02, 0x0E, 0xA5];
            
            await this.clearBuffer();
            await this.sendCommand(command, 'Reboot');
            
            // Python: RebootProtocol没有期望响应，直接发送即可
            // 重启命令发送后设备会重启，不需要等待响应
            this.debug('info', '✅ 重启命令已发送');
            
            // 等待设备重启
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            this.debug('info', '✅ 设备重启完成');
            return true;
        } catch (error) {
            this.debug('error', `设备重启失败: ${error.message}`);
            return false;
        }
    }
    
    /**
     * 读取Flash数据 - 完全按照Python read()方法实现
     */
    async readFlash(length, startAddr = 0x00) {
        if (!this.chipId || !this.flashId) {
            throw new Error('设备未连接，请先调用connect()');
        }
        
        try {
            this.debug('info', '开始读取Flash数据...');
            this.debug('info', `起始地址: 0x${startAddr.toString(16).padStart(8, '0')}`);
            this.debug('info', `读取长度: ${length} 字节`);
            
            const flashSize = this.flashConfig ? this.flashConfig.size : 4 * 1024 * 1024;
            let start = startAddr;
            let fileBuffer = new Uint8Array(length);
            const retry = 5;
            let i = 0;
            
            const totalSectors = Math.ceil(length / 0x1000);
            
            if (this.onProgress) {
                this.onProgress({ 
                    stage: 'reading', 
                    message: '开始读取Flash...',
                    progress: 0,
                    total: totalSectors
                });
            }
            
            while (i < length) {
                if (this.stopFlag) break;
                
                const currentAddr = start + i;
                this.debug('debug', `read at ${currentAddr.toString(16).padStart(8, '0')} ...`);
                
                // Python: ret = self.ser_handle.read_and_check_sector(start+i, flash_size, cnt)
                const ret = await this.readAndCheckSector(currentAddr, flashSize, retry);
                
                if (ret === null) {
                    throw new Error(`读取Flash失败: 地址 0x${currentAddr.toString(16).padStart(8, '0')}`);
                }
                
                // 复制数据到结果缓冲区
                const copyLength = Math.min(0x1000, length - i);
                fileBuffer.set(ret.slice(0, copyLength), i);
                
                i += 0x1000;
                
                // 更新进度
                const currentSector = Math.floor(i / 0x1000);
                if (this.onProgress) {
                    this.onProgress({ 
                        stage: 'reading', 
                        message: '读取Flash...',  // 移除消息中的百分比
                        progress: currentSector,
                        total: totalSectors,
                        percent: (currentSector / totalSectors) * 100  // 将百分比作为单独字段提供
                    });
                }
            }
            
            this.debug('info', '✅ Flash读取完成');
            
            if (this.onProgress) {
                this.onProgress({ 
                    stage: 'completed', 
                    message: 'Flash读取完成',
                    progress: totalSectors,
                    total: totalSectors
                });
            }
            
            // 返回实际读取的数据长度
            return fileBuffer.slice(0, length);
            
        } catch (error) {
            this.debug('error', `Flash读取失败: ${error.message}`);
            if (this.onProgress) {
                this.onProgress({ 
                    stage: 'error', 
                    message: `读取失败: ${error.message}` 
                });
            }
            throw error;
        }
    }
    
    /**
     * CRC校验功能 - 完全按照Python crc_check()方法实现
     */
    async crcCheck() {
        this.debug('info', '开始CRC校验...');
        
        // Python T5FlashHandler.crc_check()方法实际上是空实现
        // '''
        // do nothing
        // '''
        // 这是因为T5的CRC校验已经集成在write_and_check_sector中
        
        this.debug('info', '✅ CRC校验成功');
        return true;
    }
    
    /**
     * 重置串口连接 - 完全按照Python reset()方法实现
     */
    async reset(baudrate = null) {
        this.debug('info', '重置串口连接...');
        
        try {
            // Python: port = self.ser.port
            // Python: if baudrate is None: baudrate = self.ser.baudrate
            const targetBaudrate = baudrate || this.currentBaudrate || 115200;
            
            // Python: self.disconnect()
            // 注意：在Web环境中，我们不能直接关闭串口，需要重新配置
            
            // Python: self.ser = serial.Serial(port, baudrate, timeout=0)
            await this.port.close();
            await this.port.open({
                baudRate: targetBaudrate,
                dataBits: 8,
                stopBits: 1,
                parity: 'none'
            });
            
            this.currentBaudrate = targetBaudrate;
            this.debug('info', `✅ 串口重置完成，波特率: ${targetBaudrate}`);
            
            return true;
        } catch (error) {
            this.debug('error', `串口重置失败: ${error.message}`);
            return false;
        }
    }
    
    /**
     * 获取Flash配置信息 - 扩展Flash数据库信息
     */
    getFlashInfo() {
        if (!this.flashConfig) {
            return null;
        }
        
        return {
            chipId: this.chipId,
            flashId: this.flashId,
            manufacturer: this.flashConfig.manufacturer,
            name: this.flashConfig.name,
            size: this.flashConfig.size,
            sizeString: `${this.flashConfig.size / (1024 * 1024)}MB`
        };
    }
    
    /**
     * 检查设备连接状态
     */
    isConnected() {
        return this.chipId !== null && this.flashId !== null;
    }
    
    /**
     * 获取设备状态信息
     */
    getDeviceStatus() {
        return {
            connected: this.isConnected(),
            chipId: this.chipId,
            flashId: this.flashId,
            flashConfig: this.flashConfig,
            currentBaudrate: this.currentBaudrate || 115200,
            stopFlag: this.stopFlag
        };
    }

    /**
     * 获取支持的Flash芯片列表
     */
    getSupportedFlashChips() {
        return this.flashDatabase;
    }

    debug(level, message, data) {
        // 过滤掉WriteSector相关日志
        if (typeof message === 'string' && message.includes('WriteSector')) {
            return;
        }
        // ... existing code ...
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = T5Downloader;
} else if (typeof window !== 'undefined') {
    window.T5Downloader = T5Downloader;
}