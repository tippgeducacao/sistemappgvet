
import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormTextareaField } from '@/components/ui/form-field';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, File, AlertTriangle } from 'lucide-react';
import { useFormStore } from '@/store/FormStore';
import { useToast } from '@/hooks/use-toast';

const ObservationsSection: React.FC = () => {
  const { formData, updateField } = useFormStore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Como todos os canais agora são reuniões, não há mais necessidade de comprovação obrigatória
  const requerComprovacao = false;
  
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validar tamanho do arquivo (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 10MB",
        variant: "destructive"
      });
      return;
    }
    
    // Validar tipos permitidos
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/gif', 'audio/mpeg', 'audio/wav', 'audio/mp3', 'application/pdf'];
    if (!tiposPermitidos.includes(file.type)) {
      toast({
        title: "Tipo de arquivo não permitido",
        description: "Envie apenas imagens (JPG, PNG, GIF), áudios (MP3, WAV) ou PDF",
        variant: "destructive"
      });
      return;
    }
    
    // Salvar o arquivo no formData
    updateField('documentoComprobatorio', file);
    toast({
      title: "Arquivo selecionado",
      description: `Arquivo "${file.name}" foi selecionado com sucesso`
    });
  };
  
  const removeFile = () => {
    updateField('documentoComprobatorio', null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Observações Gerais</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormTextareaField
          id="observacoes"
          label="Observações"
          value={formData.observacoes || ''}
          onChange={(value) => updateField('observacoes', value)}
          placeholder="Digite suas observações sobre esta venda..."
          rows={4}
        />
        
        {/* Campo de upload de documento - aparece apenas para tipos de venda que requerem comprovação */}
        {requerComprovacao && (
          <div className="space-y-4">
            {/* Alerta sobre comprovação obrigatória */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-orange-800">Comprovação Obrigatória</h4>
                  <p className="text-sm text-orange-700 mt-1">
                    Este tipo de venda requer comprovação. Por favor, anexe um documento comprobatório 
                    (áudio da ligação, print da conversa, etc.).
                  </p>
                </div>
              </div>
            </div>
            
            {/* Campo de upload */}
            <div>
              <Label htmlFor="documento">Documento Comprobatório *</Label>
              <div className="mt-2">
                {formData.documentoComprobatorio ? (
                  // Mostrar arquivo selecionado
                  <div className="flex items-center justify-between p-3 border border-green-200 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <File className="h-4 w-4 text-green-600 mr-2" />
                      <span className="text-sm text-green-800">{formData.documentoComprobatorio.name}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeFile}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Remover
                    </Button>
                  </div>
                ) : (
                  // Botão para selecionar arquivo
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleFileSelect}
                    className="w-full h-20 border-dashed border-2 hover:border-primary hover:bg-primary/5"
                  >
                    <div className="flex flex-col items-center">
                      <Upload className="h-6 w-6 mb-2" />
                      <span className="text-sm">Clique para selecionar arquivo</span>
                      <span className="text-xs text-muted-foreground">
                        Máx. 10MB - Imagens, áudios ou PDF
                      </span>
                    </div>
                  </Button>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*,audio/*,.pdf"
                  className="hidden"
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ObservationsSection;
