# API: Chỉnh sửa bản dịch đã lưu

API này cho phép lưu lại bản dịch đã được user chỉnh sửa sau khi AI dịch xong. Backend giữ nguyên bản dịch AI gốc trong `translated_text` và lưu bản chỉnh sửa vào `edited_translated_text`.

---

## 1. Thông tin chung

- **Endpoint**: `PATCH /api/v1/translate/history/:id`
- **Tác vụ**: Cập nhật bản dịch đã chỉnh sửa cho một record lịch sử dịch.
- **Auth**: Bearer Token bắt buộc.
- **Permission**: `translate.history.update`.

Ràng buộc bổ sung:

- `ADMIN` được sửa mọi bản dịch.
- `OPERATOR` chỉ sửa được bản dịch do chính mình tạo và cần được Admin cấp permission `translate.history.update`.
- Backend không ghi đè `translated_text`; nội dung sửa nằm ở `edited_translated_text`.

---

## 2. Request

```http
PATCH /api/v1/translate/history/2f2f2f2f-1111-4444-8888-aaaaaaaaaaaa
Authorization: Bearer <access_token>
Content-Type: application/json
```

```json
{
  "translated_text": "Hello, I need this content translated."
}
```

| Field             | Kiểu     | Bắt buộc | Ghi chú                                      |
| :---------------- | :------- | :------- | :------------------------------------------- |
| `translated_text` | `String` | Có       | Bản dịch user đã chỉnh sửa, không được rỗng. |

---

## 3. Response

```json
{
  "success": true,
  "data": {
    "id": "2f2f2f2f-1111-4444-8888-aaaaaaaaaaaa",
    "source_text": "Xin chào, tôi cần dịch nội dung này.",
    "translated_text": "Hello, I need to translate this content.",
    "edited_translated_text": "Hello, I need this content translated.",
    "effective_translated_text": "Hello, I need this content translated.",
    "edited_at": "2026-05-02T05:35:00.000Z",
    "edited_by": "9a9a9a9a-2222-4444-8888-bbbbbbbbbbbb",
    "source_lang": "vi",
    "target_lang": "en",
    "source_file_type": "text",
    "mode": "TRANSLATE",
    "created_at": "2026-05-02T05:30:00.000Z",
    "operator": {
      "id": "9a9a9a9a-2222-4444-8888-bbbbbbbbbbbb",
      "email": "admin@example.com",
      "username": "admin",
      "role": "ADMIN"
    }
  },
  "message": "Cập nhật bản dịch thành công",
  "meta": {
    "timestamp": "2026-05-02T05:35:01.000Z",
    "version": "v1",
    "requestId": "..."
  }
}
```

FE nên dùng `effective_translated_text` để hiển thị/copy/export sau khi record đã được chỉnh sửa.

---

## 4. Flow FE chỉnh sửa từ màn lịch sử Admin

1. FE gọi `GET /api/v1/translate/history` để lấy danh sách record.
2. Khi render danh sách, FE dùng:
   - `effective_translated_text` để hiển thị preview bản dịch.
   - `edited_at` để hiển thị badge “Đã chỉnh sửa” nếu có.
3. Khi user mở chi tiết record, FE hiển thị hai cột:
   - Cột trái: `source_text`.
   - Cột phải: `effective_translated_text`.
4. Nếu user có permission `translate.history.update`, FE hiển thị nút “Chỉnh sửa”.
5. Khi bấm “Chỉnh sửa”, FE mở textarea với giá trị ban đầu là `effective_translated_text`.
6. Khi bấm “Lưu”, FE validate:
   - Nội dung sau khi trim không được rỗng.
   - Nếu nội dung không đổi so với `effective_translated_text`, có thể bỏ qua request.
7. FE gọi:

```ts
await axiosInstance.patch(`/translate/history/${record.id}`, {
  translated_text: editedText.trim(),
});
```

8. Sau khi thành công, FE dùng response `data` để cập nhật record trong cache/list hiện tại hoặc refetch lại `GET /translate/history`.
9. FE tiếp tục dùng `effective_translated_text` mới cho copy/export/preview.

---

## 5. Flow FE chỉnh sửa ngay sau khi dịch xong

