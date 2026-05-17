## Design Decisions: Sleep Profile Form (Card-Style Grouping)

- **Color Palette**:
  - Background: #0a0e1a (deep night blue)
  - Card surface: rgba(255,255,255,0.04) with backdrop blur
  - Primary accent: #c8b896 (moonbeam gold)
  - Text primary: #e8e6e1 (mist)
  - Text secondary: rgba(232,230,225,0.6)
  - Border subtle: rgba(255,255,255,0.08)
  - Glow: rgba(200,184,150,0.15)

- **Typography**:
  - Font: "Noto Serif SC" for headings, system sans for body
  - Title: 22px bold
  - Card title: 13px 500 weight, uppercase tracking
  - Label: 12px, muted color
  - Input: 15px

- **Spacing System**:
  - Base unit: 8px
  - Card padding: 24px
  - Card gap: 16px
  - Label-to-input gap: 8px
  - Row gap: 14px

- **Border-radius strategy**:
  - Card: 16px
  - Input/select: 10px
  - Chips: 20px (pill shape)

- **Shadow/Depth**:
  - Card: 0 4px 24px rgba(0,0,0,0.3)
  - Subtle inner glow on focus

- **Motion style**:
  - Transition: 0.2s ease
  - Hover: subtle lift + glow intensify