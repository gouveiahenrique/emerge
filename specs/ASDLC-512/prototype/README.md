# iOS Prototype: ASDLC-512 — All Day Indicator on Event Detail Page

## Scope

This prototype covers **only** the screens explicitly required by ASDLC-512:

- **Event Detail Page (All-Day event)** — demonstrates the fix: "All Day" capsule/pill badge replaces the misleading "12:00 AM" time value.
- **Event Detail Page (Timed event)** — confirms that non-all-day events continue to show start/end time unchanged.
- **Events List** — minimal entry point to navigate into the detail screens.

## Design System Source

Tokens extracted from `gouveiahenrique/berkeley-mobile-ios` via CodeGraph and GitHub source inspection.

| Token | Value | Source |
|---|---|---|
| Accent color | `#003262` | Berkeley Blue — primary brand color |
| Secondary accent | `#FDB515` | Cal Gold |
| Background | `#F2F2F7` | iOS `secondarySystemBackground` |
| Surface / card | `#FFFFFF` | `BMColor.cardBackground` / `BMColor.modalBackground` |
| All Day badge bg | `rgba(120,120,128,0.2)` | `AllDayEventBannerView.swift` — Capsule fill |
| Card corner radius | `12px` | `CardView.swift` — `cornerRadius: 12` |
| Image corner radius | `10px` | `BMDetailHeaderView` — `RoundedRectangle(cornerRadius: 10)` |
| Card shadow | `0 5px 20px rgba(0,0,0,0.25)` | `CardView.swift` — `shadowRadius:5, shadowOpacity:0.25` |
| Font family | `-apple-system` / SF Pro | `BMFont` wraps `UIFont.systemFont` |
| Nav pattern | NavigationStack (push/pop) | `EventsView.swift` — `NavigationStack` |

## How to Run

1. Open `specs/ASDLC-512/prototype/index.html` in Chrome, Firefox, or Safari
2. No installation, no server, no build step required
3. Renders inside an iPhone 15 Pro frame (393×852px)

## Screens

| Screen ID | Name | Description |
|---|---|---|
| `screen-events` | Events List | Minimal entry point — tap rows to navigate |
| `screen-allday` | All-Day Event Detail | **Primary screen** — shows the ASDLC-512 fix |
| `screen-timed` | Timed Event Detail | Comparison — unchanged non-all-day behavior |

## Navigation Flows

- Events List → tap "Berkeley Career Fair" banner → All-Day Event Detail
- Events List → tap "CS 61A Office Hours" row → Timed Event Detail
- Any Detail → tap "< Events" back button → Events List

## Interactions Implemented

| Interaction | Location |
|---|---|
| NavigationStack push (slide in from right) | Tap any event row |
| NavigationStack pop (slide back to left) | Tap "< Events" back button |
| **Before / After toggle** | "ASDLC-512 Fix Preview" segmented control on All-Day detail screen |
| Add to Calendar button toggle | Top-right toolbar button on either detail screen |
| Toast notification | Fires on action button taps |

### Before / After Toggle

The **All-Day Event Detail** screen includes a segmented control labelled "ASDLC-512 — Compare Fix":

- **Before (Bug)** — time row shows `12:00 AM` in red (the incorrect/misleading current behavior)
- **After (Fixed)** — time row shows the `All Day` capsule/pill badge (the correct fixed behavior, default)

## Acceptance Criteria Coverage

| AC | Screen | Status |
|---|---|---|
| All-day event: time row shows "All Day" capsule badge | `screen-allday` (After mode) | ✅ Covered |
| All-day event: no time value (12:00 AM) visible | `screen-allday` (After mode) | ✅ Covered |
| Non-all-day event: time row unchanged | `screen-timed` | ✅ Covered |
| All Day indicator is capsule/pill shaped | `screen-allday` — `.all-day-badge` class | ✅ Covered |
| All Day status read from event data, not inferred | Modeled in toggle — badge driven by `isAllDay` flag | ✅ Covered |
| All-day event with no time value available | `screen-allday` — badge renders even without time field | ✅ Covered |

## Key Component: `.all-day-badge`

The "All Day" indicator is styled as a native iOS capsule badge matching `AllDayEventBannerView.swift`:

```css
.all-day-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 12px;
  background: rgba(120, 120, 128, 0.2);  /* semi-transparent gray */
  border: 0.5px solid rgba(120, 120, 128, 0.3);
  border-radius: 100px;  /* full capsule */
  font-size: 13px;
  font-weight: 600;
  height: 26px;
}
```

This replaces the `EventDetailRow` plain text `timePart` for all-day events in `BMDetailHeaderView.timeView`.
