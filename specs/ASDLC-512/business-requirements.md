# Business Requirements Specification
## ASDLC-512: Display "All Day" Indicator Instead of Time on Event Detail Page

**Issue Key**: ASDLC-512  
**Date**: 2026-08-06  
**Status**: Draft  
**Complexity**: S (Small)

---

## 1. Executive Summary

When viewing the detail page for an all-day event, the time row currently displays a misleading time value (12:00 AM) instead of communicating that no specific time applies. This specification defines the requirement to replace that misleading time display with a clearly labeled "All Day" indicator so that users accurately understand the nature of the event.

---

## 2. Problem Statement

### Current State
On the Event Detail Page, every event shows a time row. When an event is marked as all-day, the system has no specific start or end time, yet the time row displays "12:00 AM" — a value that is technically a placeholder artifact, not a real event time.

### Desired State
When an event is all-day, the time row must display an "All Day" indicator (visually rendered as a capsule/pill-shaped label) in place of any time value. When an event is not all-day, the existing time display behavior remains unchanged.

### Business Impact
- **Users** (event attendees and viewers) are misled into believing all-day events start at 12:00 AM, which may cause confusion about attendance, scheduling, or event planning.
- **Trust and accuracy** in the event platform are undermined when displayed data does not match reality.
- **Accessibility**: Users relying on screen readers or assistive tools receive inaccurate time information.

### Urgency
The current behavior actively communicates incorrect information to users. Any user viewing an all-day event today receives a false time reading. The fix is low-risk and high-value.

---

## 3. Personas & User Stories

### Persona 1: Event Viewer (Primary)
A user browsing or attending events who opens an event detail page to understand when and how long an event runs.

**User Story**:  
As an event viewer, when I open the detail page for an all-day event, I want the time row to clearly say "All Day" so that I am not misled into thinking the event starts at a specific time.

**Pain Point**: Currently sees "12:00 AM" and may assume they need to arrive at midnight or that the event has a specific start time.

---

### Persona 2: Event Organizer / Content Manager (Secondary)
A person who creates or manages events and relies on the platform to accurately represent their event details to attendees.

**User Story**:  
As an event organizer, when I mark an event as all-day, I want the event detail page to reflect that accurately so that attendees are not confused by a fabricated start time.

**Pain Point**: The platform misrepresents their event, undermining trust in the accuracy of the system.

---

## 4. Business Rules

**BR-001**: When an event is flagged as an all-day event, the time row on the Event Detail Page must display an "All Day" indicator and must not display any time value (e.g., 12:00 AM, start time, end time).

**BR-002**: When an event is not flagged as all-day, the time row must continue to display the event's start and/or end time as it currently does. No change to the time display behavior for non-all-day events.

**BR-003**: The "All Day" indicator must be visually distinct from a plain time string. It must be presented as a capsule/pill-shaped label (a rounded badge containing the text "All Day").

**BR-004**: The text content of the "All Day" indicator must be exactly "All Day" (title case). It must not be abbreviated or substituted with alternative phrasing.

**BR-005**: The all-day flag is determined by the event data provided by the backend system. The display layer must read and respect this flag as authoritative — it must not infer or compute all-day status from time values.

**BR-006**: The "All Day" indicator must meet accessibility standards: it must be perceivable as a label by assistive technologies, conveying the same meaning as it does visually (i.e., its accessible label must communicate "All Day").

**BR-007**: This change applies to both repositories referenced in the issue (the iOS mobile application and the web/emerge application). Each must independently satisfy these requirements within its own display layer.

---

## 5. Acceptance Criteria

```gherkin
Feature: All Day Indicator on Event Detail Page

  Background:
    Given the Event Detail Page is open

  Scenario: All-day event displays "All Day" indicator instead of time
    Given an event is marked as an all-day event
    When a user navigates to the Event Detail Page for that event
    Then the time row displays an "All Day" capsule/pill-shaped label
    And the time row does not display any time value (e.g., "12:00 AM")

  Scenario: Non-all-day event continues to display its time value
    Given an event is not marked as all-day
    And the event has a defined start time
    When a user navigates to the Event Detail Page for that event
    Then the time row displays the event's start and/or end time as before
    And no "All Day" indicator is shown

  Scenario: "All Day" indicator text is exactly "All Day"
    Given an event is marked as an all-day event
    When a user views the time row on the Event Detail Page
    Then the label text reads exactly "All Day" in title case
    And no abbreviated or alternative phrasing is used

  Scenario: "All Day" indicator is visually styled as a capsule/pill
    Given an event is marked as an all-day event
    When a user views the time row on the Event Detail Page
    Then the "All Day" indicator is rendered as a rounded badge (capsule/pill shape)
    And it is visually distinguishable from a plain text time value

  Scenario: "All Day" indicator is accessible to assistive technologies
    Given an event is marked as an all-day event
    When the Event Detail Page is read by a screen reader or assistive tool
    Then the time row communicates "All Day" to the assistive technology
    And no misleading time value is announced

  Scenario: All-day flag is respected as provided by the backend
    Given the backend provides an event with the all-day flag set to true
    When the Event Detail Page renders the time row
    Then the display layer shows the "All Day" indicator without computing or overriding the flag
    And it does not fall back to displaying a default time (e.g., 12:00 AM)

  Scenario: All-day flag set to false — no indicator shown
    Given the backend provides an event with the all-day flag set to false
    When the Event Detail Page renders the time row
    Then no "All Day" indicator is displayed
    And the event's actual time is shown

  Scenario: Event detail page loads without error for all-day event
    Given an event is marked as an all-day event
    When a user opens the Event Detail Page
    Then the page loads successfully
    And the time row area renders without errors or blank/missing content
```

