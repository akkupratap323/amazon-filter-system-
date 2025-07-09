import { useState, useCallback, useMemo } from 'react';
import { PaginationState } from '@/types';

export const usePagination = (totalItems: number, initialPageSize: number = 100) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const paginationState: PaginationState = useMemo(() => ({
    currentPage,
    pageSize,
    totalItems,
    totalPages: Math.ceil(totalItems / pageSize),
  }), [currentPage, pageSize, totalItems]);

  const goToPage = useCallback((page: number) => {
    const maxPage = Math.ceil(totalItems / pageSize);
    setCurrentPage(Math.max(1, Math.min(page, maxPage)));
  }, [totalItems, pageSize]);

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const changePageSize = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  }, []);

  const getPaginatedData = useCallback(<T>(data: T[]): T[] => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return data.slice(startIndex, endIndex);
  }, [currentPage, pageSize]);

  return {
    paginationState,
    goToPage,
    nextPage,
    prevPage,
    changePageSize,
    getPaginatedData,
  };
};
