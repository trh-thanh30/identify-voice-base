# Module Lịch sử dịch (Translation History)

Module **Translation History** lưu lại các lần dịch văn bản đã hoàn tất để Admin thống kê, đối soát và xem lại nội dung nguồn/nội dung dịch.

---

## 1. Phạm vi nghiệp vụ

Module này phục vụ màn **Thống kê bản dịch** trên Admin UI:

- Xem tổng số lượt dịch theo bộ lọc hiện tại.
- Xem số lượt dịch trong ngày.
- Thống kê theo ngôn ngữ đích và chế độ dịch.
- Tra cứu danh sách bản dịch mới nhất.
- Mở dialog chi tiết để xem lại **Văn bản gốc** và **Bản dịch**.
- Copy riêng nội dung văn bản gốc hoặc bản dịch trong dialog chi tiết.
- Cho phép người tạo bản dịch hoặc Admin chỉnh sửa bản dịch đã lưu.
- Xuất bản dịch sang `docx` hoặc `pdf` thông qua API export của AI Core.

---

## 2. Nguồn dữ liệu

Dữ liệu được ghi vào bảng `translation_records` sau khi backend gọi AI Core dịch thành công.

Các luồng đang ghi lịch sử:

- `POST /api/v1/ai-core/translate`
- `POST /api/v1/ai-core/translate-summarize`
- `POST /api/v1/ai-core/translate/jobs` khi job hoàn tất.
- `POST /api/v1/ai-core/translate-summarize/jobs` khi job hoàn tất.

Backend chỉ ghi record khi request có user đăng nhập và response AI Core có trường `translated_text` dạng string.

Khi ghi lịch sử thành công, các API dịch trả thêm `history_record_id` trong response để FE có thể mở form chỉnh sửa ngay sau khi dịch xong nếu cần.

---

## 3. Phân quyền

- **Endpoint danh sách toàn hệ thống**: `GET /api/v1/translate/history`
- **Quyền truy cập danh sách toàn hệ thống**: chỉ `ADMIN`.
- **Endpoint chỉnh sửa**: `PATCH /api/v1/translate/history/:id`
- **Quyền chỉnh sửa**: user có permission `translate.history.update`; chỉ người tạo bản dịch hoặc `ADMIN` được sửa.
- **Auth**: bắt buộc `Authorization: Bearer <access_token>`.
- **Guards**: `JwtAuthGuard`, `RolesGuard` cho danh sách; `JwtAuthGuard`, `PermissionsGuard` cho chỉnh sửa.

User không phải Admin sẽ không truy cập được danh sách lịch sử dịch toàn hệ thống. Operator vẫn có thể cập nhật bản dịch do chính mình tạo nếu Admin cấp permission `translate.history.update`.

---

## 4. Tài liệu chi tiết

| Tài liệu                                                 | Nội dung chính                                               | Đối tượng  |
| :------------------------------------------------------- | :----------------------------------------------------------- | :--------- |
| **[Danh sách & thống kê](./list-history.md)**            | Query params, response, thống kê và gợi ý tích hợp Admin UI. | FE / Admin |
| **[Chỉnh sửa bản dịch đã lưu](./update-translation.md)** | API update, ràng buộc quyền và flow FE chỉnh sửa bản dịch.   | FE / Admin |

---

## 5. Data Model

```prisma
model translation_records {
  id              String          @id @default(uuid()) @db.Uuid
  user_id         String          @db.Uuid
  source_text     String
  translated_text String
  edited_translated_text String?
  edited_at       DateTime?
  edited_by       String?         @db.Uuid
  source_lang     String?
  target_lang     String
  source_file_type String?
  mode            TranslationMode @default(TRANSLATE)
  created_at      DateTime        @default(now())

  operator auth_accounts @relation("translation_record_operator", fields: [user_id], references: [id], onDelete: Restrict)
  editor   auth_accounts? @relation("translation_record_editor", fields: [edited_by], references: [id], onDelete: SetNull)

  @@index([user_id])
  @@index([created_at])
  @@index([target_lang])
  @@index([mode])
  @@index([edited_by])
  @@map("translation_records")
}
```

`mode` gồm:

- `TRANSLATE`: dịch thường.
- `SUMMARIZE`: dịch và tóm tắt.

---

## 6. Lưu ý vận hành

- `source_text` và `translated_text` có thể dài; FE nên render trong vùng scroll.
- `translated_text` là bản AI gốc, không ghi đè khi user sửa.
- `edited_translated_text` là bản user đã chỉnh sửa; FE nên ưu tiên hiển thị/export/copy trường này nếu có, fallback về `translated_text`.
- Flow FE chỉnh sửa chi tiết nằm trong tài liệu **[Chỉnh sửa bản dịch đã lưu](./update-translation.md)**.
- Nội dung dịch là dữ liệu nghiệp vụ nhạy cảm, chỉ hiển thị cho Admin.
- `today_count` dùng ngày hiện tại theo timezone backend.
- Bộ lọc ngày dùng trực tiếp `Date` từ chuỗi `YYYY-MM-DD`; nếu cần lọc trọn ngày kết thúc, FE nên gửi `to_date` phù hợp hoặc backend cần chuẩn hóa về cuối ngày.
