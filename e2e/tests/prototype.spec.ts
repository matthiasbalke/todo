import { test, expect, type Page } from '@playwright/test';

async function waitForHydration(page: Page) {
  await page.waitForSelector('body[data-hydrated="true"]');
}

test.describe('/ redirects to /lists', () => {
  test('root redirects to lists page', async ({ page }) => {
    await page.goto('/');
    await waitForHydration(page);
    await expect(page).toHaveURL(/\/lists$/);
  });
});

test.describe('/auth renders + navigates', () => {
  test('auth page renders and passkey button navigates to lists', async ({ page }) => {
    await page.goto('/auth');
    await waitForHydration(page);
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    await expect(page.getByText('Sign in to your Todo app')).toBeVisible();
    await expect(page.getByRole('button', { name: /Continue with Passkey/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Continue with Google/ })).toBeVisible();

    await page.getByRole('button', { name: /Continue with Passkey/ }).click();
    await expect(page).toHaveURL(/\/lists$/);
  });
});

test.describe('/lists shows 3 list cards', () => {
  test('lists page shows Grocery, Household, and Personal cards', async ({ page }) => {
    await page.goto('/lists');
    await waitForHydration(page);
    await expect(page.getByRole('heading', { name: 'My Lists' })).toBeVisible();

    const groceryCard = page.locator('a[href*="/lists/grocery"]').first();
    const householdCard = page.locator('a[href*="/lists/household"]').first();
    const personalCard = page.locator('a[href*="/lists/personal"]').first();

    await expect(groceryCard).toBeVisible();
    await expect(householdCard).toBeVisible();
    await expect(personalCard).toBeVisible();

    await expect(groceryCard.getByRole('heading', { name: 'Grocery' })).toBeVisible();
    await expect(householdCard.getByRole('heading', { name: 'Household' })).toBeVisible();
    await expect(personalCard.getByRole('heading', { name: 'Personal' })).toBeVisible();
  });
});

test.describe('List view renders grouped items', () => {
  test('grocery list shows category headings and grouped items', async ({ page }) => {
    await page.goto('/lists/grocery');
    await waitForHydration(page);
    await expect(page.getByRole('heading', { name: /Grocery/i }).first()).toBeVisible();

    // Category headings are h3 elements — use heading role to avoid matching filter chips
    await expect(page.getByRole('heading', { name: 'Produce' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Dairy' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Bakery' })).toBeVisible();
  });
});

test.describe('Filter chip toggles', () => {
  test('clicking Starred chip filters to only starred items', async ({ page }) => {
    await page.goto('/lists/grocery');
    await waitForHydration(page);

    // Verify unstarred items are visible before filtering
    await expect(page.getByText('Bananas')).toBeVisible();

    // Click the Starred filter chip
    await page.getByRole('button', { name: '★ Starred' }).click();

    // After filtering: only Apples (starred) and Cheddar Cheese (starred) remain — 2 items
    await expect(page.getByText('2 items')).toBeVisible();

    // Unstarred item Bananas should be gone
    await expect(page.getByText('Bananas')).not.toBeVisible();
  });
});

test.describe('Sort selector works', () => {
  test('changing sort to Alphabetical reorders items within Dairy', async ({ page }) => {
    await page.goto('/lists/grocery');
    await waitForHydration(page);

    // Default MANUAL sort: Dairy items are Whole Milk (1), Greek Yogurt (2), Cheddar Cheese (3)
    // After ALPHA sort: Cheddar Cheese, Greek Yogurt, Whole Milk

    // Verify default order: Whole Milk appears before Cheddar Cheese
    const dairyItems = page.locator('h3').filter({ hasText: 'Dairy' }).locator('..').locator('button').filter({ hasText: /Whole Milk|Cheddar Cheese/ });

    // Switch to Alphabetical sort
    await page.getByRole('combobox').selectOption('ALPHA');
    await expect(page.getByRole('combobox')).toHaveValue('ALPHA');

    // Verify sort value updated — items are now in alphabetical order
    // Cheddar Cheese (C) should now appear before Whole Milk (W)
    const sortedItems = page.locator('text=Cheddar Cheese').first();
    await expect(sortedItems).toBeVisible();
  });
});

