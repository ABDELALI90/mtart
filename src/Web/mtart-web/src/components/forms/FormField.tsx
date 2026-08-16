import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import type { FieldError, UseFormRegisterReturn } from 'react-hook-form';
import TextFieldMui from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';

interface WrapperProps {
  label: string;
  htmlFor: string;
  error?: FieldError;
  required?: boolean;
  className?: string;
}

interface TextFieldProps extends WrapperProps {
  register: UseFormRegisterReturn;
  type?: InputHTMLAttributes<HTMLInputElement>['type'];
  placeholder?: string;
}

export function TextField({ register, type = 'text', placeholder, className, ...wrapperProps }: TextFieldProps) {
  const { ref, ...field } = register;
  return (
    <TextFieldMui
      id={wrapperProps.htmlFor}
      label={wrapperProps.label}
      required={wrapperProps.required}
      type={type}
      placeholder={placeholder}
      error={Boolean(wrapperProps.error)}
      helperText={wrapperProps.error?.message}
      className={className}
      aria-invalid={Boolean(wrapperProps.error)}
      inputRef={ref}
      {...field}
    />
  );
}

interface SelectFieldProps extends WrapperProps {
  register: UseFormRegisterReturn;
  options: { value: string; label: string }[];
}

export function SelectField({ register, options, className, ...wrapperProps }: SelectFieldProps) {
  const { ref, ...field } = register;
  return (
    <TextFieldMui
      id={wrapperProps.htmlFor}
      label={wrapperProps.label}
      required={wrapperProps.required}
      select
      error={Boolean(wrapperProps.error)}
      helperText={wrapperProps.error?.message}
      className={className}
      aria-invalid={Boolean(wrapperProps.error)}
      inputRef={ref}
      {...field}
    >
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TextFieldMui>
  );
}

interface TextareaFieldProps extends WrapperProps {
  register: UseFormRegisterReturn;
  rows?: number;
  placeholder?: string;
  textareaProps?: TextareaHTMLAttributes<HTMLTextAreaElement>;
}

export function TextareaField({
  register,
  rows = 5,
  placeholder,
  className,
  textareaProps,
  ...wrapperProps
}: TextareaFieldProps) {
  const { ref, ...field } = register;
  return (
    <TextFieldMui
      id={wrapperProps.htmlFor}
      label={wrapperProps.label}
      required={wrapperProps.required}
      multiline
      rows={rows}
      placeholder={placeholder}
      error={Boolean(wrapperProps.error)}
      helperText={wrapperProps.error?.message}
      className={className}
      aria-invalid={Boolean(wrapperProps.error)}
      inputRef={ref}
      slotProps={{ htmlInput: textareaProps }}
      {...field}
    />
  );
}
