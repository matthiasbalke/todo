## MODIFIED Requirements

### Requirement: Editable users can sort categories in the configure dialog
The configure categories dialog SHALL allow users with category management capability to reorder real categories by drag and drop, edit category names and colors inline, and choose category colors from presets or a custom hex value.

#### Scenario: Category order is changed in configure dialog
- **WHEN** an editable user drags a category by its reorder handle to a different position in the configure categories dialog
- **THEN** the dialog category rows are reordered to match the dropped position
- **AND** the category order is persisted for subsequent loads of the list

#### Scenario: Configure dialog uses drag handles instead of arrows
- **WHEN** an editable user opens the configure categories dialog
- **THEN** each category row exposes a drag handle for reordering
- **AND** up and down arrow controls for reordering categories are not displayed

#### Scenario: Dialog category editing remains available
- **WHEN** an editable user reorders categories in the configure categories dialog
- **THEN** category rename, color selection, delete, and add actions remain available
- **AND** the reordered categories keep their names, colors, and item assignments

#### Scenario: Category deletion requires confirmation
- **WHEN** an editable user activates delete for an existing category named `Produce`
- **THEN** the dialog title asks `Delete category?`
- **AND** the dialog body identifies category `Produce` as the category being deleted
- **AND** the confirmation action is labeled `Delete`
- **AND** the category is not deleted unless the user confirms the deletion

#### Scenario: Confirmed category deletion is persisted
- **WHEN** an editable user confirms deleting an existing category
- **THEN** the category is deleted from the list
- **AND** canceling the confirmation leaves the category unchanged

#### Scenario: Uncategorized is not sortable in the dialog
- **WHEN** an editable user opens the configure categories dialog
- **THEN** only real categories are displayed as sortable rows
- **AND** no uncategorized category row is created or persisted

#### Scenario: Dialog category rows align colorless categories
- **WHEN** the configure categories dialog displays categories with and without configured colors
- **THEN** every category name starts at the same horizontal position
- **AND** categories without a configured color reserve the same leading color-control space as categories with a configured color
- **AND** no-color category controls display a dashed circular marker while colored category controls display a solid color without a surrounding border

#### Scenario: Existing category name is edited automatically
- **WHEN** an editable user changes an existing category name in the configure categories dialog and commits the inline edit
- **THEN** the changed name is persisted without requiring separate save or discard buttons
- **AND** the category color, sort order, and item assignments are preserved

#### Scenario: Existing category color is edited from the color control
- **WHEN** an editable user activates the color control for an existing category row
- **THEN** the dialog allows the user to choose a preset color, enter a custom hex color, or clear the color
- **AND** committing the color choice persists the category color without requiring separate save or discard buttons
- **AND** the category name, sort order, and item assignments are preserved

#### Scenario: Existing category preset color or clear action applies immediately
- **WHEN** an editable user chooses a preset color or clears the color while editing an existing category color
- **THEN** the selected color state is persisted immediately
- **AND** no separate color save or discard action is displayed

#### Scenario: Existing category custom hex color commits from the hex field
- **WHEN** an editable user enters a valid custom hex color for an existing category and commits the hex field with Enter or blur
- **THEN** the custom color is normalized to uppercase `#RRGGBB`
- **AND** the normalized color is persisted for the category
- **AND** no separate color save or discard action is displayed

#### Scenario: New category uses preset or custom color
- **WHEN** an editable user adds a new category from the configure categories dialog
- **THEN** the dialog allows selecting from basic preset colors before creation
- **AND** the dialog allows entering a custom hex color before creation
- **AND** creating the category persists the selected preset color, normalized custom hex color, or no color when none is selected

#### Scenario: Invalid custom color is not persisted
- **WHEN** an editable user enters a custom category color that is not a valid hex color
- **THEN** the dialog communicates the validation problem
- **AND** the invalid color is not persisted to an existing or newly created category

#### Scenario: Custom hex shorthand is normalized
- **WHEN** an editable user commits a valid shorthand custom hex color such as `#3AF`
- **THEN** the dialog normalizes the value to uppercase `#RRGGBB` form before persistence
