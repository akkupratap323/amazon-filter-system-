import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { VirtualScrollState } from '@/types';

export const useVirtualScroll = (
  totalItems: number,
  itemHeight: number = 50,
  containerHeight: number = 400,
  overscan: number = 10 // Increased overscan for smoother scrolling
) => {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | undefined>(undefined);

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

  // Optimized scroll handler with RAF for better performance
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    
    rafRef.current = requestAnimationFrame(() => {
      setScrollTop(event.currentTarget.scrollTop);
    });
  }, []);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    const newScrollTop = index * itemHeight;
    setScrollTop(newScrollTop);
    
    if (scrollRef.current) {
      scrollRef.current.scrollTop = newScrollTop;
    }
  }, [itemHeight]);

  const scrollToTop = useCallback(() => {
    setScrollTop(0);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    const newScrollTop = (totalItems - visibleItemCount) * itemHeight;
    setScrollTop(newScrollTop);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = newScrollTop;
    }
  }, [totalItems, visibleItemCount, itemHeight]);

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

  // Performance optimizations
  const isNearTop = scrollTop < itemHeight * 10;
  const isNearBottom = scrollTop > (totalItems - visibleItemCount - 10) * itemHeight;

  return {
    virtualState,
    handleScroll,
    scrollToIndex,
    scrollToTop,
    scrollToBottom,
    getItemStyle,
    containerStyle,
    contentStyle,
    scrollRef,
    isNearTop,
    isNearBottom,
  };
};