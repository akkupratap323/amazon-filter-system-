import { DataRow, ColumnConfig } from '@/types';

export const getColumnConfigs = (data: DataRow[]): ColumnConfig[] => {
  if (data.length === 0) return [];
  
  const firstRow = data[0];
  return Object.keys(firstRow).map(key => ({
    key,
    label: key.charAt(0).toUpperCase() + key.slice(1),
    type: typeof firstRow[key] === 'number' ? 'number' : 'string',
    filterable: key !== 'id', // Don't make ID filterable
  }));
};

export const getUniqueValues = (data: DataRow[], column: string): string[] => {
  const uniqueValues = [...new Set(data.map(row => String(row[column])))];
  return uniqueValues.sort((a, b) => {
    const numA = Number(a);
    const numB = Number(b);
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    return a.localeCompare(b);
  });
};

export const calculateFilterCounts = (
  data: DataRow[],
  column: string,
  values: string[]
): { [value: string]: number } => {
  const counts: { [value: string]: number } = {};
  
  values.forEach(value => {
    counts[value] = data.filter(row => String(row[column]) === value).length;
  });
  
  return counts;
};

export const sortData = (
  data: DataRow[],
  column: string,
  direction: 'asc' | 'desc'
): DataRow[] => {
  return [...data].sort((a, b) => {
    const aVal = a[column];
    const bVal = b[column];
    
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return direction === 'asc' ? aVal - bVal : bVal - aVal;
    }
    
    const aStr = String(aVal);
    const bStr = String(bVal);
    return direction === 'asc' 
      ? aStr.localeCompare(bStr)
      : bStr.localeCompare(aStr);
  });
};