Các API dịch/job dịch trả thêm `history_record_id` khi backend ghi lịch sử thành công. FE có thể dùng id này để cho phép sửa ngay bản dịch vừa tạo.

### 5.1 Dịch trực tiếp không qua job

1. User chạy dịch.
2. FE nhận response có `translated_text` và có thể có `history_record_id`.
3. FE hiển thị bản dịch bằng `translated_text`.
4. Nếu response có `history_record_id` và user có permission `translate.history.update`, FE hiển thị nút “Chỉnh sửa”.
5. Khi lưu, FE gọi:

```ts
await axiosInstance.patch(
  `/translate/history/${translation.history_record_id}`,
  {
    translated_text: editedText.trim(),
  },
);
```

### 5.2 Dịch qua job

1. FE tạo job dịch.
2. FE poll `GET /api/v1/ai-core/translate/jobs/:jobId`.
3. Khi job `completed`, FE đọc:
   - `jobStatus.result.translated_text`
   - `jobStatus.result.history_record_id`
4. FE lưu `history_record_id` vào state của kết quả đang hiển thị.
5. Khi user sửa và lưu, FE gọi PATCH giống flow trên.

Nếu response không có `history_record_id`, FE vẫn hiển thị bản dịch bình thường nhưng nên ẩn nút lưu chỉnh sửa, vì backend không có record lịch sử để cập nhật.

---

## 6. State gợi ý cho FE

```ts
type TranslationEditState = {
  recordId: string;
  originalText: string;
  aiTranslatedText: string;
  effectiveTranslatedText: string;
  draftTranslatedText: string;
  isEditing: boolean;
  isSaving: boolean;
};
```

Mapping dữ liệu:

- `aiTranslatedText` lấy từ `translated_text`.
- `effectiveTranslatedText` lấy từ `effective_translated_text ?? edited_translated_text ?? translated_text`.
- `draftTranslatedText` khởi tạo bằng `effectiveTranslatedText`.

---

## 7. Quyền và hiển thị nút sửa

FE nên hiển thị nút “Chỉnh sửa” khi user có permission `translate.history.update`.

Backend vẫn kiểm tra thêm ownership:

- `ADMIN` sửa được mọi bản dịch.
- `OPERATOR` chỉ sửa được bản dịch do chính mình tạo và cần được Admin cấp permission `translate.history.update`.

Vì vậy FE nên xử lý `403` kể cả khi đã ẩn/hiện nút theo permission.

---

## 8. Copy và export sau khi sửa

Sau khi record đã có bản chỉnh sửa, FE không nên dùng trực tiếp `translated_text` cho copy/export nữa. Luôn dùng:

```ts
const displayText =
  record.effective_translated_text ??
  record.edited_translated_text ??
  record.translated_text;
```

Khi export DOCX/PDF bằng `POST /api/v1/ai-core/translate/export`, truyền `displayText` vào field `text`.

---

## 9. Xử lý optimistic update

FE có thể chọn một trong hai cách:

- Cách đơn giản: gọi PATCH thành công thì refetch danh sách lịch sử.
- Cách mượt hơn: thay record trong cache bằng `response.data`, vì response trả đầy đủ các field cần render.

Khi PATCH lỗi, FE giữ nguyên bản dịch hiện tại và báo lỗi.

---

## 10. Xử lý lỗi

| HTTP Status | Trường hợp                                         | Hướng xử lý FE                                     |
| :---------- | :------------------------------------------------- | :------------------------------------------------- |
| `401`       | Token hết hạn hoặc không hợp lệ.                   | Điều hướng đăng nhập lại hoặc refresh token.       |
| `403`       | Không đủ quyền hoặc sửa bản dịch không thuộc user. | Ẩn nút sửa hoặc báo không đủ quyền thao tác.       |
| `404`       | Không tìm thấy bản dịch khi gọi PATCH.             | Thông báo record không còn tồn tại và refetch lại. |
| `400`       | `translated_text` rỗng hoặc payload sai.           | Validate form trước khi gọi API.                   |
| `500`       | Lỗi truy vấn database hoặc lỗi hệ thống.           | Hiển thị error state và cho phép thử lại.          |
