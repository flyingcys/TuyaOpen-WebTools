/**
 * 语言管理模块
 * 负责语言切换、下拉菜单管理
 */
class LanguageManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.elements = {};
        this.currentLanguage = 'zh';
        
        this.initializeElements();
        this.bindEvents();
    }
    
    initializeElements() {
        // 语言切换相关元素
        this.elements.langDropdown = document.getElementById('langDropdown');
        this.elements.langDropdownBtn = document.getElementById('langDropdownBtn');
        this.elements.langDropdownMenu = document.getElementById('langDropdownMenu');
        this.elements.currentLangName = document.getElementById('currentLangName');
    }
    
    bindEvents() {
        // 语言切换事件
        this.elements.langDropdownBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleLanguageDropdown();
        });

        // 语言选项点击事件
        this.elements.langDropdownMenu?.addEventListener('click', async (e) => {
            const langOption = e.target.closest('.lang-option');
            if (langOption) {
                const selectedLang = langOption.getAttribute('data-lang');
                await this.changeLanguage(selectedLang);
                this.closeLanguageDropdown();
            }
        });

        // 点击外部关闭下拉菜单
        document.addEventListener('click', (e) => {
            if (this.elements.langDropdown && !this.elements.langDropdown.contains(e.target)) {
                this.closeLanguageDropdown();
            }
        });
        
        // 监听模块事件
        this.eventBus.on('language:dropdown-toggle', () => {
            this.toggleLanguageDropdown();
        });
        
        this.eventBus.on('language:change', (lang) => {
            this.changeLanguage(lang);
        });
        
        this.eventBus.on('language:update-display', () => {
            this.updateLanguageDisplay();
        });
    }
    
    /**
     * 初始化语言设置
     */
    async initialize() {
        // 获取当前语言
        this.currentLanguage = i18n.getCurrentLanguage() || 'zh';
        
        // 更新语言按钮显示
        this.updateLanguageDisplay();
        
        console.log('Language Manager initialized for:', this.currentLanguage);
    }
    
    /**
     * 切换下拉菜单显示状态
     */
    toggleLanguageDropdown() {
        if (this.elements.langDropdown) {
            this.elements.langDropdown.classList.toggle('active');
        }
    }

    /**
     * 关闭下拉菜单
     */
    closeLanguageDropdown() {
        if (this.elements.langDropdown) {
            this.elements.langDropdown.classList.remove('active');
        }
    }

    /**
     * 切换语言
     */
    async changeLanguage(lang) {
        if (lang !== this.currentLanguage) {
            // 异步加载并设置语言
            const success = await i18n.setLanguage(lang);
            
            if (success) {
                this.currentLanguage = lang;
                
                // 更新语言显示
                this.updateLanguageDisplay();
                
                // 触发语言变更事件
                this.eventBus.emit('language:changed', lang);
                
                console.log('Language switched to:', lang);
            } else {
                console.error(`语言切换失败: ${lang}`);
                this.eventBus.emit('error', { message: `Failed to switch to language: ${lang}` });
            }
        }
    }

    /**
     * 更新语言显示
     */
    updateLanguageDisplay() {
        const currentLang = this.currentLanguage;
        
        if (!currentLang) {
            console.warn('当前语言未设置，使用默认中文');
            return;
        }
        
        // 使用全局语言配置
        const langData = window.LANGUAGE_CONFIG || {
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
        
        const currentLangData = langData[currentLang];
        if (!currentLangData) {
            console.warn(`未知语言代码: ${currentLang}`);
            return;
        }
        
        // 更新当前显示的语言
        if (this.elements.currentLangName) {
            this.elements.currentLangName.textContent = currentLangData.name;
        }
        
        // 更新选项的激活状态
        if (this.elements.langDropdownMenu) {
            this.elements.langDropdownMenu.querySelectorAll('.lang-option').forEach(option => {
                const optionLang = option.getAttribute('data-lang');
                if (optionLang === currentLang) {
                    option.classList.add('active');
                } else {
                    option.classList.remove('active');
                }
            });
        }
        
        console.log('Language display updated:', `${currentLangData.name} (${currentLang})`);
    }
    
    /**
     * 获取当前语言
     */
    getCurrentLanguage() {
        return this.currentLanguage;
    }
    
    /**
     * 获取支持的语言列表
     */
    getSupportedLanguages() {
        return Object.keys(window.LANGUAGE_CONFIG || {});
    }
    
    /**
     * 销毁模块
     */
    destroy() {
        this.elements = {};
        this.currentLanguage = null;
        this.eventBus = null;
    }
}

// 导出
if (typeof window !== 'undefined') {
    window.LanguageManager = LanguageManager;
} 
