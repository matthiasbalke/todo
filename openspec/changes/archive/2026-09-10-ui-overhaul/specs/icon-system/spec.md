## ADDED Requirements

### Requirement: Functional UI icons use Lucide SVG components
Functional UI icons SHALL use Lucide SVG components from `@lucide/svelte` so the app presents a coherent icon language.

#### Scenario: Functional control icon is displayed
- **WHEN** a control displays an icon for navigation, menu, save, cancel, delete, edit, expand, collapse, drag, completion, starring, date, recurrence, category, assignee, notes, or list actions
- **THEN** the icon is rendered from the Lucide SVG icon system when a Lucide equivalent exists
- **AND** the icon inherits sizing, stroke width, color, and accessibility treatment from shared component or control-owned styling

#### Scenario: Shared Icon component renders app icons
- **WHEN** a functional UI icon is needed in changed UI areas
- **THEN** consumers render a shared app `Icon` component using semantic app icon names rather than importing Lucide icons directly
- **AND** the shared `Icon` component maps semantic names such as `back`, `menu`, `status`, `done`, `plus`, `group`, `expand`, and `collapse` to explicitly imported Lucide components
- **AND** the shared `Icon` component applies shared sizing presets by name
- **AND** the shared `Icon` component provides accessible defaults for decorative icons and allows an accessible label when the icon itself is the only visible content
- **AND** direct Lucide imports outside the shared icon registry are limited to documented component-owned exceptions

#### Scenario: Icon sizing tokens are used
- **WHEN** a shared component, route header, row action, or item-state control renders a Lucide icon
- **THEN** the visual icon size, stroke width, and icon-only touch target size are chosen from shared named sizing presets
- **AND** the presets include normal action icons, compact icons, header/navigation icons, metadata/status icons, and item completion/status icons
- **AND** changing a preset updates all consumers that use that preset without editing each consumer
- **AND** one-off hardcoded Lucide `size` or `strokeWidth` values are avoided unless the component documents a deliberate local exception

#### Scenario: Default icon sizing presets are applied
- **WHEN** the ui overhaul is first implemented
- **THEN** normal inline/action icons use an 18px visual icon size
- **AND** compact metadata/status icons use a 14px or 16px visual icon size
- **AND** header/navigation icons use a 24px visual icon size with a 44px square touch target
- **AND** standard icon-only controls use a 40px square touch target
- **AND** compact icon-only controls use a 32px square touch target
- **AND** item completion/status icons use a 22px or 24px visual icon size
- **AND** normal Lucide icons use the default 2px stroke width unless a named preset specifies a stronger stroke
- **AND** header/navigation and completion/status presets use a stronger stroke such as 2.5px to 3px

#### Scenario: Required named icons are displayed
- **WHEN** the app renders back navigation, menu controls, completion/status indicators, list creation actions, list group indicators, or section disclosure indicators including checked-items groups
- **THEN** back navigation uses the Lucide `ChevronLeft` icon
- **AND** menu controls use the Lucide `Menu` icon
- **AND** unchecked completion/status indicators use the Lucide `Circle` icon
- **AND** checked or completed indicators use the Lucide `CircleCheck` icon
- **AND** list creation actions use the Lucide `Plus` icon
- **AND** list group indicators use the Lucide `Group` icon
- **AND** expanded section disclosure indicators use the Lucide `ChevronDown` icon
- **AND** collapsed section disclosure indicators use the Lucide `ChevronUp` icon

#### Scenario: Lucide imports remain tree-shakable
- **WHEN** the shared icon registry maps semantic icon names to Lucide icons
- **THEN** it uses explicit per-icon imports from `@lucide/svelte/icons/...`
- **AND** it does not import the whole Lucide icon package dynamically or as a wildcard collection

#### Scenario: Active icon state is displayed
- **WHEN** an icon represents an active state such as completed or starred
- **THEN** the state is communicated by accessible state plus coherent Lucide styling
- **AND** filled rendering is only used where the Lucide icon remains visually coherent

#### Scenario: Legacy functional glyph exists
- **WHEN** a functional text glyph or emoji icon has a Lucide equivalent
- **THEN** the UI does not use the text glyph or emoji as the functional icon
- **AND** examples include replacing `←`, `⋮`, `✓`, `✕`, `★`, `▶`, `▼`, delete emoji, and edit emoji in functional controls

### Requirement: Non-functional visuals SHALL remain allowed where appropriate
User-authored content, app identity assets, and generated avatars SHALL be allowed to use non-Lucide visuals when they are not functional control icons.

#### Scenario: User list emoji is displayed
- **WHEN** a list has a user-selected emoji
- **THEN** the list emoji may remain visible as list content
- **AND** it is not treated as a functional UI icon

#### Scenario: App asset is displayed
- **WHEN** the app displays PWA icons, favicon assets, or other app identity images
- **THEN** those assets may remain in their existing image or SVG format
- **AND** they are not required to be Lucide icons

#### Scenario: User avatar is displayed
- **WHEN** the UI displays a user avatar or avatar fallback
- **THEN** the avatar may use the existing initial-in-circle pattern
- **AND** it is not required to use Lucide unless it appears as a generic functional user icon
