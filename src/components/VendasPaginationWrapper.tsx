import React, { useState } from 'react';
import VendasPagination from '@/components/vendas/VendasPagination';

interface VendasPaginationWrapperProps {
  totalItems: number;
  itemsPerPage: number;
  children: (currentPage: number, itemsPerPage: number) => React.ReactNode;
}

/**
 * OTIMIZADA: Wrapper para paginação de vendas que reduz re-renders
 */
export const VendasPaginationWrapper: React.FC<VendasPaginationWrapperProps> = ({
  totalItems,
  itemsPerPage = 50, // Reduzido de 100 para melhor performance
  children
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="space-y-4">
      {children(currentPage, itemsPerPage)}
      
      {totalPages > 1 && (
        <VendasPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default VendasPaginationWrapper;