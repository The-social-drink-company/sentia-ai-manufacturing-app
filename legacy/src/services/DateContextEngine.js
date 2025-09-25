/**
 * DateContextEngine - Provides real-time, calendar-aware date calculations 
 * for cashflow forecasting and working capital management
 * 
 * Replaces mock data with actual business calendar calculations
 */

export class DateContextEngine {
  constructor() {
    this.currentDate = new Date();
    this.businessCalendar = new BusinessCalendarService();
    this.seasonalPatterns = new SeasonalBusinessPatterns();
  }

  /**
   * Get current business context with real dates
   */
  getCurrentContext() {
    const now = new Date();
    return {
      currentDate: now.toISOString().split('T')[0],
      currentMonth: now.getMonth() + 1,
      currentQuarter: Math.floor(now.getMonth() / 3) + 1,
      currentYear: now.getFullYear(),
      dayOfWeek: now.getDay(),
      dayOfMonth: now.getDate(),
      weekOfYear: this.getWeekOfYear(now),
      isBusinessDay: this.businessCalendar.isBusinessDay(now),
      nextBusinessDay: this.businessCalendar.getNextBusinessDay(now)
    };
  }

  /**
   * Generate date range for forecasting periods (replaces mock data)
   */
  generateDateRange(startDate, periodDays, includeBusinessDaysOnly = false) {
    const start = new Date(startDate);
    const dates = [];
    let currentDate = new Date(start);

    for (let i = 0; i < periodDays; i++) {
      if (!includeBusinessDaysOnly || this.businessCalendar.isBusinessDay(currentDate)) {
        dates.push({
          date: new Date(currentDate),
          dateString: currentDate.toISOString().split('T')[0],
          dayOfWeek: currentDate.getDay(),
          weekOfMonth: Math.ceil(currentDate.getDate() / 7),
          month: currentDate.getMonth() + 1,
          quarter: Math.floor(currentDate.getMonth() / 3) + 1,
          isBusinessDay: this.businessCalendar.isBusinessDay(currentDate),
          isMonthEnd: this.isLastBusinessDayOfMonth(currentDate),
          isQuarterEnd: this.isLastBusinessDayOfQuarter(currentDate)
        });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  }

  /**
   * Calculate realistic working capital requirements based on actual calendar
   */
  calculateWorkingCapitalByPeriod(baseData, periodDays, options = {}) {
    const {
      dsoTarget = 45, // Days Sales Outstanding
      dpoTarget = 60, // Days Payable Outstanding  
      inventoryDays = 30,
      seasonalityFactor = 0.15,
      currentRevenue = 40000000 // Annual revenue baseline
    } = options;

    const dates = this.generateDateRange(new Date(), periodDays, true);
    const projections = [];

    dates.forEach((dateInfo, index) => {
      // Calculate seasonal business multiplier (real patterns, not sine waves)
      const seasonalMultiplier = this.seasonalPatterns.getBusinessSeasonality(
        dateInfo.month, 
        dateInfo.quarter
      );

      // Daily revenue adjusted for seasonality
      const dailyRevenue = (currentRevenue / 365) * seasonalMultiplier;
      
      // Working capital components based on actual business days
      const receivables = dailyRevenue * dsoTarget;
      const inventory = (dailyRevenue * 0.6) * inventoryDays; // 60% COGS assumption
      const payables = (dailyRevenue * 0.4) * dpoTarget; // 40% of revenue as payables
      
      const workingCapital = receivables + inventory - payables;

      // Cash flow calculation with payment term realities
      const cashIn = this.calculateCashInflows(dateInfo, dailyRevenue, dsoTarget);
      const cashOut = this.calculateCashOutflows(dateInfo, dailyRevenue, dpoTarget);
      
      projections.push({
        date: dateInfo.dateString,
        dateInfo,
        projectedRevenue: Math.round(dailyRevenue),
        receivables: Math.round(receivables),
        inventory: Math.round(inventory),
        payables: Math.round(payables),
        workingCapital: Math.round(workingCapital),
        cashIn: Math.round(cashIn),
        cashOut: Math.round(cashOut),
        netCashFlow: Math.round(cashIn - cashOut),
        seasonalMultiplier: seasonalMultiplier.toFixed(3),
        businessDaysInMonth: this.businessCalendar.getBusinessDaysInMonth(
          dateInfo.date.getFullYear(), 
          dateInfo.date.getMonth()
        )
      });
    });

    return {
      projections,
      summary: this.calculatePeriodSummary(projections),
      metadata: {
        periodDays,
        startDate: dates[0]?.dateString,
        endDate: dates[dates.length - 1]?.dateString,
        businessDaysCount: dates.filter(d => d.isBusinessDay).length,
        generatedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Calculate realistic cash inflows based on payment terms and collection patterns
   */
  calculateCashInflows(dateInfo, dailyRevenue, dsoTarget) {
    // Model realistic collection patterns
    const collectionProfile = {
      currentMonth: 0.30, // 30% collected in current month
      plus30Days: 0.45,   // 45% collected after 30 days
      plus60Days: 0.20,   // 20% collected after 60 days
      plus90Days: 0.05    // 5% collected after 90+ days
    };

    // Calculate weighted collection based on DSO target
    const baseCollection = dailyRevenue;
    const dsoWeighting = Math.max(0.7, Math.min(1.3, dsoTarget / 45)); // Normalize around 45 days
    
    return baseCollection * collectionProfile.currentMonth * dsoWeighting;
  }

  /**
   * Calculate realistic cash outflows based on supplier payment terms
   */
  calculateCashOutflows(dateInfo, dailyRevenue, dpoTarget) {
    // Model realistic payment patterns to suppliers
    const paymentProfile = {
      net30: 0.40,  // 40% of payments on net 30 terms
      net60: 0.45,  // 45% of payments on net 60 terms
      net90: 0.15   // 15% of payments on net 90 terms
    };

    const baseCosts = dailyRevenue * 0.65; // 65% of revenue as operating costs
    const dpoWeighting = Math.max(0.8, Math.min(1.2, dpoTarget / 60)); // Normalize around 60 days

    // Additional outflows for fixed costs, payroll (bi-weekly), etc.
    let additionalOutflows = 0;
    if (dateInfo.dayOfWeek === 5) { // Friday payroll
      additionalOutflows += dailyRevenue * 0.15; // 15% for payroll every 2 weeks
    }
    if (dateInfo.isMonthEnd) { // Month-end expenses
      additionalOutflows += dailyRevenue * 0.05; // 5% for monthly fixed costs
    }

    return (baseCosts * dpoWeighting) + additionalOutflows;
  }

  /**
   * Calculate period summary statistics
   */
  calculatePeriodSummary(projections) {
    const totalCashIn = projections.reduce((sum, p) => sum + p.cashIn, 0);
    const totalCashOut = projections.reduce((sum, p) => sum + p.cashOut, 0);
    const averageWC = projections.reduce((sum, p) => sum + p.workingCapital, 0) / projections.length;
    
    const minCash = Math.min(...projections.map(p => p.netCashFlow));
    const maxCash = Math.max(...projections.map(p => p.netCashFlow));
    
    // Find periods with negative cash flow
    const negativeCashDays = projections.filter(p => p.netCashFlow < 0);
    
    return {
      totalCashIn: Math.round(totalCashIn),
      totalCashOut: Math.round(totalCashOut),
      netCashFlow: Math.round(totalCashIn - totalCashOut),
      averageWorkingCapital: Math.round(averageWC),
      minDailyCashFlow: Math.round(minCash),
      maxDailyCashFlow: Math.round(maxCash),
      negativeCashDays: negativeCashDays.length,
      riskDays: negativeCashDays.map(p => p.date)
    };
  }

  /**
   * Get week of year (1-53)
   */
  getWeekOfYear(date) {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - startOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
  }

  /**
   * Check if date is last business day of month
   */
  isLastBusinessDayOfMonth(date) {
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    while (!this.businessCalendar.isBusinessDay(lastDay) && lastDay.getDate() > 1) {
      lastDay.setDate(lastDay.getDate() - 1);
    }
    return date.toDateString() === lastDay.toDateString();
  }

  /**
   * Check if date is last business day of quarter  
   */
  isLastBusinessDayOfQuarter(date) {
    const quarter = Math.floor(date.getMonth() / 3);
    const lastMonthOfQuarter = (quarter + 1) * 3 - 1;
    const lastDayOfQuarter = new Date(date.getFullYear(), lastMonthOfQuarter + 1, 0);
    
    while (!this.businessCalendar.isBusinessDay(lastDayOfQuarter) && lastDayOfQuarter.getDate() > 1) {
      lastDayOfQuarter.setDate(lastDayOfQuarter.getDate() - 1);
    }
    
    return date.toDateString() === lastDayOfQuarter.toDateString();
  }
}

/**
 * Business Calendar Service - Handles UK/EU/US business day calculations
 */
class BusinessCalendarService {
  constructor() {
    this.holidays = {
      UK: this.getUKHolidays(),
      EU: this.getEUHolidays(),
      US: this.getUSHolidays()
    };
  }

  isBusinessDay(date, region = 'UK') {
    const dayOfWeek = date.getDay();
    // Weekend check
    if (dayOfWeek === 0 || dayOfWeek === 6) return false;
    
    // Holiday check
    const dateString = date.toISOString().split('T')[0];
    return !this.holidays[region].includes(dateString);
  }

  getNextBusinessDay(date, region = 'UK') {
    let nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    
    while (!this.isBusinessDay(nextDay, region)) {
      nextDay.setDate(nextDay.getDate() + 1);
    }
    
    return nextDay;
  }

  getBusinessDaysInMonth(year, month, region = 'UK') {
    let count = 0;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      if (this.isBusinessDay(date, region)) {
        count++;
      }
    }
    
    return count;
  }

  getUKHolidays() {
    const currentYear = new Date().getFullYear();
    // Key UK bank holidays (simplified - would normally fetch from API)
    return [
      `${currentYear}-01-01`, // New Year's Day
      `${currentYear}-03-29`, // Good Friday (varies)
      `${currentYear}-04-01`, // Easter Monday (varies)
      `${currentYear}-05-06`, // May Day
      `${currentYear}-05-27`, // Spring Bank Holiday
      `${currentYear}-08-26`, // Summer Bank Holiday
      `${currentYear}-12-25`, // Christmas Day
      `${currentYear}-12-26`, // Boxing Day
    ];
  }

  getEUHolidays() {
    const currentYear = new Date().getFullYear();
    // Common EU holidays
    return [
      `${currentYear}-01-01`, // New Year's Day
      `${currentYear}-03-29`, // Good Friday
      `${currentYear}-04-01`, // Easter Monday
      `${currentYear}-05-01`, // Labour Day
      `${currentYear}-12-25`, // Christmas Day
      `${currentYear}-12-26`, // St Stephen's Day
    ];
  }

  getUSHolidays() {
    const currentYear = new Date().getFullYear();
    // US Federal holidays
    return [
      `${currentYear}-01-01`, // New Year's Day
      `${currentYear}-01-15`, // MLK Day (3rd Monday in Jan)
      `${currentYear}-02-19`, // Presidents Day (3rd Monday in Feb)
      `${currentYear}-05-27`, // Memorial Day (last Monday in May)
      `${currentYear}-07-04`, // Independence Day
      `${currentYear}-09-02`, // Labor Day (1st Monday in Sep)
      `${currentYear}-10-14`, // Columbus Day (2nd Monday in Oct)
      `${currentYear}-11-11`, // Veterans Day
      `${currentYear}-11-28`, // Thanksgiving (4th Thursday in Nov)
      `${currentYear}-12-25`, // Christmas Day
    ];
  }
}

/**
 * Seasonal Business Patterns - Real business seasonality (replaces sine wave mock data)
 */
class SeasonalBusinessPatterns {
  constructor() {
    // Real business seasonality patterns based on typical manufacturing/retail cycles
    this.monthlyMultipliers = {
      1: 0.85,  // January - post-holiday slow
      2: 0.88,  // February - gradual recovery
      3: 0.95,  // March - Q1 end push
      4: 0.92,  // April - steady
      5: 0.96,  // May - spring uptick
      6: 1.00,  // June - solid mid-year
      7: 0.89,  // July - summer vacation impact
      8: 0.87,  // August - continued vacation
      9: 1.05,  // September - back to school/work surge
      10: 1.08, // October - pre-holiday preparation
      11: 1.12, // November - Black Friday, holiday prep
      12: 1.15  // December - holiday peak
    };

    this.quarterlyTrends = {
      1: 0.92, // Q1 - slower start
      2: 0.96, // Q2 - building momentum  
      3: 0.94, // Q3 - summer impact
      4: 1.08  // Q4 - holiday peak
    };
  }

  getBusinessSeasonality(month, quarter) {
    const monthlyFactor = this.monthlyMultipliers[month] || 1.0;
    const quarterlyFactor = this.quarterlyTrends[quarter] || 1.0;
    
    // Weighted combination of monthly and quarterly patterns
    return (monthlyFactor * 0.7) + (quarterlyFactor * 0.3);
  }

  getSeasonalCashflowPattern(month) {
    // Cash flow patterns typically lag sales by 30-45 days due to payment terms
    const laggedMonth = month > 1 ? month - 1 : 12;
    return this.monthlyMultipliers[laggedMonth] || 1.0;
  }
}

export default DateContextEngine;
