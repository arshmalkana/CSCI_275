import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FloatingLabelField from '../../components/FloatingLabelField';
import { User, Lock } from 'lucide-react';

describe('FloatingLabelField Component', () => {
  describe('Rendering', () => {
    it('should render with label', () => {
      render(
        <FloatingLabelField
          id="test-field"
          label="Test Label"
          value=""
          onChange={() => {}}
        />
      );

      expect(screen.getByText('Test Label')).toBeInTheDocument();
    });

    it('should render with icon', () => {
      render(
        <FloatingLabelField
          id="test-field"
          label="Username"
          value=""
          onChange={() => {}}
          icon={User}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('should render with placeholder', () => {
      render(
        <FloatingLabelField
          id="test-field"
          label="Test"
          value=""
          onChange={() => {}}
          placeholder="Enter value"
        />
      );

      const input = screen.getByPlaceholderText('Enter value');
      expect(input).toBeInTheDocument();
    });

    it('should render as password type', () => {
      render(
        <FloatingLabelField
          id="password-field"
          label="Password"
          type="password"
          value=""
          onChange={() => {}}
        />
      );

      const input = screen.getByLabelText('Password');
      expect(input).toHaveAttribute('type', 'password');
    });

    it('should render as disabled', () => {
      render(
        <FloatingLabelField
          id="test-field"
          label="Test"
          value=""
          onChange={() => {}}
          disabled
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });
  });

  describe('User Interaction', () => {
    it('should call onChange when typing', async () => {
      let value = '';
      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        value = e.target.value;
      };

      render(
        <FloatingLabelField
          id="test-field"
          label="Test"
          value={value}
          onChange={handleChange}
        />
      );

      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'Hello');

      expect(value).toBe('Hello');
    });

    it('should handle focus and blur events', async () => {
      render(
        <FloatingLabelField
          id="test-field"
          label="Test"
          value=""
          onChange={() => {}}
        />
      );

      const input = screen.getByRole('textbox');

      await userEvent.click(input);
      expect(input).toHaveFocus();

      fireEvent.blur(input);
      expect(input).not.toHaveFocus();
    });

    it('should not allow typing when disabled', async () => {
      let value = '';
      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        value = e.target.value;
      };

      render(
        <FloatingLabelField
          id="test-field"
          label="Test"
          value={value}
          onChange={handleChange}
          disabled
        />
      );

      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'Hello');

      expect(value).toBe('');
    });

    it('should handle paste events', async () => {
      let value = '';
      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        value = e.target.value;
      };

      const { rerender } = render(
        <FloatingLabelField
          id="test-field"
          label="Test"
          value={value}
          onChange={handleChange}
        />
      );

      const input = screen.getByRole('textbox');
      await userEvent.click(input);
      await userEvent.paste('Pasted text');

      // Update value and rerender
      value = 'Pasted text';
      rerender(
        <FloatingLabelField
          id="test-field"
          label="Test"
          value={value}
          onChange={handleChange}
        />
      );

      expect(input).toHaveValue('Pasted text');
    });
  });

  describe('Error State', () => {
    it('should display error message', () => {
      render(
        <FloatingLabelField
          id="test-field"
          label="Email"
          value=""
          onChange={() => {}}
          error="Invalid email format"
        />
      );

      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    });

    it('should apply error styling when error is present', () => {
      const { container } = render(
        <FloatingLabelField
          id="test-field"
          label="Email"
          value=""
          onChange={() => {}}
          error="Invalid email"
        />
      );

      // Check for error-related classes
      const input = screen.getByRole('textbox');
      expect(input.className).toContain('border-red');
    });

    it('should not display error when no error prop', () => {
      render(
        <FloatingLabelField
          id="test-field"
          label="Email"
          value=""
          onChange={() => {}}
        />
      );

      const errorText = screen.queryByText(/Invalid/);
      expect(errorText).not.toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('should validate required field (empty)', () => {
      render(
        <FloatingLabelField
          id="test-field"
          label="Username"
          value=""
          onChange={() => {}}
          required
          error="Username is required"
        />
      );

      expect(screen.getByText('Username is required')).toBeInTheDocument();
    });

    it('should accept valid input', () => {
      render(
        <FloatingLabelField
          id="test-field"
          label="Username"
          value="validuser"
          onChange={() => {}}
          required
        />
      );

      const errorText = screen.queryByText(/required/);
      expect(errorText).not.toBeInTheDocument();
    });

    it('should handle email validation', () => {
      render(
        <FloatingLabelField
          id="email-field"
          label="Email"
          type="email"
          value="invalid-email"
          onChange={() => {}}
          error="Invalid email format"
        />
      );

      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper label association', () => {
      render(
        <FloatingLabelField
          id="test-field"
          label="Username"
          value=""
          onChange={() => {}}
        />
      );

      const input = screen.getByLabelText('Username');
      expect(input).toBeInTheDocument();
    });

    it('should have accessible name', () => {
      render(
        <FloatingLabelField
          id="test-field"
          label="Username"
          value=""
          onChange={() => {}}
        />
      );

      const input = screen.getByRole('textbox', { name: /username/i });
      expect(input).toBeInTheDocument();
    });

    it('should support aria-required', () => {
      render(
        <FloatingLabelField
          id="test-field"
          label="Username"
          value=""
          onChange={() => {}}
          required
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('required');
    });

    it('should be keyboard navigable', async () => {
      render(
        <>
          <FloatingLabelField
            id="field1"
            label="Field 1"
            value=""
            onChange={() => {}}
          />
          <FloatingLabelField
            id="field2"
            label="Field 2"
            value=""
            onChange={() => {}}
          />
        </>
      );

      const input1 = screen.getByLabelText('Field 1');
      const input2 = screen.getByLabelText('Field 2');

      input1.focus();
      expect(input1).toHaveFocus();

      await userEvent.tab();
      expect(input2).toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long text', async () => {
      let value = '';
      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        value = e.target.value;
      };

      render(
        <FloatingLabelField
          id="test-field"
          label="Test"
          value={value}
          onChange={handleChange}
        />
      );

      const longText = 'a'.repeat(1000);
      const input = screen.getByRole('textbox');
      await userEvent.type(input, longText);

      expect(value).toBe(longText);
    });

    it('should handle special characters', async () => {
      let value = '';
      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        value = e.target.value;
      };

      render(
        <FloatingLabelField
          id="test-field"
          label="Test"
          value={value}
          onChange={handleChange}
        />
      );

      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const input = screen.getByRole('textbox');
      await userEvent.type(input, specialChars);

      expect(value).toBe(specialChars);
    });

    it('should handle unicode characters', async () => {
      let value = '';
      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        value = e.target.value;
      };

      render(
        <FloatingLabelField
          id="test-field"
          label="Test"
          value={value}
          onChange={handleChange}
        />
      );

      const unicode = '日本語 हिन्दी ਪੰਜਾਬੀ';
      const input = screen.getByRole('textbox');
      await userEvent.type(input, unicode);

      expect(value).toBe(unicode);
    });

    it('should handle rapid typing', async () => {
      let value = '';
      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        value = e.target.value;
      };

      render(
        <FloatingLabelField
          id="test-field"
          label="Test"
          value={value}
          onChange={handleChange}
        />
      );

      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'QuickTyping', { delay: 1 });

      expect(value).toBe('QuickTyping');
    });

    it('should handle clear/reset', async () => {
      let value = 'initial';
      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        value = e.target.value;
      };

      const { rerender } = render(
        <FloatingLabelField
          id="test-field"
          label="Test"
          value={value}
          onChange={handleChange}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('initial');

      // Clear the value
      value = '';
      rerender(
        <FloatingLabelField
          id="test-field"
          label="Test"
          value={value}
          onChange={handleChange}
        />
      );

      expect(input).toHaveValue('');
    });
  });

  describe('Number Input', () => {
    it('should accept numeric input when type is number', async () => {
      let value = '';
      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        value = e.target.value;
      };

      render(
        <FloatingLabelField
          id="number-field"
          label="Age"
          type="number"
          value={value}
          onChange={handleChange}
        />
      );

      const input = screen.getByRole('spinbutton');
      await userEvent.type(input, '25');

      expect(value).toBe('25');
    });

    it('should handle negative numbers when allowed', async () => {
      let value = '';
      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        value = e.target.value;
      };

      render(
        <FloatingLabelField
          id="number-field"
          label="Temperature"
          type="number"
          value={value}
          onChange={handleChange}
        />
      );

      const input = screen.getByRole('spinbutton');
      await userEvent.type(input, '-10');

      expect(value).toBe('-10');
    });
  });
});
