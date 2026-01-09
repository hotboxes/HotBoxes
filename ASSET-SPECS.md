# 🎨 HotBoxes Asset Generation Specifications

**Status:** Redesign Complete - Ready for Asset Generation
**Date:** January 9, 2026

---

## 🎯 Overview

The HotBoxes platform has been completely redesigned with a bold, energetic "Stadium Energy Meets Vegas Excitement" theme. This document specifies exactly what visual assets you need to generate to replace the current placeholders.

---

## 🎨 Brand Color Palette (Reference for Assets)

Use these colors when generating assets:

- **Primary Orange:** `#FF4500` / `#FF6B35` (gradients)
- **Navy/Midnight:** `#0A1128` / `#1E3A8A` (dark backgrounds)
- **Neon Green:** `#39FF14` / `#00FF41` (accents, winning indicators)
- **Gold:** `#FFD700` / `#FFA500` (prizes, premium elements)

---

## 📋 Asset Priority List

### 🔥 HIGH PRIORITY (Phase 1)

#### 1. **Hero Section Background Video/Animation**
**Location:** Homepage hero section (src/app/page.tsx:21)
**Current State:** Animated gradient placeholder with floating elements

**Specifications:**
- **Format:** MP4 (H.264) and WebM (VP9) for browser compatibility
- **Resolution:** 1920x1080 (Full HD)
- **Duration:** 10-15 seconds, seamless loop
- **File Size:** <5MB (optimized for web)
- **Aspect Ratio:** 16:9

**Style Guidelines:**
- **Theme:** Stadium atmosphere OR abstract sports energy
- **Mood:** Dark, energetic, exciting (not distracting)
- **Elements to Include:**
  - Subtle motion (crowd particles, light sweeps, energy waves)
  - Dark background (navy/midnight blues)
  - Accent colors: orange flames, neon green highlights
  - Optional: Abstract football/basketball elements (no copyrighted logos!)

**Examples of What Works:**
- Slow-motion abstract crowd celebration
- Particle effects resembling confetti or energy
- Stadium lights sweeping across frame
- Animated grid pattern with glowing numbers
- Abstract score digits morphing/floating

**What to Avoid:**
- Copyrighted team logos or branding
- Actual game footage (licensing issues)
- Too much motion (should be atmospheric, not jarring)
- Bright, distracting elements that compete with text

---

#### 2. **HotBoxes Logo**
**Location:** Navigation bar (src/components/Navigation.tsx:105-112)
**Current State:** Text-based placeholder with orange "H" icon

**Specifications:**
- **Format:** PNG with transparency (and SVG if possible)
- **Sizes Needed:**
  - Logo (full): 200x60px
  - Logo (mobile): 150x45px
  - Favicon: 32x32px, 16x16px
  - App Icon: 512x512px

