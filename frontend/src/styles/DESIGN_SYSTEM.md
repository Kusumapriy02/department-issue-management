/**
 * DESIGN SYSTEM STANDARDS
 * College Management System - Professional Layout
 * 
 * This file documents the UI/UX standards applied across the entire frontend.
 * All components should follow these guidelines for consistency.
 */

/**
 * LAYOUT STRUCTURE
 * - Fixed sidebar: 256px (w-64)
 * - Top header: 56px (px-8 py-4)
 * - Main content: Full width with 32px padding (p-8)
 * - Component: DashboardLayout.js provides consistent structure
 */

/**
 * SPACING SYSTEM
 * Page padding:          32px (p-8)
 * Section gaps:          24px (gap-6)
 * Card padding:          24px (p-6)
 * Heading margin-bottom: 8px (mb-2) or 12px (mb-3) or 16px (mb-4)
 * Element gaps:          12px (gap-3)
 */

/**
 * TYPOGRAPHY
 * Page titles:     text-3xl font-bold text-gray-900
 * Section titles:  text-lg font-semibold text-gray-900 (in cards)
 * Body text:       text-sm or text-base text-gray-600
 * Labels:          text-xs font-medium lowercase text-gray-500
 */

/**
 * COLOR PALETTE
 * Primary:   Blue (#2563eb, #1d4ed8)
 * Success:   Green (#16a34a, #15803d)
 * Warning:   Orange (#ea580c, #c2410c)
 * Error:     Red (#dc2626, #b91c1c)
 * Neutral:   Gray scale (50-900)
 * Backgrounds: White (#ffffff), Light Gray (#f3f4f6)
 * Borders:   Light Gray (#e5e7eb)
 */

/**
 * CARD SYSTEM
 * All cards use:
 * - Background: bg-white
 * - Border: border border-gray-200
 * - Padding: p-6
 * - Border radius: rounded-lg
 * - Shadow: shadow-sm hover:shadow-md
 */

/**
 * SIDEBAR STYLING
 * - Background: white
 * - Border: border-r border-gray-200
 * - Active item: bg-blue-50 text-blue-700 border-l-4 border-blue-700
 * - Inactive item: text-gray-700 hover:bg-gray-100
 */

/**
 * DO's
 * ✓ Use consistent spacing from the spacing system
 * ✓ Use the Card component for all content blocks
 * ✓ Use StatCard for numeric displays
 * ✓ Use DashboardLayout for all dashboard pages
 * ✓ Use only blue/green primary colors
 * ✓ Maintain 2px-4px borders
 * ✓ Use light shadows (shadow-sm)
 * ✓ Center icons and text properly
 */

/**
 * DON'Ts
 * ✗ No gradients (they were removed for professional appearance)
 * ✗ No random margin/padding values
 * ✗ No multiple accent colors
 * ✗ No animations or transitions beyond hover
 * ✗ No dark backgrounds (except dark mode if needed)
 * ✗ No custom fonts or sizes
 * ✗ No shadow-lg or shadow-2xl (use shadow-sm only)
 */

/**
 * COMPONENT REFERENCE
 * 
 * DashboardLayout - Main layout wrapper
 * Props: title, icon, isReadOnly, menuItems, activeTab, onTabChange, onLogout, children
 * 
 * Card - Content card wrapper
 * Props: title, icon, children, onClick, className
 * 
 * StatCard - Numeric statistic display
 * Props: icon, label, value, color (blue|green|orange|red)
 */

export const DESIGN_SYSTEM_VERSION = '1.0.0';
