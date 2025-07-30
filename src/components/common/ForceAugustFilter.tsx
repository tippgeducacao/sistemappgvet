import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

interface ForceAugustFilterProps {
  className?: string;
}

const ForceAugustFilter: React.FC<ForceAugustFilterProps> = ({ className = "" }) => {
  return (
    <Card className={`mb-6 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Filtrar por período:</span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <label className="text-xs text-gray-500 mb-1">Mês</label>
              <div className="w-32 h-10 px-3 py-2 border border-input bg-background rounded-md flex items-center">
                <span className="text-sm">Agosto</span>
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-xs text-gray-500 mb-1">Ano</label>
              <div className="w-24 h-10 px-3 py-2 border border-input bg-background rounded-md flex items-center">
                <span className="text-sm">2025</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ForceAugustFilter;