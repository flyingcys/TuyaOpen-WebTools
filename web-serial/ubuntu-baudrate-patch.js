/**
 * Ubuntu波特率兼容性补丁
 * 自动为Ubuntu用户调整T5AI波特率设置，避免1152000等非标准波特率问题
 */

(function() {
    'use strict';
    
    // 检测平台
    function detectPlatform() {
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes('linux')) {
            return 'ubuntu';
        } else if (userAgent.includes('mac')) {
            return 'macos';
        } else {
            return 'windows';
        }
    }
    
    // Ubuntu波特率兼容性映射
    const ubuntuBaudrateMap = {
        115200: 115200,   // 标准波特率
        230400: 230400,   // 标准波特率
        460800: 460800,   // 标准波特率
        921600: 921600,   // 标准波特率，推荐使用
        1152000: 921600,  // 非标准波特率，降级到921600
        1500000: 921600,  // 非标准波特率，降级到921600
        2000000: 921600,  // 非标准波特率，降级到921600
        3000000: 921600   // 非标准波特率，降级到921600
    };
    
    // 获取兼容的波特率
    function getCompatibleBaudrate(requestedBaudrate) {
        const platform = detectPlatform();
        
        if (platform === 'ubuntu') {
            const compatible = ubuntuBaudrateMap[requestedBaudrate] || 921600;
            
            if (compatible !== requestedBaudrate) {
                console.warn(`🔧 Ubuntu兼容性调整: 波特率 ${requestedBaudrate} → ${compatible}`);
                console.info('💡 Ubuntu用户建议使用921600或更低的标准波特率以获得最佳兼容性');
                
                // 显示用户友好的通知
                if (window.serialTerminal && window.serialTerminal.debug) {
                    window.serialTerminal.debug('warning', 
                        `检测到Ubuntu平台，波特率${requestedBaudrate}不被完全支持，已自动调整为${compatible}`);
                }
            }
            
            return compatible;
        }
        
        return requestedBaudrate;
    }
    
    // 补丁T5AI下载器的getUserConfiguredBaudrate方法
    function patchT5AIDownloader() {
        if (typeof window.T5Downloader !== 'undefined' && window.T5Downloader.prototype) {
            const originalGetUserConfiguredBaudrate = window.T5Downloader.prototype.getUserConfiguredBaudrate;
            
            if (originalGetUserConfiguredBaudrate) {
                window.T5Downloader.prototype.getUserConfiguredBaudrate = function() {
                    const originalBaudrate = originalGetUserConfiguredBaudrate.call(this);
                    const compatibleBaudrate = getCompatibleBaudrate(originalBaudrate);
                    
                    if (compatibleBaudrate !== originalBaudrate && this.warningLog) {
                        this.warningLog(`Ubuntu平台波特率自动调整: ${originalBaudrate} → ${compatibleBaudrate}`);
                        this.infoLog('💡 建议Ubuntu用户使用921600或更低的标准波特率以获得最佳兼容性');
                        this.infoLog('💡 原因: Linux串口驱动对非标准波特率的支持有限');
                    }
                    
                    return compatibleBaudrate;
                };
                
                console.log('✅ T5AI Ubuntu波特率兼容性补丁已应用');
            }
        }
    }
    
    // 监听T5Downloader类的加载
    function waitForT5Downloader() {
        if (typeof window.T5Downloader !== 'undefined') {
            patchT5AIDownloader();
        } else {
            // 每100ms检查一次，最多等待10秒
            let attempts = 0;
            const maxAttempts = 100;
            const interval = setInterval(() => {
                attempts++;
                if (typeof window.T5Downloader !== 'undefined') {
                    clearInterval(interval);
                    patchT5AIDownloader();
                } else if (attempts >= maxAttempts) {
                    clearInterval(interval);
                    console.warn('T5AI下载器类未找到，波特率兼容性补丁未应用');
                }
            }, 100);
        }
    }
    
    // 页面加载后应用补丁
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForT5Downloader);
    } else {
        waitForT5Downloader();
    }
    
    // 添加全局测试函数
    window.testUbuntuBaudrateCompatibility = function() {
        const platform = detectPlatform();
        console.log(`🖥️  检测到平台: ${platform}`);
        
        const testBaudrates = [115200, 230400, 460800, 921600, 1152000, 1500000, 2000000, 3000000];
        console.log('🧪 波特率兼容性测试:');
        
        testBaudrates.forEach(baudrate => {
            const compatible = getCompatibleBaudrate(baudrate);
            const status = compatible === baudrate ? '✅ 兼容' : '⚠️  调整';
            console.log(`   ${baudrate} → ${compatible} (${status})`);
        });
        
        return {
            platform,
            testResults: testBaudrates.map(baudrate => ({
                original: baudrate,
                compatible: getCompatibleBaudrate(baudrate),
                adjusted: getCompatibleBaudrate(baudrate) !== baudrate
            }))
        };
    };
    
    console.log('🔧 Ubuntu波特率兼容性补丁已加载');
    console.log('💻 使用 testUbuntuBaudrateCompatibility() 进行测试');
    
})();