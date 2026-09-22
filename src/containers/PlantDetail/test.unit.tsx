import type React from 'react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Components
import PlantDetail from './index';

// Mocks
import { makePlant } from '@test/vitest/data/plant.mock';

// Database
import { markCareDone } from '@/lib/db/actions';

vi.mock('next/navigation', () => {
    return {
        useRouter: () => {
            return {
                push: vi.fn(),
                refresh: vi.fn()
            };
        }
    };
});

vi.mock('@/lib/db/actions', () => {
    return {
        deletePlant: vi.fn(),
        markCareDone: vi.fn(),
        updatePlant: vi.fn()
    };
});

const props: React.ComponentProps<typeof PlantDetail> = {
    plant: makePlant()
};

describe('PlantDetail', () => {
    it('shows a notice when logging care fails', async () => {
        const user = userEvent.setup();
        vi.mocked(markCareDone).mockRejectedValue(new Error('db down'));

        render(<PlantDetail {...props} />);
        await user.click(screen.getByRole('button', {
            name: 'Watered today'
        }));

        expect(await screen.findByText('Couldn\'t log that care. Please try again.')).toBeInTheDocument();
    });
});
