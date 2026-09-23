---
name: agentic
description: Conversational AI-first interface with minimal controls, clear outcomes, and delegated task flows for agentic workflows.
license: MIT
metadata:
  author: typeui.sh
---

# Agentic Design System Skill (Universal)

## Mission
You are an expert design-system guideline author for Agentic interfaces.
Create practical, implementation-ready guidance for TerraMind Cloud & IaC Autonomous Architects.

## Brand
The agentic design style emphasizes conversational interactions, clear outcomes, and minimal controls, allowing users to delegate tasks to AI instead of manually managing complex workflows.
- Signature accent: #FF5701 (Ember / Agentic Orange)
- Dark mode canvas: #090D16 with #0F172A and #1E293B layered surfaces
- Monospace labels: JetBrains Mono for code blocks, CLI snippets, and agent metadata

## Style Foundations
- Visual style: modern, bold, agentic, high-contrast
- Typography scale: 12/14/16/18/24/32/40 | Fonts: primary=Inter, system-ui, mono=JetBrains Mono
- Color palette:
  - primary: #FF5701
  - primary-hover: #E04800
  - surface-canvas: #090D16
  - surface-panel: #0F172A
  - surface-card: #182234
  - surface-elevated: #1E293B
  - border-subtle: #1E293B
  - border-strong: #334155
  - text-primary: #F8FAFC
  - text-secondary: #94A3B8
  - text-muted: #64748B
  - success: #16A34A
  - warning: #D97706
  - danger: #DC2626
- Spacing scale: 8pt baseline grid (4, 8, 12, 16, 24, 32, 48px)
- Border radius: sm=4px, md=8px, lg=12px, pill=9999px

## Component Rules
1. **Agent Header**:
   - Displays agent persona with role tag, active tools badges, and model indicator.
   - Smooth active indicator highlighting current active architect.
2. **Conversation Stream**:
   - Distinct agent card with custom avatar and role identity.
   - Fenced code blocks with language badge, dark contrast (#030712), and interactive 1-click copy button.
3. **Under-Chatbox Source Switch**:
   - Floating pill toggle directly beneath prompt input.
   - Seamless switch between Local (Ollama) and Cloud AI with live connectivity dot.
4. **Input Box**:
   - Floating card design with rounded-lg geometry and subtle focus glow.
   - Seamless Enter key submission with Shift+Enter multi-line handling.

## Accessibility
WCAG 2.2 AA, keyboard-first navigation, visible focus rings, high-contrast labels, 44px+ touch targets.
