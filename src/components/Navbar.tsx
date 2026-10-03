import React from 'react';
import { BookOpen, Camera, PlusCircle } from 'lucide-react';

interface NavbarProps {
  onOpenScanner: () => void;
  onOpenAddBook?: () => void;
  totalBooks?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenScanner,
  onOpenAddBook,
  totalBooks = 0,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white shadow-xs">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-sm sm:text-base text-gray-950 tracking-tight block">
              THƯ VIỆN THÔNG MINH
            </span>
            <span className="text-[10px] text-gray-500 font-medium hidden sm:block">
              Dự án KHKT lớp 11A1 • {totalBooks} cuốn sách
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onOpenAddBook && (
            <button
              type="button"
              onClick={onOpenAddBook}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-gray-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-gray-500" />
              <span>Thêm sách</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenScanner}
            className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5 text-white" />
            <span>Quét mã vạch</span>
          </button>
        </div>
      </div>
    </header>
  );
};
