# Business Requirements: Display "All Day" Indicator on Event Detail Page

**Issue Key**: ASDLC-512
**Date**: 2026-08-18
**Complexity**: S (Small)
**Status**: Draft

---

## 1. Executive Summary

When an event is designated as an all-day event, the Event Detail Page currently displays a misleading time value (12:00 AM) in the time row. This specification defines the requirement to replace that time value with an "All Day" visual indicator — displayed as a capsule/pill-shaped label — so users clearly understand that the event has no specific start or end time and spans the entire day.

---

## 2. Problem Statement

### Current State

On the Event Detail Page, the time row always renders a clock-style time value. For all-day events, this value defaults to 12:00 AM, which is factually incorrect and misleading — all-day events do not have a defined start or end time.

### Desired State

When an event is marked as all-day, the time row on the Event Detail Page must display an "All Day" indicator (visually presented as a capsule/pill-shaped badge) in place of any time value. For events that are not all-day, the existing time display behavior remains unchanged.

### Business Impact

- **Users** are misled into believing an all-day event starts at midnight, which may cause scheduling confusion or loss of trust in the application.
- **Event organizers** who intentionally mark events as all-day have their intent misrepresented to attendees.
- Correcting this improves information accuracy, user trust, and the overall quality of the events experience.

### Urgency

The current behavior actively misinforms users about event scheduling. Since the Events feature is in active use, this fix should be prioritized to prevent continued user confusion.

---

## 3. Personas & User Stories

### Persona 1: Event Attendee (Primary)

A person browsing the Events section to learn about upcoming events, their timing, and whether attendance requires scheduling around a specific time slot.

**User Story**:
> As an event attendee, when I view the detail page of an all-day event, I want to see a clear "All Day" indicator in the time row so that I immediately understand no specific time commitment is required and I am not misled by an incorrect time value.

### Persona 2: Event Organizer (Secondary)

A person or department that creates and publishes events, including those that span an entire day without a fixed start or end time.

**User Story**:
> As an event organizer, when I mark an event as all-day, I want the Event Detail Page to faithfully represent that designation so that attendees receive accurate scheduling information.

---

## 4. Business Rules

**BR-001**: An event that is designated as "all-day" must not display a time value (such as 12:00 AM or any other time) in the time row of the Event Detail Page.

**BR-002**: When an event is designated as "all-day", the time row must display an "All Day" indicator rendered as a capsule/pill-shaped visual label.

**BR-003**: The all-day designation of an event is determined by data provided by the backend system; the client must read and display this designation as received — it must not infer or compute all-day status from time values.

**BR-004**: For events that are NOT designated as all-day, the time row must continue to display the event's start and end time using the existing behavior — no changes apply to non-all-day events.

**BR-005**: The "All Day" indicator must be visually distinct from a plain text label, appearing as a capsule/pill-shaped badge, to distinguish it from time values and reinforce its semantic meaning.

**BR-006**: The change applies to the Event Detail Page only. Event listing views (cards, calendars, etc.) are out of scope unless explicitly addressed in a separate issue.

---

## 5. Acceptance Criteria

```gherkin
Feature: All Day Indicator on Event Detail Page

  Background:
    Given the user is viewing the Event Detail Page

  Scenario: All-day event shows "All Day" indicator instead of a time
    Given the event is designated as an all-day event
    When the Event Detail Page renders the time row
    Then the time row displays an "All Day" capsule/pill-shaped label
    And no time value (such as 12:00 AM) is displayed in the time row

  Scenario: Non-all-day event continues to display time values
    Given the event is NOT designated as an all-day event
    And the event has a defined start time and end time
    When the Event Detail Page renders the time row
    Then the time row displays the event's start and end time
    And no "All Day" indicator is displayed

  Scenario: All Day indicator is visually distinct
    Given the event is designated as an all-day event
    When the Event Detail Page renders the time row
    Then the "All Day" label is rendered inside a capsule or pill-shaped visual container
    And the label is not presented as plain unstyled text

  Scenario: All-day designation is read from event data
    Given the event data received from the backend includes an all-day designation flag
    When the client renders the Event Detail Page
    Then the client uses the backend-provided all-day flag to determine whether to show the indicator
    And the client does not attempt to infer all-day status from time values

  Scenario: All-day event with no time value available
    Given the event is designated as an all-day event
    And the event data contains no start or end time
    When the Event Detail Page renders the time row
    Then the time row displays the "All Day" capsule/pill-shaped label
    And the page does not display an error or blank time row
```

---

## 6. Non-Functional Requirements

### Clarity & Accessibility
- The "All Day" label text must be human-readable and unambiguous.
- The capsule/pill visual style must have sufficient contrast against its background to remain legible in both light and dark display modes, if the application supports them.

### Consistency
- The visual treatment of the "All Day" indicator must align with the application's existing badge/label design conventions for similar contextual callouts.

### Correctness
- Under no circumstances may a time value appear alongside or in place of the "All Day" indicator for events carrying the all-day designation.

### Performance
- This change must not introduce any perceptible delay to the rendering of the Event Detail Page. The all-day check is a display-time data read; no additional data fetching is required.

### Observability
- No new logging or monitoring is required for this change. Existing event detail page instrumentation is sufficient.

---

## 7. Edge Cases & Special Scenarios

| Scenario | Expected Behavior |
|---|---|
| Event is all-day and backend provides no time fields | Display "All Day" indicator; do not display blank or null time values |
| Event is all-day and backend provides a time field (e.g., midnight as a convention) | Display "All Day" indicator only; the time value must be suppressed |
| Event is not all-day but has only a start time (no end time) | Display available start time using existing behavior; no "All Day" indicator |
| Event data is malformed and all-day status is absent/null | Treat as non-all-day; display time value if available, or handle gracefully per existing error behavior |
| Application is used in a locale with different date/time conventions | "All Day" label text must remain consistent — localization of this label is out of scope for this issue unless explicitly addressed |

---

## 8. Out of Scope

The following items are explicitly excluded from this requirement:

- Changes to event listing views (search results, calendar grid, card lists) — only the Event Detail Page is in scope.
- Changes to how all-day status is set, edited, or stored — this is a display-only fix.
- Localization or translation of the "All Day" label text — the English label is sufficient for this issue.
- Changes to the event creation or editing workflow.
- Changes to event reminder or notification behavior for all-day events.
- Any modifications to backend data contracts or event data models.
- Changes to any other field on the Event Detail Page (location, description, RSVP, etc.).

---

## 9. Success Metrics

| Metric | Target |
|---|---|
| All-day events no longer display a time value on the Event Detail Page | 100% of all-day events affected |
| All-day events display the "All Day" capsule/pill indicator | 100% of all-day events affected |
| Non-all-day events continue to display correct time values without regression | 100% of non-all-day events unaffected |
| No user-reported confusion about all-day event times after release | Zero reports related to this specific behavior post-release |

---

## 10. References

- **Issue Key**: ASDLC-512
- **Affected Repositories**:
  - `berkeley-mobile-ios` — iOS client rendering the Event Detail Page
  - `emerge` — may contain shared event data models or business logic used across clients
- **Related Behavior**: Event Detail Page time row rendering logic
- **Design Pattern Referenced in Issue**: Capsule/pill-shaped label for "All Day" designation
