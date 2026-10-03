import { Book } from '../types.js';

export const initialBooks: Book[] = [
  {
    id: "book-1",
    isbn: "9786042183246",
    libraryCode: "LIB-83246",
    title: "Tác phẩm văn học chọn lọc",
    author: "Tác giả đương đại",
    publisher: "NXB Trẻ",
    year: 2025,
    category: "Văn học",
    description: "Tuyển tập những tác phẩm văn học chọn lọc đặc sắc, khơi dậy tinh thần yêu nước, lòng nhân ái và tư duy độc lập sáng tạo cho học sinh.",
    shelfLocation: "Kệ A1 - Tầng 1",
    coverImage: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80",
    views: 12,
    scanCount: 5
  },
  {
    id: "book-2",
    isbn: "9786040180673",
    libraryCode: "LIB-80673",
    title: "Truyện Kiều",
    author: "Nguyễn Du",
    publisher: "NXB Giáo Dục",
    year: 2023,
    category: "Văn học cổ điển",
    description: "Kiệt tác truyện thơ Nôm của đại thi hào Nguyễn Du, kể về cuộc đời tài hoa bạc mệnh của nàng Thúy Kiều với giá trị nhân đạo sâu sắc.",
    shelfLocation: "Kệ B2 - Tầng 1",
    coverImage: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80",
    views: 45,
    scanCount: 18
  },
  {
    id: "book-3",
    isbn: "9786045892144",
    libraryCode: "LIB-89214",
    title: "Vật lý vui & Ứng dụng cuộc sống",
    author: "Yakov Perelman",
    publisher: "NXB Kim Đồng",
    year: 2024,
    category: "Khoa học",
    description: "Giải thích những hiện tượng vật lý thú vị trong đời sống hàng ngày qua các thí nghiệm trực quan, dễ hiểu cho lứa tuổi học sinh cấp 3.",
    shelfLocation: "Kệ C1 - Tầng 2",
    coverImage: "https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?auto=format&fit=crop&w=800&q=80",
    views: 28,
    scanCount: 9
  },
  {
    id: "book-4",
    isbn: "9786043021980",
    libraryCode: "LIB-02198",
    title: "Lập trình Python cơ bản cho THPT",
    author: "Đoàn Văn Nam",
    publisher: "NXB Thông Tin & Truyền Thông",
    year: 2024,
    category: "Tin học",
    description: "Tài liệu học tập lập trình Python dành cho học sinh THPT phục vụ nghiên cứu khoa học kỹ thuật và tin học ứng dụng.",
    shelfLocation: "Kệ D1 - Phòng Lab",
    coverImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80",
    views: 65,
    scanCount: 24
  }
];
