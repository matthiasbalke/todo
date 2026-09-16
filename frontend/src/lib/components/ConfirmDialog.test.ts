import { cleanup, fireEvent, render, screen, within } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ConfirmDialog from './ConfirmDialog.svelte';

const body = createRawSnippet(() => ({
	render: () => '<p>Delete the selected data permanently.</p>'
}));

afterEach(cleanup);

describe('ConfirmDialog', () => {
	it('renders destructive confirmation content and calls cancel', async () => {
		const oncancel = vi.fn();
		const onconfirm = vi.fn();
		render(ConfirmDialog, {
			props: {
				title: 'Delete data?',
				confirmLabel: 'Delete',
				oncancel,
				onconfirm,
				children: body
			}
		});

		const dialog = screen.getByRole('dialog', { name: 'Delete data?' });
		expect(dialog).toHaveTextContent('Delete the selected data permanently.');

		await fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

		expect(oncancel).toHaveBeenCalledOnce();
		expect(onconfirm).not.toHaveBeenCalled();
	});

	it('calls confirm from the destructive action', async () => {
		const onconfirm = vi.fn();
		render(ConfirmDialog, {
			props: {
				title: 'Delete data?',
				confirmLabel: 'Delete',
				oncancel: vi.fn(),
				onconfirm,
				children: body
			}
		});

		await fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

		expect(onconfirm).toHaveBeenCalledOnce();
	});

	it('shows errors and disables actions while pending', async () => {
		const oncancel = vi.fn();
		const onconfirm = vi.fn();
		render(ConfirmDialog, {
			props: {
				title: 'Delete data?',
				confirmLabel: 'Delete',
				loadingLabel: 'Deleting...',
				error: 'Delete failed',
				pending: true,
				oncancel,
				onconfirm,
				children: body
			}
		});

		expect(screen.getByText('Delete failed')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
		expect(screen.getByRole('button', { name: 'Deleting...' })).toBeDisabled();

		await fireEvent.click(screen.getByRole('button', { name: 'Deleting...' }));

		expect(onconfirm).not.toHaveBeenCalled();
		expect(oncancel).not.toHaveBeenCalled();
	});
});
