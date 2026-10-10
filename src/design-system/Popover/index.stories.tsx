import type { Meta, StoryObj } from '@storybook/nextjs-vite';

// Components
import Popover from './index';

const meta = {
    title: 'Components/Popover',
    component: Popover,
    tags: ['autodocs'],
    args: {
        trigger: 'Care details',
        children: 'Water every 7 days. Fertilise monthly in spring and summer.'
    },
    argTypes: {
        onClick: {
            action: 'clicked'
        }
    }
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const RichContent: Story = {
    args: {
        trigger: 'Why these defaults?',
        children: (
            <div>
                <p>Defaults come from PlantSolve reference data for this genus.</p>
                <p>You can edit every interval per plant.</p>
            </div>
        )
    }
};
