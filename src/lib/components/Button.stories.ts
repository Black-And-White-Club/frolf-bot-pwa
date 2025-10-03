import type { Meta, StoryObj } from '@storybook/svelte';
import Button from './Button.svelte';

const meta: Meta<Button> = {
	title: 'Components/Button',
	component: Button,
	argTypes: {
		variant: {
			control: { type: 'select' },
			options: ['primary', 'secondary', 'danger']
		},
		size: {
			control: { type: 'select' },
			options: ['sm', 'md', 'lg']
		},
		disabled: { control: 'boolean' },
		type: {
			control: { type: 'select' },
			options: ['button', 'submit', 'reset']
		}
	}
};

export default meta;
type Story = StoryObj<Button>;

export const Primary: Story = {
	args: {
		variant: 'primary',
		children: 'Click me'
	}
};

export const Secondary: Story = {
	args: {
		variant: 'secondary',
		children: 'Secondary Button'
	}
};

export const Danger: Story = {
	args: {
		variant: 'danger',
		children: 'Delete'
	}
};

export const Small: Story = {
	args: {
		size: 'sm',
		children: 'Small Button'
	}
};

export const Large: Story = {
	args: {
		size: 'lg',
		children: 'Large Button'
	}
};

export const Disabled: Story = {
	args: {
		disabled: true,
		children: 'Disabled'
	}
};

export const DisabledPrimary: Story = {
	args: {
		variant: 'primary',
		disabled: true,
		children: 'Disabled Primary'
	}
};

export const DisabledSecondary: Story = {
	args: {
		variant: 'secondary',
		disabled: true,
		children: 'Disabled Secondary'
	}
};

export const DisabledDanger: Story = {
	args: {
		variant: 'danger',
		disabled: true,
		children: 'Disabled Danger'
	}
};
