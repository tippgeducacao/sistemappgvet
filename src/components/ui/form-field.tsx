
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface BaseFieldProps {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

interface InputFieldProps extends BaseFieldProps {
  type?: 'text' | 'email' | 'date';
}

interface SelectFieldProps extends BaseFieldProps {
  options: Array<{ value: string; label: string; extra?: string }>;
  loading?: boolean;
}

interface TextareaFieldProps extends BaseFieldProps {
  rows?: number;
}

export const FormInputField: React.FC<InputFieldProps> = ({
  label,
  id,
  type = 'text',
  value,
  onChange,
  disabled,
  placeholder,
  className
}) => (
  <div>
    <Label htmlFor={id}>{label}</Label>
    <Input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
    />
  </div>
);

export const FormSelectField: React.FC<SelectFieldProps> = ({
  label,
  id,
  value,
  onChange,
  options,
  loading,
  disabled,
  placeholder
}) => (
  <div>
    <Label>{label}</Label>
    <Select 
      value={value} 
      onValueChange={onChange}
      disabled={disabled || loading}
    >
      <SelectTrigger>
        <SelectValue placeholder={loading ? "Carregando..." : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label} {option.extra && <span className="text-ppgvet-teal font-semibold">{option.extra}</span>}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

export const FormTextareaField: React.FC<TextareaFieldProps> = ({
  label,
  id,
  value,
  onChange,
  placeholder,
  rows = 4,
  disabled
}) => (
  <div>
    <Label htmlFor={id}>{label}</Label>
    <Textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
    />
  </div>
);
