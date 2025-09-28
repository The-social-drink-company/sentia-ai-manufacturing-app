class RegionalCalendarService {
  constructor(options = {}) {
    this.config = {
      supportedRegions: options.supportedRegions || ['UK', 'EU', 'USA'],
      cacheExpiry: options.cacheExpiry || 86400000 // 24 hours
    };
    
    this.calendarCache = new Map();
    this.initializeCalendars();
  }

  initializeCalendars() {
    // UK Calendar Events
    this.calendars = {
      UK: {
        holidays: {
          'new_years_day': { date: '2024-01-01', impact: '+40%', type: 'wellness' },
          'dry_january': { period: 'January', impact: '+45%', type: 'wellness' },
          'mental_health_awareness_week': { period: 'May', impact: '+15%', type: 'awareness' },
          'stoptober': { period: 'October', impact: '+25%', type: 'wellness' },
          'christmas': { date: '2024-12-25', impact: '+35%', type: 'holiday' },
          'boxing_day': { date: '2024-12-26', impact: '+20%', type: 'holiday' }
        },
        seasonal_patterns: {
          'spring': { months: [3, 4, 5], impact: '+10%', reason: 'spring_wellness' },
          'autumn': { months: [9, 10, 11], impact: '+20%', reason: 'back_to_work' },
          'winter': { months: [12, 1, 2], impact: '+30%', reason: 'winter_blues' }
        },
        regional_events: {
          'exam_season': { period: 'May-June', impact: '+35%', demographics: 'students' },
          'brexit_uncertainty': { ongoing: true, impact: '+5%', type: 'economic' }
        }
      },
      
      EU: {
        holidays: {
          'new_years_day': { date: '2024-01-01', impact: '+35%', type: 'wellness' },
          'easter': { date: '2024-03-31', impact: '+15%', type: 'holiday' },
          'labour_day': { date: '2024-05-01', impact: '+10%', type: 'holiday' },
          'christmas': { date: '2024-12-25', impact: '+30%', type: 'holiday' }
        },
        seasonal_patterns: {
          'spring': { months: [3, 4, 5], impact: '+12%', reason: 'spring_detox' },
          'summer': { months: [6, 7, 8], impact: '-5%', reason: 'vacation_season' },
          'autumn': { months: [9, 10, 11], impact: '+18%', reason: 'return_from_holidays' }
        },
        regional_events: {
          'oktoberfest': { period: 'September-October', impact: '+15%', region: 'Germany' },
          'wellness_trends': { ongoing: true, impact: '+8%', type: 'cultural' }
        }
      },
      
      USA: {
        holidays: {
          'new_years_day': { date: '2024-01-01', impact: '+50%', type: 'wellness' },
          'martin_luther_king_day': { date: '2024-01-15', impact: '+5%', type: 'holiday' },
          'presidents_day': { date: '2024-02-19', impact: '+5%', type: 'holiday' },
          'memorial_day': { date: '2024-05-27', impact: '+10%', type: 'holiday' },
          'independence_day': { date: '2024-07-04', impact: '+15%', type: 'holiday' },
          'labor_day': { date: '2024-09-02', impact: '+20%', type: 'back_to_work' },
          'thanksgiving': { date: '2024-11-28', impact: '+25%', type: 'holiday' },
          'black_friday': { date: '2024-11-29', impact: '+60%', type: 'shopping' },
          'christmas': { date: '2024-12-25', impact: '+35%', type: 'holiday' }
        },
        seasonal_patterns: {
          'winter': { months: [1, 2, 3], impact: '+25%', reason: 'new_year_resolutions' },
          'spring': { months: [4, 5, 6], impact: '+15%', reason: 'spring_cleaning' },
          'summer': { months: [7, 8], impact: '+5%', reason: 'vacation_mild_boost' },
          'fall': { months: [9, 10, 11], impact: '+30%', reason: 'back_to_routine' }
        },
        regional_events: {
          'college_season': { period: 'August-September', impact: '+40%', demographics: 'students' },
          'wellness_january': { period: 'January', impact: '+55%', type: 'wellness' },
          'tax_season_stress': { period: 'March-April', impact: '+20%', type: 'stress' }
        }
      }
    };
  }

  // Get calendar events for a specific region and date range
  getRegionalEvents(region, startDate, endDate) {
    if (!this.calendars[region]) {
      throw new Error(`Unsupported region: ${region}`);
    }

    const calendar = this.calendars[region];
    const events = [];
    
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Check holidays
    Object.entries(calendar.holidays).forEach(_([eventName, _event]) => {
      if (event.date) {
        const eventDate = new Date(event.date);
        if (eventDate >= start && eventDate <= end) {
          events.push({
            name: eventName,
            date: event.date,
            impact: event.impact,
            type: event.type,
            category: 'holiday'
          });
        }
      } else if (event.period) {
        // Handle period-based events
        events.push({
          name: eventName,
          period: event.period,
          impact: event.impact,
          type: event.type,
          category: 'period'
        });
      }
    });

    // Check seasonal patterns
    Object.entries(calendar.seasonal_patterns).forEach(_([season, _pattern]) => {
      const currentMonth = start.getMonth() + 1;
      if (pattern.months.includes(currentMonth)) {
        events.push({
          name: season,
          impact: pattern.impact,
          reason: pattern.reason,
          category: 'seasonal'
        });
      }
    });

    // Check regional events
    Object.entries(calendar.regional_events).forEach(_([eventName, _event]) => {
      events.push({
        name: eventName,
        period: event.period || 'ongoing',
        impact: event.impact,
        type: event.type || 'regional',
        category: 'regional'
      });
    });

    return events;
  }

  // Calculate seasonal adjustment factors
  calculateSeasonalAdjustments(region, forecastDates) {
    const adjustments = [];
    const calendar = this.calendars[region];

    if (!calendar) {
      return forecastDates.map(() => 1.0); // No adjustment for unknown regions
    }

    forecastDates.forEach(date => {
      const forecastDate = new Date(date);
      const month = forecastDate.getMonth() + 1;
      const dayOfYear = Math.floor((forecastDate - new Date(forecastDate.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
      
      let totalAdjustment = 1.0;
      let activeEvents = [];

      // Check seasonal patterns
      Object.entries(calendar.seasonal_patterns).forEach(_([season, _pattern]) => {
        if (pattern.months.includes(month)) {
          const adjustment = this.parseImpactPercentage(pattern.impact);
          totalAdjustment *= adjustment;
          activeEvents.push({
            name: season,
            impact: pattern.impact,
            type: 'seasonal'
          });
        }
      });

      // Check specific holidays
      Object.entries(calendar.holidays).forEach(_([eventName, _event]) => {
        if (event.date) {
          const eventDate = new Date(event.date);
          const daysDiff = Math.abs((forecastDate - eventDate) / (1000 * 60 * 60 * 24));
          
          // Apply impact for 7 days around the event
          if (daysDiff <= 7) {
            const proximity = 1 - (daysDiff / 7); // Closer = stronger impact
            const adjustment = 1 + (this.parseImpactPercentage(event.impact) - 1) * proximity;
            totalAdjustment *= adjustment;
            activeEvents.push({
              name: eventName,
              impact: event.impact,
              type: 'holiday',
              proximity
            });
          }
        }
      });

      adjustments.push({
        date,
        adjustmentFactor: totalAdjustment,
        activeEvents
      });
    });

    return adjustments;
  }

  // Parse impact percentage strings like "+40%" to multiplier like 1.4
  parseImpactPercentage(impactString) {
    const match = impactString.match(/([+-])(\d+)%/);
    if (!match) return 1.0;
    
    const sign = match[1];
    const percent = parseInt(match[2]);
    
    return sign === '+' ? 1 + (percent / 100) : 1 - (percent / 100);
  }

  // Apply regional adjustments to forecast data
  applyRegionalAdjustments(forecastData, region, forecastStartDate, horizon) {
    if (!this.calendars[region]) {
      return forecastData;
    }

    // Generate forecast dates
    const forecastDates = [];
    const startDate = new Date(forecastStartDate);
    
    for (let i = 0; i < horizon; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      forecastDates.push(date.toISOString().split('T')[0]);
    }

    // Calculate adjustments
    const adjustments = this.calculateSeasonalAdjustments(region, forecastDates);
    
    const adjustedData = {
      ...forecastData,
      forecasts: {},
      predictionIntervals: {},
      metadata: {
        ...forecastData.metadata,
        regionalAdjustments: {
          region,
          adjustmentFactors: adjustments,
          appliedAt: new Date().toISOString()
        }
      }
    };

    // Apply adjustments to forecasts
    Object.entries(forecastData.forecasts).forEach(_([model, _values]) => {
      adjustedData.forecasts[model] = values.map(_(value, _index) => {
        const adjustment = adjustments[index] ? adjustments[index].adjustmentFactor : 1.0;
        return value * adjustment;
      });
    });

    // Apply adjustments to prediction intervals
    Object.entries(forecastData.predictionIntervals).forEach(_([model, _intervals]) => {
      adjustedData.predictionIntervals[model] = {
        ...intervals,
        lower: intervals.lower.map(_(value, _index) => {
          const adjustment = adjustments[index] ? adjustments[index].adjustmentFactor : 1.0;
          return value * adjustment;
        }),
        upper: intervals.upper.map(_(value, _index) => {
          const adjustment = adjustments[index] ? adjustments[index].adjustmentFactor : 1.0;
          return value * adjustment;
        })
      };
    });

    return adjustedData;
  }

  // Get upcoming high-impact events for a region
  getUpcomingHighImpactEvents(region, days = 30) {
    const events = this.getRegionalEvents(
      region,
      new Date(),
      new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    );

    return events
      .filter(event => {
        const impact = this.parseImpactPercentage(event.impact);
        return Math.abs(impact - 1.0) > 0.15; // More than 15% impact
      })
      .sort((a, b) => {
        const impactA = Math.abs(this.parseImpactPercentage(a.impact) - 1.0);
        const impactB = Math.abs(this.parseImpactPercentage(b.impact) - 1.0);
        return impactB - impactA; // Sort by impact magnitude
      });
  }

  // Generate calendar-based insights
  generateCalendarInsights(region, horizon) {
    const highImpactEvents = this.getUpcomingHighImpactEvents(region, horizon);
    const insights = [];

    if (highImpactEvents.length > 0) {
      insights.push({
        type: 'high_impact_events',
        message: `${highImpactEvents.length} high-impact events detected in the next ${horizon} days for ${region}`,
        events: highImpactEvents.slice(0, 3), // Top 3 events
        recommendation: 'Consider these events when interpreting forecast results'
      });
    }

    // Check for seasonal transitions
    const currentMonth = new Date().getMonth() + 1;
    const calendar = this.calendars[region];
    
    if (calendar) {
      Object.entries(calendar.seasonal_patterns).forEach(_([season, _pattern]) => {
        if (pattern.months.includes(currentMonth)) {
          insights.push({
            type: 'seasonal_period',
            message: `Currently in ${season} season for ${region}`,
            impact: pattern.impact,
            reason: pattern.reason,
            recommendation: `Expect ${pattern.impact} impact on baseline demand`
          });
        }
      });
    }

    return insights;
  }

  // Get supported regions
  getSupportedRegions() {
    return Object.keys(this.calendars);
  }

  // Update regional calendar (for dynamic events)
  updateRegionalCalendar(region, events) {
    if (!this.calendars[region]) {
      this.calendars[region] = {
        holidays: {},
        seasonal_patterns: {},
        regional_events: {}
      };
    }

    Object.assign(this.calendars[region].regional_events, events);
  }
}

export default RegionalCalendarService;