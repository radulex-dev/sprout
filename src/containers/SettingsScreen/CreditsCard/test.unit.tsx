import type React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

// Constants
import { CREDITS_TITLE, PLANTNET_LINK_LABEL, PLANTNET_URL, PLANTSOLVE_LINK_LABEL, PLANTSOLVE_URL } from './constants';

// Components
import CreditsCard from './index';

const CALLER_CLASS_NAME = 'caller-class-name';

const EXTERNAL_LINKS: [string, string][] = [
    [PLANTSOLVE_LINK_LABEL, PLANTSOLVE_URL],
    [PLANTNET_LINK_LABEL, PLANTNET_URL]
];

const props: React.ComponentProps<typeof CreditsCard> = {};

describe('CreditsCard', () => {
    it('names both data sources and states the CC BY 4.0 licence', () => {
        render(<CreditsCard {...props} />);

        const plantSolveLink = screen.getByRole('link', {
            name: PLANTSOLVE_LINK_LABEL
        });
        const plantNetLink = screen.getByRole('link', {
            name: PLANTNET_LINK_LABEL
        });

        expect(screen.getByText(CREDITS_TITLE)).toBeInTheDocument();
        expect(screen.getByText(/CC BY 4\.0/)).toBeInTheDocument();
        expect(plantSolveLink).toBeInTheDocument();
        expect(plantNetLink).toBeInTheDocument();
    });

    it('links each source externally and safely', () => {
        render(<CreditsCard {...props} />);

        for (const [label, href] of EXTERNAL_LINKS) {
            const link = screen.getByRole('link', {
                name: label
            });

            expect(link).toHaveAttribute('href', href);
            expect(link).toHaveAttribute('target', '_blank');
            expect(link).toHaveAttribute('rel', 'noreferrer');
        }
    });

    it('gives the links descriptive names rather than bare urls', () => {
        render(<CreditsCard {...props} />);

        for (const [, href] of EXTERNAL_LINKS) {
            const bareUrlLink = screen.queryByRole('link', {
                name: href
            });

            expect(bareUrlLink).not.toBeInTheDocument();
        }
    });

    it('spreads props and className onto the root element', () => {
        render(<CreditsCard {...props} data-testid="credits" className={CALLER_CLASS_NAME} />);

        const root = screen.getByTestId('credits');

        expect(root.tagName).toBe('DIV');
        expect(root).toHaveClass(CALLER_CLASS_NAME);
    });
});
