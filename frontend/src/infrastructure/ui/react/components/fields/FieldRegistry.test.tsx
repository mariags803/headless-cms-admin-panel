import { render, screen, fireEvent } from '@testing-library/react';
import type { Field, FieldType } from '@cms/shared';
import { FIELD_INPUTS, FieldInput } from './FieldRegistry';

function makeField(overrides: Partial<Field> = {}): Field {
  return {
    id: 'field-1',
    name: 'Name',
    type: 'text',
    required: false,
    ...overrides,
  };
}

describe('FIELD_INPUTS', () => {
  it('maps every FieldType to a component', () => {
    const types: FieldType[] = ['text', 'number', 'boolean', 'date', 'reference'];
    expect(Object.keys(FIELD_INPUTS).sort()).toEqual([...types].sort());
    types.forEach((type) => expect(typeof FIELD_INPUTS[type]).toBe('function'));
  });
});

describe('FieldInput dispatch', () => {
  it('renders a text input for type text', () => {
    render(<FieldInput field={makeField({ type: 'text' })} value="" onChange={jest.fn()} />);
    expect(screen.getByLabelText('Name')).toHaveAttribute('type', 'text');
  });

  it('renders a number input for type number', () => {
    render(<FieldInput field={makeField({ type: 'number' })} value={null} onChange={jest.fn()} />);
    expect(screen.getByLabelText('Name')).toHaveAttribute('type', 'number');
  });

  it('renders a checkbox for type boolean', () => {
    render(<FieldInput field={makeField({ type: 'boolean' })} value={false} onChange={jest.fn()} />);
    expect(screen.getByLabelText('Name')).toHaveAttribute('type', 'checkbox');
  });

  it('renders a date input for type date', () => {
    render(<FieldInput field={makeField({ type: 'date' })} value={null} onChange={jest.fn()} />);
    expect(screen.getByLabelText('Name')).toHaveAttribute('type', 'date');
  });

});

describe('TextInput behavior', () => {
  it('calls onChange with the typed string', () => {
    const onChange = jest.fn();
    render(<FieldInput field={makeField()} value="" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'hello' } });
    expect(onChange).toHaveBeenCalledWith('hello');
  });
});

describe('NumberInput behavior', () => {
  it('calls onChange with a number when typed', () => {
    const onChange = jest.fn();
    render(<FieldInput field={makeField({ type: 'number' })} value={null} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: '42' } });
    expect(onChange).toHaveBeenCalledWith(42);
  });

  it('calls onChange with null when cleared', () => {
    const onChange = jest.fn();
    render(<FieldInput field={makeField({ type: 'number' })} value={5} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: '' } });
    expect(onChange).toHaveBeenCalledWith(null);
  });
});

describe('BooleanInput behavior', () => {
  it('calls onChange with the new checked state', () => {
    const onChange = jest.fn();
    render(<FieldInput field={makeField({ type: 'boolean' })} value={false} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Name'));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe('DateInput behavior', () => {
  it('calls onChange with the new date string', () => {
    const onChange = jest.fn();
    render(<FieldInput field={makeField({ type: 'date' })} value={null} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: '2026-06-24' } });
    expect(onChange).toHaveBeenCalledWith('2026-06-24');
  });
});

describe('error display', () => {
  it('renders an alert when error is set', () => {
    render(<FieldInput field={makeField()} value="" onChange={jest.fn()} error="Required" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Required');
  });
});
