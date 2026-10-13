import type React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Components
import BottomNav from './index';

const { pathnameMock } = vi.hoisted(() => {
    return {
        pathnameMock: vi.fn()
    };
});

vi.mock('next/navigation', () => {
    return {
        usePathname: pathnameMock
    };
});

const props: React.ComponentProps<typeof BottomNav> = {
    dueCount: 0
};

describe('<BottomNav />', () => {
    it('renders the primary navigation landmark with every tab', () => {
        pathnameMock.mockReturnValue('/');

        render(<BottomNav {...props} />);

        expect(screen.getByRole('navigation', {
            name: 'Primary'
        })).toBeInTheDocument();
        expect(screen.getAllByRole('link')).toHaveLength(4);
    });

    it.each([{
        label: 'My Plants',
        href: '/'
    }, {
        label: 'Identify',
        href: '/identify'
    }, {
        label: 'Care',
        href: '/care'
    }, {
        label: 'Settings',
        href: '/settings'
    }])('links the $label tab to $href', ({ label, href }) => {
        pathnameMock.mockReturnValue('/');

        render(<BottomNav {...props} />);

        expect(screen.getByRole('link', {
            name: label
        })).toHaveAttribute('href', href);
    });

    it.each([{
        pathname: '/',
        active: 'My Plants'
    }, {
        pathname: '/plants/plant-1',
        active: 'My Plants'
    }, {
        pathname: '/identify',
        active: 'Identify'
    }, {
        pathname: '/care',
        active: 'Care'
    }, {
        pathname: '/settings',
        active: 'Settings'
    }])('marks $active as the current page on $pathname', ({ pathname, active }) => {
        pathnameMock.mockReturnValue(pathname);

        render(<BottomNav {...props} />);

        expect(screen.getByRole('link', {
            current: 'page'
        })).toHaveAccessibleName(active);
    });

    it('shows the due count on the care tab when plants are due', () => {
        pathnameMock.mockReturnValue('/');

        render(<BottomNav {...props} dueCount={3} />);

        expect(screen.getByRole('link', {
            name: 'Care3'
        })).toBeInTheDocument();
    });

    it('shows no badge when nothing is due', () => {
        pathnameMock.mockReturnValue('/');

        render(<BottomNav {...props} />);

        expect(screen.getByRole('link', {
            name: 'Care'
        })).toBeInTheDocument();
        expect(screen.queryByRole('link', {
            name: /Care\d/
        })).not.toBeInTheDocument();
    });
});
