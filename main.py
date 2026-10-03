#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
DỰ ÁN KHOA HỌC KĨ THUẬT: HỆ THỐNG QUẢN LÝ THƯ VIỆN & CẤP MÃ SÁCH TỰ ĐỘNG
Tác giả: Cấn Việt Tùng & Tạ Ngọc Diệp (Lớp 11A1)
Ngôn ngữ: Python 3 (Sử dụng thư viện tiêu chuẩn của Python - Không cần cài đặt pip)
=============================================================================
"""

import os
import sys
import json
import sqlite3
import random
import re
import urllib.parse
import http.server
import socketserver
import threading
from datetime import datetime

# Đường dẫn thư mục dữ liệu
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
DB_FILE = os.path.join(DATA_DIR, "library.db")
os.makedirs(DATA_DIR, exist_ok=True)

# =============================================================================
# 1. KẾT NỐI VÀ KHỞI TẠO CƠ SỞ DỮ LIỆU SQLITE
# =============================================================================
def ket_noi_csdl():
    """Tạo kết nối tới cơ sở dữ liệu SQLite."""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def khoi_tao_csdl():
    """Tạo bảng lưu thông tin sách nếu chưa có."""
    with ket_noi_csdl() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS books (
                id TEXT PRIMARY KEY,
                isbn TEXT NOT NULL,
                libraryCode TEXT NOT NULL,
                title TEXT NOT NULL,
                author TEXT NOT NULL,
                category TEXT NOT NULL,
                publisher TEXT,
                year INTEGER,
                shelfLocation TEXT,
                coverImage TEXT,
                views INTEGER DEFAULT 0,
                scanCount INTEGER DEFAULT 0
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS scan_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                barcode TEXT NOT NULL,
                libraryCode TEXT,
                bookTitle TEXT,
                isNew INTEGER DEFAULT 0,
                scanTime TEXT NOT NULL
            )
        """)
        conn.commit()

        # Nạp sẵn một số sách mẫu nếu cơ sở dữ liệu còn trống
        cursor.execute("SELECT COUNT(*) FROM books")
        if cursor.fetchone()[0] == 0:
            sach_mau = [
                ("book-1", "9786042183246", "LIB-83246", "Tác phẩm văn học chọn lọc", "Tác giả đương đại", "Văn học", "NXB Trẻ", 2025, "Kệ A1 - Tầng 1", "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80", 12, 5),
                ("book-2", "9786040180673", "LIB-80673", "Truyện Kiều", "Nguyễn Du", "Văn học cổ điển", "NXB Giáo Dục", 2023, "Kệ B2 - Tầng 1", "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80", 45, 18),
                ("book-3", "9786045892144", "LIB-89214", "Vật lý vui & Ứng dụng cuộc sống", "Yakov Perelman", "Khoa học", "NXB Kim Đồng", 2024, "Kệ C1 - Tầng 2", "https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?auto=format&fit=crop&w=800&q=80", 28, 9),
                ("book-4", "9786043021980", "LIB-02198", "Lập trình Python cơ bản cho THPT", "Đoàn Văn Nam", "Tin học", "NXB TT&TT", 2024, "Kệ D1 - Phòng Lab", "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80", 65, 24)
            ]
            cursor.executemany("""
                INSERT INTO books (id, isbn, libraryCode, title, author, category, publisher, year, shelfLocation, coverImage, views, scanCount)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, sach_mau)
            conn.commit()

# =============================================================================
# 2. THUẬT TOÁN SINH MÃ THƯ VIỆN & QUÉT MÃ VẠCH
# =============================================================================
def sinh_ma_thu_vien(ma_vach: str = "") -> str:
    """
    Sinh mã thư viện độc quyền: LIB-xxxxx
    Dựa trên 5 chữ số cuối của mã vạch ISBN.
    """
    so = re.sub(r"[^0-9]", "", ma_vach)
    if len(so) >= 5:
        duoi = so[-5:]
    elif len(so) > 0:
        duoi = so.zfill(5)
    else:
        duoi = str(random.randint(10000, 99999))
    return f"LIB-{duoi}"

def tim_sach(ma_tim_kiem: str):
    """Tìm sách theo mã thư viện (LIB-xxxxx) hoặc mã vạch ISBN."""
    if not ma_tim_kiem:
        return None
    code = ma_tim_kiem.strip()
    so_duoi = re.sub(r"[^0-9]", "", code)

    with ket_noi_csdl() as conn:
        cursor = conn.cursor()
        # Tìm chính xác mã thư viện
        cursor.execute("SELECT * FROM books WHERE UPPER(libraryCode) = ?", (code.upper(),))
        row = cursor.fetchone()
        if row:
            return dict(row)

        # Tìm theo mã ISBN
        cursor.execute("SELECT * FROM books WHERE isbn = ?", (code,))
        row = cursor.fetchone()
        if row:
            return dict(row)

        # Tìm theo số đuôi
        if so_duoi and len(so_duoi) >= 4:
            cursor.execute("SELECT * FROM books WHERE libraryCode LIKE ? OR isbn LIKE ?", (f"%{so_duoi}", f"%{so_duoi}"))
            row = cursor.fetchone()
            if row:
                return dict(row)

    return None

def xu_ly_quet_ma(ma_vach: str):
    """
    Xử lý quét mã vạch:
    - Nếu sách đã có: hiển thị sách.
    - Nếu sách mới: tự động cấp mã LIB-xxxxx và lưu vào thư viện.
    """
    ma_chuan = ma_vach.strip()
    if len(ma_chuan) < 3:
        return {"success": False, "message": "Mã vạch không hợp lệ."}

    sach = tim_sach(ma_chuan)

    with ket_noi_csdl() as conn:
        cursor = conn.cursor()
        if sach:
            cursor.execute("UPDATE books SET scanCount = scanCount + 1, views = views + 1 WHERE id = ?", (sach["id"],))
            cursor.execute("""
                INSERT INTO scan_logs (barcode, libraryCode, bookTitle, isNew, scanTime)
                VALUES (?, ?, ?, 0, datetime('now'))
            """, (ma_chuan, sach["libraryCode"], sach["title"]))
            conn.commit()
            sach["scanCount"] += 1
            sach["views"] += 1
            return {
                "success": True,
                "isNewlyCreated": False,
                "book": sach,
                "message": f"Tìm thấy sách: \"{sach['title']}\""
            }

        # Nếu là sách mới: cấp mã mới
        ma_moi = sinh_ma_thu_vien(ma_chuan)
        sach_moi = {
            "id": f"book-{random.randint(1000, 9999)}",
            "isbn": ma_chuan,
            "libraryCode": ma_moi,
            "title": f"Sách Mới ({ma_chuan[-4:]})",
            "author": "Tác giả bổ sung",
            "category": "Sách mới",
            "publisher": "Thư viện 11A1",
            "year": datetime.now().year,
            "shelfLocation": "Kệ mới nhập - Tầng 1",
            "coverImage": "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80",
            "views": 1,
            "scanCount": 1
        }

        cursor.execute("""
            INSERT INTO books (id, isbn, libraryCode, title, author, category, publisher, year, shelfLocation, coverImage, views, scanCount)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
        """, (
            sach_moi["id"], sach_moi["isbn"], sach_moi["libraryCode"], sach_moi["title"],
            sach_moi["author"], sach_moi["category"], sach_moi["publisher"], sach_moi["year"],
            sach_moi["shelfLocation"], sach_moi["coverImage"]
        ))
        cursor.execute("""
            INSERT INTO scan_logs (barcode, libraryCode, bookTitle, isNew, scanTime)
            VALUES (?, ?, ?, 1, datetime('now'))
        """, (ma_chuan, ma_moi, sach_moi["title"]))
        conn.commit()

        return {
            "success": True,
            "isNewlyCreated": True,
            "newLibraryCode": ma_moi,
            "book": sach_moi,
            "message": f"🎉 ĐÃ CẤP MÃ MỚI: [{ma_moi}]! Sách đã được lưu vào hệ thống."
        }

def lay_danh_sach_sach():
    """Lấy danh sách tất cả các cuốn sách trong cơ sở dữ liệu."""
    with ket_noi_csdl() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM books ORDER BY id DESC")
        return [dict(r) for r in cursor.fetchall()]

# =============================================================================
# 3. GIAO DIỆN WEB DÀNH CHO BẠN ĐỌC & TRA CỨU
# =============================================================================
class WebHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def tra_ve_json(self, du_lieu: dict, status: int = 200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(json.dumps(du_lieu, ensure_ascii=False).encode("utf-8"))

    def do_GET(self):
        path = urllib.parse.urlparse(self.path).path
        if path == "/api/books":
            ds = lay_danh_sach_sach()
            self.tra_ve_json({"success": True, "books": ds})
            return

        if path in ("/", "/index.html"):
            ds = lay_danh_sach_sach()
            html = f"""<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>THƯ VIỆN THÔNG MINH - 11A1</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50 text-slate-900 min-h-screen p-4">
  <div class="max-w-4xl mx-auto space-y-6">
    <header class="bg-white p-4 rounded-2xl border shadow-xs flex items-center justify-between">
      <div>
        <h1 class="text-base sm:text-lg font-black text-slate-900">📚 THƯ VIỆN THÔNG MINH</h1>
        <p class="text-xs text-slate-500">Dự án KHKT: Cấn Việt Tùng & Tạ Ngọc Diệp (11A1)</p>
      </div>
      <span class="text-xs font-bold px-2.5 py-1 bg-orange-100 text-orange-800 rounded-lg">{len(ds)} cuốn sách</span>
    </header>

    <!-- Quét mã -->
    <div class="bg-white p-4 rounded-2xl border space-y-3 shadow-xs">
      <h2 class="font-bold text-sm text-slate-800">🔍 Quét mã vạch / Nhập mã thư viện:</h2>
      <div class="flex gap-2">
        <input id="ma" type="text" placeholder="Nhập mã ISBN hoặc LIB-xxxxx..." class="flex-1 px-3 py-2 border rounded-xl text-xs font-mono" />
        <button onclick="quet()" class="px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold shadow">Quét mã</button>
      </div>
      <div id="kq" class="hidden text-xs p-3 rounded-xl border"></div>
    </div>

    <!-- Danh sách sách -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {"".join([f'''
        <div class="bg-white p-3 rounded-xl border space-y-1 shadow-2xs">
          <img src="{s['coverImage']}" class="w-full aspect-[3/4] object-cover rounded-lg border" />
          <span class="text-[10px] font-mono font-bold text-orange-700 bg-orange-50 px-1 py-0.5 rounded inline-block">{s['libraryCode']}</span>
          <h3 class="font-bold text-xs truncate">{s['title']}</h3>
          <p class="text-[11px] text-slate-500 truncate">{s['author']}</p>
          <p class="text-[10px] text-slate-400">📍 {s['shelfLocation']}</p>
        </div>
      ''' for s in ds])}
    </div>
  </div>

  <script>
    async function quet() {{
      const v = document.getElementById('ma').value.trim();
      if(!v) return;
      const res = await fetch('/api/barcode/scan', {{
        method: 'POST',
        headers: {{ 'Content-Type': 'application/json' }},
        body: JSON.stringify({{ barcode: v }})
      }});
      const d = await res.json();
      const div = document.getElementById('kq');
      div.classList.remove('hidden');
      if(d.success) {{
        div.className = 'text-xs p-3 rounded-xl border bg-emerald-50 border-emerald-300';
        div.innerHTML = `<strong>${{d.message}}</strong><br>📖 ${{d.book.title}} - ${{d.book.author}}<br>🏷️ Mã: <b>${{d.book.libraryCode}}</b> (Kệ: ${{d.book.shelfLocation}})`;
      }} else {{
        div.className = 'text-xs p-3 rounded-xl border bg-rose-50 border-rose-300 text-rose-700';
        div.innerText = '❌ ' + d.message;
      }}
    }}
  </script>
</body>
</html>"""
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(html.encode("utf-8"))
            return

        self.send_response(404)
        self.end_headers()

    def do_POST(self):
        path = urllib.parse.urlparse(self.path).path
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length).decode("utf-8") if length > 0 else "{}"
        try:
            data = json.loads(body)
        except Exception:
            data = {}

        if path == "/api/barcode/scan":
            ma = data.get("barcode", "")
            kq = xu_ly_quet_ma(ma)
            self.tra_ve_json(kq)
            return

        self.send_response(404)
        self.end_headers()

# =============================================================================
# 4. CHƯƠNG TRÌNH CHÍNH & MENU LỰA CHỌN (TIN HỌC LỚP 11)
# =============================================================================
def chay_web_server(port: int = 8000):
    """Chạy máy chủ web trong luồng nền."""
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", port), WebHandler) as httpd:
        print(f"✓ Máy chủ Web đang chạy tại: http://localhost:{port}")
        httpd.serve_forever()

def menu_chinh():
    """Menu dòng lệnh tương tác cho học sinh."""
    while True:
        print("\n" + "=" * 55)
        print("  📚 DỰ ÁN KHKT: HỆ THỐNG THƯ VIỆN THÔNG MINH")
        print("  Nhóm tác giả: Cấn Việt Tùng & Tạ Ngọc Diệp (Lớp 11A1)")
        print("=" * 55)
        print("1. Xem danh sách tất cả các cuốn sách")
        print("2. Quét mã vạch / Tìm kiếm sách (ISBN hoặc LIB-xxxxx)")
        print("3. Thêm một cuốn sách mới vào thư viện")
        print("4. Mở máy chủ Web để tra cứu (Cổng 8000)")
        print("5. Thoát chương trình")
        print("-" * 55)

        chon = input("👉 Nhập lựa chọn của bạn (1-5): ").strip()

        if chon == "1":
            ds = lay_danh_sach_sach()
            print(f"\n--- TỔNG SỐ: {len(ds)} CUỐN SÁCH TRONG THƯ VIỆN ---")
            for i, s in enumerate(ds, 1):
                print(f"{i:2d}. [{s['libraryCode']}] {s['title']} - {s['author']} ({s['shelfLocation']})")

        elif chon == "2":
            ma = input("\n👉 Quét mã qua máy quét hoặc nhập mã vạch: ").strip()
            if not ma:
                continue
            kq = xu_ly_quet_ma(ma)
            if kq.get("success"):
                b = kq["book"]
                if kq.get("isNewlyCreated"):
                    print(f"\n🎉 [ĐÃ CẤP MÃ MỚI]: {kq.get('newLibraryCode')}")
                else:
                    print(f"\n✓ [TÌM THẤY SÁCH]:")
                print(f"   📖 Tên sách: {b['title']}")
                print(f"   ✍️ Tác giả: {b['author']} ({b['year']})")
                print(f"   🏷️ Mã thư viện: {b['libraryCode']}  |  Mã ISBN: {b['isbn']}")
                print(f"   📍 Vị trí: {b['shelfLocation']}")
            else:
                print(f"❌ {kq.get('message')}")

        elif chon == "3":
            print("\n--- NHẬP THÔNG TIN SÁCH MỚI ---")
            ten = input("Tên sách: ").strip()
            tac_gia = input("Tác giả: ").strip()
            ma_vach = input("Mã vạch ISBN: ").strip()
            the_loai = input("Thể loại (mặc định: Văn học): ").strip() or "Văn học"
            ke = input("Vị trí kệ (mặc định: Kệ A1): ").strip() or "Kệ A1"

            if not ten or not tac_gia or not ma_vach:
                print("❌ Lỗi: Tên sách, tác giả và mã vạch không được để trống!")
                continue

            ma_lib = sinh_ma_thu_vien(ma_vach)
            with ket_noi_csdl() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO books (id, isbn, libraryCode, title, author, category, publisher, year, shelfLocation, coverImage, views, scanCount)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)
                """, (
                    f"book-{random.randint(1000, 9999)}", ma_vach, ma_lib, ten,
                    tac_gia, the_loai, "Thư viện 11A1", 2025, ke,
                    "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80"
                ))
                conn.commit()
            print(f"✓ Đã thêm sách \"{ten}\" với mã thư viện: [{ma_lib}]")

        elif chon == "4":
            print("\nĐang khởi chạy máy chủ Web...")
            t = threading.Thread(target=chay_web_server, args=(8000,), daemon=True)
            t.start()
            print("👉 Bạn có thể mở trình duyệt vào http://localhost:8000 để sử dụng!")

        elif chon == "5":
            print("Cảm ơn bạn đã sử dụng chương trình. Tạm biệt!")
            break
        else:
            print("❌ Lựa chọn không hợp lệ, vui lòng chọn từ 1 đến 5.")

if __name__ == "__main__":
    khoi_tao_csdl()
    if len(sys.argv) > 1 and sys.argv[1] == "--server":
        chay_web_server(8000)
    else:
        menu_chinh()
