import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TimezonePicker from './TimezonePicker.svelte';
import TimezonePickerBinding from './test/TimezonePickerBinding.svelte';
import {
	createTimeZoneOptions,
	formatTimeZoneLabel,
	isValidTimeZone
} from './timezonePicker';

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

describe('TimezonePicker helpers', () => {
	it('generates valid IANA options with UTC first and retains selected and detected values', () => {
		const options = createTimeZoneOptions({
			selected: 'Pacific/Auckland',
			detectedTimeZone: 'Asia/Tokyo',
			supportedTimeZones: ['Europe/Berlin', 'America/New_York', 'Europe/Berlin']
		});

		expect(options[0]).toBe('UTC');
		expect(options).toEqual(
			expect.arrayContaining([
				'UTC',
				'Europe/Berlin',
				'America/New_York',
				'Pacific/Auckland',
				'Asia/Tokyo'
			])
		);
		expect(options.every(isValidTimeZone)).toBe(true);
	});

	it('falls back to UTC plus valid current and browser-detected values', () => {
		expect(
			createTimeZoneOptions({
				selected: 'Europe/Berlin',
				detectedTimeZone: 'America/Chicago',
				supportedTimeZones: null
			})
		).toEqual(['UTC', 'Europe/Berlin', 'America/Chicago']);
	});

	it('formats friendly labels without changing identifiers', () => {
		expect(formatTimeZoneLabel('UTC')).toBe('UTC');
		expect(formatTimeZoneLabel('Europe/Berlin')).toBe('Berlin (Europe)');
		expect(formatTimeZoneLabel('America/Argentina/Buenos_Aires')).toBe(
			'Buenos Aires (America / Argentina)'
		);
	});
});

describe('TimezonePicker', () => {
	it('renders friendly labels while preserving IANA option values', async () => {
		vi.spyOn(Intl, 'supportedValuesOf').mockReturnValue([
			'America/New_York',
			'Europe/Berlin'
		]);
		const onSelect = vi.fn();
		render(TimezonePicker, {
			props: {
				selected: 'Europe/Berlin',
				label: 'Account timezone',
				onSelect
			}
		});

		const trigger = screen.getByRole('combobox', { name: 'Account timezone' });
		expect(trigger).toHaveValue('Berlin (Europe)');

		await fireEvent.click(trigger);
		expect(screen.getByRole('listbox', { name: 'Account timezone' })).toBeInTheDocument();
		await fireEvent.click(screen.getByRole('option', { name: 'New York (America)' }));

		expect(onSelect).toHaveBeenCalledWith('America/New_York');
		expect(trigger).toHaveValue('New York (America)');
	});

	it('uses shared Select keyboard behavior and supports bind:selected', async () => {
		vi.spyOn(Intl, 'supportedValuesOf').mockReturnValue(['Europe/Berlin']);
		render(TimezonePickerBinding);

		const trigger = screen.getByRole('combobox', { name: 'Bound timezone' });
		await fireEvent.keyDown(trigger, { key: 'ArrowDown' });
		expect(screen.getByRole('listbox', { name: 'Bound timezone' })).toBeInTheDocument();
		await fireEvent.keyDown(trigger, { key: 'End' });
		await fireEvent.keyDown(trigger, { key: 'Enter' });

		expect(screen.getByRole('status')).toHaveTextContent('Europe/Berlin');
		expect(trigger).toHaveValue('Berlin (Europe)');
	});

	it('forwards the disabled state to shared Select', async () => {
		render(TimezonePicker, {
			props: { selected: 'UTC', label: 'Locked timezone', disabled: true }
		});

		const trigger = screen.getByRole('combobox', { name: 'Locked timezone' });
		expect(trigger).toBeDisabled();
		await fireEvent.click(trigger);
		expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
	});

	it('keeps fallback options usable when browser enumeration is unavailable', async () => {
		vi.spyOn(Intl, 'supportedValuesOf').mockImplementation(() => {
			throw new TypeError('unsupported');
		});
		vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
			locale: 'en-US',
			calendar: 'gregory',
			numberingSystem: 'latn',
			timeZone: 'Asia/Tokyo'
		});
		render(TimezonePicker, {
			props: { selected: 'Europe/Berlin', label: 'Fallback timezone' }
		});

		await fireEvent.click(screen.getByRole('combobox', { name: 'Fallback timezone' }));
		expect(screen.getAllByRole('option').map((option) => option.textContent?.trim())).toEqual([
			'UTC',
			'Berlin (Europe)',
			'Tokyo (Asia)'
		]);
	});
});
