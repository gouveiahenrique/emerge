# iOS Prototype: ASDLC-512 — Event Detail: All Day Indicator

## Scope

This prototype covers ONLY the single screen in scope: the **Event Detail Page** in two states:

1. **All Day Event** — time row shows the "All Day" capsule badge (ASDLC-512 change)
2. **Timed Event** — time row shows a normal time value (unchanged baseline behavior)

## Design System Source

Extracted from `gouveiahenrique/berkeley-mobile-ios` via CodeGraph and GitHub:

| Token | Value | Source |
|---|---|---|
| Accent color | `#779AFC` | `BMColor.ActionButton.background` |
| Background (light) | `#FAFAFA` | `BMColor.modalBackground` (R:250 G:250 B:250) |
| Background (dark) | `#414141` | `BMColor.modalBackground` (R:65 G:65 B:65) |
| Surface (light) | `#FFFFFF` | `BMColor.cardBackground` (R:255 G:255 B:255) |
| Surface (dark) | `#484747` | `BMColor.cardBackground` (R:72 G:71 B:71) |
| Primary text (light) | `#2C2C2D` | `BMColor.Calendar.blackText` |
| Secondary text (light) | `#626162` | `BMColor.Calendar.grayedText` |
| Font family | Apercu / system-ui | `BMFont` (Apercu-Regular, Apercu-Bold, etc.) |
| Card radius | `12px` | `RoundedRectangle(cornerRadius: 12)` in `EventDetailView.swift` |
| Thumbnail radius | `10px` | `RoundedRectangle(cornerRadius: 10)` in `BMDetailHeaderView` |
| Spacing unit | `16px` | `.padding(.horizontal)` in `EventDetailView.swift` |
| Nav pattern | NavigationStack push | `EventDetailView` is pushed onto the events nav stack |

## How to Run

1. Open `specs/ASDLC-512/prototype/index.html` in Chrome, Firefox, or Safari
2. No installation, no server, no build step required
3. Renders inside an iPhone 15 Pro frame (393×852)

## Screens

| Screen ID | Name | Description |
|---|---|---|
| `screen-allday` | All Day Event Detail | Event marked as all-day; time row displays "All Day" capsule badge |
| `screen-timed` | Timed Event Detail | Normal event with start/end time; time row displays time string |

## Navigation

Use the toggle buttons above the iPhone frame to switch between the two states.

## Interactions Implemented

- Toggle between All Day / Timed event screens via buttons above the frame
- Calendar toolbar button toggles between "add" and "checkmark" states on tap
- Action buttons ("Learn More", "Register") have tap feedback
- Annotation callout appears on the All Day screen pointing to the badge
- Dark mode supported via `prefers-color-scheme: dark`

## Acceptance Criteria Coverage

| AC | Screen | Status |
|---|---|---|
| All-day event shows "All Day" capsule in time row | `screen-allday` | Covered |
| Time row does not show time value (e.g. "12:00 AM") for all-day | `screen-allday` | Covered |
| Non-all-day event continues to show time value | `screen-timed` | Covered |
| Badge text is exactly "All Day" (title case) | `screen-allday` | Covered |
| Indicator is visually styled as a capsule/pill | `screen-allday` | Covered — border-radius: 999px |
| Indicator is accessible (role="text", aria-label="All Day") | `screen-allday` | Covered |
| All-day flag determines display, not time value inference | Both screens | Covered — separate screen states model flag |
| Page loads without errors for all-day event | `screen-allday` | Covered |
