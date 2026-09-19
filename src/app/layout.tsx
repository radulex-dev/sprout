import classNames from 'classnames';
import localFont from 'next/font/local';
import type { Metadata, Viewport } from 'next';

// Components
import Analytics from '@/components/Analytics';
import SiteCore from '@/components/SiteCore';

// Styles
import './globals.css';

const font = localFont({
    src: '../assets/fonts/manrope/Manrope-latin.woff2',
    variable: '--font-manrope',
    display: 'swap'
});

export const metadata: Metadata = {
    title: {
        default: 'Sprout — Plant Tracker',
        template: '%s · Sprout'
    },
    description: 'Track your houseplants, identify species with your camera, and never miss a watering.',
    applicationName: 'Sprout',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'Sprout'
    },
    icons: {
        icon: [{
            url: '/favicon.ico',
            sizes: '48x48'
        }, {
            url: '/icon.svg',
            type: 'image/svg+xml'
        }],
        apple: [{
            url: '/apple-touch-icon.png',
            sizes: '180x180'
        }]
    }
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
    themeColor: '#0F6B45'
};

interface Props extends React.ComponentProps<'html'> {
    children: React.ReactNode;
}

const RootLayout = ({ children, className, ...props }: Props) => {
    const classes = classNames(className, font.variable);

    return (
        <html lang="en" {...props} className={classes}>
            <body>
                <SiteCore>
                    {children}
                </SiteCore>
                <Analytics />
            </body>
        </html>
    );
};

export default RootLayout;
