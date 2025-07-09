import { useState, useCallback, useMemo } from 'react';
import { VirtualScrollState } from '@/types';

export const useVirtualScroll = (
  totalItems: number,
  itemHeight: number = 50,
  containerHeight: number = 400,
  overscan: number = 5
) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItemCount = Math.ceil(containerHeight / itemHeight);

  const virtualState: VirtualScrollState = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      totalItems - 1,
      startIndex + visibleItemCount + overscan * 2
    );

    return {
      startIndex,
      endIndex,
      visibleItems: endIndex - startIndex + 1,
    };
  }, [scrollTop, itemHeight, totalItems, visibleItemCount, overscan]);

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    const newScrollTop = index * itemHeight;
    setScrollTop(newScrollTop);
  }, [itemHeight]);

  const getItemStyle = useCallback((index: number) => ({
    position: 'absolute' as const,
    top: index * itemHeight,
    left: 0,
    right: 0,
    height: itemHeight,
  }), [itemHeight]);

  const containerStyle = useMemo(() => ({
    height: containerHeight,
    overflow: 'auto' as const,
    position: 'relative' as const,
  }), [containerHeight]);

  const contentStyle = useMemo(() => ({
    height: totalItems * itemHeight,
    position: 'relative' as const,
  }), [totalItems, itemHeight]);

  return {
    virtualState,
    handleScroll,
    scrollToIndex,
    getItemStyle,
    containerStyle,
    contentStyle,
  };
};
