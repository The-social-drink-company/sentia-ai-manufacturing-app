# Seasonal Patterns & Regional Calendar - Business Requirements

## Overview

This document defines the seasonal patterns, regional calendar events, and holiday mappings that influence demand forecasting across UK, EU, and USA markets for Sentia's GABA tea products.

## Product Seasonality

### GABA Tea Consumption Patterns

#### Primary Seasonality Drivers
1. **Wellness Trends**: Q1 health resolutions, post-holiday detox
2. **Weather Patterns**: Warm tea consumption in cold months
3. **Stress Cycles**: Back-to-school, holiday seasons, tax periods
4. **Gift Giving**: Holiday seasons, Mother's Day, wellness-focused gifting

#### Seasonal Intensity by Quarter
```
Q1 (Jan-Mar): 120% of baseline (New Year wellness, winter consumption)
Q2 (Apr-Jun): 95% of baseline (Spring transition, lower warm beverage demand)
Q3 (Jul-Sep): 85% of baseline (Summer low, back-to-school preparation)
Q4 (Oct-Dec): 135% of baseline (Holiday gifting, stress management, winter onset)
```

### Weekly Patterns
```
Monday:    110% (week start stress)
Tuesday:   105% (workweek momentum) 
Wednesday: 100% (baseline)
Thursday:  95% (mid-week dip)
Friday:    90% (weekend anticipation)
Saturday:  85% (leisure day)
Sunday:    115% (Sunday scaries, prep for week)
```

### Daily Patterns (Hours - UTC)
```
06:00-09:00: 35% (morning routine)
09:00-12:00: 25% (mid-morning focus)
12:00-15:00: 15% (lunch break)
15:00-18:00: 20% (afternoon stress)
18:00-22:00: 25% (evening wind-down)
22:00-06:00: 5% (late night/early morning)
```

## Regional Calendar Events

### United Kingdom

#### National Holidays & Observances
```javascript
const ukHolidays = {
  // Fixed Holidays
  'new_years_day': { date: 'Jan 1', impact: 'high', pattern: 'pre_spike_post_dip' },
  'christmas_day': { date: 'Dec 25', impact: 'high', pattern: 'gift_spike' },
  'boxing_day': { date: 'Dec 26', impact: 'medium', pattern: 'post_holiday_continuation' },
  
  // Variable Holidays (calculated annually)
  'good_friday': { calculation: 'easter_based', impact: 'medium', pattern: 'long_weekend_prep' },
  'easter_monday': { calculation: 'easter_based', impact: 'medium', pattern: 'long_weekend_recovery' },
  'early_may_bank_holiday': { date: 'First Mon in May', impact: 'medium', pattern: 'spring_break' },
  'spring_bank_holiday': { date: 'Last Mon in May', impact: 'medium', pattern: 'half_term_prep' },
  'summer_bank_holiday': { date: 'Last Mon in Aug', impact: 'medium', pattern: 'summer_end' },
  
  // Seasonal Events
  'mothers_day': { date: 'Fourth Sun of Lent', impact: 'high', pattern: 'gift_focused' },
  'fathers_day': { date: 'Third Sun in Jun', impact: 'medium', pattern: 'wellness_gift' },
  'back_to_school': { date: 'Early Sep', impact: 'high', pattern: 'routine_establishment' },
  
  // Cultural Events
  'london_marathon': { date: 'Late Apr', impact: 'low', pattern: 'fitness_awareness' },
  'wimbledon': { date: 'Late Jun-Early Jul', impact: 'low', pattern: 'summer_entertaining' },
  'edinburgh_festival': { date: 'Aug', impact: 'low', pattern: 'cultural_engagement' }
};
```

#### UK-Specific Demand Drivers
- **Dry January**: +40% demand in January (wellness resolution)
- **Mental Health Awareness Week**: +15% demand in May
- **Stoptober**: +25% demand in October (quit smoking support)
- **Winter Wellness**: +20% demand Nov-Feb (seasonal affective support)

### European Union

