import React, { useState, useEffect } from 'react';
import { X, BookPlus, Barcode, MapPin, Building, Calendar, User, Save } from 'lucide-react';
import { Book, Category } from '../types.js';

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onBookAdded: (book: Book) => void;
  onBookUpdated?: (book: Book) => void;
  initialIsbn?: string;
  initialBook?: Book | null;
}

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80';

export const AddBookModal: React.FC<AddBookModalProps> = ({
  isOpen,
  onClose,
  categories,
  onBookAdded,
  onBookUpdated,
  initialIsbn = '',
  initialBook = null,
}) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || 'Văn học');
  const [isbn, setIsbn] = useState(initialIsbn);
  const [libraryCode, setLibraryCode] = useState('');
  const [shelfLocation, setShelfLocation] = useState('Kệ A1 - Tầng 1');
  const [publisher, setPublisher] = useState('NXB Giáo Dục');
  const [year, setYear] = useState('2024');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState(DEFAULT_COVER);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialBook) {
      setTitle(initialBook.title || '');
      setAuthor(initialBook.author || '');
      setCategory(initialBook.category || 'Văn học');
      setIsbn(initialBook.isbn || '');
      setLibraryCode(initialBook.libraryCode || '');
      setShelfLocation(initialBook.shelfLocation || 'Kệ A1 - Tầng 1');
      setPublisher(initialBook.publisher || 'NXB Giáo Dục');
      setYear(String(initialBook.year || 2024));
      setDescription(initialBook.description || '');
      setCoverImage(initialBook.coverImage || DEFAULT_COVER);
    } else {
      setTitle('');
      setAuthor('');
      setCategory(categories[0]?.name || 'Văn học');
      const newIsbn = initialIsbn || String(Math.floor(1000000000000 + Math.random() * 9000000000000));
      setIsbn(newIsbn);
      setLibraryCode(`LIB-${newIsbn.slice(-5)}`);
      setShelfLocation('Kệ A1 - Tầng 1');
      setPublisher('NXB Giáo Dục');
      setYear('2024');
      setDescription('');
      setCoverImage(DEFAULT_COVER);
    }
  }, [initialBook, initialIsbn, isOpen]);

  // Cập nhật mã thư viện khi đổi ISBN
  const handleIsbnChange = (val: string) => {
    setIsbn(val);
    const nums = val.replace(/[^0-9]/g, '');
    if (nums.length >= 5) {
      setLibraryCode(`LIB-${nums.slice(-5)}`);
    } else if (nums.length > 0) {
      setLibraryCode(`LIB-${nums.padStart(5, '0')}`);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim() || !isbn.trim()) {
      alert('Vui lòng nhập đầy đủ: Tên sách, Tác giả và Mã vạch!');
      return;
    }

    setIsSubmitting(true);
    const finalLibCode = libraryCode.trim() || `LIB-${isbn.slice(-5)}`;

    const bookData: Book = {
      id: initialBook ? initialBook.id : `book-${Date.now()}`,
      isbn: isbn.trim(),
      libraryCode: finalLibCode,
      title: title.trim(),
      author: author.trim(),
      category: category.trim() || 'Văn học',
      publisher: publisher.trim() || 'NXB Giáo Dục',
      year: parseInt(year) || 2024,
      shelfLocation: shelfLocation.trim() || 'Kệ A1 - Tầng 1',
      description: description.trim() || `Sách "${title}" của tác giả ${author}.`,
      coverImage: coverImage.trim() || DEFAULT_COVER,
      views: initialBook?.views || 0,
      scanCount: initialBook?.scanCount || 0,
    };

    try {
      // Lưu lên server
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookData),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.book) {
          bookData.id = data.book.id;
        }
      }
    } catch (err) {
      console.warn('Lưu tạm trên trình duyệt:', err);
    }

    if (initialBook && onBookUpdated) {
      onBookUpdated(bookData);
    } else {
      onBookAdded(bookData);
    }

    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <BookPlus className="w-4 h-4 text-orange-600" />
            <span className="font-bold text-sm text-gray-900">
              {initialBook ? 'Chỉnh sửa thông tin sách' : 'Thêm sách vào thư viện'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form nhập liệu đơn giản */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-3.5 text-xs text-gray-700">
          <div>
            <label className="block font-semibold text-gray-800 mb-1">
              Tên sách <span className="text-red-500">*</span>:
            </label>
            <input
              type="text"
              required
              placeholder="VD: Lập trình Python cơ bản..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold text-gray-800 mb-1">
                Tác giả <span className="text-red-500">*</span>:
              </label>
              <input
                type="text"
                required
                placeholder="VD: Nguyễn Du"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-800 mb-1">Thể loại:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:border-orange-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
                <option value="Khác">Khác</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold text-gray-800 mb-1">
                Mã vạch ISBN <span className="text-red-500">*</span>:
              </label>
              <input
                type="text"
                required
                placeholder="VD: 9786042183246"
                value={isbn}
                onChange={(e) => handleIsbnChange(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg font-mono focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-800 mb-1">Mã thư viện mới:</label>
              <input
                type="text"
                value={libraryCode}
                onChange={(e) => setLibraryCode(e.target.value)}
                placeholder="LIB-xxxxx"
                className="w-full px-3 py-2 border rounded-lg font-mono font-bold text-orange-600 bg-orange-50/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold text-gray-800 mb-1">Vị trí kệ:</label>
              <input
                type="text"
                placeholder="VD: Kệ A1 - Tầng 1"
                value={shelfLocation}
                onChange={(e) => setShelfLocation(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-800 mb-1">Năm xuất bản:</label>
              <input
                type="number"
                placeholder="2024"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-800 mb-1">Tóm tắt ngắn gọn:</label>
            <textarea
              rows={3}
              placeholder="Giới thiệu đôi nét về cuốn sách..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-orange-500 text-xs"
            />
          </div>

          {/* Nút Submit */}
          <div className="pt-2 flex justify-end gap-2 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 border rounded-lg hover:bg-gray-100 font-semibold text-gray-600"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg flex items-center gap-1.5 shadow"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{initialBook ? 'Lưu thay đổi' : 'Thêm vào thư viện'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
