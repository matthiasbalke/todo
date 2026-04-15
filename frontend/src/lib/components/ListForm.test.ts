import { vi, describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import ListForm from './ListForm.svelte';

const oncancel = vi.fn();

describe('ListForm emoji extraction', () => {
  it('correctly extracts plain emoji without variation selector (🪡)', async () => {
    const onsubmit = vi.fn().mockResolvedValue(undefined);
    const { container } = render(ListForm, { props: { onsubmit, oncancel } });

    const input = container.querySelector('input[type="text"]')!;
    await fireEvent.input(input, { target: { value: '🪡 Sewing' } });
    await fireEvent.submit(container.querySelector('form')!);

    expect(onsubmit).toHaveBeenCalledWith({ name: 'Sewing', emoji: '🪡' });
  });

  it('correctly extracts emoji with variation selector (🏞️) and leaves clean title', async () => {
    const onsubmit = vi.fn().mockResolvedValue(undefined);
    const { container } = render(ListForm, { props: { onsubmit, oncancel } });

    const input = container.querySelector('input[type="text"]')!;
    await fireEvent.input(input, { target: { value: '🏞️ Landscape' } });
    await fireEvent.submit(container.querySelector('form')!);

    expect(onsubmit).toHaveBeenCalledWith({ name: 'Landscape', emoji: '🏞️' });
  });

  it('correctly extracts emoji with variation selector (🏷️) and leaves clean title', async () => {
    const onsubmit = vi.fn().mockResolvedValue(undefined);
    const { container } = render(ListForm, { props: { onsubmit, oncancel } });

    const input = container.querySelector('input[type="text"]')!;
    await fireEvent.input(input, { target: { value: '🏷️ Tags' } });
    await fireEvent.submit(container.querySelector('form')!);

    expect(onsubmit).toHaveBeenCalledWith({ name: 'Tags', emoji: '🏷️' });
  });

  it('correctly extracts emoji not followed by a space (🏞️SSE Test)', async () => {
    const onsubmit = vi.fn().mockResolvedValue(undefined);
    const { container } = render(ListForm, { props: { onsubmit, oncancel } });

    const input = container.querySelector('input[type="text"]')!;
    await fireEvent.input(input, { target: { value: '🏞️SSE Test' } });
    await fireEvent.submit(container.querySelector('form')!);

    expect(onsubmit).toHaveBeenCalledWith({ name: 'SSE Test', emoji: '🏞️' });
  });
});
