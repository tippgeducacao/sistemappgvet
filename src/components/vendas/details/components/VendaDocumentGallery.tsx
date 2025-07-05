
import React from 'react';
import ImageGallery from '@/components/common/ImageGallery';

interface VendaDocumentGalleryProps {
  vendaId: string;
  vendedorId?: string;
}

const VendaDocumentGallery: React.FC<VendaDocumentGalleryProps> = ({
  vendaId,
  vendedorId
}) => {
  // Tentar diferentes combinações de pastas onde o documento pode estar
  const possibleFolders = [
    // Formato esperado: vendedor/venda
    vendedorId ? `${vendedorId}/${vendaId}` : '',
    // Apenas venda ID
    vendaId,
    // Formato abreviado
    vendedorId ? `${vendedorId}/${vendaId.substring(0, 8)}` : '',
    // Apenas ID abreviado
    vendaId.substring(0, 8)
  ].filter(Boolean);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">🔍 Busca por Documentos</h3>
      <p className="text-sm text-gray-600">
        Tentando localizar documentos nas seguintes pastas:
      </p>
      
      {possibleFolders.map((folder, index) => (
        <ImageGallery
          key={folder}
          bucketName="documentos-vendas"
          folderPath={folder}
          title={`Pasta ${index + 1}: ${folder}`}
          maxImages={5}
          gridCols={2}
        />
      ))}
      
      {/* Galeria geral - listar tudo */}
      <ImageGallery
        bucketName="documentos-vendas"
        folderPath=""
        title="🗂️ Todos os Documentos (Últimos 20)"
        maxImages={20}
        gridCols={4}
      />
    </div>
  );
};

export default VendaDocumentGallery;
