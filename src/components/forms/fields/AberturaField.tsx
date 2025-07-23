import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface AberturaFieldProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
}

const AberturaField: React.FC<AberturaFieldProps> = ({ 
  value, 
  onChange, 
  label, 
  placeholder = "Ex: 5 (será #05)" 
}) => {
  const formatAbertura = (input: string): string => {
    // Remove tudo que não é número
    const numbers = input.replace(/\D/g, '');
    
    if (numbers === '') return '';
    
    // Pega apenas o primeiro número (abertura é de 1 a 99)
    const aberturaNumber = parseInt(numbers);
    
    // Formata com zero à esquerda se necessário
    const formattedNumber = aberturaNumber.toString().padStart(2, '0');
    
    return `#${formattedNumber}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Se está apagando, permite valor vazio
    if (inputValue === '') {
      onChange('');
      return;
    }
    
    // Se já tem o prefixo #, pega apenas os números
    const cleanValue = inputValue.replace(/^#/, '');
    const formattedValue = formatAbertura(cleanValue);
    onChange(formattedValue);
  };

  const displayValue = value || '';

  return (
    <div className="space-y-2">
      <Label htmlFor="abertura">{label}</Label>
      <Input
        id="abertura"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="font-mono"
      />
    </div>
  );
};

export default AberturaField;