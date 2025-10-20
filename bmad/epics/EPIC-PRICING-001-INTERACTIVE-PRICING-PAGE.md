# EPIC-PRICING-001: Interactive Pricing Page with ROI Calculator

**Status**: 🚀 In Progress
**Priority**: High
**Created**: 2025-10-22
**Epic Owner**: BMAD Developer Agent
**Target Completion**: 2025-10-22
**Estimated Time**: 8 hours

---

## 📋 **EPIC OVERVIEW**

Build a high-converting, interactive pricing page for CapLiquify featuring:
- 3-tier pricing cards (Starter, Professional, Enterprise)
- Monthly/annual billing toggle with 17% savings badge
- Interactive ROI calculator modal showing cash freed + time savings
- Feature comparison table (all tiers side-by-side)
- FAQ section with smooth accordion animations
- Testimonials section with social proof
- Multiple CTAs driving to trial signup
- Framer Motion animations for professional UX

**Business Goal**: Increase trial signups by 40% through transparent pricing and ROI demonstration.

---

## 🎯 **BUSINESS OBJECTIVES**

### **Primary Goals**
1. **Convert Visitors to Trials**: Clear pricing → trial signup flow
2. **Demonstrate Value**: ROI calculator shows tangible savings ($$$)
3. **Build Trust**: Testimonials, FAQ, transparent feature comparison
4. **Reduce Friction**: 14-day free trial, no credit card required

### **Success Metrics**
- Trial signup conversion rate: 12%+ (from pricing page visits)
- Time on page: 3+ minutes (engagement with ROI calculator)
- Bounce rate: <40%
- ROI calculator usage: 30%+ of visitors

### **Target Audience**
- **CFOs** - Care about cash freed, ROI percentage, payback period
- **Operations Directors** - Care about time savings, efficiency gains
- **Finance Managers** - Care about forecasting accuracy, automation

---

## 📐 **TECHNICAL SCOPE**

### **Components to Build** (5)

1. **PricingPage.tsx** (Main Component)
   - 3 pricing tier cards with animations
   - Monthly/annual billing toggle
   - Pricing calculation (monthly vs annual)
   - CTA buttons → `/signup?tier={tier}&cycle={cycle}`
   - Integration with pricing.config.ts

2. **ROICalculatorModal.tsx**
   - 5 input fields (revenue, CCC, runway, hours, rate)
   - Real-time calculations:
     - Cash freed (CCC improvement)
     - Additional runway (days)
     - Time savings value ($/year)
     - Total benefit + ROI + payback period
   - Modal overlay with close button
   - CTA → signup with Professional tier pre-selected

3. **FeatureComparisonTable.tsx**
   - 14 features × 3 tiers grid
   - Check/X icons for boolean features
   - Numeric values for limits (users, entities, etc.)
   - Responsive table (horizontal scroll on mobile)

4. **FAQSection.tsx**
   - 8 FAQ items with accordion behavior
   - Smooth expand/collapse animations (Framer Motion)
   - One open at a time (accordion mode)

5. **TestimonialsSection.tsx**
   - 3 testimonial cards
   - Customer photo, name, role, company
   - 5-star rating display
   - Quote with quotation mark icon

### **Dependencies**
- `framer-motion`: ^10.16.0 (animations)
- `lucide-react`: Already installed (icons)
- `react-router-dom`: Already installed (navigation)
- `@/config/pricing.config`: Already exists (EPIC-008)

### **Routes**
- New route: `/pricing` → `<PricingPage />`
- Navigation link in marketing header
- Sitemap update for SEO

---

## 🎨 **USER EXPERIENCE DESIGN**

### **Page Flow**
1. **Hero Section**
   - Headline: "Simple, Transparent Pricing"
   - Subheadline: "14-day free trial, no credit card required"
   - Billing toggle (Monthly/Annual with 17% badge)

2. **Pricing Cards** (Grid of 3)
   - **Starter**: Blue icon (Zap), $149/mo, "Start Free Trial" button
   - **Professional**: Gradient icon (Rocket), $295/mo, "Most Popular" badge, highlighted
   - **Enterprise**: Gold icon (Crown), $595/mo, "Contact Sales" button
   - Each card shows: 10 key features, price, savings (annual)

3. **ROI Calculator CTA**
   - Button: "Calculate Your ROI" (Calculator icon)
   - Opens modal overlay

