# multiselect-component Specification

## Purpose
Define the shared multi-value selection component and its accessible interaction and custom rendering behavior.

## Requirements

### Requirement: MultiSelect supports accessible multi-value selection
The shared MultiSelect component SHALL allow users to select zero, one, or many values from an option list while following the existing Select and ComboboxPrimitive interaction patterns.

#### Scenario: User opens an empty multi-select
- **WHEN** a consumer renders MultiSelect with no selected values
- **THEN** the control exposes its accessible label
- **AND** the trigger displays the configured placeholder
- **AND** opening the control displays the available options

#### Scenario: User selects multiple options
- **WHEN** a user selects more than one option
- **THEN** each selected option is represented in the trigger value area
- **AND** the option list indicates which options are selected
- **AND** the selected values are emitted as a complete array
- **AND** the option list remains open after each selection so the user can select additional values without reopening it

#### Scenario: User removes a selected option
- **WHEN** a user clicks or activates an already-selected option in the option list
- **THEN** that option is removed from the selected value array
- **AND** the remaining selected values stay selected

#### Scenario: User filters and navigates options
- **WHEN** a user types into or focuses the multi-select control
- **THEN** options can be filtered using the same search behavior as the existing select pattern
- **AND** keyboard navigation and dismissal behavior remain accessible
- **AND** focus returns to the trigger when the option list closes

#### Scenario: User dismisses the option list
- **WHEN** the option list is open
- **THEN** pressing Escape closes the option list without changing selected values
- **AND** moving focus outside the multi-select closes the option list without changing selected values

### Requirement: MultiSelect supports custom option and selected rendering
The shared MultiSelect component SHALL let consumers customize option and selected-value content while keeping the accessible option name based on consumer-provided labels.

#### Scenario: Consumer renders custom option content
- **WHEN** a consumer provides custom option content
- **THEN** the option list renders that content for each option
- **AND** the option remains selectable by its accessible label

#### Scenario: Consumer renders custom selected content
- **WHEN** a consumer provides custom selected-value content
- **THEN** the trigger value area renders that content for each selected option
- **AND** the selected values remain identifiable by their accessible labels

#### Scenario: Assignee usage renders avatars
- **WHEN** ItemForm uses MultiSelect for assignees
- **THEN** each user option displays an avatar before the user's name
- **AND** each selected user displays an avatar before the user's name
- **AND** avatar visuals are decorative unless the user name would otherwise be unavailable
