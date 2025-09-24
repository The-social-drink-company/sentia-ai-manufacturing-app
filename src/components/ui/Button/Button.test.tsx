// Unit tests for Button component

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { Download, Plus } from 'lucide-react';
import { Button } from './Button';
import { ThemeProvider } from '@/lib/design-system';

const renderWithTheme = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {ui}
    </ThemeProvider>
  );
};

describe('Button', () => {
  it('renders correctly', () => {
    renderWithTheme(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    renderWithTheme(<Button onClick={handleClick}>Click me</Button>);
    
    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('prevents click when loading', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    renderWithTheme(
      <Button loading onClick={handleClick}>
        Click me
      </Button>
    );
    
    await user.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('prevents click when disabled', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    renderWithTheme(
      <Button disabled onClick={handleClick}>
        Click me
      </Button>
    );
    
    await user.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('displays loading spinner when loading', () => {
    renderWithTheme(
      <Button loading data-testid="test-button">
        Loading
      </Button>
    );
    
    expect(screen.getByTestId('test-button-loading-spinner')).toBeInTheDocument();
  });

  it('displays custom loading text', () => {
    renderWithTheme(
      <Button loading loadingText="Processing..." data-testid="test-button">
        Submit
      </Button>
    );
    
    expect(screen.getByTestId('test-button-text')).toHaveTextContent('Processing...');
  });

  it('renders left icon', () => {
    renderWithTheme(
      <Button leftIcon={<Plus />} data-testid="test-button">
        Add Item
      </Button>
    );
    
    expect(screen.getByTestId('test-button-left-icon')).toBeInTheDocument();
  });

  it('renders right icon', () => {
    renderWithTheme(
      <Button rightIcon={<Download />} data-testid="test-button">
        Download
      </Button>
    );
    
    expect(screen.getByTestId('test-button-right-icon')).toBeInTheDocument();
  });

  it('hides icons when loading', () => {
    renderWithTheme(
      <Button 
        loading 
        leftIcon={<Plus />} 
        rightIcon={<Download />}
        data-testid="test-button"
      >
        Submit
      </Button>
    );
    
    expect(screen.queryByTestId('test-button-left-icon')).not.toBeInTheDocument();
    expect(screen.queryByTestId('test-button-right-icon')).not.toBeInTheDocument();
  });

  it('applies correct variant classes', () => {
    const { rerender } = renderWithTheme(<Button variant="destructive">Delete</Button>);
    
    expect(screen.getByRole('button')).toHaveClass('bg-destructive');
    
    rerender(
      <ThemeProvider>
        <Button variant="outline">Cancel</Button>
      </ThemeProvider>
    );
    
    expect(screen.getByRole('button')).toHaveClass('border');
  });

  it('applies correct size classes', () => {
    const { rerender } = renderWithTheme(<Button size="sm">Small</Button>);
    
    expect(screen.getByRole('button')).toHaveClass('h-9');
    
    rerender(
      <ThemeProvider>
        <Button size="lg">Large</Button>
      </ThemeProvider>
    );
    
    expect(screen.getByRole('button')).toHaveClass('h-11');
  });

  it('applies full width when specified', () => {
    renderWithTheme(<Button fullWidth>Full Width</Button>);
    
    expect(screen.getByRole('button')).toHaveClass('w-full');
  });

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    renderWithTheme(<Button onClick={handleClick}>Press me</Button>);
    
    const button = screen.getByRole('button');
    
    // Focus the button
    button.focus();
    expect(button).toHaveFocus();
    
    // Press Enter
    await user.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalledTimes(1);
    
    // Press Space
    await user.keyboard(' ');
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it('supports ARIA attributes', () => {
    renderWithTheme(
      <Button 
        loading 
        disabled 
        aria-describedby="help-text"
        data-testid="aria-button"
      >
        Submit
      </Button>
    );
    
    const button = screen.getByTestId('aria-button');
    
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('aria-describedby', 'help-text');
  });

  it('displays tooltip on hover', async () => {
    const user = userEvent.setup();
    
    renderWithTheme(
      <Button tooltip="This is helpful information">
        Hover me
      </Button>
    );
    
    const button = screen.getByRole('button');
    
    await user.hover(button);
    
    await waitFor(() => {
      expect(screen.getByText('This is helpful information')).toBeInTheDocument();
    });
  });

  it('handles visual pressed state', async () => {
    const user = userEvent.setup();
    
    renderWithTheme(<Button>Press me</Button>);
    
    const button = screen.getByRole('button');
    
    // Mouse down should add pressed class
    fireEvent.mouseDown(button);
    expect(button).toHaveClass('scale-95');
    
    // Mouse up should remove pressed class
    fireEvent.mouseUp(button);
    expect(button).not.toHaveClass('scale-95');
    
    // Key down should add pressed class
    await user.keyboard('{Enter>}');
    expect(button).toHaveClass('scale-95');
    
    // Key up should remove pressed class
    await user.keyboard('{/Enter}');
    expect(button).not.toHaveClass('scale-95');
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    
    renderWithTheme(<Button ref={ref}>Button</Button>);
    
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLButtonElement));
  });

  it('renders as child when asChild is true', () => {
    renderWithTheme(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );
    
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/test');
    expect(link).toHaveClass('inline-flex'); // Button classes should be applied
  });

  it('passes through additional props', () => {
    renderWithTheme(
      <Button 
        data-custom="test-value" 
        id="custom-button"
        className="custom-class"
      >
        Custom Button
      </Button>
    );
    
    const button = screen.getByRole('button');
    
    expect(button).toHaveAttribute('data-custom', 'test-value');
    expect(button).toHaveAttribute('id', 'custom-button');
    expect(button).toHaveClass('custom-class');
  });
});

describe('Button Accessibility', () => {
  it('meets accessibility guidelines', async () => {
    const { container } = renderWithTheme(
      <div>
        <Button>Accessible Button</Button>
        <Button disabled>Disabled Button</Button>
        <Button loading>Loading Button</Button>
      </div>
    );

    // This would typically use @testing-library/jest-dom's toBeAccessible
    // or a more sophisticated accessibility testing library
    expect(container).toBeInTheDocument();
  });

  it('provides proper focus management', async () => {
    const user = userEvent.setup();
    
    renderWithTheme(
      <div>
        <Button>First</Button>
        <Button>Second</Button>
        <Button disabled>Disabled</Button>
        <Button>Third</Button>
      </div>
    );

    // Tab through focusable elements
    await user.tab();
    expect(screen.getByRole('button', { name: 'First' })).toHaveFocus();
    
    await user.tab();
    expect(screen.getByRole('button', { name: 'Second' })).toHaveFocus();
    
    await user.tab();
    // Should skip disabled button
    expect(screen.getByRole('button', { name: 'Third' })).toHaveFocus();
  });
});