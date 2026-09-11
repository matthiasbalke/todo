import { expect, test, type Locator } from '@playwright/test';
import { registerPasskey, setupListWithItems, uniqueEmail, waitForHydration } from './helpers';

async function appearance(locator: Locator, pseudo?: string) {
 return locator.evaluate((element, pseudo) => {
  const style = getComputedStyle(element, pseudo);
  return { color: style.color, background: style.backgroundColor, border: style.borderTopColor,
   font: style.fontFamily, size: style.fontSize, line: style.lineHeight, italic: style.fontStyle,
   opacity: style.opacity, shadow: style.boxShadow };
 }, pseudo);
}

for (const width of [1280, 390]) {
 test(`foundation palettes and shared typography at ${width}px`, async ({ page }, testInfo) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width, height: 844 });
  await page.goto('/components');
  await waitForHydration(page);
  await page.addStyleTag({ content: '* { transition: none !important; }' });
  const section = page.locator('#foundation');
  const input = section.getByRole('textbox', { name: 'Foundation placeholder', exact: true });
  const textarea = section.getByRole('textbox', { name: 'Foundation notes', exact: true });
  const rendered = page.getByTestId('foundation-role-placeholder');
  const primary = section.getByRole('button', { name: 'Foundation primary', exact: true });
  const selected = section.getByRole('button', { name: 'Foundation selected', exact: true });
  const invalid = section.getByRole('button', { name: 'Foundation invalid', exact: true });
  const disabled = section.getByRole('textbox', { name: 'Foundation disabled', exact: true });
  const initial = await appearance(primary);
  const initialSurface = await appearance(section);
  const initialSelected = await appearance(selected);
  const initialInvalid = await appearance(invalid);
  const initialPlaceholder = await appearance(input, '::placeholder');
  const themeSelector = page.getByRole('combobox', { name: 'Theme' });
  for (const alternate of [false, true]) {
   if (alternate) {
    await themeSelector.click();
    await page.getByRole('option', { name: 'Diagnostic' }).click();
   }
   if (alternate) await expect(page.locator('html')).toHaveAttribute('data-diagnostic-palette', 'true');
   else await expect(page.locator('html')).not.toHaveAttribute('data-diagnostic-palette', 'true');
   const preview = await appearance(rendered);
   for (const field of [input, textarea]) {
    const placeholder = await appearance(field, '::placeholder');
    const text = await appearance(field);
    expect(placeholder.color).toBe(preview.color);
    expect(placeholder.italic).toBe(preview.italic);
    expect(text.font).toBe(preview.font);
    expect(text.size).toBe(preview.size);
    expect(parseFloat(text.size)).toBeGreaterThanOrEqual(16);
   }
   await expect(disabled).toBeDisabled();
   expect((await appearance(disabled)).opacity).toBe('0.5');
   const normal = await appearance(primary);
   await primary.hover();
   const hover = await appearance(primary);
   await primary.focus();
   await page.keyboard.press("Tab");
   await page.keyboard.press("Shift+Tab");
   await expect(primary).toBeFocused();
   expect((await appearance(primary)).shadow).not.toBe('none');
   if (alternate) {
    expect(normal.background).not.toBe(initial.background);
    expect((await appearance(section)).background).not.toBe(initialSurface.background);
    expect((await appearance(selected)).color).not.toBe(initialSelected.color);
    expect((await appearance(invalid)).border).not.toBe(initialInvalid.border);
    expect((await appearance(input, '::placeholder')).color).not.toBe(initialPlaceholder.color);
   } else {
    expect(hover.background).not.toBe(normal.background);
   }
   const validation = section.getByRole('textbox', { name: 'Foundation validation' });
   await validation.fill('x');
   await expect(validation).toHaveAttribute('aria-invalid', 'true');
   const menu = section.getByRole('combobox', { name: 'Foundation menu' });
   await menu.click();
   const popup = section.getByRole('listbox');
   await expect(popup).toBeVisible();
   expect((await appearance(popup)).background).toBe((await appearance(input)).background);
   await menu.press('Escape');
   await section.scrollIntoViewIfNeeded();
   await page.screenshot({ path: testInfo.outputPath(`foundation-${alternate ? 'alternate' : 'default'}.png`) });
  }
  // Changing one typography variable updates independent native and rendered controls.
  await page.evaluate(() => document.documentElement.style.setProperty('--ui-control-size', '18px'));
  for (const locator of [input, textarea, rendered]) expect((await appearance(locator)).size).toBe('18px');
  await page.evaluate(() => document.documentElement.style.removeProperty('--ui-control-size'));
  await themeSelector.click();
  await page.getByRole('option', { name: 'System' }).click();
  expect((await appearance(input, '::placeholder')).color).toBe(initialPlaceholder.color);
  expect((await appearance(section)).background).toBe(initialSurface.background);
 });

 test(`app surfaces and fullscreen notes use the production dark palette at ${width}px`, async ({ page, context }, testInfo) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width, height: 844 });
  await registerPasskey(page, context, 'Palette Reviewer', uniqueEmail('palette'));
  const { listId } = await setupListWithItems(page, 'Palette review', []);
  await page.goto(`/lists/${listId}`);
  await waitForHydration(page);
  await page.addStyleTag({ content: '* { transition: none !important; }' });
  const footer = page.getByTestId('fixed-action-footer');
  const original = await appearance(footer);
  await page.goto('/account');
  await waitForHydration(page);
  await page.getByRole('combobox', { name: 'Theme' }).click();
  await page.getByRole('option', { name: 'Dark' }).click();
  await expect(page.getByText('Preferences saved.')).toBeVisible();
  await page.goto(`/lists/${listId}`);
  await waitForHydration(page);
  await page.addStyleTag({ content: '* { transition: none !important; }' });
  expect((await appearance(footer)).background).not.toBe(original.background);
  await page.getByRole('button', { name: 'List options' }).click();
  const members = page.getByRole('button', { name: 'Members', exact: true });
  await expect(members).toBeVisible();
  expect((await appearance(members.locator('..'))).background).toBe((await appearance(footer)).background);
  await page.mouse.click(5, 400);
  await page.getByRole('button', { name: '+ add item', exact: true }).click();
  await page.getByPlaceholder('Item title').fill('Palette item');
  const preview = await appearance(page.getByTestId('item-form-notes-preview'));
  await page.getByRole('button', { name: 'Notes', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Notes' });
  const notes = dialog.getByRole('textbox', { name: 'Notes' });
  await expect(notes).toBeFocused();
  await expect(notes).toHaveAttribute('placeholder', 'add note');
  expect((await appearance(notes, '::placeholder')).color).toBe(preview.color);
  expect((await appearance(notes)).size).toBe(preview.size);
  expect((await appearance(dialog)).background).toBe((await appearance(footer)).background);
  await page.screenshot({ path: testInfo.outputPath('notes-alternate.png') });
  await notes.fill('Palette notes\nSecond line');
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByTestId('item-form-notes-preview')).toContainText('Palette notes');
 });
}
