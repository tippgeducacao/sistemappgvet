
import React from 'react';

interface VendaDocumentInfoProps {
  tipoVenda: string;
}

const VendaDocumentInfo: React.FC<VendaDocumentInfoProps> = ({ tipoVenda }) => {
  return (
    <div>
      <span className="text-sm text-gray-600">Tipo de Venda:</span>
      <p className="font-medium">{tipoVenda}</p>
    </div>
  );
};

export default VendaDocumentInfo;
