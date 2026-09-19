import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

// Constants
import { NEXT_MONTH_LABEL, PREVIOUS_MONTH_LABEL, SELECT_DATE_TEXT } from './constants';

// Components
import DateSelect from './index';

const VALUE = '2026-09-12';
const MAX = '2026-09-30';
const TRIGGER_NAME = `Last watered: ${SELECT_DATE_TEXT}`;

describe('DateSelect', () => {
    it('renders an icon-only trigger with the accessible name', () => {
        render(<DateSelect label="Last watered" value={VALUE} max={MAX} onSelect={vi.fn()} />);

        const trigger = screen.getByRole('button', {
            name: TRIGGER_NAME
        });

        expect(trigger).not.toHaveTextContent(SELECT_DATE_TEXT);
    });

    it('opens the calendar on the stored month', async () => {
        const user = userEvent.setup();

        render(<DateSelect label="Last watered" value={VALUE} max={MAX} onSelect={vi.fn()} />);

        await user.click(screen.getByRole('button', {
            name: TRIGGER_NAME
        }));

        expect(await screen.findByText('September 2026')).toBeInTheDocument();
        expect(screen.getByRole('dialog', {
            name: 'Last watered'
        })).toBeInTheDocument();
    });

    it('reports the picked day and returns focus to the trigger', async () => {
        const handleSelect = vi.fn();
        const user = userEvent.setup();

        render(<DateSelect label="Last watered" value={VALUE} max={MAX} onSelect={handleSelect} />);

        const trigger = screen.getByRole('button', {
            name: TRIGGER_NAME
        });

        await user.click(trigger);
        await user.click(screen.getByRole('button', {
            name: 'September 15, 2026'
        }));

        expect(handleSelect).toHaveBeenCalledWith('2026-09-15');

        await waitFor(() => {
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });
        expect(trigger).toHaveFocus();
    });

    it('disables days after the max date', async () => {
        const user = userEvent.setup();

        render(<DateSelect label="Last watered" value={VALUE} max="2026-09-20" onSelect={vi.fn()} />);

        await user.click(screen.getByRole('button', {
            name: TRIGGER_NAME
        }));

        expect(screen.getByRole('button', {
            name: 'September 21, 2026'
        })).toBeDisabled();
        expect(screen.getByRole('button', {
            name: 'September 20, 2026'
        })).toBeEnabled();
    });

    it('advances to the next month', async () => {
        const user = userEvent.setup();

        render(<DateSelect label="Last watered" value={VALUE} max={MAX} onSelect={vi.fn()} />);

        await user.click(screen.getByRole('button', {
            name: TRIGGER_NAME
        }));
        await user.click(screen.getByRole('button', {
            name: NEXT_MONTH_LABEL
        }));

        expect(await screen.findByText('October 2026')).toBeInTheDocument();
        expect(screen.queryByText('September 2026')).not.toBeInTheDocument();
    });

    it('steps back to the previous month', async () => {
        const user = userEvent.setup();

        render(<DateSelect label="Last watered" value={VALUE} max={MAX} onSelect={vi.fn()} />);

        await user.click(screen.getByRole('button', {
            name: TRIGGER_NAME
        }));
        await user.click(screen.getByRole('button', {
            name: PREVIOUS_MONTH_LABEL
        }));

        expect(await screen.findByText('August 2026')).toBeInTheDocument();
        expect(screen.queryByText('September 2026')).not.toBeInTheDocument();
    });
});
