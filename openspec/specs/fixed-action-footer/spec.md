# fixed-action-footer Specification

## Purpose
Define the reusable fixed bottom action surface used by list and item workflows across responsive viewports.

## Requirements

### Requirement: FixedActionFooter provides reusable bottom action layout
The frontend SHALL provide a shared FixedActionFooter component for bottom-pinned action surfaces.

#### Scenario: Footer renders action content
- **WHEN** a page renders action content inside FixedActionFooter
- **THEN** the footer remains pinned to the bottom of the viewport
- **AND** the footer content is constrained to the regular app content width on larger screens
- **AND** the footer applies the shared background, top border, and shadow treatment for bottom action surfaces

#### Scenario: Footer renders on rounded mobile displays
- **WHEN** FixedActionFooter renders on a mobile viewport
- **THEN** the footer content includes base horizontal spacing from left and right display edges
- **AND** the footer content includes base bottom spacing from the bottom display edge
- **AND** action borders remain visually inset from rounded physical display edges

#### Scenario: Footer renders with bottom safe-area inset
- **WHEN** FixedActionFooter renders on a viewport with a bottom safe-area inset
- **THEN** the footer bottom spacing combines the base visual spacing with `env(safe-area-inset-bottom)`
- **AND** footer actions remain visible and tappable above system UI

#### Scenario: Footer renders expanded form content
- **WHEN** FixedActionFooter displays an expanded form instead of a compact action row
- **THEN** the expanded form area is bounded relative to the viewport height
- **AND** overflowing form content scrolls within the bounded area
- **AND** footer spacing from display edges is preserved

### Requirement: Pages using FixedActionFooter reserve scroll space
Pages using FixedActionFooter SHALL reserve enough bottom space for page content to remain reachable above the fixed footer.

#### Scenario: User scrolls to the end of a page
- **WHEN** a page with FixedActionFooter contains content behind the footer
- **THEN** the final page content can scroll above the footer
- **AND** the final content is not hidden by compact or expanded footer content