4. **Feature Comparison Table**
   - Headline: "Compare Plans"
   - Responsive table with sticky header
   - 14 rows × 3 columns

5. **FAQ Section**
   - Headline: "Frequently Asked Questions"
   - 8 common questions (trial, plans, integrations, security, limits, etc.)

6. **Testimonials**
   - Headline: "Trusted by Manufacturing Leaders"
   - 3 testimonial cards (CFO, Operations Director, Finance Manager)

7. **Final CTA**
   - Gradient background (blue to purple)
   - Headline: "Ready to optimize your working capital?"
   - Button: "Start Free Trial"

### **Animations** (Framer Motion)
- **Pricing Cards**: Fade in from bottom, staggered (0.1s delay each)
- **Popular Badge**: Pulse animation
- **ROI Calculator Modal**: Scale + fade in (0.3s)
- **FAQ Accordion**: Height animation (0.3s)
- **Hover Effects**: Card lift on hover (shadow + transform)

### **Mobile Responsiveness**
- **Desktop (1280px+)**: 3-column grid
- **Tablet (768px - 1279px)**: 2-column grid (Enterprise on second row)
- **Mobile (<768px)**: Single column, stack all cards

---

## 🧮 **ROI CALCULATOR LOGIC**

### **Inputs** (5 Fields)
1. **Annual Revenue** ($) - Default: $10,000,000
2. **Current CCC** (days) - Default: 75 (industry avg: 60-90)
3. **Current Cash Runway** (days) - Default: 45
4. **Hours/Week on Forecasting** - Default: 10
5. **Hourly Rate** ($) - Default: $75

### **Calculations**
```javascript
// Constants
const TARGET_CCC = 55; // CapLiquify target (industry best-in-class)
const TIME_SAVINGS_PERCENT = 0.70; // 70% time reduction
const PROFESSIONAL_PLAN_COST = 295 * 12; // $3,540/year

// Cash Freed Calculation
const cccImprovement = currentCCC - TARGET_CCC; // days reduced
const dailyRevenue = annualRevenue / 365;
const cashFreed = dailyRevenue * cccImprovement;

// Additional Runway
const additionalRunway = cashFreed / dailyRevenue; // days added

// Time Savings
const timeSavings = hoursPerWeek * TIME_SAVINGS_PERCENT; // hours/week saved
const timeSavingsValue = timeSavings * hourlyRate * 52; // $/year

// Total Benefit & ROI
const totalAnnualBenefit = cashFreed + timeSavingsValue;
const roi = ((totalAnnualBenefit - PROFESSIONAL_PLAN_COST) / PROFESSIONAL_PLAN_COST) * 100;
const paybackPeriod = PROFESSIONAL_PLAN_COST / (totalAnnualBenefit / 12); // months
```

### **Outputs** (4 Result Cards)
1. **Cash Freed Up** (Green card)
   - Value: $XXX,XXX
   - Description: "By reducing CCC from X to Y days"

2. **Additional Cash Runway** (Blue card)
   - Value: +XX days
   - Description: "From X to Y days"

3. **Time Savings Value** (Purple card)
   - Value: $XX,XXX/year
   - Description: "X.X hours/week saved"

4. **Total Annual Benefit** (Gradient card)
   - Value: $XXX,XXX
   - ROI: XXX%
   - Payback Period: X.X months

---

## 📊 **FEATURE COMPARISON TABLE**

| Feature | Starter | Professional | Enterprise |
|---------|---------|--------------|------------|
| Users | 5 | 25 | 100 |
| Entities | 500 | 5,000 | Unlimited |
| Integrations | 3 | 10 | Unlimited |
| Forecast Horizon | 3 months | 12 months | 24 months |
| Data Retention | 6 months | 24 months | Unlimited |
| What-If Scenarios | ❌ | ✅ | ✅ |
| Inventory Optimization | ❌ | ✅ | ✅ |
| Real-time Updates | ❌ | ✅ | ✅ |
| Priority Support | ❌ | ✅ | ✅ |
| Account Manager | ❌ | ❌ | ✅ |
| White-label | ❌ | ❌ | ✅ |
| API Access | ❌ | ✅ | ✅ |
| SSO & SAML | ❌ | ❌ | ✅ |
| Custom Reporting | ❌ | ❌ | ✅ |

---

