import React from 'react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Whether the checkbox is checked */
  checked: boolean;
  /** Change handler for the checkbox */
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

export const Checkbox: React.FC<CheckboxProps> = ({ checked, onChange, ...props }) => (
  <input
    type="checkbox"
    checked={checked}
    onChange={onChange}
    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
    {...props}
  />
);