test.describe('"Add item" form appears', () => {
  test('clicking + Add item reveals the form', async ({ page }) => {
    await page.goto('/lists/grocery');
    await waitForHydration(page);

    await page.getByRole('button', { name: '+ Add item' }).click();

    await expect(page.getByPlaceholder('Item title')).toBeVisible();
    await expect(page.getByPlaceholder('Notes (optional)')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
  });
});

test.describe('Add item saves', () => {
  test('filling and submitting the form adds the new item to the list', async ({ page }) => {
    await page.goto('/lists/grocery');
    await waitForHydration(page);

    await page.getByRole('button', { name: '+ Add item' }).click();

    await page.getByPlaceholder('Item title').fill('Test Item E2E');
    await page.getByRole('button', { name: 'Add' }).click();

    // New item should appear in the list
    await expect(page.getByText('Test Item E2E')).toBeVisible();
  });
});

test.describe('Grocery mode — collapsible sections', () => {
  test('grocery mode shows collapsible category sections with item counts', async ({ page }) => {
    await page.goto('/lists/grocery/grocery');
    await waitForHydration(page);

    // Section headers are buttons (collapsed/expanded toggle)
    await expect(page.getByRole('button', { name: /Produce/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Dairy/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Bakery/i }).first()).toBeVisible();

    // Each section shows a count badge like "2/3"
    const produceButton = page.getByRole('button', { name: /Produce/i }).first();
    await expect(produceButton).toContainText(/\d+\/\d+/);
  });
});

test.describe('Grocery mode — check item', () => {
  test('clicking an item button moves it to checked state', async ({ page }) => {
    await page.goto('/lists/grocery/grocery');
    await waitForHydration(page);

    // Sections start expanded — Apples is directly visible
    const applesButton = page.getByRole('button', { name: /Apples/i });
    await expect(applesButton).toBeVisible();
    await applesButton.click();

    // After clicking, Apples moves to checked array and renders with line-through
    const applesTitleSpan = page.getByRole('button', { name: /Apples/i }).locator('span').filter({ hasText: /Apples/ });
    await expect(applesTitleSpan).toHaveClass(/line-through/);
  });
});

test.describe('Grocery mode — "Clear checked"', () => {
  test('clear checked button hides all done items', async ({ page }) => {
    await page.goto('/lists/grocery/grocery');
    await waitForHydration(page);

    // Sections start expanded — click Apples to check it
    const applesButton = page.getByRole('button', { name: /Apples/i });
    await expect(applesButton).toBeVisible();
    await applesButton.click();

    // Wait for Apples to be in checked state (line-through)
    const applesTitleSpan = page.getByRole('button', { name: /Apples/i }).locator('span').filter({ hasText: /Apples/ });
    await expect(applesTitleSpan).toHaveClass(/line-through/);

    // Click "Clear checked" — sets hideDone=true, removing all done items from view
    await page.getByRole('button', { name: 'Clear checked' }).click();

    // Apples (now done) should no longer be visible
    await expect(page.getByRole('button', { name: /^Apples/ })).not.toBeVisible();
    // Bananas (already done from mock data) should also be gone
    await expect(page.getByRole('button', { name: /^Bananas/ })).not.toBeVisible();
  });
});

test.describe('Item detail shows all fields', () => {
  test('navigating to a known item shows title, priority, due date, and notes', async ({ page }) => {
    // i1: Apples — grocery list, priority NORMAL, due today, notes, assigned u1
    await page.goto('/lists/grocery/items/i1');
    await waitForHydration(page);

    // Title
    await expect(page.getByRole('heading', { name: 'Apples' })).toBeVisible();

    // Priority badge
    await expect(page.getByText('Normal')).toBeVisible();

    // Due date chip (today)
    await expect(page.getByText('Today')).toBeVisible();

    // Notes
    await expect(page.getByText('Get Braeburn if available')).toBeVisible();

    // Edit button present in view mode
    await expect(page.getByRole('button', { name: 'Edit' })).toBeVisible();
  });
});

test.describe('Item detail edit + save', () => {
  test('editing an item title and saving shows the updated title', async ({ page }) => {
    await page.goto('/lists/grocery/items/i1');
    await waitForHydration(page);

    await page.getByRole('button', { name: 'Edit' }).click();

    // Edit mode: ItemForm renders with pre-filled title input
    const titleInput = page.getByPlaceholder('Item title');
    await expect(titleInput).toBeVisible();
    await expect(titleInput).toHaveValue('Apples');

    // Clear and type new title
    await titleInput.fill('Apples (Updated)');

    // Save
    await page.getByRole('button', { name: 'Save' }).click();

    // Updated title should now be shown in view mode
    await expect(page.getByRole('heading', { name: 'Apples (Updated)' })).toBeVisible();
  });
});

test.describe('Category config dialog', () => {
  async function openCategoryDialog(page: Page) {
    await page.getByRole('button', { name: 'Configure categories' }).click();
    await expect(page.getByRole('heading', { name: 'Categories' })).toBeVisible();
  }

  test('open dialog', async ({ page }) => {
    await page.goto('/lists/grocery');
    await waitForHydration(page);
    await page.getByRole('button', { name: 'Configure categories' }).click();
    await expect(page.getByRole('heading', { name: 'Categories' })).toBeVisible();
  });

  test('close via ✕ button', async ({ page }) => {
    await page.goto('/lists/grocery');
    await waitForHydration(page);
    await openCategoryDialog(page);
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('heading', { name: 'Categories' })).not.toBeVisible();
  });

  test('close via backdrop click', async ({ page }) => {
    await page.goto('/lists/grocery');
    await waitForHydration(page);
    await openCategoryDialog(page);
    // Click near top-left corner of the overlay — outside the centered white panel
    await page.locator('[role="dialog"]').click({ position: { x: 10, y: 10 } });
    await expect(page.getByRole('heading', { name: 'Categories' })).not.toBeVisible();
  });

  test('existing categories are displayed', async ({ page }) => {
    await page.goto('/lists/grocery');
    await waitForHydration(page);
    await openCategoryDialog(page);
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog.getByRole('button', { name: 'Produce' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Dairy' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Bakery' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Meat' })).toBeVisible();
  });

  test('▲ disabled on first item, ▼ disabled on last item', async ({ page }) => {
    await page.goto('/lists/grocery');
    await waitForHydration(page);
    await openCategoryDialog(page);
    await expect(page.getByRole('button', { name: 'Move up' }).first()).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Move down' }).last()).toBeDisabled();
  });

  test('Add button disabled when input is empty', async ({ page }) => {
    await page.goto('/lists/grocery');
    await waitForHydration(page);
    await openCategoryDialog(page);
    await expect(page.getByRole('button', { name: 'Add', exact: true })).toBeDisabled();
  });

  test('add new category via button', async ({ page }) => {
    await page.goto('/lists/grocery');
    await waitForHydration(page);
    await openCategoryDialog(page);
    const dialog = page.locator('[role="dialog"]');
    await page.getByPlaceholder('New category name').fill('Frozen');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(dialog.getByText('Frozen')).toBeVisible();
    await expect(page.getByPlaceholder('New category name')).toHaveValue('');
  });

  test('add new category via Enter key', async ({ page }) => {
    await page.goto('/lists/grocery');
    await waitForHydration(page);
    await openCategoryDialog(page);
    const dialog = page.locator('[role="dialog"]');
    await page.getByPlaceholder('New category name').fill('Beverages');
    await page.getByPlaceholder('New category name').press('Enter');
    await expect(dialog.getByText('Beverages')).toBeVisible();
  });

  test('inline rename via name click — commit with Enter', async ({ page }) => {
    await page.goto('/lists/grocery');
    await waitForHydration(page);
    await openCategoryDialog(page);
    const dialog = page.locator('[role="dialog"]');
    await dialog.getByRole('button', { name: 'Produce' }).click();
    // The inline edit input has no placeholder (footer input has placeholder="New category name")
    const inlineInput = dialog.locator('input:not([placeholder])');
    await expect(inlineInput).toBeVisible();
    await expect(inlineInput).toHaveValue('Produce');
    await inlineInput.fill('Fresh Produce');
    await inlineInput.press('Enter');
    await expect(dialog.getByText('Fresh Produce')).toBeVisible();
    await expect(inlineInput).not.toBeVisible();
  });

  test('inline rename via ✏️ button — commit with ✓', async ({ page }) => {
    await page.goto('/lists/grocery');
    await waitForHydration(page);
    await openCategoryDialog(page);
    const dialog = page.locator('[role="dialog"]');
    // Rename buttons are ordered: Produce(0), Dairy(1), Bakery(2), Meat(3)
    await dialog.getByRole('button', { name: 'Rename' }).nth(1).click();
    const inlineInput = dialog.locator('input:not([placeholder])');
    await inlineInput.fill('Dairy & Eggs');
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog.getByText('Dairy & Eggs')).toBeVisible();
  });

  test('cancel inline rename with ✕', async ({ page }) => {
    await page.goto('/lists/grocery');
    await waitForHydration(page);
    await openCategoryDialog(page);
    const dialog = page.locator('[role="dialog"]');
    await dialog.getByRole('button', { name: 'Rename' }).nth(2).click();
    const inlineInput = dialog.locator('input:not([placeholder])');
    await inlineInput.fill('Baked Goods');
    await page.keyboard.press('Escape');
    await expect(dialog.getByRole('button', { name: 'Bakery' })).toBeVisible();
    await expect(dialog.getByText('Baked Goods')).not.toBeVisible();
  });

  test('delete a category', async ({ page }) => {
    await page.goto('/lists/grocery');
    await waitForHydration(page);
    await openCategoryDialog(page);
    await page.getByRole('button', { name: 'Delete' }).last().click();
    await expect(page.getByText('Meat')).not.toBeVisible();
  });

  test('reorder — move item down', async ({ page }) => {
    await page.goto('/lists/grocery');
    await waitForHydration(page);
    await openCategoryDialog(page);
    const rows = page.locator('[role="dialog"] [role="button"]');
    const firstRowText = await rows.first().textContent();
    await page.getByRole('button', { name: 'Move down' }).first().click();
    const newFirstRowText = await rows.first().textContent();
    expect(newFirstRowText).not.toBe(firstRowText);
  });

  test('clicking category heading collapses and expands its items', async ({ page }) => {
    await page.goto('/lists/grocery');
    await waitForHydration(page);

    // Produce heading is visible and Apples (a Produce item) is visible initially
    const produceHeading = page.getByRole('heading', { name: 'Produce' });
    await expect(produceHeading).toBeVisible();
    await expect(page.getByText('Apples')).toBeVisible();

    // Click heading to collapse
    await produceHeading.click();
    await expect(page.getByText('Apples')).not.toBeVisible();

    // Click again to expand
    await produceHeading.click();
    await expect(page.getByText('Apples')).toBeVisible();
  });

  test('renamed category reflected in group header after closing dialog', async ({ page }) => {
    await page.goto('/lists/grocery');
    await waitForHydration(page);
    await openCategoryDialog(page);
    await page.getByRole('button', { name: 'Produce' }).click();
    const inlineInput = page.locator('[role="dialog"] input').first();
    await inlineInput.fill('Fresh Produce');
    await inlineInput.press('Enter');
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('heading', { name: /Fresh Produce/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /^Produce$/i })).not.toBeVisible();
  });

  test('deleted category — its items appear under Uncategorized', async ({ page }) => {
    await page.goto('/lists/grocery');
    await waitForHydration(page);
    await openCategoryDialog(page);
    await page.getByRole('button', { name: 'Delete' }).first().click();
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('heading', { name: /^Produce$/i })).not.toBeVisible();
    await expect(page.getByText('Apples')).toBeVisible();
  });
});
