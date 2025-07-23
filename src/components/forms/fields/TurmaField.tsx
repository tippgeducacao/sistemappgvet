import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface TurmaFieldProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
}

const TurmaField: React.FC<TurmaFieldProps> = ({ 
  value, 
  onChange, 
  label, 
  placeholder = "Ex: 2 (será T02)" 
}) => {
  const formatTurma = (input: string): string => {
    // Remove tudo que não é número
    const numbers = input.replace(/\D/g, '');
    
    if (numbers === '') return '';
    
    // Pega apenas o primeiro número (turma é de 1 a 99)
    const turmaNumber = parseInt(numbers);
    
    // Formata com zero à esquerda se necessário
    const formattedNumber = turmaNumber.toString().padStart(2, '0');
    
    return `T${formattedNumber}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Se está apagando, permite valor vazio
    if (inputValue === '') {
      onChange('');
      return;
    }
    
    // Se já tem o prefixo T, pega apenas os números
    const cleanValue = inputValue.replace(/^T/, '');
    const formattedValue = formatTurma(cleanValue);
    onChange(formattedValue);
  };

  const displayValue = value || '';

  return (
    <div className="space-y-2">
      <Label htmlFor="turma">{label}</Label>
      <Input
        id="turma"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="font-mono"
      />
    </div>
  );
};

export default TurmaField;