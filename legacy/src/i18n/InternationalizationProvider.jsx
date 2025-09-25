import React, { createContext, useContext, useState, useEffect } from 'react';
import { logDebug, logInfo, logWarn, logError } from '../utils/logger';


// Translation context
const I18nContext = createContext();

// Supported languages and regions
const SUPPORTED_LOCALES = {
  'en-US': { name: 'English (US)', region: 'Americas', currency: 'USD', dateFormat: 'MM/DD/YYYY' },
  'en-GB': { name: 'English (UK)', region: 'Europe', currency: 'GBP', dateFormat: 'DD/MM/YYYY' },
  'de-DE': { name: 'Deutsch', region: 'Europe', currency: 'EUR', dateFormat: 'DD.MM.YYYY' },
  'fr-FR': { name: 'FranÃ§ais', region: 'Europe', currency: 'EUR', dateFormat: 'DD/MM/YYYY' },
  'es-ES': { name: 'EspaÃ±ol', region: 'Europe', currency: 'EUR', dateFormat: 'DD/MM/YYYY' },
  'it-IT': { name: 'Italiano', region: 'Europe', currency: 'EUR', dateFormat: 'DD/MM/YYYY' },
  'pt-BR': { name: 'PortuguÃªs (BR)', region: 'Americas', currency: 'BRL', dateFormat: 'DD/MM/YYYY' },
  'zh-CN': { name: 'ä¸­æ–‡ (ç®€ä½“)', region: 'Asia', currency: 'CNY', dateFormat: 'YYYY-MM-DD' },
  'ja-JP': { name: 'æ—¥æœ¬èªž', region: 'Asia', currency: 'JPY', dateFormat: 'YYYY/MM/DD' },
  'ko-KR': { name: 'í•œêµ­ì–´', region: 'Asia', currency: 'KRW', dateFormat: 'YYYY-MM-DD' },
  'hi-IN': { name: 'à¤¹à¤¿à¤‚à¤¦à¥€', region: 'Asia', currency: 'INR', dateFormat: 'DD/MM/YYYY' },
  'ar-SA': { name: 'Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©', region: 'Middle East', currency: 'SAR', dateFormat: 'DD/MM/YYYY', rtl: true }
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
      dashboard: 'Ãœbersicht',
      manufacturing: 'Fertigung',
      production: 'Produktion',
      quality: 'QualitÃ¤t',
      inventory: 'Bestand',
      compliance: 'Compliance',
      analytics: 'Analytik',
      settings: 'Einstellungen',
      logout: 'Abmelden'
    },
    manufacturing: {
      oee: 'GesamtanlageneffektivitÃ¤t',
      availability: 'VerfÃ¼gbarkeit',
      performance: 'Leistung',
      quality: 'QualitÃ¤t',
      cycleTime: 'Taktzeit',
      taktTime: 'Taktzeit',
      throughput: 'Durchsatz',
      yield: 'Ausbeute',
      defectRate: 'Fehlerquote',
      scrapRate: 'Ausschussrate',
      downtime: 'Stillstandszeit',
      plannedMaintenance: 'Geplante Wartung',
      unplannedDowntime: 'Ungeplante Stillstandszeit',
      changeoverTime: 'UmrÃ¼stzeit',
      setupTime: 'RÃ¼stzeit'
    },
    units: {
      pieces: 'StÃ¼ck',
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
      running: 'LÃ¤uft',
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
      reset: 'ZurÃ¼cksetzen',
      save: 'Speichern',
      cancel: 'Abbrechen',
      confirm: 'BestÃ¤tigen',
      export: 'Exportieren',
      import: 'Importieren',
      refresh: 'Aktualisieren',
      analyze: 'Analysieren'
    }
  },
  'zh-CN': {
    common: {
      dashboard: 'ä»ªè¡¨æ¿',
      manufacturing: 'åˆ¶é€ ',
      production: 'ç”Ÿäº§',
      quality: 'è´¨é‡',
      inventory: 'åº“å­˜',
      compliance: 'åˆè§„',
      analytics: 'åˆ†æž',
      settings: 'è®¾ç½®',
      logout: 'ç™»å‡º'
    },
    manufacturing: {
      oee: 'è®¾å¤‡ç»¼åˆæ•ˆçŽ‡',
      availability: 'å¯ç”¨æ€§',
      performance: 'æ€§èƒ½',
      quality: 'è´¨é‡',
      cycleTime: 'å‘¨æœŸæ—¶é—´',
      taktTime: 'èŠ‚æ‹æ—¶é—´',
      throughput: 'åžåé‡',
      yield: 'è‰¯çŽ‡',
      defectRate: 'ç¼ºé™·çŽ‡',
      scrapRate: 'æŠ¥åºŸçŽ‡',
      downtime: 'åœæœºæ—¶é—´',
      plannedMaintenance: 'è®¡åˆ’ç»´æŠ¤',
      unplannedDowntime: 'éžè®¡åˆ’åœæœº',
      changeoverTime: 'æ¢åž‹æ—¶é—´',
      setupTime: 'è®¾ç½®æ—¶é—´'
    },
    units: {
      pieces: 'ä»¶',
      units: 'å•ä½',
      hours: 'å°æ—¶',
      minutes: 'åˆ†é’Ÿ',
      seconds: 'ç§’',
      kilograms: 'åƒå…‹',
      meters: 'ç±³',
      liters: 'å‡',
      percent: '%'
    },
    status: {
      running: 'è¿è¡Œä¸­',
      stopped: 'å·²åœæ­¢',
      maintenance: 'ç»´æŠ¤ä¸­',
      idle: 'ç©ºé—²',
      error: 'é”™è¯¯',
      warning: 'è­¦å‘Š',
      normal: 'æ­£å¸¸',
      critical: 'å±æ€¥'
    },
    actions: {
      start: 'å¼€å§‹',
      stop: 'åœæ­¢',
      pause: 'æš‚åœ',
      resume: 'æ¢å¤',
      reset: 'é‡ç½®',
      save: 'ä¿å­˜',
      cancel: 'å–æ¶ˆ',
      confirm: 'ç¡®è®¤',
      export: 'å¯¼å‡º',
      import: 'å¯¼å…¥',
      refresh: 'åˆ·æ–°',
      analyze: 'åˆ†æž'
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
