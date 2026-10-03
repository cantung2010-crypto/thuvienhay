import React from 'react';
import { X, BookOpen, MapPin, Tag, Calendar, User, Barcode, Copy, Check } from 'lucide-react';
import { Book } from '../types.js';

interface BookDetailsModalProps {
  book: Book | null;
  onClose: () => void;
  onEditBook?: (book: Book) => void;
  onScanCode?: (code: string) => void;
  onSelectRelatedBook?: (book: Book) => void;
  onOpenQuiz?: (book: Book) => void;
}

export const BookDetailsModal: React.FC<BookDetailsModalProps> = ({
  book,
  onClose,
  onEditBook,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!book) return null;

  const libraryCode = book.libraryCode || `LIB-${(book.isbn || '00000').slice(-5)}`;

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(libraryCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Tiêu đề modal */}
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-orange-600" />
            <span className="font-bold text-sm text-gray-900">Chi tiết cuốn sách</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nội dung chi tiết */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="flex gap-4">
            {/* Ảnh bìa */}
            <img
              src={book.coverImage}
              alt={book.title}
              className="w-24 sm:w-28 aspect-[3/4] object-cover rounded-xl border border-gray-200 shadow-xs shrink-0"
            />

            {/* Thông tin chính */}
            <div className="space-y-1.5 flex-1 min-w-0">
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-orange-100 text-orange-800 inline-block">
                {book.category}
              </span>
              <h2 className="text-base font-bold text-gray-900 leading-snug">
                {book.title}
              </h2>
              <p className="text-xs text-gray-600 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>{book.author}</span>
              </p>
              <p className="text-xs text-gray-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>Năm xuất bản: {book.year}</span>
              </p>
              <p className="text-xs text-gray-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>Vị trí: <strong>{book.shelfLocation || 'Kệ A1'}</strong></span>
              </p>
            </div>
          </div>

          {/* Khối mã thư viện */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-[11px] text-gray-500 font-medium">Mã định danh thư viện:</div>
              <div className="font-mono text-sm font-black text-orange-600">
                {libraryCode}
              </div>
              <div className="text-[10px] text-gray-400 font-mono">
                Mã vạch gốc: {book.isbn}
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopyCode}
              className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-xs font-semibold text-gray-700 flex items-center gap-1 shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
            </button>
          </div>

          {/* Tóm tắt nội dung */}
          {book.description && (
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                Tóm tắt nội dung:
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed bg-slate-50/60 p-3 rounded-xl border border-gray-100">
                {book.description}
              </p>
            </div>
          )}
        </div>

        {/* Nút hành động dưới đáy */}
        <div className="px-5 py-3 border-t border-gray-100 bg-slate-50 flex items-center justify-end gap-2">
          {onEditBook && (
            <button
              type="button"
              onClick={() => onEditBook(book)}
              className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 text-xs font-bold text-gray-700 rounded-lg transition-colors"
            >
              Sửa thông tin
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
