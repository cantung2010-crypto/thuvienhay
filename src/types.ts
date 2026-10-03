// Cấu trúc dữ liệu đơn giản cho dự án Thư viện lớp 11A1

export interface Book {
  id: string;
  isbn: string;
  libraryCode?: string;
  title: string;
  author: string;
  publisher?: string;
  year: number;
  category: string;
  description?: string;
  shelfLocation?: string;
  coverImage: string;
  views?: number;
  scanCount?: number;
}

export interface Category {
  id: string;
  name: string;
  count: number;
}

export interface ScanLog {
  id: number;
  barcode: string;
  libraryCode: string;
  bookTitle: string;
  isNew: boolean;
  scanTime: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