## ❓ **FAQ CONTENT**

1. **How does the free trial work?**
   - 14 days full access, no credit card, cancel anytime

2. **Can I change plans later?**
   - Yes, upgrade/downgrade anytime with prorated billing

3. **What integrations do you support?**
   - Xero, QuickBooks, Sage One, Unleashed, Shopify, Amazon SP-API, etc.

4. **Is my data secure?**
   - AES-256 encryption, SOC 2 compliance, regular audits

5. **What happens if I exceed my limits?**
   - Notification before limits, upgrade option, no sudden shutoff

6. **Do you offer discounts for annual billing?**
   - Yes, 17% savings (2+ months free per year)

7. **Can I get a demo before signing up?**
   - Yes, contact us or start free trial

8. **What kind of support do you offer?**
   - Email (all), priority (Pro), dedicated manager (Enterprise)

---

## 💬 **TESTIMONIALS**

### **Sarah Johnson** - CFO, Sentia Spirits
> "CapLiquify reduced our cash conversion cycle from 82 to 51 days. That freed up over $2M in working capital."
- 5-star rating
- Photo: /testimonials/sarah.jpg

### **Michael Chen** - Operations Director, Pacific Manufacturing
> "The AI forecasting is incredibly accurate. We've reduced stockouts by 40% and excess inventory by 35%."
- 5-star rating
- Photo: /testimonials/michael.jpg

### **Emily Rodriguez** - Finance Manager, Artisan Foods Co.
> "What used to take me 10 hours a week now takes 30 minutes. The ROI was immediate."
- 5-star rating
- Photo: /testimonials/emily.jpg

---

## 🔧 **IMPLEMENTATION STORIES**

### **Story 1: BMAD-PRICE-001** - Install Framer Motion
- **Estimate**: 15 minutes
- **Tasks**:
  - Install framer-motion package
  - Verify TypeScript types
  - Test basic animation

### **Story 2: BMAD-PRICE-002** - Create PricingPage Main Component
- **Estimate**: 2 hours
- **Tasks**:
  - Build page layout with sections
  - Implement billing toggle (monthly/annual)
  - Create 3 pricing tier cards
  - Add animations (fade in, stagger)
  - Wire up CTA buttons → signup route
  - Mobile responsive grid

### **Story 3: BMAD-PRICE-003** - Build ROI Calculator Modal
- **Estimate**: 2 hours
- **Tasks**:
  - Create modal overlay component
  - Build 5 input fields with validation
  - Implement calculation logic (6 formulas)
  - Design 4 result cards (Green, Blue, Purple, Gradient)
  - Add close button + backdrop click
  - Animate modal (scale + fade)
  - Wire up CTA → signup with tier preset

### **Story 4: BMAD-PRICE-004** - Feature Comparison Table
- **Estimate**: 1 hour
- **Tasks**:
  - Create responsive table component
  - Map 14 features × 3 tiers
  - Add Check/X icons for booleans
  - Style with alternating row colors
  - Sticky header for scroll

### **Story 5: BMAD-PRICE-005** - FAQ Section with Accordion
- **Estimate**: 1 hour
- **Tasks**:
  - Create accordion component
  - Add 8 FAQ items
  - Implement expand/collapse logic
  - Framer Motion height animation
  - Chevron rotation on toggle

### **Story 6: BMAD-PRICE-006** - Testimonials Section
- **Estimate**: 45 minutes
- **Tasks**:
  - Create testimonial card component
  - Add 3 testimonials (Sarah, Michael, Emily)
  - 5-star rating display
  - Quote icon
  - Placeholder images (will replace with real photos)

### **Story 7: BMAD-PRICE-007** - Routing & Navigation
- **Estimate**: 30 minutes
- **Tasks**:
  - Add /pricing route to App.tsx
  - Add "Pricing" link to marketing nav
  - Update sitemap.xml
  - Test navigation flow

### **Story 8: BMAD-PRICE-008** - Testing & Polish
- **Estimate**: 1 hour
- **Tasks**:
  - Test all animations
  - Verify calculations in ROI calculator
  - Test mobile responsiveness
  - Check accessibility (keyboard nav)
  - Verify all CTAs work
  - Test signup flow with tier preselection

---

## 📦 **DELIVERABLES**

