# Sentia Enterprise Dashboard – Design Specification

## Visual Identity
- **Primary Gradient**: `from-[#111827] via-[#1E293B] to-[#0F172A]`
- **Accent Gradient**: `from-[#3B82F6] to-[#22D3EE]`
- **Surface Colors**: 
  - Dark surface: `#0F172A`
  - Card surface: `rgba(255,255,255,0.04)` on dark backgrounds
  - Light surface: `#FFFFFF`
- **Neutral Palette**:
  - Slate 900, Slate 300, Slate 500 (Tailwind slate scale)
- **Typography**:
  - Display/Headings: `font-semibold`, tracking-tight
  - Body: `font-normal`, `text-slate-300` on dark, `text-slate-600` on light
- **Iconography**: Use `lucide-react` icons, accent color `#38BDF8` for active states.

## Layout Overview
1. **Landing Experience**
   - Full viewport gradient hero with centered content.
   - Nav bar (logo + CTA buttons).
   - Key benefits cards beneath hero.
2. **Authentication**
   - Two-column layout: left gradient hero, right contains Clerk `<SignIn>` / `<SignUp>`.
   - Add headline and bullet list of benefits beside form.
3. **Application Shell**
   - Left sidebar width `280px`, gradient background `bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950`.
   - Top navigation bar: translucent card overlay with breadcrumb + user actions.
   - Main content uses `max-w-6xl` width, centered.
   - Floating chatbot button bottom-right with gradient background and drop shadow; expands into modal panel.
4. **Dashboard Sections**
   - Executive, Working Capital, Production, Analytics pages share consistent card grid.
   - KPI cards: 4-up grid, each with icon, label, main value, delta badge.
   - Charts: use Recharts area/line combos with gradient fills.
   - Tables: rounded corners, subtle borders, zebra striping.

## Component Guidelines
- **Sidebar Navigation**
  - Sections separated by subtle dividers.
  - Active item: highlight with gradient pill background and glowing border.
  - Icons placed inside 36px circle with accent gradient.
- **Buttons**
  - Primary: gradient background `from-[#3B82F6] to-[#22D3EE]`, white text, shadow.
  - Secondary: translucent outline `border-white/20`, `hover:bg-white/10`.
- **Badges**
  - Status badges follow semantic colors (success `emerald`, warning `amber`, danger `rose`).
- **Chat Widget**
  - Floating action button 64x64 with chatbot icon.
  - When open, pane 360x420, dark surface, message bubbles with gradient outlines.
- **Metrics**
  - Use consistent format `text-emerald-400` for positive deltas, `text-rose-400` for negative.

## Page-Specific Layouts
### 1. Landing Page
- Hero: headline, supporting copy, CTA buttons.
- Feature cards: icon + title + copy.
- Social proof row (avatars or logos placeholders).

### 2. Dashboard (Executive)
- KPI row (4 cards) + revenue chart + pipeline chart + product table.
- Quick action cards with gradient background.

### 3. Working Capital
- KPI row: Cash on hand, DSO, DPO, DIO.
- Cash forecast chart + liquidity actions list.
- Receivables/payables table.

### 4. Production
- Throughput chart, OEE chart, downtime log (matching earlier implementation).

### 5. Analytics
- Already defined with revenue mix, pipeline, retention.

### 6. Chatbot Experience
- Floating button at bottom-right.
- Modal with conversation history, quick suggestions, input box.

## Responsive Behavior
- Mobile: sidebar collapses into top nav with menu button.
- Chart containers shrink to full width, stacked layout.
- Chat widget hides on screens `<768px` (optional toggle in header).

## Animation & Interaction
- Sidebar items animate `translate-x` on hover.
- Modal chat appears with scale + fade using `framer-motion` or simple CSS transitions.
- Buttons have subtle scale transform on hover.

## Assets Needed
- No external assets required; use Tailwind gradients and lucide icons.
- Avatar placeholders can be circles with initials.

## Accessibility
- Ensure contrast ratio: text on dark surfaces >= 4.5:1.
- Provide `aria-label` for chat toggle and nav toggles.
- Use `focus-visible` Tailwind utilities for keyboard navigation.

