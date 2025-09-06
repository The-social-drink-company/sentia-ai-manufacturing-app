// Storybook stories for Button component

import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { Download, Plus, Settings } from 'lucide-react';
import { Button } from './Button';
import { ThemeProvider } from '@/lib/design-system';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Enterprise-grade Button component with loading states, icons, and accessibility features.'
      }
    }
  },
  decorators: [
    (Story) => (
      <ThemeProvider>
        <Story />
      </ThemeProvider>
    )
  ],
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link', 'success', 'warning', 'market']
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'xl', 'icon']
    },
    loading: {
      control: 'boolean'
    },
    disabled: {
      control: 'boolean'
    },
    fullWidth: {
      control: 'boolean'
    },
    onClick: {
      action: 'clicked'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Button',
    onClick: action('button-clicked')
  }
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="default">Default</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
      <Button variant="success">Success</Button>
      <Button variant="warning">Warning</Button>
      <Button variant="market">Market</Button>
    </div>
  )
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra Large</Button>
    </div>
  )
};

export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button leftIcon={<Plus className="h-4 w-4" />}>
        Add Item
      </Button>
      <Button rightIcon={<Download className="h-4 w-4" />}>
        Download
      </Button>
      <Button 
        leftIcon={<Settings className="h-4 w-4" />}
        rightIcon={<Download className="h-4 w-4" />}
      >
        Export Settings
      </Button>
      <Button variant="outline" size="icon">
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  )
};

export const LoadingStates: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button loading>Loading</Button>
      <Button loading loadingText="Saving...">Save</Button>
      <Button 
        loading 
        loadingText="Processing..."
        leftIcon={<Settings className="h-4 w-4" />}
      >
        Process Data
      </Button>
    </div>
  )
};

export const DisabledStates: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button disabled>Disabled</Button>
      <Button variant="outline" disabled>Disabled Outline</Button>
      <Button variant="destructive" disabled>Disabled Destructive</Button>
    </div>
  )
};

export const FullWidth: Story = {
  render: () => (
    <div className="w-96 space-y-4">
      <Button fullWidth>Full Width Default</Button>
      <Button variant="outline" fullWidth>Full Width Outline</Button>
      <Button variant="destructive" fullWidth>Full Width Destructive</Button>
    </div>
  )
};

export const WithTooltip: Story = {
  render: () => (
    <div className="flex gap-4 p-8">
      <Button tooltip="This is a helpful tooltip">Hover for tooltip</Button>
      <Button 
        variant="outline" 
        size="icon"
        tooltip="Settings"
      >
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  )
};

export const InteractiveDemo: Story = {
  args: {
    children: 'Interactive Button',
    onClick: action('button-clicked'),
    'data-testid': 'interactive-button'
  }
};

export const AccessibilityDemo: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2 font-semibold">Keyboard Navigation</h3>
        <p className="mb-4 text-sm text-gray-600">Use Tab to navigate, Enter or Space to activate</p>
        <div className="flex gap-2">
          <Button>First</Button>
          <Button variant="outline">Second</Button>
          <Button variant="ghost">Third</Button>
        </div>
      </div>
      
      <div>
        <h3 className="mb-2 font-semibold">Screen Reader Support</h3>
        <p className="mb-4 text-sm text-gray-600">Proper ARIA attributes and loading states</p>
        <div className="flex gap-2">
          <Button loading loadingText="Processing" aria-describedby="loading-desc">
            Process
          </Button>
          <Button disabled aria-describedby="disabled-desc">
            Disabled Action
          </Button>
        </div>
        <p id="loading-desc" className="sr-only">This button is currently processing your request</p>
        <p id="disabled-desc" className="sr-only">This action is currently unavailable</p>
      </div>
    </div>
  )
};