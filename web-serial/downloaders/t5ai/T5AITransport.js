/**
 * T5AI Transport层 - 串口通信抽象层
 * 
 * 提供类似esptool-js Transport的抽象层，处理跨平台串口通信
 * 解决流锁定、信号控制、数据传输等底层问题
 * 
 * @author Claude
 * @date 2024
 */

class T5AITransport {
    constructor(port, debugCallback) {
        this.port = port;
        this.debugCallback = debugCallback || (() => {});
        this.reader = null;
        this.writer = null;
        this.signalController = null;
        this.connected = false;
        this.readBuffer = [];
        this.readPromise = null;
        
        // 初始化信号控制器
        this.initializeSignalController();
        
        this.log('info', 'T5AI Transport层初始化');
    }
    
    /**
     * 初始化信号控制器
     */
    initializeSignalController() {
        // 动态加载信号控制器
        if (typeof T5AISignalController !== 'undefined') {
            this.signalController = new T5AISignalController(this.port, (level, message) => {
                this.log(level, `[Signal] ${message}`);
            });
            this.log('info', '信号控制器已加载');
        } else {
            this.log('warning', '信号控制器未找到，使用基础信号控制');
        }
    }
    
    /**
     * 连接并初始化
     */
    async connect(options = {}) {
        try {
            this.log('info', '开始建立Transport连接');
            
            // 确保串口已打开
            if (!this.port.readable || !this.port.writable) {
                throw new Error('串口未打开或不可用');
            }
            
            // 获取读写器
            await this.acquireReaderWriter();
            
            this.connected = true;
            this.log('success', 'Transport连接建立成功');
            
            return true;
        } catch (error) {
            this.log('error', `连接失败: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * 获取读写器
     */
    async acquireReaderWriter() {
        try {
            // 检查并释放已锁定的流
            await this.releaseReaderWriter();
            
            // 获取新的读写器
            if (this.port.readable && !this.port.readable.locked) {
                this.reader = this.port.readable.getReader();
                this.log('debug', '读取器获取成功');
            } else {
                throw new Error('无法获取读取器：流已锁定或不可用');
            }
            
            if (this.port.writable && !this.port.writable.locked) {
                this.writer = this.port.writable.getWriter();
                this.log('debug', '写入器获取成功');
            } else {
                // 释放已获取的reader
                if (this.reader) {
                    await this.reader.releaseLock();
                    this.reader = null;
                }
                throw new Error('无法获取写入器：流已锁定或不可用');
            }
            
            return true;
        } catch (error) {
            this.log('error', `获取读写器失败: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * 释放读写器
     */
    async releaseReaderWriter() {
        try {
            if (this.reader) {
                try {
                    await this.reader.cancel();
                    await this.reader.releaseLock();
                } catch (e) {
                    // 忽略释放错误
                }
                this.reader = null;
                this.log('debug', '读取器已释放');
            }
            
            if (this.writer) {
                try {
                    await this.writer.close();
                    await this.writer.releaseLock();
                } catch (e) {
                    // 忽略释放错误
                }
                this.writer = null;
                this.log('debug', '写入器已释放');
            }
        } catch (error) {
            this.log('warning', `释放读写器警告: ${error.message}`);
        }
    }
    
    /**
     * 执行复位操作
     */
    async reset() {
        try {
            this.log('info', '执行T5AI复位');
            
            // 使用信号控制器执行跨平台复位
            if (this.signalController) {
                const success = await this.signalController.executeReset();
                if (!success) {
                    throw new Error('信号控制器复位失败');
                }
            } else {
                // 降级到基础复位
                await this.basicReset();
            }
            
            // 清空读缓冲区
            await this.flushInput();
            
            this.log('success', '复位完成');
            return true;
        } catch (error) {
            this.log('error', `复位失败: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * 基础复位操作（降级方案）
     */
    async basicReset() {
        try {
            await this.port.setSignals({ dataTerminalReady: false, requestToSend: true });
            await this.delay(300);
            await this.port.setSignals({ requestToSend: false });
            await this.delay(4);
        } catch (error) {
            this.log('warning', `基础复位警告: ${error.message}`);
        }
    }
    
    /**
     * 写入数据
     */
    async write(data) {
        if (!this.writer) {
            throw new Error('写入器未初始化');
        }
        
        try {
            // 确保数据是Uint8Array
            const uint8Data = data instanceof Uint8Array ? data : new Uint8Array(data);
            
            await this.writer.write(uint8Data);
            
            this.log('debug', `写入 ${uint8Data.length} 字节`);
            return true;
        } catch (error) {
            this.log('error', `写入失败: ${error.message}`);
            
            // 尝试重新获取writer
            if (error.message.includes('lock') || error.message.includes('closed')) {
                this.log('info', '尝试重新获取写入器');
                await this.acquireReaderWriter();
                // 重试一次
                return await this.write(data);
            }
            
            throw error;
        }
    }
    
    /**
     * 读取数据
     */
    async read(expectedLength = 1, timeout = 100) {
        if (!this.reader) {
            throw new Error('读取器未初始化');
        }
        
        const buffer = [];
        const startTime = Date.now();
        
        try {
            while (buffer.length < expectedLength) {
                const remaining = expectedLength - buffer.length;
                const elapsed = Date.now() - startTime;
                
                if (elapsed >= timeout) {
                    break; // 超时
                }
                
                // 设置读取超时
                const readPromise = this.reader.read();
                const timeoutPromise = new Promise((resolve) =>
                    setTimeout(() => resolve({ done: true, timeout: true }), timeout - elapsed)
                );
                
                const result = await Promise.race([readPromise, timeoutPromise]);
                
                if (result.timeout || result.done) {
                    break;
                }
                
                if (result.value && result.value.length > 0) {
                    buffer.push(...result.value);
                    
                    // 如果读到了足够的数据，立即返回
                    if (buffer.length >= expectedLength) {
                        break;
                    }
                }
            }
            
            this.log('debug', `读取 ${buffer.length}/${expectedLength} 字节`);
            return buffer.slice(0, expectedLength);
            
        } catch (error) {
            this.log('error', `读取失败: ${error.message}`);
            
            // 尝试重新获取reader
            if (error.message.includes('lock') || error.message.includes('closed')) {
                this.log('info', '尝试重新获取读取器');
                await this.acquireReaderWriter();
                // 重试一次
                return await this.read(expectedLength, timeout);
            }
            
            throw error;
        }
    }
    
    /**
     * 清空输入缓冲区
     */
    async flushInput() {
        try {
            if (!this.reader) {
                return;
            }
            
            let totalCleared = 0;
            const startTime = Date.now();
            const maxTime = 50; // 最多清理50ms
            
            while (Date.now() - startTime < maxTime) {
                const readPromise = this.reader.read();
                const timeoutPromise = new Promise((resolve) =>
                    setTimeout(() => resolve({ done: true }), 5)
                );
                
                const result = await Promise.race([readPromise, timeoutPromise]);
                
                if (result.done || !result.value || result.value.length === 0) {
                    break;
                }
                
                totalCleared += result.value.length;
            }
            
            if (totalCleared > 0) {
                this.log('debug', `清空输入缓冲区: ${totalCleared} 字节`);
            }
        } catch (error) {
            this.log('warning', `清空缓冲区警告: ${error.message}`);
        }
    }
    
    /**
     * 断开连接
     */
    async disconnect() {
        try {
            this.log('info', '断开Transport连接');
            
            // 释放读写器
            await this.releaseReaderWriter();
            
            this.connected = false;
            this.signalController = null;
            
            this.log('success', 'Transport已断开');
        } catch (error) {
            this.log('error', `断开失败: ${error.message}`);
        }
    }
    
    /**
     * 检查连接状态
     */
    isConnected() {
        return this.connected && this.port && (this.port.readable || this.port.writable);
    }
    
    /**
     * 获取设备信息
     */
    getInfo() {
        if (this.port && this.port.getInfo) {
            return this.port.getInfo();
        }
        
        return {
            usbVendorId: 0,
            usbProductId: 0
        };
    }
    
    /**
     * 设置串口参数
     */
    async configure(options) {
        try {
            // 关闭当前连接
            if (this.port.readable || this.port.writable) {
                await this.port.close();
            }
            
            // 重新打开with新参数
            await this.port.open(options);
            
            // 重新获取读写器
            await this.acquireReaderWriter();
            
            this.log('info', `串口重新配置: 波特率=${options.baudRate}`);
            return true;
        } catch (error) {
            this.log('error', `配置失败: ${error.message}`);
            throw error;
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
        const prefix = '[T5AI-Transport]';
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
     * 获取平台信息（如果信号控制器可用）
     */
    getPlatformInfo() {
        if (this.signalController && this.signalController.getPlatformInfo) {
            return this.signalController.getPlatformInfo();
        }
        
        return {
            platform: 'Unknown',
            userAgent: navigator.userAgent
        };
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = T5AITransport;
} else if (typeof window !== 'undefined') {
    window.T5AITransport = T5AITransport;
}