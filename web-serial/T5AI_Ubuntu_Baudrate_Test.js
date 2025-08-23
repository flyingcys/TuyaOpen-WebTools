/**
 * T5AI Ubuntu波特率兼容性测试工具
 * 用于测试和验证Ubuntu平台下的波特率兼容性处理
 */

class T5AIUbuntuBaudrateTest {
    constructor() {
        this.testResults = {};
    }

    /**
     * 模拟平台检测
     */
    detectPlatform() {
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes('linux')) {
            return 'ubuntu';
        } else if (userAgent.includes('mac')) {
            return 'macos';
        } else {
            return 'windows';
        }
    }

    /**
     * 获取平台兼容的波特率（与T5AI下载器逻辑一致）
     */
    getCompatibleBaudrate(requestedBaudrate) {
        const platform = this.detectPlatform();
        
        // Ubuntu/Linux平台的波特率兼容性映射
        if (platform === 'ubuntu') {
            const ubuntuCompatibleBaudrates = {
                115200: 115200,   // 标准波特率
                230400: 230400,   // 标准波特率
                460800: 460800,   // 标准波特率
                921600: 921600,   // 标准波特率，推荐使用
                1152000: 921600,  // 非标准波特率，降级到921600
                1500000: 921600,  // 非标准波特率，降级到921600
                2000000: 921600,  // 非标准波特率，降级到921600
                3000000: 921600   // 非标准波特率，降级到921600
            };
            
            return ubuntuCompatibleBaudrates[requestedBaudrate] || 921600;
        }
        
        // Windows和macOS平台保持原有行为
        return requestedBaudrate;
    }

    /**
     * 测试波特率兼容性
     */
    testBaudrateCompatibility() {
        console.log('🧪 开始T5AI Ubuntu波特率兼容性测试...');
        console.log(`📱 检测到平台: ${this.detectPlatform()}`);
        
        const testBaudrates = [115200, 230400, 460800, 921600, 1152000, 1500000, 2000000, 3000000];
        
        testBaudrates.forEach(baudrate => {
            const compatible = this.getCompatibleBaudrate(baudrate);
            const isAdjusted = compatible !== baudrate;
            
            this.testResults[baudrate] = {
                original: baudrate,
                compatible: compatible,
                adjusted: isAdjusted,
                status: isAdjusted ? '⚠️ 已调整' : '✅ 保持'
            };
            
            if (isAdjusted) {
                console.log(`⚠️  ${baudrate} → ${compatible} (Ubuntu平台自动调整)`);
            } else {
                console.log(`✅ ${baudrate} (无需调整)`);
            }
        });
        
        return this.testResults;
    }

    /**
     * 显示Ubuntu用户建议
     */
    showUbuntuRecommendations() {
        const platform = this.detectPlatform();
        
        if (platform === 'ubuntu') {
            console.log('\n📋 Ubuntu用户波特率建议:');
            console.log('✅ 推荐波特率: 921600 (最佳兼容性和性能平衡)');
            console.log('✅ 兼容波特率: 115200, 230400, 460800, 921600');
            console.log('⚠️  非标准波特率 (1152000, 1500000, 2000000, 3000000) 将自动降级到921600');
            console.log('💡 提示: Linux串口驱动对非标准波特率的支持有限');
        } else {
            console.log(`\n📋 ${platform}平台无需特殊处理，支持所有配置的波特率`);
        }
    }

    /**
     * 运行完整测试套件
     */
    runFullTest() {
        console.clear();
        console.log('🚀 T5AI Ubuntu波特率兼容性测试工具');
        console.log('='.repeat(50));
        
        this.testBaudrateCompatibility();
        this.showUbuntuRecommendations();
        
        console.log('\n📊 测试完成！');
        console.log('详细结果已保存到 testResults 属性中');
        
        return {
            platform: this.detectPlatform(),
            results: this.testResults,
            summary: {
                totalTested: Object.keys(this.testResults).length,
                adjusted: Object.values(this.testResults).filter(r => r.adjusted).length,
                unchanged: Object.values(this.testResults).filter(r => !r.adjusted).length
            }
        };
    }
}

// 创建全局测试实例
window.T5AIBaudrateTest = new T5AIUbuntuBaudrateTest();

// 提供快速测试函数
window.testT5AIBaudrate = () => {
    return window.T5AIBaudrateTest.runFullTest();
};

console.log('🔧 T5AI Ubuntu波特率兼容性测试工具已加载');
console.log('💻 使用方法: 在控制台运行 testT5AIBaudrate()');