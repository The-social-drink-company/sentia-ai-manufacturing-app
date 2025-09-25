import React, { createContext, useContext, useState, useEffect } from 'react';
import { logDebug, logInfo, logWarn, logError } from '../utils/logger';


// Translation context
const I18nContext = createContext();

// Supported languages and regions
const SUPPORTED_LOCALES = {
  'en-US': { name: 'English (US)', region: 'Americas', currency: 'USD', dateFormat: 'MM/DD/YYYY' },
  'en-GB': { name: 'English (UK)', region: 'Europe', currency: 'GBP', dateFormat: 'DD/MM/YYYY' },
  'de-DE': { name: 'Deutsch', region: 'Europe', currency: 'EUR', dateFormat: 'DD.MM.YYYY' },
  'fr-FR': { name: 'Français', region: 'Europe', currency: 'EUR', dateFormat: 'DD/MM/YYYY' },
  'es-ES': { name: 'Español', region: 'Europe', currency: 'EUR', dateFormat: 'DD/MM/YYYY' },
  'it-IT': { name: 'Italiano', region: 'Europe', currency: 'EUR', dateFormat: 'DD/MM/YYYY' },
  'pt-BR': { name: 'Português (BR)', region: 'Americas', currency: 'BRL', dateFormat: 'DD/MM/YYYY' },
  'zh-CN': { name: '中文 (简体)', region: 'Asia', currency: 'CNY', dateFormat: 'YYYY-MM-DD' },
  'ja-JP': { name: '日本語', region: 'Asia', currency: 'JPY', dateFormat: 'YYYY/MM/DD' },
  'ko-KR': { name: '한국어', region: 'Asia', currency: 'KRW', dateFormat: 'YYYY-MM-DD' },
  'hi-IN': { name: 'हिंदी', region: 'Asia', currency: 'INR', dateFormat: 'DD/MM/YYYY' },
  'ar-SA': { name: 'العربية', region: 'Middle East', currency: 'SAR', dateFormat: 'DD/MM/YYYY', rtl: true }
};

