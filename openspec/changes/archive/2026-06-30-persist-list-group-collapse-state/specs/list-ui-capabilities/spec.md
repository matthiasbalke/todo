## ADDED Requirements

### Requirement: List group collapse state is restored locally
The `/lists` overview SHALL persist list group expanded/collapsed state locally on the user's device and restore it on later visits.

#### Scenario: Persisted list group is collapsed
- **WHEN** a signed-in user collapses a persisted list group on `/lists`
- **THEN** that group is hidden on the overview without changing its lists or sort order
- **AND** the collapsed state is saved locally for the same browser/device

#### Scenario: Persisted list group state is restored
- **WHEN** a signed-in user returns to `/lists` after previously collapsing a persisted list group on the same browser/device
- **THEN** that list group is rendered collapsed
- **AND** other list groups use their own saved collapsed state or the default expanded state

#### Scenario: Ungrouped section state is restored
- **WHEN** a signed-in user collapses the virtual Ungrouped section and later returns to `/lists` on the same browser/device
- **THEN** the Ungrouped section is rendered collapsed
- **AND** the section remains virtual and is not persisted as a backend list group

#### Scenario: Local storage is unavailable
- **WHEN** local preference storage cannot be read or written
- **THEN** the `/lists` overview remains usable
- **AND** list group sections default to expanded when no saved state can be restored
