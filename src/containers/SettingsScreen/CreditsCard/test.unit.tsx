import type React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

// Constants
import { CREDITS_TITLE, PLANTNET_LINK_LABEL, PLANTNET_URL } from './constants';

// Components
import CreditsCard from './index';

const props: React.ComponentProps<typeof CreditsCard> = {};

describe('<CreditsCard />', () => {
    it('names the data source', () => {
        render(<CreditsCard {...props} />);

        const plantNetLink = screen.getByRole('link', {
            name: PLANTNET_LINK_LABEL
        });

        expect(screen.getByText(CREDITS_TITLE)).toBeInTheDocument();
        expect(plantNetLink).toBeInTheDocument();
    });

    it('links the source externally and safely', () => {
        render(<CreditsCard {...props} />);

        const plantNetLink = screen.getByRole('link', {
            name: PLANTNET_LINK_LABEL
        });

        expect(plantNetLink).toHaveAttribute('href', PLANTNET_URL);
        expect(plantNetLink).toHaveAttribute('target', '_blank');
        expect(plantNetLink).toHaveAttribute('rel', 'noreferrer');
    });

    it('gives the link a descriptive name rather than a bare url', () => {
        render(<CreditsCard {...props} />);

        expect(screen.queryByRole('link', {
            name: PLANTNET_URL
        })).not.toBeInTheDocument();
    });
});
