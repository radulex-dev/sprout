import type React from 'react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Components
import CareScreen from './index';

// Mocks
import { makePlant } from '@test/vitest/data/plant.mock';

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

const props: React.ComponentProps<typeof CareScreen> = {
    plants: [makePlant()]
};

describe('CareScreen', () => {
    it('opens the plant page when a task row is activated', async () => {
        const user = userEvent.setup();

        render(<CareScreen {...props} />);
        await user.click(screen.getByRole('button', {
            name: /Water/
        }));

        expect(pushMock).toHaveBeenCalledWith(`/plants/${makePlant().id}`);
    });

    it('offers no done action inside a task row', () => {
        render(<CareScreen {...props} />);

        expect(screen.queryByRole('button', {
            name: 'Done'
        })).not.toBeInTheDocument();
    });
});