// Manufacturing-specific translations
const TRANSLATIONS = {
  'en-US': {
    common: {
      dashboard: 'Dashboard',
      manufacturing: 'Manufacturing',
      production: 'Production',
      quality: 'Quality',
      inventory: 'Inventory',
      compliance: 'Compliance',
      analytics: 'Analytics',
      settings: 'Settings',
      logout: 'Logout'
    },
    manufacturing: {
      oee: 'Overall Equipment Effectiveness',
      availability: 'Availability',
      performance: 'Performance',
      quality: 'Quality',
      cycleTime: 'Cycle Time',
      taktTime: 'Takt Time',
      throughput: 'Throughput',
      yield: 'Yield',
      defectRate: 'Defect Rate',
      scrapRate: 'Scrap Rate',
      downtime: 'Downtime',
      plannedMaintenance: 'Planned Maintenance',
      unplannedDowntime: 'Unplanned Downtime',
      changeoverTime: 'Changeover Time',
      setupTime: 'Setup Time'
    },
    units: {
      pieces: 'pieces',
      units: 'units',
      hours: 'hours',
      minutes: 'minutes',
      seconds: 'seconds',
      kilograms: 'kg',
      meters: 'meters',
      liters: 'liters',
      percent: '%'
    },
    status: {
      running: 'Running',
      stopped: 'Stopped',
      maintenance: 'Maintenance',
      idle: 'Idle',
      error: 'Error',
      warning: 'Warning',
      normal: 'Normal',
      critical: 'Critical'
    },
    actions: {
      start: 'Start',
      stop: 'Stop',
      pause: 'Pause',
      resume: 'Resume',
      reset: 'Reset',
      save: 'Save',
      cancel: 'Cancel',
      confirm: 'Confirm',
      export: 'Export',
      import: 'Import',
      refresh: 'Refresh',
      analyze: 'Analyze'
    }
  },
  'de-DE': {
    common: {
      dashboard: 'Übersicht',
      manufacturing: 'Fertigung',
      production: 'Produktion',
      quality: 'Qualität',
      inventory: 'Bestand',
      compliance: 'Compliance',
      analytics: 'Analytik',
      settings: 'Einstellungen',
      logout: 'Abmelden'
    },
    manufacturing: {
      oee: 'Gesamtanlageneffektivität',
      availability: 'Verfügbarkeit',
      performance: 'Leistung',
      quality: 'Qualität',
      cycleTime: 'Taktzeit',
      taktTime: 'Taktzeit',
      throughput: 'Durchsatz',
      yield: 'Ausbeute',
      defectRate: 'Fehlerquote',
      scrapRate: 'Ausschussrate',
      downtime: 'Stillstandszeit',
      plannedMaintenance: 'Geplante Wartung',
      unplannedDowntime: 'Ungeplante Stillstandszeit',
      changeoverTime: 'Umrüstzeit',
      setupTime: 'Rüstzeit'
    },
    units: {
      pieces: 'Stück',
      units: 'Einheiten',
      hours: 'Stunden',
      minutes: 'Minuten',
      seconds: 'Sekunden',
      kilograms: 'kg',
      meters: 'Meter',
      liters: 'Liter',
      percent: '%'
    },
    status: {
      running: 'Läuft',
      stopped: 'Gestoppt',
      maintenance: 'Wartung',
      idle: 'Leerlauf',
      error: 'Fehler',
      warning: 'Warnung',
      normal: 'Normal',
      critical: 'Kritisch'
    },
    actions: {
      start: 'Starten',
      stop: 'Stoppen',
      pause: 'Pausieren',
      resume: 'Fortsetzen',
      reset: 'Zurücksetzen',
      save: 'Speichern',
      cancel: 'Abbrechen',
      confirm: 'Bestätigen',
      export: 'Exportieren',
      import: 'Importieren',
      refresh: 'Aktualisieren',
      analyze: 'Analysieren'
    }
  },
  'zh-CN': {
    common: {
      dashboard: '仪表板',
      manufacturing: '制造',
      production: '生产',
      quality: '质量',
      inventory: '库存',
      compliance: '合规',
      analytics: '分析',
      settings: '设置',
      logout: '登出'
    },
    manufacturing: {
      oee: '设备综合效率',
      availability: '可用性',
      performance: '性能',
      quality: '质量',
      cycleTime: '周期时间',
      taktTime: '节拍时间',
      throughput: '吞吐量',
      yield: '良率',
      defectRate: '缺陷率',
      scrapRate: '报废率',
      downtime: '停机时间',
      plannedMaintenance: '计划维护',
      unplannedDowntime: '非计划停机',
      changeoverTime: '换型时间',
      setupTime: '设置时间'
    },
    units: {
      pieces: '件',
      units: '单位',
      hours: '小时',
      minutes: '分钟',
      seconds: '秒',
      kilograms: '千克',
      meters: '米',
      liters: '升',
      percent: '%'
    },
    status: {
      running: '运行中',
      stopped: '已停止',
      maintenance: '维护中',
      idle: '空闲',
      error: '错误',
      warning: '警告',
      normal: '正常',
      critical: '危急'
    },
    actions: {
      start: '开始',
      stop: '停止',
      pause: '暂停',
      resume: '恢复',
      reset: '重置',
      save: '保存',
      cancel: '取消',
      confirm: '确认',
      export: '导出',
      import: '导入',
      refresh: '刷新',
      analyze: '分析'
    }
  }
};

// Region-specific configurations
const REGION_CONFIG = {
  'Americas': {
    measurementSystem: 'imperial',
    temperatureUnit: 'fahrenheit',
    firstDayOfWeek: 0, // Sunday
    workingHours: { start: 8, end: 17 },
    regulations: ['OSHA', 'FDA', 'EPA'],
    standards: ['ANSI', 'ASME', 'UL']
  },
  'Europe': {
    measurementSystem: 'metric',
    temperatureUnit: 'celsius',
    firstDayOfWeek: 1, // Monday
    workingHours: { start: 7, end: 16 },
    regulations: ['CE', 'REACH', 'RoHS', 'MDR'],
    standards: ['ISO', 'EN', 'DIN']
  },
  'Asia': {
    measurementSystem: 'metric',
    temperatureUnit: 'celsius',
    firstDayOfWeek: 1, // Monday (varies by country)
    workingHours: { start: 8, end: 18 },
    regulations: ['CCC', 'JIS', 'BIS', 'KS'],
    standards: ['ISO', 'GB', 'JIS', 'KS']
  },
  'Middle East': {
    measurementSystem: 'metric',
    temperatureUnit: 'celsius',
    firstDayOfWeek: 6, // Saturday
    workingHours: { start: 7, end: 16 },
    regulations: ['SASO', 'GSO', 'ESMA'],
    standards: ['ISO', 'SASO', 'GSO']
  }
};

