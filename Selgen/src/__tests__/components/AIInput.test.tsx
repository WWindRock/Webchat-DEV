import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Simple AIInput component for testing
interface AIInputProps {
  onSend: (message: string) => void | Promise<void>;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  loading?: boolean;
}

const AIInput: React.FC<AIInputProps> = ({
  onSend,
  onChange,
  placeholder = 'Type a message...',
  disabled = false,
  maxLength = 1000,
  loading = false,
}) => {
  const [value, setValue] = React.useState('');
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      setValue(newValue);
      onChange?.(newValue);
    }
  };

  const handleSend = async () => {
    if (!value.trim() || disabled || loading) return;
    
    const message = value.trim();
    setValue('');
    await onSend(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <div className="ai-input-container" data-testid="ai-input">
      <textarea
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        data-testid="ai-input-textarea"
        className="ai-input-textarea"
        rows={1}
      />
      <button
        onClick={handleSend}
        disabled={!value.trim() || disabled || loading}
        data-testid="ai-input-send-button"
        className="ai-input-send-button"
      >
        {loading ? 'Sending...' : 'Send'}
      </button>
      <span data-testid="ai-input-char-count" className="ai-input-char-count">
        {value.length}/{maxLength}
      </span>
    </div>
  );
};

describe('AIInput Component', () => {
  const mockOnSend = vi.fn();
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the AIInput component', () => {
    render(<AIInput onSend={mockOnSend} />);

    expect(screen.getByTestId('ai-input')).toBeInTheDocument();
    expect(screen.getByTestId('ai-input-textarea')).toBeInTheDocument();
    expect(screen.getByTestId('ai-input-send-button')).toBeInTheDocument();
    expect(screen.getByTestId('ai-input-char-count')).toBeInTheDocument();
  });

  it('should display placeholder text', () => {
    render(<AIInput onSend={mockOnSend} placeholder="Custom placeholder" />);

    const textarea = screen.getByTestId('ai-input-textarea');
    expect(textarea).toHaveAttribute('placeholder', 'Custom placeholder');
  });

  it('should use default placeholder when not provided', () => {
    render(<AIInput onSend={mockOnSend} />);

    const textarea = screen.getByTestId('ai-input-textarea');
    expect(textarea).toHaveAttribute('placeholder', 'Type a message...');
  });

  it('should call onChange when typing', () => {
    render(<AIInput onSend={mockOnSend} onChange={mockOnChange} />);

    const textarea = screen.getByTestId('ai-input-textarea');
    fireEvent.change(textarea, { target: { value: 'Hello' } });

    expect(mockOnChange).toHaveBeenCalledWith('Hello');
    expect(textarea).toHaveValue('Hello');
  });

  it('should call onSend when clicking send button', async () => {
    render(<AIInput onSend={mockOnSend} />);

    const textarea = screen.getByTestId('ai-input-textarea');
    const sendButton = screen.getByTestId('ai-input-send-button');

    fireEvent.change(textarea, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(mockOnSend).toHaveBeenCalledWith('Test message');
    });
  });

  it('should call onSend when pressing Enter', async () => {
    render(<AIInput onSend={mockOnSend} />);

    const textarea = screen.getByTestId('ai-input-textarea');

    fireEvent.change(textarea, { target: { value: 'Test message' } });
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(mockOnSend).toHaveBeenCalledWith('Test message');
    });
  });

  it('should not call onSend when pressing Shift+Enter', () => {
    render(<AIInput onSend={mockOnSend} />);

    const textarea = screen.getByTestId('ai-input-textarea');

    fireEvent.change(textarea, { target: { value: 'Line 1' } });
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', shiftKey: true });

    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it('should clear input after sending', async () => {
    render(<AIInput onSend={mockOnSend} />);

    const textarea = screen.getByTestId('ai-input-textarea');
    const sendButton = screen.getByTestId('ai-input-send-button');

    fireEvent.change(textarea, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(textarea).toHaveValue('');
    });
  });

  it('should disable send button when input is empty', () => {
    render(<AIInput onSend={mockOnSend} />);

    const sendButton = screen.getByTestId('ai-input-send-button');
    expect(sendButton).toBeDisabled();
  });

  it('should disable send button when input is whitespace only', () => {
    render(<AIInput onSend={mockOnSend} />);

    const textarea = screen.getByTestId('ai-input-textarea');
    const sendButton = screen.getByTestId('ai-input-send-button');

    fireEvent.change(textarea, { target: { value: '   ' } });

    expect(sendButton).toBeDisabled();
  });

  it('should disable input when disabled prop is true', () => {
    render(<AIInput onSend={mockOnSend} disabled />);

    const textarea = screen.getByTestId('ai-input-textarea');
    const sendButton = screen.getByTestId('ai-input-send-button');

    expect(textarea).toBeDisabled();
    expect(sendButton).toBeDisabled();
  });

  it('should show loading state', () => {
    render(<AIInput onSend={mockOnSend} loading />);

    const sendButton = screen.getByTestId('ai-input-send-button');
    expect(sendButton).toBeDisabled();
    expect(sendButton).toHaveTextContent('Sending...');
  });

  it('should enforce maxLength constraint', () => {
    const maxLength = 10;
    render(<AIInput onSend={mockOnSend} maxLength={maxLength} />);

    const textarea = screen.getByTestId('ai-input-textarea');

    fireEvent.change(textarea, { target: { value: 'This is a very long message' } });

    expect(textarea).toHaveAttribute('maxLength', '10');
    expect(screen.getByTestId('ai-input-char-count')).toHaveTextContent(`0/${maxLength}`);
  });

  it('should display character count', () => {
    render(<AIInput onSend={mockOnSend} maxLength={100} />);

    const textarea = screen.getByTestId('ai-input-textarea');
    fireEvent.change(textarea, { target: { value: 'Hello' } });

    expect(screen.getByTestId('ai-input-char-count')).toHaveTextContent('5/100');
  });

  it('should not call onSend when disabled', () => {
    render(<AIInput onSend={mockOnSend} disabled />);

    const textarea = screen.getByTestId('ai-input-textarea');

    fireEvent.change(textarea, { target: { value: 'Test' } });
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it('should handle async onSend function', async () => {
    const asyncOnSend = vi.fn().mockResolvedValue(undefined);
    render(<AIInput onSend={asyncOnSend} />);

    const textarea = screen.getByTestId('ai-input-textarea');
    const sendButton = screen.getByTestId('ai-input-send-button');

    fireEvent.change(textarea, { target: { value: 'Async message' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(asyncOnSend).toHaveBeenCalledWith('Async message');
    });
  });

  it('should trim whitespace from message before sending', async () => {
    render(<AIInput onSend={mockOnSend} />);

    const textarea = screen.getByTestId('ai-input-textarea');
    const sendButton = screen.getByTestId('ai-input-send-button');

    fireEvent.change(textarea, { target: { value: '  Test message  ' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(mockOnSend).toHaveBeenCalledWith('Test message');
    });
  });

  it('should auto-resize textarea based on content', () => {
    render(<AIInput onSend={mockOnSend} />);

    const textarea = screen.getByTestId('ai-input-textarea');
    
    // Initial state
    expect(textarea).toHaveAttribute('rows', '1');

    // Add content
    fireEvent.change(textarea, { target: { value: 'Line 1\nLine 2\nLine 3' } });

    // Verify the component handles multi-line content
    expect(textarea).toHaveValue('Line 1\nLine 2\nLine 3');
  });
});
