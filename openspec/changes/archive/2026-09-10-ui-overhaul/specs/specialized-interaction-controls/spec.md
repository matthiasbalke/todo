## ADDED Requirements

### Requirement: Item state toggles support item form usage
Dedicated completion and starred state toggles SHALL be reusable in item forms while preserving their domain-specific accessible state, Lucide icon presentation, and activation behavior.

#### Scenario: Completion toggle is used in an item form
- **WHEN** an item form renders the completion toggle for an editable item
- **THEN** the toggle exposes whether the item is done or not done
- **AND** activating the toggle changes the form's pending completion state exactly once

#### Scenario: Star toggle is used in an item form
- **WHEN** an item form renders the starred toggle for an editable item
- **THEN** the toggle exposes whether the item is starred or unstarred
- **AND** activating the toggle changes the form's pending starred state exactly once

#### Scenario: Toggle presentation remains component-owned
- **WHEN** item cards or item forms render completion or starred toggles
- **THEN** consumers provide item state and layout context only
- **AND** active, inactive, focus, disabled, icon-size, and stroke-weight presentation remains owned by the dedicated toggle components
- **AND** functional icon shapes come from the selected Lucide icon system
- **AND** unchecked completion/status indicator icon shapes use the Lucide `Circle` icon
- **AND** checked or completed indicator icon shapes use the Lucide `CircleCheck` icon
