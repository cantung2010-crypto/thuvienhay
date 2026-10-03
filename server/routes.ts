import { Router } from 'express';
import { db } from './db.js';
import { Book } from '../src/types.js';

export const apiRouter = Router();

// Lấy danh sách sách (có tìm kiếm)
apiRouter.get('/books', (req, res) => {
  const query = (req.query.q as string || '').toLowerCase().trim();
  const category = (req.query.category as string || '').toLowerCase().trim();

  let books = db.getAllBooks();

  if (category && category !== 'all') {
    books = books.filter((b) => b.category.toLowerCase() === category);
  }

  if (query) {
    books = books.filter((b) =>
      b.title.toLowerCase().includes(query) ||
      b.author.toLowerCase().includes(query) ||
      b.isbn.includes(query) ||
      (b.libraryCode && b.libraryCode.toLowerCase().includes(query))
    );
  }

  res.json({ success: true, count: books.length, books });
});

// Lấy danh mục thể loại
apiRouter.get('/categories', (_req, res) => {
  const categories = db.getCategories();
  res.json({ success: true, categories });
});

// API Quét mã vạch: Tìm sách cũ hoặc tự động tạo mã LIB-xxxxx cho sách mới
apiRouter.post('/barcode/scan', (req, res) => {
  const { barcode } = req.body;
  if (!barcode || typeof barcode !== 'string') {
    return res.status(400).json({ success: false, message: 'Thiếu mã vạch hợp lệ.' });
  }

  const cleanCode = barcode.trim();
  const existingBook = db.findBookByCode(cleanCode);

  if (existingBook) {
    db.incrementScan(existingBook.id);
    return res.json({
      success: true,
      isNewlyCreated: false,
      book: existingBook,
      message: `Đã tìm thấy sách: "${existingBook.title}"`,
    });
  }

  // Tự động sinh mã thư viện mới: LIB-xxxxx
  const numbersOnly = cleanCode.replace(/[^0-9]/g, '');
  let suffix = numbersOnly.slice(-5);
  if (!suffix) {
    suffix = String(Math.floor(10000 + Math.random() * 90000));
  }
  const newLibraryCode = `LIB-${suffix}`;

  const newBook: Book = {
    id: `book-${Date.now()}`,
    isbn: cleanCode,
    libraryCode: newLibraryCode,
    title: `Sách Mới (${cleanCode.slice(-4)})`,
    author: 'Tác giả bổ sung',
    publisher: 'Thư viện 11A1',
    year: new Date().getFullYear(),
    category: 'Sách mới',
    shelfLocation: 'Kệ mới nhập - Tầng 1',
    description: `Cuốn sách mới được nhập vào thư viện với mã định danh ${newLibraryCode}.`,
    coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80',
    views: 1,
    scanCount: 1,
  };

  const saved = db.addBook(newBook);

  return res.json({
    success: true,
    isNewlyCreated: true,
    newLibraryCode,
    book: saved,
    message: `🎉 ĐÃ CẤP MÃ MỚI: [${newLibraryCode}]! Sách đã được lưu vào hệ thống.`,
  });
});

// Thêm sách mới thủ công
apiRouter.post('/books', (req, res) => {
  const bookData: Book = req.body;
  if (!bookData.title || !bookData.author || !bookData.isbn) {
    return res.status(400).json({ success: false, message: 'Vui lòng điền đủ Tên sách, Tác giả và Mã vạch.' });
  }

  if (!bookData.libraryCode) {
    bookData.libraryCode = `LIB-${(bookData.isbn || '00000').slice(-5)}`;
  }
  if (!bookData.id) {
    bookData.id = `book-${Date.now()}`;
  }

  const saved = db.addBook(bookData);
  res.json({ success: true, book: saved });
});

// Cập nhật sách
apiRouter.put('/books/:id', (req, res) => {
  const { id } = req.params;
  const updated = db.updateBook(id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy sách.' });
  }
  res.json({ success: true, book: updated });
});
