import React, { useState, useEffect } from 'react';
import {
  Search,
  Camera,
  X,
  BookOpen,
  ArrowUpDown,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Barcode,
} from 'lucide-react';
import { Book, Category } from './types.js';
import { initialBooks } from './data/booksData.js';
import { Navbar } from './components/Navbar.js';
import { BookCard } from './components/BookCard.js';
import { BookDetailsModal } from './components/BookDetailsModal.js';
import { BarcodeScannerModal } from './components/BarcodeScannerModal.js';
import { AddBookModal } from './components/AddBookModal.js';

export default function App() {
  const [books, setBooks] = useState<Book[]>(() => {
    try {
      const stored = localStorage.getItem('smart_library_books_v3');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return initialBooks || [];
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'title'>('popular');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);
  const [initialIsbnForAdd, setInitialIsbnForAdd] = useState<string>('');
  const [bookToEdit, setBookToEdit] = useState<Book | null>(null);
  const [unregisteredScannedIsbn, setUnregisteredScannedIsbn] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const persistBooks = (bookList: Book[]) => {
    try {
      localStorage.setItem('smart_library_books_v3', JSON.stringify(bookList));
    } catch {}
  };

  const loadData = async () => {
    try {
      const [bookRes, catRes] = await Promise.all([
        fetch('/api/books').catch(() => null),
        fetch('/api/categories').catch(() => null),
      ]);
      if (bookRes && bookRes.ok) {
        const bData = await bookRes.json();
        if (bData && bData.success && Array.isArray(bData.books) && bData.books.length > 0) {
          setBooks(bData.books);
          persistBooks(bData.books);
        }
      }
      if (catRes && catRes.ok) {
        const cData = await catRes.json();
        if (cData && cData.success) {
          setCategories(cData.categories);
        }
      }
    } catch (err) {
      console.warn('Tải dữ liệu từ server:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Xử lý khi quét được mã vạch
  const handleBarcodeDetected = async (code: string) => {
    setIsScannerOpen(false);
    try {
      const res = await fetch('/api/barcode/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: code }),
      });
      const data = await res.json();

      if (data.success && data.book) {
        setSelectedBook(data.book);
        showNotification(
          data.isNewlyCreated
            ? `🎉 ĐÃ TẠO MÃ MỚI: [${data.book.libraryCode}]! Sách đã được lưu.`
            : `✓ Tìm thấy sách: "${data.book.title}" (Mã: ${data.book.libraryCode || data.book.isbn})`
        );
        loadData();
      } else {
        setUnregisteredScannedIsbn(code);
      }
    } catch {
      showNotification('Không thể kết nối máy chủ khi quét mã', 'error');
    }
  };

  const handleBookAdded = (newBook: Book) => {
    const updated = [newBook, ...books.filter((b) => b.id !== newBook.id)];
    setBooks(updated);
    persistBooks(updated);
    showNotification(`✓ Đã thêm sách mới: "${newBook.title}" (Mã: ${newBook.libraryCode})`);
    loadData();
  };

  const handleBookUpdated = (updatedBook: Book) => {
    const updated = books.map((b) => (b.id === updatedBook.id ? updatedBook : b));
    setBooks(updated);
    persistBooks(updated);
    if (selectedBook && selectedBook.id === updatedBook.id) {
      setSelectedBook(updatedBook);
    }
    showNotification(`✓ Đã cập nhật sách: "${updatedBook.title}"`);
    loadData();
  };

  // Lọc và sắp xếp sách
  const filteredBooks = books
    .filter((b) => {
      const matchesCat =
        selectedCategory === 'all' ||
        b.category.toLowerCase() === selectedCategory.toLowerCase();
      if (!matchesCat) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.isbn.includes(q) ||
        (b.libraryCode && b.libraryCode.toLowerCase().includes(q)) ||
        b.category.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'popular') return (b.scanCount || 0) + (b.views || 0) - ((a.scanCount || 0) + (a.views || 0));
      if (sortBy === 'newest') return (b.year || 0) - (a.year || 0);
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return 0;
    });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Navbar */}
      <Navbar
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenAddBook={() => {
          setBookToEdit(null);
          setInitialIsbnForAdd('');
          setIsAddBookOpen(true);
        }}
        totalBooks={books.length}
      />

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* Search & Sort Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Tìm theo tên sách, tác giả, mã thư viện (LIB-xxxxx), mã vạch ISBN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-orange-500 shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-500 font-medium">Sắp xếp:</span>
            <div className="flex items-center gap-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent font-medium focus:outline-none cursor-pointer"
              >
                <option value="popular">Phổ biến nhất</option>
                <option value="newest">Mới nhất</option>
                <option value="title">Tên sách (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border cursor-pointer shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Tất cả ({books.length})
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border cursor-pointer shrink-0 ${
                selectedCategory.toLowerCase() === cat.name.toLowerCase()
                  ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat.name} ({cat.count})
            </button>
          ))}
        </div>

        {/* Search Notice */}
        {searchQuery && (
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>Kết quả cho: "{searchQuery}" ({filteredBooks.length} cuốn)</span>
            <button
              onClick={() => setSearchQuery('')}
              className="text-orange-600 underline font-semibold cursor-pointer"
            >
              Xóa tìm kiếm
            </button>
          </div>
        )}

        {/* Books Grid */}
        {filteredBooks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
            {filteredBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onSelect={(b) => setSelectedBook(b)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl bg-white space-y-2">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">Không tìm thấy sách phù hợp</p>
            <p className="text-xs text-slate-500">Hãy thử từ khóa khác hoặc bấm Tất cả thể loại.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 px-4 text-center text-xs text-slate-500 mt-12">
        <p className="font-semibold text-slate-700">
          DỰ ÁN KHOA HỌC KĨ THUẬT — CẤN VIỆT TÙNG VÀ TẠ NGỌC DIỆP (LỚP 11A1)
        </p>
        <p className="text-[11px] text-slate-400 mt-1">
          Hệ thống Quản lý Thư viện Thông minh & Tự động Cấp Mã Sách
        </p>
      </footer>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onDetected={handleBarcodeDetected}
      />

      {/* Book Details Modal */}
      {selectedBook && (
        <BookDetailsModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onSelectRelatedBook={(b) => setSelectedBook(b)}
          onEditBook={(b) => {
            setSelectedBook(null);
            setBookToEdit(b);
            setIsAddBookOpen(true);
          }}
          onScanCode={handleBarcodeDetected}
        />
      )}

      {/* Add New Book Modal */}
      <AddBookModal
        isOpen={isAddBookOpen}
        onClose={() => {
          setIsAddBookOpen(false);
          setInitialIsbnForAdd('');
          setBookToEdit(null);
        }}
        categories={categories}
        onBookAdded={handleBookAdded}
        onBookUpdated={handleBookUpdated}
        initialIsbn={initialIsbnForAdd}
        initialBook={bookToEdit}
      />

      {/* Unregistered Scanned Barcode Prompt */}
      {unregisteredScannedIsbn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 mx-auto rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <Barcode className="w-6 h-6" />
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-bold">
                {unregisteredScannedIsbn}
              </span>
              <h3 className="text-sm font-bold text-slate-900 mt-2">Mã sách chưa có trong thư viện</h3>
              <p className="text-xs text-slate-500 mt-1">
                Bạn có muốn thêm cuốn sách này vào danh mục thư viện ngay bây giờ không?
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const isbn = unregisteredScannedIsbn;
                  setUnregisteredScannedIsbn(null);
                  setInitialIsbnForAdd(isbn);
                  setIsAddBookOpen(true);
                }}
                className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow"
              >
                + Thêm sách này vào thư viện
              </button>
              <button
                type="button"
                onClick={() => setUnregisteredScannedIsbn(null)}
                className="w-full py-2 text-slate-500 hover:text-slate-800 text-xs font-semibold"
              >
                Bỏ qua
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xl flex items-center gap-2">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