### **New Files** (6)
1. `src/pages/marketing/PricingPage.tsx` (400+ lines)
2. `src/components/pricing/ROICalculatorModal.tsx` (250+ lines)
3. `src/components/pricing/FeatureComparisonTable.tsx` (120+ lines)
4. `src/components/pricing/FAQSection.tsx` (100+ lines)
5. `src/components/pricing/TestimonialsSection.tsx` (80+ lines)
6. `src/components/pricing/index.ts` (exports)

### **Modified Files** (2)
1. `src/App-simple-environment.jsx` (add /pricing route)
2. `package.json` (add framer-motion dependency)

### **Total Lines of Code**: ~1,050 lines

---

## 🧪 **TESTING CHECKLIST**

### **Functional Testing**
- [ ] Billing toggle switches between monthly/annual
- [ ] Prices update correctly based on billing cycle
- [ ] Savings badge shows correct amount
- [ ] All CTA buttons navigate to signup with correct params
- [ ] ROI calculator modal opens/closes
- [ ] Calculator inputs accept numeric values
- [ ] Calculations are accurate (manual verification)
- [ ] FAQ accordion expands/collapses smoothly
- [ ] Only one FAQ open at a time

### **Visual Testing**
- [ ] Pricing cards align properly (grid layout)
- [ ] "Most Popular" badge displays on Professional tier
- [ ] Icons render correctly (Zap, Rocket, Crown)
- [ ] Animations are smooth (60fps)
- [ ] Colors match brand (blue/purple gradient)
- [ ] Feature comparison table scrolls horizontally on mobile
- [ ] Testimonials display properly

### **Responsive Testing**
- [ ] Desktop (1920px): 3-column grid
- [ ] Laptop (1280px): 3-column grid (slightly smaller)
- [ ] Tablet (768px): 2-column grid
- [ ] Mobile (375px): Single column stack
- [ ] All touch targets >= 44x44 pixels

### **Performance Testing**
- [ ] Page loads in <2 seconds
- [ ] Animations don't cause jank
- [ ] Framer Motion bundle size acceptable
- [ ] Images lazy load

### **Accessibility Testing**
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Focus indicators visible
- [ ] ARIA labels on interactive elements
- [ ] Color contrast meets WCAG 2.1 AA
- [ ] Screen reader announces accordion state

---

## 🚀 **DEPLOYMENT PLAN**

1. **Development**
   - Build all components locally
   - Test with `pnpm run dev`
   - Verify routing works

2. **Commit**
   - Create feature branch: `feature/interactive-pricing-page`
   - Commit with BMAD-METHOD co-authorship
   - Push to GitHub

3. **Merge to Main**
   - Create PR with screenshots
   - Review checklist
   - Merge to main

4. **Auto-Deploy**
   - Render auto-deploys from main branch
   - Verify deployment health
   - Test on production URL

---

## 📈 **SUCCESS CRITERIA**

✅ **Completion Criteria**:
- All 6 components built and working
- Framer Motion animations smooth
- ROI calculator calculations accurate
- Mobile responsive (all breakpoints)
- Navigation integrated
- All CTAs functional
- FAQ accordion working
- Feature comparison table complete

✅ **Quality Gates**:
- TypeScript errors: 0
- ESLint warnings: 0
- Lighthouse score: 90+ (Performance, Accessibility, Best Practices)
- Visual review: Approved
- Functional testing: 100% pass

---

## 🔗 **DEPENDENCIES**

### **External**
- framer-motion package (install required)

### **Internal**
- pricing.config.ts (already exists from EPIC-008)
- App-simple-environment.jsx (routing)
- Signup flow (must accept tier/cycle query params)

### **Risks**
- Framer Motion bundle size (mitigation: tree-shake, lazy load)
- Calculator accuracy (mitigation: unit tests for formulas)
- Mobile table scroll (mitigation: horizontal scroll wrapper)

---

## 📝 **DOCUMENTATION**

### **To Create**
1. BMAD-PRICE-001 through BMAD-PRICE-008 story files
2. Testing results document
3. ROI calculator formula documentation
4. Component usage examples

### **To Update**
1. CLAUDE.md (add EPIC-PRICING-001 status)
2. bmad/status/daily-log.md (track progress)
3. README.md (add pricing page section)

---

**Last Updated**: 2025-10-22
**Epic Owner**: BMAD Developer Agent
**Status**: 🚀 In Progress
**Completion**: 0% (0/8 stories)