#### Major EU Holiday Patterns
```javascript
const euHolidays = {
  // Pan-European Holidays
  'new_years_day': { date: 'Jan 1', impact: 'high', coverage: 'all_eu' },
  'epiphany': { date: 'Jan 6', impact: 'medium', coverage: 'catholic_countries' },
  'good_friday': { calculation: 'easter_based', impact: 'high', coverage: 'protestant_countries' },
  'easter_monday': { calculation: 'easter_based', impact: 'high', coverage: 'most_eu' },
  'labour_day': { date: 'May 1', impact: 'medium', coverage: 'all_eu' },
  'ascension_day': { calculation: 'easter_plus_39', impact: 'medium', coverage: 'catholic_countries' },
  'whit_monday': { calculation: 'easter_plus_50', impact: 'medium', coverage: 'many_eu' },
  'assumption': { date: 'Aug 15', impact: 'medium', coverage: 'catholic_countries' },
  'all_saints': { date: 'Nov 1', impact: 'medium', coverage: 'catholic_countries' },
  'christmas_day': { date: 'Dec 25', impact: 'high', coverage: 'all_eu' },
  'st_stephens_day': { date: 'Dec 26', impact: 'medium', coverage: 'many_eu' },
  
  // Country-Specific Major Holidays
  'german_unity_day': { date: 'Oct 3', impact: 'medium', coverage: 'germany' },
  'bastille_day': { date: 'Jul 14', impact: 'medium', coverage: 'france' },
  'liberation_day_nl': { date: 'May 5', impact: 'medium', coverage: 'netherlands' },
  'national_day_belgium': { date: 'Jul 21', impact: 'medium', coverage: 'belgium' },
  'spanish_national_day': { date: 'Oct 12', impact: 'medium', coverage: 'spain' },
  'italian_republic_day': { date: 'Jun 2', impact: 'medium', coverage: 'italy' }
};
```

#### EU Seasonal Considerations
- **Summer Holidays**: Major impact Jul-Aug (reduced office consumption, increased travel)
- **Oktoberfest**: Sep-Oct wellness interest in Germany/Austria
- **Christmas Markets**: Nov-Dec gift purchasing across DACH region
- **Carnival/Mardi Gras**: Pre-Lent wellness preparation (varies by country)
- **European Wellness Month**: April - coordinated health campaigns

### United States

#### US Federal & Cultural Holidays
```javascript
const usHolidays = {
  // Federal Holidays
  'new_years_day': { date: 'Jan 1', impact: 'high', pattern: 'resolution_spike' },
  'martin_luther_king_day': { date: 'Third Mon in Jan', impact: 'low', pattern: 'long_weekend' },
  'presidents_day': { date: 'Third Mon in Feb', impact: 'low', pattern: 'long_weekend' },
  'memorial_day': { date: 'Last Mon in May', impact: 'medium', pattern: 'summer_kickoff' },
  'independence_day': { date: 'Jul 4', impact: 'medium', pattern: 'patriotic_celebration' },
  'labor_day': { date: 'First Mon in Sep', impact: 'medium', pattern: 'back_to_routine' },
  'columbus_day': { date: 'Second Mon in Oct', impact: 'low', pattern: 'regional_variation' },
  'veterans_day': { date: 'Nov 11', impact: 'low', pattern: 'remembrance' },
  'thanksgiving': { date: 'Fourth Thu in Nov', impact: 'high', pattern: 'gratitude_family' },
  'christmas_day': { date: 'Dec 25', impact: 'high', pattern: 'major_gift_holiday' },
  
  // Major Cultural Events
  'super_bowl_sunday': { date: 'First Sun in Feb', impact: 'medium', pattern: 'stress_food_pairing' },
  'valentines_day': { date: 'Feb 14', impact: 'medium', pattern: 'wellness_gift' },
  'mothers_day': { date: 'Second Sun in May', impact: 'high', pattern: 'pampering_gift' },
  'fathers_day': { date: 'Third Sun in Jun', impact: 'medium', pattern: 'health_focused_gift' },
  'back_to_school': { date: 'Late Aug-Early Sep', impact: 'high', pattern: 'routine_stress_mgmt' },
  'halloween': { date: 'Oct 31', impact: 'low', pattern: 'sugar_balance_prep' },
  
  // Shopping Events
  'black_friday': { date: 'Day after Thanksgiving', impact: 'very_high', pattern: 'major_shopping' },
  'cyber_monday': { date: 'Mon after Thanksgiving', impact: 'high', pattern: 'online_shopping' },
  'amazon_prime_day': { date: 'Mid Jul (varies)', impact: 'high', pattern: 'deal_shopping' },
  'singles_day': { date: 'Nov 11', impact: 'medium', pattern: 'self_care_shopping' },
  
  // Health & Wellness Events
  'national_stress_awareness_month': { date: 'April', impact: 'high', pattern: 'month_long_awareness' },
  'mental_health_awareness_month': { date: 'May', impact: 'high', pattern: 'month_long_awareness' },
  'world_meditation_day': { date: 'May 21', impact: 'medium', pattern: 'mindfulness_focus' },
  'national_tea_day': { date: 'Various dates', impact: 'medium', pattern: 'category_celebration' }
};
```