export const InternationalizationProvider = ({ children }) => {
  const [locale, setLocale] = useState('en-US');
  const [translations, setTranslations] = useState(TRANSLATIONS['en-US']);
  const [regionConfig, setRegionConfig] = useState(REGION_CONFIG['Americas']);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize locale from browser or saved preference
  useEffect(() => {
    const savedLocale = localStorage.getItem('preferredLocale');
    const browserLocale = navigator.language || navigator.userLanguage;
    
    const initialLocale = savedLocale || 
      (SUPPORTED_LOCALES[browserLocale] ? browserLocale : 'en-US');
    
    changeLocale(initialLocale);
  }, []);

  // Change locale and load translations
  const changeLocale = async (newLocale) => {
    if (!SUPPORTED_LOCALES[newLocale]) {
      logWarn(`Unsupported locale: ${newLocale}`);
      return;
    }

    setIsLoading(true);

    try {
      // Load translations (in production, this would be an API call)
      const newTranslations = TRANSLATIONS[newLocale] || TRANSLATIONS['en-US'];
      const localeInfo = SUPPORTED_LOCALES[newLocale];
      const newRegionConfig = REGION_CONFIG[localeInfo.region];

      setLocale(newLocale);
      setTranslations(newTranslations);
      setRegionConfig(newRegionConfig);

      // Save preference
      localStorage.setItem('preferredLocale', newLocale);

      // Update document direction for RTL languages
      document.documentElement.dir = localeInfo.rtl ? 'rtl' : 'ltr';
      document.documentElement.lang = newLocale;

    } catch (error) {
      logError('Failed to change locale:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Translation function with fallback
  const t = (key, params = {}) => {
    const keys = key.split('.');
    let value = translations;

    for (const k of keys) {
      value = value?.[k];
      if (!value) break;
    }

    if (typeof value !== 'string') {
      logWarn(`Translation not found for key: ${key}`);
      return key;
    }

    // Replace parameters in translation
    let translated = value;
    Object.entries(params).forEach(([param, val]) => {
      translated = translated.replace(`{${param}}`, val);
    });

    return translated;
  };

  // Format number based on locale
  const formatNumber = (number, options = {}) => {
    return new Intl.NumberFormat(locale, options).format(number);
  };

  // Format date based on locale
  const formatDate = (date, options = {}) => {
    return new Intl.DateTimeFormat(locale, options).format(date);
  };

  // Format currency based on locale
  const formatCurrency = (amount, currency = null) => {
    const localeInfo = SUPPORTED_LOCALES[locale];
    const currencyCode = currency || localeInfo.currency;
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode
    }).format(amount);
  };

  // Convert units based on region
  const convertUnit = (value, fromUnit, toUnit) => {
    const conversions = {
      'kg_lb': value * 2.20462,
      'lb_kg': value / 2.20462,
      'm_ft': value * 3.28084,
      'ft_m': value / 3.28084,
      'l_gal': value * 0.264172,
      'gal_l': value / 0.264172,
      'c_f': (value * 9/5) + 32,
      'f_c': (value - 32) * 5/9
    };

    const key = `${fromUnit}_${toUnit}`;
    return conversions[key] || value;
  };

  // Get measurement system for current region
  const getMeasurementSystem = () => {
    return regionConfig.measurementSystem;
  };

  // Get temperature unit for current region
  const getTemperatureUnit = () => {
    return regionConfig.temperatureUnit;
  };

  // Get working hours for current region
  const getWorkingHours = () => {
    return regionConfig.workingHours;
  };

  // Get applicable regulations for current region
  const getRegulations = () => {
    return regionConfig.regulations;
  };

  // Get applicable standards for current region
  const getStandards = () => {
    return regionConfig.standards;
  };

  const value = {
    locale,
    locales: SUPPORTED_LOCALES,
    translations,
    regionConfig,
    isLoading,
    changeLocale,
    t,
    formatNumber,
    formatDate,
    formatCurrency,
    convertUnit,
    getMeasurementSystem,
    getTemperatureUnit,
    getWorkingHours,
    getRegulations,
    getStandards
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

// Custom hook to use i18n
export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within InternationalizationProvider');
  }
  return context;
};

export default InternationalizationProvider;