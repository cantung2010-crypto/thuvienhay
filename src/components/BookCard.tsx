import React from 'react';
import { Eye } from 'lucide-react';
import { Book } from '../types.js';

interface BookCardProps {
  book: Book;
  onSelect: (book: Book) => void;
  onOpenQuiz?: (book: Book) => void;
}

export const BookCard: React.FC<BookCardProps> = ({ book, onSelect }) => {
  return (
    <div
      id={`book-card-${book.id}`}
      onClick={() => onSelect(book)}
      className="bg-white border border-gray-200 rounded-xl p-3 sm:p-3.5 hover:border-amber-400 hover:shadow-md active:scale-[0.98] transition-all flex flex-col justify-between cursor-pointer group select-none"
    >
      <div>
        {/* Cover Image */}
        <div className="aspect-[3/4] w-full rounded-lg overflow-hidden bg-gray-100 mb-2.5 sm:mb-3 border border-gray-100 relative shadow-2xs">
          <img
            src={book.coverImage}
            alt={book.title}
            referrerPolicy="no-referrer"
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          />
          {book.shelfLocation && (
            <span className="absolute bottom-1.5 right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-xs text-white">
              {book.shelfLocation}
            </span>
          )}
        </div>

        {/* Category & Library Code badge */}
        <div className="mb-1 flex items-center justify-between gap-1">
          <span className="text-[10px] sm:text-[11px] font-medium text-gray-600 bg-gray-100 px-1.5 sm:px-2 py-0.5 rounded inline-block truncate max-w-[65%]">
            {book.category}
          </span>
          <span className="text-[10px] font-mono font-bold text-orange-700 bg-orange-50 border border-orange-200/80 px-1.5 py-0.5 rounded truncate shrink-0" title="Mã thư viện dùng để quét">
            {book.libraryCode || `LIB-${(book.isbn || '00000').slice(-5)}`}
          </span>
        </div>

        {/* Title & Author */}
        <h3 className="font-bold text-xs sm:text-sm text-gray-900 leading-snug line-clamp-2 group-hover:text-amber-950 mb-0.5 sm:mb-1">
          {book.title}
        </h3>
        <p className="text-[11px] sm:text-xs text-gray-500 line-clamp-1 mb-1.5 sm:mb-2">
          {book.author} • {book.year}
        </p>

        {/* Short description */}
        <p className="text-[11px] sm:text-xs text-gray-600 line-clamp-2 leading-relaxed font-normal hidden xs:block">
          {book.description}
        </p>
      </div>

      {/* Footer info */}
      <div className="pt-2 sm:pt-3 mt-2 sm:mt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-2 text-[10px] sm:text-[11px]">
          <span className="flex items-center gap-1 text-gray-400" title="Lượt xem">
            <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>{book.views || 0}</span>
          </span>
        </div>
        <span className="text-[10px] text-amber-700 font-semibold group-hover:underline">
          Chi tiết →
        </span>
      </div>
    </div>
  );
};