#### US Regional Variations
- **West Coast**: Higher wellness awareness, earlier trend adoption
- **East Coast**: Business stress patterns, commuter consumption
- **Southwest**: Heat-sensitive consumption patterns
- **Midwest**: Traditional seasonal patterns, comfort-focused
- **South**: Year-round warm weather affecting hot tea consumption

## E-commerce Platform Seasonality

### Amazon-Specific Patterns
- **Prime Day** (July): 200-300% spike in wellness categories
- **Back-to-School** (August): 150% increase in routine/productivity products
- **Black Friday/Cyber Monday**: 400-500% spike in gift categories
- **January Resolution Rush**: 250% increase in wellness products
- **Subscribe & Save Promotions**: Monthly recurring spikes

### Direct-to-Consumer Patterns
- **Email Campaign Cycles**: Bi-weekly promotional lifts
- **Subscription Renewals**: Monthly recurring patterns
- **Influencer Collaborations**: Irregular but significant spikes
- **Seasonal Product Launches**: Q4 gift sets, Q1 detox variants

## Weather Impact Correlations

### Temperature Sensitivity
```javascript
const temperatureImpact = {
  'very_cold': { temp_range: '<0°C', demand_multiplier: 1.4, note: 'Comfort seeking' },
  'cold': { temp_range: '0-10°C', demand_multiplier: 1.2, note: 'Warm beverage preference' },
  'cool': { temp_range: '10-20°C', demand_multiplier: 1.0, note: 'Baseline consumption' },
  'warm': { temp_range: '20-30°C', demand_multiplier: 0.8, note: 'Reduced hot beverage appeal' },
  'hot': { temp_range: '>30°C', demand_multiplier: 0.6, note: 'Summer consumption low' }
};
```

### Precipitation Impact
- **Rainy Days**: +15% (comfort seeking behavior)
- **Snow Days**: +25% (staying home, warm beverages)
- **Sunny Weather**: -10% (outdoor activity preference)

### Seasonal Affective Patterns
- **Daylight Hours < 8**: +20% demand (mood support)
- **Winter Solstice Period**: +30% demand (peak seasonal impact)
- **Spring Equinox**: -15% demand (energy transition)

## Business Calendar Integration

### Financial Calendar Events
```javascript
const businessCalendarEvents = {
  // Quarter-end stress periods
  'q1_close': { date: 'Mar 31', impact: 'medium', pattern: 'work_stress' },
  'q2_close': { date: 'Jun 30', impact: 'medium', pattern: 'work_stress' },
  'q3_close': { date: 'Sep 30', impact: 'medium', pattern: 'work_stress' },
  'q4_close': { date: 'Dec 31', impact: 'high', pattern: 'year_end_stress' },
  
  // Tax periods
  'us_tax_deadline': { date: 'Apr 15', impact: 'high', pattern: 'financial_stress' },
  'uk_self_assessment': { date: 'Jan 31', impact: 'high', pattern: 'deadline_stress' },
  'eu_vat_quarters': { date: 'Quarterly', impact: 'medium', pattern: 'business_stress' },
  
  // Academic calendar
  'university_exams': { date: 'May & Dec', impact: 'medium', pattern: 'student_stress' },
  'graduation_season': { date: 'May-Jun', impact: 'low', pattern: 'celebration_gifts' },
  'new_academic_year': { date: 'Aug-Sep', impact: 'medium', pattern: 'routine_establishment' }
};
```

## Promotional Calendar

### Recurring Promotional Patterns
```javascript
const promotionalCalendar = {
  // Monthly patterns
  'month_start': { days: [1, 2, 3], impact: 'medium', reason: 'Fresh start mentality' },
  'mid_month': { days: [15, 16], impact: 'low', reason: 'Payday timing' },
  'month_end': { days: [28, 29, 30, 31], impact: 'medium', reason: 'Goal completion' },
  
  // Weekly patterns  
  'monday_motivation': { impact: 'medium', reason: 'Week start wellness focus' },
  'wednesday_hump_day': { impact: 'low', reason: 'Mid-week energy support' },
  'sunday_prep': { impact: 'medium', reason: 'Week preparation rituals' },
  
  // Seasonal promotions
  'new_year_detox': { period: 'Jan 1-31', impact: 'very_high' },
  'spring_cleanse': { period: 'Mar 1-Apr 15', impact: 'high' },
  'summer_wellness': { period: 'Jun 1-Aug 31', impact: 'medium' },
  'back_to_routine': { period: 'Aug 15-Sep 30', impact: 'high' },
  'holiday_gifting': { period: 'Nov 1-Dec 31', impact: 'very_high' },
  
  // Event-driven promotions
  'stress_awareness_campaigns': { timing: 'Apr', impact: 'high' },
  'world_tea_day': { date: 'May 21', impact: 'medium' },
  'international_tea_day': { date: 'Dec 15', impact: 'medium' },
  'wellness_wednesday_campaigns': { frequency: 'weekly', impact: 'low' }
};
```

