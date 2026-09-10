import { cleanup, render, screen } from '@testing-library/svelte';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import Icon from './Icon.svelte';
import {
	appIcons,
	iconSizePresets,
	iconTouchTargetPresets,
	type AppIconName
} from './iconRegistry';

afterEach(cleanup);

describe('Icon', () => {
	it('registers the required semantic icon names', () => {
		const requiredNames: AppIconName[] = [
			'back',
			'menu',
			'status',
				'done',
				'plus',
				'group',
				'next',
				'expand',
				'collapse'
			];

		for (const name of requiredNames) {
			expect(appIcons[name], `${name} should be registered`).toBeDefined();
		}
	});

	it('renders decorative icons by default', () => {
		const { container } = render(Icon, { props: { name: 'plus' } });

		const icon = container.querySelector('svg');
		expect(icon).toBeInTheDocument();
		expect(icon).toHaveAttribute('aria-hidden', 'true');
		expect(icon).not.toHaveAttribute('aria-label');
	});

	it('supports accessible icon-only usage with a label', () => {
		render(Icon, { props: { name: 'menu', label: 'Open menu' } });

		const icon = screen.getByRole('img', { name: 'Open menu' });
		expect(icon).toBeInTheDocument();
		expect(icon).not.toHaveAttribute('aria-hidden');
	});

	it('applies named sizing presets', () => {
		const { container } = render(Icon, { props: { name: 'back', size: 'header' } });

		const icon = container.querySelector('svg');
		expect(icon).toHaveAttribute('width', String(iconSizePresets.header.size));
		expect(icon).toHaveAttribute('height', String(iconSizePresets.header.size));
		expect(icon).toHaveAttribute('stroke-width', String(iconSizePresets.header.strokeWidth));
	});

	it('supports explicit size and stroke overrides', () => {
		const { container } = render(Icon, {
			props: { name: 'status', size: 22, strokeWidth: 2.5 }
		});

		const icon = container.querySelector('svg');
		expect(icon).toHaveAttribute('width', '22');
		expect(icon).toHaveAttribute('height', '22');
		expect(icon).toHaveAttribute('stroke-width', '2.5');
	});

	it('applies semantic tone classes alongside layout classes', () => {
		const { container } = render(Icon, {
			props: { name: 'check', tone: 'menuSelected', class: 'flex-shrink-0' }
		});

		const icon = container.querySelector('svg');
		expect(icon).toHaveClass('flex-shrink-0', 'text-menu-selected');
	});

	it('applies muted semantic tone classes', () => {
		const { container } = render(Icon, {
			props: { name: 'next', tone: 'muted' }
		});

		const icon = container.querySelector('svg');
		expect(icon).toHaveClass('text-faint');
	});

	it('defines icon-only touch target presets for shared controls', () => {
		expect(iconTouchTargetPresets.control.className).toContain('h-10');
		expect(iconTouchTargetPresets.controlCompact.className).toContain('h-8');
		expect(iconTouchTargetPresets.header.className).toContain('h-11');
	});

	it('uses explicit per-icon Lucide imports for tree-shaking', () => {
		const source = readFileSync(join(process.cwd(), 'src/lib/components/iconRegistry.ts'), 'utf8');

		expect(source).not.toContain("from '@lucide/svelte'");
		expect(source).not.toContain('import * as');
		expect(source).toMatch(/from '@lucide\/svelte\/icons\/chevron-left'/);
		expect(source).toMatch(/from '@lucide\/svelte\/icons\/chevron-right'/);
		expect(source).toMatch(/from '@lucide\/svelte\/icons\/menu'/);
	});
});
