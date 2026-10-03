import fs from 'fs';
import path from 'path';
import { Book, Category } from '../src/types.js';
import { initialBooks } from '../src/data/booksData.js';

const DATA_FILE = path.join(process.cwd(), 'data', 'books.json');

class SimpleBookDatabase {
  private books: Book[] = [];

  constructor() {
    this.loadBooks();
  }

  private loadBooks() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const content = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.books = parsed;
          return;
        }
      }
    } catch (err) {
      console.warn('Lỗi đọc file data/books.json, nạp dữ liệu mặc định:', err);
    }

    this.books = [...initialBooks];
    this.saveBooks();
  }

  private saveBooks() {
    try {
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.books, null, 2), 'utf-8');
    } catch (err) {
      console.error('Lỗi ghi file data/books.json:', err);
    }
  }

  public getAllBooks(): Book[] {
    return [...this.books];
  }

  public getBookById(id: string): Book | undefined {
    return this.books.find((b) => b.id === id);
  }

  public findBookByCode(code: string): Book | undefined {
    if (!code) return undefined;
    const clean = code.trim().toLowerCase();
    const numbersOnly = code.replace(/[^0-9]/g, '');

    return this.books.find((b) => {
      if (b.libraryCode && b.libraryCode.toLowerCase() === clean) return true;
      if (b.isbn && b.isbn.toLowerCase() === clean) return true;
      if (numbersOnly.length >= 4) {
        if (b.isbn && b.isbn.endsWith(numbersOnly)) return true;
        if (b.libraryCode && b.libraryCode.endsWith(numbersOnly)) return true;
      }
      return false;
    });
  }

  public addBook(book: Book): Book {
    const existingIndex = this.books.findIndex((b) => b.id === book.id || (book.isbn && b.isbn === book.isbn));
    if (existingIndex >= 0) {
      this.books[existingIndex] = { ...this.books[existingIndex], ...book };
      this.saveBooks();
      return this.books[existingIndex];
    }

    this.books.unshift(book);
    this.saveBooks();
    return book;
  }

  public updateBook(id: string, updates: Partial<Book>): Book | null {
    const index = this.books.findIndex((b) => b.id === id);
    if (index === -1) return null;
    this.books[index] = { ...this.books[index], ...updates };
    this.saveBooks();
    return this.books[index];
  }

  public incrementScan(id: string) {
    const book = this.books.find((b) => b.id === id);
    if (book) {
      book.scanCount = (book.scanCount || 0) + 1;
      book.views = (book.views || 0) + 1;
      this.saveBooks();
    }
  }

  public getCategories(): Category[] {
    const map = new Map<string, number>();
    for (const b of this.books) {
      const cat = b.category || 'Khác';
      map.set(cat, (map.get(cat) || 0) + 1);
    }
    return Array.from(map.entries()).map(([name, count]) => ({
      id: name.toLowerCase(),
      name,
      count,
    }));
  }
}

export const db = new SimpleBookDatabase();
