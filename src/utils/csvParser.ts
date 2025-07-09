import Papa from 'papaparse';
import { DataRow } from '@/types';

export const parseCsvFile = (file: File): Promise<DataRow[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transform: (value: string, field: string) => {
        // Convert numeric fields to numbers
        if (field !== 'id' && !isNaN(Number(value))) {
          return Number(value);
        }
        return value;
      },
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error('CSV parsing failed'));
        } else {
          resolve(results.data as DataRow[]);
        }
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};

export const parseCsvFromUrl = async (url: string): Promise<DataRow[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(url, {
      download: true,
      header: true,
      skipEmptyLines: true,
      transform: (value: string, field: string) => {
        // Convert numeric fields to numbers
        if (field !== 'id' && !isNaN(Number(value))) {
          return Number(value);
        }
        return value;
      },
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error('CSV parsing failed'));
        } else {
          resolve(results.data as DataRow[]);
        }
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};

export const generateMockData = (count: number): DataRow[] => {
  const data: DataRow[] = [];
  
  for (let i = 1; i <= count; i++) {
    const row: DataRow = {
      id: i,
      number: i,
      mod3: i % 3,
      mod4: i % 4,
      mod5: i % 5,
      mod6: i % 6,
      mod7: i % 7,
      mod8: i % 8,
    };
    data.push(row);
  }
  
  return data;
};
