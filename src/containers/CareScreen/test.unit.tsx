import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { makePlant } from '@test/vitest/data/plant.mock';

// Components
import CareScreen from './index';

const { pushMock } = vi.hoisted(() => {
    return {
        pushMock: vi.fn()
    };
});

vi.mock('next/navigation', () => {
    return {
        useRouter: () => {
            return {
                push: pushMock,
                refresh: vi.fn()
            };
        }
    };
});

describe('CareScreen', () => {
    it('opens the plant page when a task row is activated', async () => {
        const plant = makePlant();
        const user = userEvent.setup();

        render(<CareScreen plants={[plant]} />);
        await user.click(screen.getByRole('button', {
            name: /Water/
        }));

        expect(pushMock).toHaveBeenCalledWith(`/plants/${plant.id}`);
    });

    it('offers no done action inside a task row', () => {
        render(<CareScreen plants={[makePlant()]} />);

        expect(screen.queryByRole('button', {
            name: 'Done'
        })).not.toBeInTheDocument();
    });
});