## Data Integration Requirements

### External Data Sources
1. **Weather APIs**: Daily temperature, precipitation, daylight hours
2. **Economic Calendars**: Business days, market closures, earnings seasons
3. **Social Media**: Wellness trend indicators, influencer campaigns
4. **Google Trends**: Search volume for stress, tea, wellness keywords
5. **E-commerce Events**: Platform-specific promotional calendars

### Feature Engineering Pipeline
```javascript
const seasonalFeatureEngineeringPipeline = {
  // Calendar features
  day_of_week: 'categorical',
  week_of_month: 'ordinal',
  month_of_year: 'cyclical_encoding',
  quarter: 'categorical',
  
  // Holiday proximity
  days_to_next_major_holiday: 'continuous',
  days_since_last_major_holiday: 'continuous',
  is_holiday_week: 'boolean',
  is_long_weekend: 'boolean',
  
  // Seasonal indicators
  is_peak_season: 'boolean', // Q1, Q4
  is_low_season: 'boolean',  // Q2, Q3
  seasonal_intensity: 'continuous', // 0.85 - 1.35
  
  // Weather features
  temperature_band: 'categorical',
  precipitation_indicator: 'boolean',
  daylight_hours: 'continuous',
  seasonal_affective_risk: 'continuous',
  
  // Business calendar
  is_quarter_end: 'boolean',
  is_tax_season: 'boolean',
  is_exam_period: 'boolean',
  
  // Promotional context
  promotion_intensity: 'continuous', // 0.0 - 2.0
  competitor_promotional_activity: 'continuous',
  seasonal_messaging_active: 'boolean'
};
```

## Regional Adaptation Requirements

### UK Market Specifics
- **Mental Health Focus**: Higher sensitivity to stress awareness campaigns
- **Tea Culture**: Stronger baseline tea consumption, cultural integration
- **Wellness Timing**: Earlier adoption of wellness trends vs. other markets
- **Seasonal Intensity**: More pronounced winter consumption patterns

### EU Market Variations
- **Regulatory Compliance**: Health claim restrictions affect messaging
- **Cultural Diversity**: Country-specific holiday and cultural patterns
- **Language Localization**: Campaign timing varies by linguistic regions
- **Economic Cycles**: Different business calendar impacts by country

### US Market Characteristics
- **Size and Scale**: Larger market with more pronounced seasonal swings
- **Regional Diversity**: Significant climate and cultural variations
- **E-commerce Dominance**: Higher sensitivity to platform promotional events
- **Wellness Trends**: Trend-driven market with rapid adoption cycles

## Forecasting Model Integration

### Seasonal Component Modeling
```javascript
const seasonalComponentsIntegration = {
  // Multiple seasonality handling
  weekly_seasonality: { period: 7, fourier_terms: 3 },
  monthly_seasonality: { period: 30.44, fourier_terms: 5 },
  quarterly_seasonality: { period: 91.31, fourier_terms: 4 },
  annual_seasonality: { period: 365.25, fourier_terms: 10 },
  
  // Holiday effects
  holiday_impact_window: { before: 7, after: 3 }, // Days
  holiday_carryover: true, // Model post-holiday effects
  regional_holiday_sets: ['uk', 'eu', 'us'],
  
  // External regressor integration
  weather_lag: 1, // Weather impact next day
  promotion_lead: 3, // Promotion announcement effect
  trend_adoption_lag: 14, // Social trend impact delay
  
  // Model validation
  seasonal_decomposition_validation: true,
  holiday_effect_significance_testing: true,
  regional_pattern_consistency_checks: true
};
```

This seasonal patterns framework provides the foundation for accurate demand forecasting that accounts for the complex interplay of cultural, economic, and environmental factors affecting GABA tea demand across different regions.