---

## 6. Non-Functional Requirements

### Display Consistency
- The "All Day" indicator must be visually consistent with the existing design language of the Event Detail Page (font weight, size, color scheme).
- The capsule/pill shape must be consistent in appearance between both affected applications (iOS and web/emerge).

### Accessibility
- The "All Day" label must have an accessible text representation equivalent to its visual content.
- Color contrast of the label against its background must meet accepted readability standards.

### Performance
- The change must not introduce any measurable increase in page load time or rendering delay on the Event Detail Page.

### Reliability
- If the all-day flag is absent or undefined in the event data, the time row must fall back gracefully — either displaying the available time value or an empty/neutral state — and must not crash or render broken UI.

### Maintainability
- The logic that determines whether to show the "All Day" indicator versus a time value must be centralized or clearly encapsulated so that future changes to this behavior can be made in a single place per application.

---

## 7. Edge Cases & Special Scenarios

### EC-001: All-day flag is absent or undefined
**Scenario**: The event data does not include an all-day flag at all (e.g., older events, data migration gaps).  
**Required Behavior**: The system must treat a missing flag as "not all-day" and display the time value if available. It must not display the "All Day" indicator when the flag is absent.

### EC-002: All-day event with no time value in data
**Scenario**: The event is marked all-day and also has no start/end time fields populated.  
**Required Behavior**: The "All Day" indicator must still render correctly. The absence of time fields must not cause errors or a blank row.

### EC-003: All-day event with a time value still present in data
**Scenario**: The event is marked all-day but also has a time value stored (e.g., 12:00 AM as a default).  
**Required Behavior**: The all-day flag takes precedence. The "All Day" indicator must be shown and the time value must not be displayed.

### EC-004: Screen reader / low-vision users
**Scenario**: A user with visual impairment accesses the Event Detail Page via assistive technology.  
**Required Behavior**: The accessible label for the time row must communicate "All Day" clearly — not read out a capsule icon or an empty string.

### EC-005: Very long list of events, all marked all-day
**Scenario**: A user views multiple all-day events sequentially.  
**Required Behavior**: Each Event Detail Page must independently render the "All Day" indicator correctly; there is no shared state between pages.

### EC-006: Indicator label localization (open question)
**Concern**: The issue specifies "All Day" in English. If the application supports multiple languages, the indicator text may need to be localized.  
**Open Question**: Does the application currently localize other UI labels in the Event Detail Page? If yes, "All Day" must follow the same localization approach. If no, English-only is acceptable for this change.

---

## 8. Out of Scope

The following items are explicitly **not** included in this requirement:

- **Changes to event creation or editing flows**: This requirement only affects how all-day events are *displayed*, not how they are created or saved.
- **Changes to event list views, calendar views, or any page other than the Event Detail Page**: The "All Day" indicator is scoped to the Event Detail Page time row only.
- **Changes to the backend event data model or all-day flag storage**: The backend already provides the all-day flag; no backend changes are required.
- **Changes to non-all-day event time display**: Time display for events that are not all-day must remain exactly as it is today.
- **Introduction of new event types or statuses**: "All Day" is an existing event attribute; no new event classification is being introduced.
- **Changes to push notifications, reminders, or calendar integrations**: Only the in-app Event Detail Page display is in scope.
- **Localization of the "All Day" label** (pending resolution of EC-006 open question): Unless the team confirms localization is required, this is out of scope.
- **Any visual redesign of the Event Detail Page beyond the time row**: No other elements on the page are to be modified.

---

## 9. Success Metrics

| Metric | Target |
|---|---|
| All-day events display "All Day" indicator on detail page | 100% of all-day events |
| No time value shown for all-day events | 0 occurrences of time values on all-day event pages |
| Non-all-day events unaffected — time display unchanged | 100% of non-all-day events |
| No accessibility violations introduced in time row | 0 new violations |
| No new rendering errors on Event Detail Page | 0 errors introduced |
| Both affected repositories implement the indicator | Both repositories updated and consistent |

---

## 10. References

- **Issue**: ASDLC-512 — Multiple Repos - [Events Page] Display (All Day) Indicator Instead of Time on Event Detail Page
- **Affected Repositories**:
  - iOS Mobile Application: https://github.com/gouveiahenrique/berkeley-mobile-ios.git
  - Web/Emerge Application: https://github.com/gouveiahenrique/emerge.git
- **Related Business Context**: Event Detail Page, time row display, all-day event flag
- **Open Questions**:
  - EC-006: Does the application support localization of UI labels? If yes, the "All Day" text must follow the established localization pattern.
  - Confirmation needed: Is the all-day flag always present in the event data contract, or can it be absent/null for some event records? (See EC-001.)
