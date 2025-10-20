/**
 * 全局配置常量
 * 包含设备配置、ANSI颜色、默认值等
 */

// 设备波特率配置
window.DEVICE_BAUDRATE_CONFIG = {
    'custom': { baudrate: 115200, readonly: false },
    'T5AI': { baudrate: 921600, readonly: true },
    'T3': { baudrate: 921600, readonly: true },
    'T2': { baudrate: 115200, readonly: true },
    'ESP32': { baudrate: 115200, readonly: true },
    'ESP32C3': { baudrate: 115200, readonly: true },
    'ESP32S3': { baudrate: 115200, readonly: true },
    'BK7231N': { baudrate: 115200, readonly: true },
    'LN882H': { baudrate: 921600, readonly: true }
};

// ANSI颜色映射表
window.ANSI_COLORS = {
    '30': '#000000',  // 黑色
    '31': '#ff4444',  // 红色
    '32': '#44ff44',  // 绿色
    '33': '#ffff44',  // 黄色
    '34': '#4444ff',  // 蓝色
    '35': '#ff44ff',  // 洋红色
    '36': '#44ffff',  // 青色
    '37': '#ffffff',  // 白色
    '90': '#808080',  // 亮黑色（灰色）
    '91': '#ff6b6b',  // 亮红色
    '92': '#51cf66',  // 亮绿色
    '93': '#ffd43b',  // 亮黄色
    '94': '#74c0fc',  // 亮蓝色
    '95': '#f06292',  // 亮洋红色
    '96': '#22d3ee',  // 亮青色
    '97': '#f8f9fa'   // 亮白色
};

// ANSI背景颜色映射表
window.ANSI_BG_COLORS = {
    '40': '#000000',  // 黑色背景
    '41': '#8b0000',  // 红色背景
    '42': '#006400',  // 绿色背景
    '43': '#8b8000',  // 黄色背景
    '44': '#000080',  // 蓝色背景
    '45': '#8b008b',  // 洋红色背景
    '46': '#008b8b',  // 青色背景
    '47': '#c0c0c0',  // 白色背景
    '100': '#404040', // 亮黑色背景
    '101': '#800000', // 亮红色背景
    '102': '#008000', // 亮绿色背景
    '103': '#808000', // 亮黄色背景
    '104': '#000080', // 亮蓝色背景
    '105': '#800080', // 亮洋红色背景
    '106': '#008080', // 亮青色背景
    '107': '#808080'  // 亮白色背景
};

// 语言数据配置
window.LANGUAGE_CONFIG = {
    'zh': { name: '简体中文' },
    'zh-tw': { name: '繁體中文' },
    'en': { name: 'English' },
    'fr': { name: 'Français' },
    'de': { name: 'Deutsch' },
    'es': { name: 'Español' },
    'ja': { name: '日本語' },
    'ko': { name: '한국어' },
    'ru': { name: 'Русский' },
    'pt': { name: 'Português' }
};

// 应用配置
window.APP_CONFIG = {
    MAX_LOG_LINES: 1000,
    MAX_LINE_LENGTH: 200,
    MAX_BUFFER_SIZE: 500,
    AUTO_SCROLL_DEFAULT: true,
    SHOW_TIMESTAMP_DEFAULT: false,
    HEX_MODE_DEFAULT: false,
    ADD_NEWLINE_DEFAULT: true,
    FLASH_DEBUG_MODE_DEFAULT: false,
    FLASH_AUTO_SCROLL_DEFAULT: true,
    DEVICE_CONFIGS: window.DEVICE_BAUDRATE_CONFIG,
    ANSI_COLORS: window.ANSI_COLORS,
    ANSI_BG_COLORS: window.ANSI_BG_COLORS,
    BAUD_RATES: window.DEVICE_BAUDRATE_CONFIG,
    DATA_BITS_OPTIONS: {
        '5': { name: '5 Data Bits' },
        '6': { name: '6 Data Bits' },
        '7': { name: '7 Data Bits' },
        '8': { name: '8 Data Bits' }
    },
    STOP_BITS_OPTIONS: {
        '1': { name: '1 Stop Bit' },
        '1.5': { name: '1.5 Stop Bits' },
        '2': { name: '2 Stop Bits' }
    },
    PARITY_OPTIONS: {
        'N': { name: 'None' },
        'O': { name: 'Odd' },
        'E': { name: 'Even' },
        'M': { name: 'Mark' },
        'S': { name: 'Space' }
    },
    LANGUAGE_CONFIG: window.LANGUAGE_CONFIG,
    DEFAULT_QUICK_COMMANDS: [
        { name: 'AT', value: 'AT' }
    ]
};

console.log('📋 应用配置加载完成'); 
