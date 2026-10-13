import type React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

// Components
import CareEmptyState from './index';

const CALLER_CLASS_NAME = 'caller-class-name';

const props: React.ComponentProps<typeof CareEmptyState> = {
    className: CALLER_CLASS_NAME
};

describe('<CareEmptyState />', () => {
    it('tells the user there is nothing due and how tasks arrive', () => {
        render(<CareEmptyState {...props} />);

        expect(screen.getByRole('heading', {
            name: 'Nothing to do yet'
        })).toBeInTheDocument();
        expect(screen.getByText('Add plants and their watering, fertilising and repotting tasks will show up here.')).toBeInTheDocument();
    });

    it('merges the caller class onto the root', () => {
        const { container } = render(<CareEmptyState {...props} />);

        expect(container.firstElementChild).toHaveClass(CALLER_CLASS_NAME);
    });

    it('renders the droplet icon as decorative', () => {
        render(<CareEmptyState {...props} />);

        expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
});
