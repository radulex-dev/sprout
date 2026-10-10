import type { Preview } from '@storybook/nextjs-vite';

// Styles
import '../../app/globals.css';

const preview: Preview = {
    parameters: {
        layout: 'centered',
        controls: {
            expanded: true,
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i
            }
        }
    }
};

export default preview;