**Design Guidelines:**
- **Must Include:** The word "HOTBOXES" or "HOT BOXES"
- **Style:** Bold, sporty, uppercase typography
- **Visual Element:** Incorporate flames/heat OR grid pattern
- **Colors:** Orange (#FF4500) and white primarily
- **Must Work On:** Dark backgrounds AND light backgrounds

**Design Concepts:**
- Flame coming off the "O" in HOT
- Grid pattern integrated into letters
- Stacked design: "HOT" on top, "BOXES" below
- Typography: Bold, condensed, sports-inspired (think ESPN/NFL.com)

---

#### 3. **HotCoin Icon**
**Location:** Navigation balance badge, throughout UI
**Current State:** Circular badge with "HC" text

**Specifications:**
- **Format:** PNG with transparency
- **Sizes Needed:**
  - Large: 128x128px
  - Medium: 64x64px
  - Small: 32x32px
  - Tiny: 16x16px

**Design Guidelines:**
- **Style:** Poker chip inspired OR coin with flames
- **Must Include:** Some indicator of "heat" (flames, glow, etc.)
- **Colors:** Gold (#FFD700 / #FFA500) base with orange accents
- **Optional:** "HC" monogram or flame symbol in center

**Design Concepts:**
- Poker chip with flame icon
  - Gold circular coin with flame coming off top
- Casino token with "HC" embossed
- Glowing coin with heat waves

---

### 📊 MEDIUM PRIORITY (Phase 2)

#### 4. **Game Card Background Images (6-8 variants)**
**Location:** Games listing page (src/app/games/page.tsx)
**Current State:** Solid gradient backgrounds

**Specifications:**
- **Format:** JPG or WebP (optimized)
- **Resolution:** 800x600px (4:3 ratio)
- **File Size:** <200KB each
- **Quantity:** 6-8 different variants

**Variants Needed:**
- 3-4 NFL/Football themed backgrounds
- 3-4 NBA/Basketball themed backgrounds

**Style Guidelines:**
- **Theme:** Abstract sports action OR stadium atmosphere
- **Mood:** Dynamic, energetic, premium
- **Colors:** Mix of orange, navy, green accents
- **Overlay Friendly:** Must work with semi-transparent card overlays

**Content Ideas - NFL:**
- Abstract football action (running, tackling) - silhouettes or artistic style
- Stadium crowd energy (bokeh lights, abstract figures)
- Football field texture with yard lines
- Generic huddle or celebration scene

**Content Ideas - NBA:**
- Abstract basketball action (dunking, shooting) - silhouettes or artistic style
- Arena lights and crowd energy
- Basketball court hardwood texture
- Generic team celebration scene

**Important:** NO copyrighted logos, real teams, or identifiable players!

---

#### 5. **Grid Background Texture**
**Location:** Grid component (src/components/Grid.tsx:309)
**Current State:** CSS grid pattern

**Specifications:**
- **Format:** PNG with transparency OR seamless pattern
- **Resolution:** 1000x1000px (tileable)
- **File Size:** <100KB
- **Style:** Subtle, non-distracting

**Design Guidelines:**
- **Theme:** Stadium scoreboard OR field/court texture
- **Must Be:** Very subtle, low opacity suitable texture
- **Colors:** Dark with orange/green accents
- **Pattern Type:** Repeating/seamless

**Concepts:**
- Digital scoreboard grid pattern
- Stadium seat texture (very subtle)
- Football field grass pattern (abstract, dark)
- Basketball court wood grain (dark, stylized)

---

#### 6. **Achievement Badge Icons (6 variants)**
**Location:** Player dashboard achievements
**Current State:** Generic SVG icons

**Specifications:**
- **Format:** PNG with transparency
- **Resolution:** 128x128px
- **File Size:** <50KB each
- **Quantity:** 6 badge types

**Badge Types Needed:**
1. **First Timer** - Beginner badge (bronze/silver tones)
2. **Winner** - Trophy or star (gold)
3. **High Roller** - Premium player (platinum/diamond)
4. **Lucky Streak** - Hot streak indicator (flames/fire)
5. **Perfect Score** - Rare achievement (rainbow/prismatic)
6. **Legend** - Top-tier status (legendary glow effect)

**Style Guidelines:**
- **Theme:** Gaming achievements meets sports trophies
- **Must Include:** Iconography + subtle glow/effects
- **Colors:** Match HotBoxes brand (orange, gold, green)

---

### 🎁 LOW PRIORITY (Phase 3 - Nice to Have)

#### 7. **Background Patterns (3 variants)**
**Specifications:**
- **Format:** PNG with transparency, seamless/tileable
- **Resolution:** 500x500px
- **File Size:** <50KB each

**Variants:**
- Football field grid pattern (yard lines)
- Basketball court lines pattern
- Stadium seat texture pattern

---

#### 8. **Confetti/Particle Effect Sprites**
**Specifications:**
- **Format:** PNG sequence OR sprite sheet
- **Resolution:** Individual particles 50x50px
- **File Size:** <1MB total
- **Use Case:** Winner celebrations, big wins

**Design:**
- Orange and gold confetti pieces
- Star burst effects
- Coin/HotCoin particles falling
- Number digit animations

---

## 📁 File Organization

When you generate assets, organize them as follows:

```
/public/
├── images/
│   ├── logo/
│   │   ├── hotboxes-logo-full.png
│   │   ├── hotboxes-logo-mobile.png
│   │   └── hotboxes-logo.svg
│   ├── icons/
│   │   ├── hotcoin-128.png
│   │   ├── hotcoin-64.png
│   │   ├── hotcoin-32.png
│   │   └── hotcoin-16.png
│   ├── backgrounds/
│   │   ├── hero-video.mp4
│   │   ├── hero-video.webm
│   │   ├── game-card-nfl-1.jpg
│   │   ├── game-card-nfl-2.jpg
│   │   ├── game-card-nfl-3.jpg
│   │   ├── game-card-nba-1.jpg
│   │   ├── game-card-nba-2.jpg
│   │   └── game-card-nba-3.jpg
│   ├── textures/
│   │   ├── grid-background.png
│   │   ├── field-pattern.png
│   │   └── court-pattern.png
│   └── badges/
│       ├── badge-first-timer.png
│       ├── badge-winner.png
│       ├── badge-high-roller.png
│       ├── badge-lucky-streak.png
│       ├── badge-perfect-score.png
│       └── badge-legend.png
```

---

## 🚀 Implementation Process

### When Assets Are Ready:

1. **Send me the files** (via upload or shared link)
2. **I'll update the code** to replace placeholders (~30 minutes)
3. **We test together** to ensure everything looks perfect
4. **We iterate** on any assets that need tweaking

### Placeholders Currently in Code:

- ✅ Hero video background → Animated gradient (working placeholder)
- ✅ Logo → Text-based logo (working placeholder)
- ✅ HotCoin icon → "HC" badge (working placeholder)
- ✅ Game cards → Gradient backgrounds (working placeholder)
- ✅ Grid texture → CSS pattern (working placeholder)

**You can work on these in any order** - I can swap them individually as you finish!

---

## 📐 Design Principles

When generating assets, keep these principles in mind:

### ✅ DO:
- Use bold, high-contrast visuals
- Incorporate brand colors (orange, navy, neon green, gold)
- Make it feel premium and exciting
- Use gradients and glows
- Think "stadium energy" and "Vegas excitement"
- Keep it ownable and unique

### ❌ DON'T:
- Use copyrighted team logos or real players
- Make it look like a generic SaaS product
- Use pastel or muted colors
- Copy other gaming sites exactly
- Make backgrounds too busy (text must be readable)

---

## 🎨 AI Generation Prompts (Starting Points)

### For Hero Video:
```
"Cinematic dark stadium atmosphere with abstract energy particles, navy blue and orange color scheme, slow motion crowd celebration bokeh lights, mysterious and exciting mood, 4K quality, seamless loop, no identifiable people or logos"
```

### For Logo:
```
"Bold modern sports logo design, text 'HOTBOXES', orange flames integrated into letters, dark background, professional esports style, uppercase typography, aggressive and energetic feel"
```

### For HotCoin Icon:
```
"Gold poker chip icon with flame symbol, casino token design, orange and gold gradient, glowing effect, premium currency icon, clean and simple, transparent background"
```

### For Game Cards (NFL):
```
"Abstract NFL football action silhouette, dark stadium atmosphere, orange and navy blue colors, dynamic motion blur, no logos or real players, artistic and energetic mood, premium sports graphics"
```

### For Game Cards (NBA):
```
"Abstract basketball player dunking silhouette, dark arena with neon lights, orange and green accent colors, no logos or real players, artistic and dynamic, premium sports graphics"
```

---

## ✨ Summary

**Total Assets Needed:** 20-25 files
**Estimated Time to Integrate:** 30-60 minutes once assets are ready
**Priority:** Start with #1-3 (hero video, logo, HotCoin icon)

**Questions?** Just ask! I'm ready to integrate as soon as you start generating. You can send me assets one at a time or in batches - whatever works best for you!

---

**Next Steps:**
1. Review this spec
2. Start generating assets (Priority 1 first!)
3. Send me completed assets
4. I'll integrate and we'll review together
5. Iterate if needed
6. Launch the amazing new design! 🚀
