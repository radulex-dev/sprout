import type React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

// Components
import PlantsEmptyState from './index';

const props: React.ComponentProps<typeof PlantsEmptyState> = {};

describe('<PlantsEmptyState />', () => {
    it('renders the empty-state heading and guidance', () => {
        render(<PlantsEmptyState {...props} />);

        expect(screen.getByRole('heading', {
            name: 'No plants yet'
        })).toBeInTheDocument();
        expect(screen.getByText(/Point your camera at a plant/)).toBeInTheDocument();
    });

    it('links to the identify screen', () => {
        render(<PlantsEmptyState {...props} />);

        expect(screen.getByRole('link', {
            name: /Identify your first plant/
        })).toHaveAttribute('href', '/identify');
    });
});
