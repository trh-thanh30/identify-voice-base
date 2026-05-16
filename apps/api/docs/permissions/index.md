# Permission Matrix & Usage Guide

Tài liệu này mô tả chi tiết hệ permission hiện tại của hệ thống, cách permission được gán, cách backend sử dụng permission trong guards và controller, cũng như cách frontend nên diễn giải chúng trong UI.

---

## 1. Mục tiêu của hệ permission

Hệ thống không chỉ dùng `role` để phân quyền.

Nếu chỉ dùng `role`, mọi operator sẽ có cùng mức quyền và rất khó cấu hình các trường hợp như:

- operator chỉ được xem
- operator được enroll nhưng không được sửa hồ sơ
- operator được phép identify nhưng không được xóa voice
- operator bị giới hạn chỉ một vài màn hình

Vì vậy hệ thống dùng mô hình:

- `Role`
- `Permissions`

Trong đó:

- `Role` dùng để xác định nhóm lớn của tài khoản
- `Permissions` dùng để quyết định tài khoản đó được phép thao tác gì

---

## 2. Vai trò hiện có

### 2.1 ADMIN

`ADMIN` là tài khoản quản trị hệ thống.

Admin có toàn quyền trên toàn bộ permission hiện có.

Trong logic hiện tại, nếu account có `role = ADMIN` thì backend coi như account đó luôn có full permission, kể cả khi trường `permissions` trong DB rỗng hoặc khác với operator.

### 2.2 OPERATOR

`OPERATOR` là tài khoản vận hành nghiệp vụ.

Operator có thể:

- dùng bộ quyền mặc định
- hoặc được admin cấu hình lại permission cụ thể

Điểm quan trọng:

- operator không mặc định có toàn quyền
- operator mặc định chỉ có một tập permission tối thiểu
- admin có thể tăng hoặc giảm tập quyền này

---

## 3. Nơi lưu permission

Permission được lưu trong bảng:

`auth_accounts`

Field liên quan:

- `role`
- `permissions`
- `status`

Trong đó:

- `role` là enum Prisma
- `permissions` là `JSONB`
- `status` giúp khóa account nếu cần

Ví dụ một record operator:

```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "email": "operator@example.com",
  "role": "OPERATOR",
  "status": "ACTIVE",
  "permissions": ["profile.read", "voices.read", "voices.enroll"]
}
```

---

## 4. Danh sách permission hiện có

Hiện tại hệ thống định nghĩa các permission sau:

### 4.1 `accounts.manage`

Ý nghĩa:

- quản lý account đăng nhập
- dùng cho các thao tác ở nhóm admin account management

Trạng thái sử dụng thực tế:

- hiện tại các API admin account đang được bảo vệ bằng `Role.ADMIN`
- permission này đã được khai báo trong danh sách chung
- có thể dùng trong tương lai nếu muốn chuyển từ role-check sang permission-check

### 4.2 `profile.read`

Ý nghĩa:

- xem thông tin account của chính tài khoản đang đăng nhập

Được dùng cho:

- `GET /api/v1/user/me`

Frontend tương ứng:

- màn hình My Account
- drawer/profile popup
- phần hiển thị role và permission hiện tại

### 4.3 `profile.update`

Ý nghĩa:

- tự cập nhật account của chính mình

Được dùng cho:

- `PATCH /api/v1/user/account`

Cho phép:

- đổi `email`
- đổi `username`

Không cho phép:

- đổi `role`
- đổi `status`
- đổi `permissions`
- đổi password trực tiếp qua API này

### 4.4 `profile.delete`

Ý nghĩa:

- tự vô hiệu hóa account của mình

Được dùng cho:

- `DELETE /api/v1/user/delete-account`

Hành vi:

- chuyển `status` sang `INACTIVE`
- xóa `refresh_token`

### 4.5 `voices.read`

Ý nghĩa:

- xem danh sách và chi tiết hồ sơ giọng nói

Được dùng cho:

- `GET /api/v1/voices`
- `GET /api/v1/voices/:id`
- `GET /api/v1/ai-voices`
- `GET /api/v1/ai-voices/:id`

Frontend tương ứng:

- màn hình danh sách voice
- màn hình chi tiết voice
- màn hình danh sách AI voice gợi ý

### 4.6 `voices.enroll`

Ý nghĩa:

- đăng ký giọng nói mới
- chuyển AI gợi ý thành hồ sơ chính thức

Được dùng cho:

- `POST /api/v1/voices/enroll`
- `POST /api/v1/ai-voices/:id/convert`
- upload audio với `purpose = ENROLL`

Frontend tương ứng:

- form enroll
- action convert AI voice

### 4.7 `voices.update`

Ý nghĩa:

- sửa metadata voice
- cập nhật embedding từ audio mới
- upload audio cho mục đích update voice

Được dùng cho:

- `PATCH /api/v1/voices/:id`
- `POST /api/v1/voices/:id/update-from-audios`
- upload audio với `purpose = UPDATE_VOICE`

Frontend tương ứng:

- màn hình chỉnh sửa hồ sơ voice
- flow upload audio để enrich model

### 4.8 `voices.delete`

Ý nghĩa:

- vô hiệu hóa hoặc xóa hồ sơ giọng nói khỏi luồng nhận dạng

Được dùng cho:

- `PATCH /api/v1/voices/:id/delete-voice`

Frontend tương ứng:

- nút delete hoặc deactivate voice

### 4.9 `identify.run`

Ý nghĩa:

- thực hiện nhận dạng giọng nói

Được dùng cho:

- `POST /api/v1/identify`
- upload audio với `purpose = IDENTIFY`

Frontend tương ứng:

- màn hình nhận dạng 1 người
- màn hình nhận dạng nhiều người

### 4.10 `ocr.run`

Ý nghĩa:

- chạy OCR tài liệu qua AI Core

Được dùng cho:

- `POST /api/v1/ai-core/ocr`
- `POST /api/v1/ai-core/ocr/jobs`
- `GET /api/v1/ai-core/ocr/jobs/:jobId`

Frontend tương ứng:

- bước trích xuất văn bản từ ảnh/PDF/DOCX/TXT trong màn dịch file

### 4.11 `s2t.run`

Ý nghĩa:

- chuyển giọng nói thành văn bản qua AI Core

Được dùng cho:

- `POST /api/v1/ai-core/speech-to-text`
- `POST /api/v1/ai-core/speech-to-text/jobs`
- `GET /api/v1/ai-core/speech-to-text/jobs/:jobId`

Frontend tương ứng:

- bước nhận dạng audio/video trong màn dịch file

### 4.12 `translate.run`

Ý nghĩa:

- chạy dịch văn bản, dịch/tóm tắt, phát hiện ngôn ngữ và export bản dịch

Được dùng cho:

- `POST /api/v1/ai-core/translate`
- `POST /api/v1/ai-core/translate/jobs`
- `GET /api/v1/ai-core/translate/jobs/:jobId`
- `POST /api/v1/ai-core/translate-summarize`
- `POST /api/v1/ai-core/translate-summarize/jobs`
- `POST /api/v1/ai-core/detect-language`
- `POST /api/v1/ai-core/translate/export`

Frontend tương ứng:

- màn dịch trực tiếp
- màn dịch file

### 4.13 `translate.history.update`

Ý nghĩa:

- chỉnh sửa bản dịch đã lưu trong lịch sử

Được dùng cho:

- `PATCH /api/v1/translate/history/:id`

Ràng buộc bổ sung:

- `ADMIN` được sửa mọi bản dịch
- `OPERATOR` chỉ sửa được bản dịch do chính mình tạo và cần được Admin cấp permission này

Frontend tương ứng:

- nút/chế độ chỉnh sửa bản dịch trong chi tiết lịch sử dịch

### 4.14 `sessions.read`

Ý nghĩa:

- xem danh sách phiên identify
- xem chi tiết phiên
- nghe audio từng speaker trong session

Được dùng cho:

- `GET /api/v1/sessions`
- `GET /api/v1/sessions/:id`
- `GET /api/v1/sessions/:id/speakers/:label/audio`

Frontend tương ứng:

- màn hình session history
- session detail page

---

## 5. Default permission của từng role

### 5.1 ADMIN

Admin có full permission:

- `accounts.manage`
- `profile.read`
- `profile.update`
- `profile.delete`
- `voices.read`
- `voices.enroll`
- `voices.update`
- `voices.delete`
- `identify.run`
- `ocr.run`
- `s2t.run`
- `translate.run`
- `translate.history.update`
- `sessions.read`

### 5.2 OPERATOR

Operator mặc định hiện tại chỉ có:

- `profile.read`
- `voices.read`
- `voices.enroll`

Đây là cấu hình mặc định đúng theo yêu cầu nghiệp vụ:

- được xem
- được đăng ký giọng nói
- không được sửa hồ sơ
- không được xóa hồ sơ

Nói cách khác, operator mới tạo mà không cấu hình thêm sẽ:

- vào được màn hình thông tin account của mình
- vào được màn hình xem voice
- thực hiện enroll được
- không chạy identify được
- không sửa voice được
- không xóa voice được
- không xem sessions được

---

## 6. Cách backend resolve permission

Backend dùng helper trong:

`src/common/auth/permissions.ts`

Luồng xử lý hiện tại:

1. Đọc account từ DB trong `JwtAuthGuard`
2. Kiểm tra `status`
3. Resolve permission thực tế của account
4. Gắn lại vào `request.user`
5. `PermissionsGuard` kiểm tra permission ở controller method

Ý nghĩa của cách làm này:

- thay đổi permission có hiệu lực ngay ở request sau
- không cần đợi user logout/login lại
- token cũ vẫn được kiểm tra lại với dữ liệu DB mới nhất

---

## 7. Cách controller khai báo permission

Backend dùng decorator:

`@Permissions([...])`

Ví dụ:

```ts
@Get('me')
@Permissions(['profile.read'])
async getMe() {}
```

Ví dụ khác:

```ts
@Post('enroll')
@Permissions(['voices.enroll'])
async enroll() {}
```

Nếu một endpoint yêu cầu permission nhưng account không có, request sẽ bị chặn bởi `PermissionsGuard`.

---

## 8. Sự khác nhau giữa Role Guard và Permission Guard

### 8.1 Role Guard

Dùng khi:

- cần chặn hẳn một nhóm route chỉ admin mới được vào

Ví dụ:

- admin account management routes dưới `/users/accounts`

### 8.2 Permission Guard

Dùng khi:

- route thuộc nghiệp vụ chung
- nhưng cần bật hoặc tắt quyền chi tiết cho từng operator

Ví dụ:

- voice read
- enroll
- identify
- translate
- translate history update
- sessions

Nguyên tắc nên dùng:

- route admin-only cấp hệ thống: ưu tiên `Role.ADMIN`
- route nghiệp vụ cần cấu hình linh hoạt: dùng permission

---

## 9. Mapping permission với route hiện tại

### 9.1 Account self-service

- `GET /api/v1/user/me` -> `profile.read`
- `PATCH /api/v1/user/account` -> `profile.update`
- `DELETE /api/v1/user/delete-account` -> `profile.delete`

### 9.2 Voice management

- `GET /api/v1/voices` -> `voices.read`
- `GET /api/v1/voices/:id` -> `voices.read`
- `PATCH /api/v1/voices/:id` -> `voices.update`
- `PATCH /api/v1/voices/:id/delete-voice` -> `voices.delete`
- `POST /api/v1/voices/:id/update-from-audios` -> `voices.update`
- `POST /api/v1/voices/enroll` -> `voices.enroll`

### 9.3 AI voices

- `GET /api/v1/ai-voices` -> `voices.read`
- `GET /api/v1/ai-voices/:id` -> `voices.read`
- `POST /api/v1/ai-voices/:id/convert` -> `voices.enroll`

### 9.4 Identify

- `POST /api/v1/identify` -> `identify.run`

### 9.5 AI Core dịch và xử lý tài liệu

- `POST /api/v1/ai-core/ocr` -> `ocr.run`
- `POST /api/v1/ai-core/ocr/jobs` -> `ocr.run`
- `GET /api/v1/ai-core/ocr/jobs/:jobId` -> `ocr.run`
- `POST /api/v1/ai-core/speech-to-text` -> `s2t.run`
- `POST /api/v1/ai-core/speech-to-text/jobs` -> `s2t.run`
- `GET /api/v1/ai-core/speech-to-text/jobs/:jobId` -> `s2t.run`
- `POST /api/v1/ai-core/translate` -> `translate.run`
- `POST /api/v1/ai-core/translate/jobs` -> `translate.run`
- `GET /api/v1/ai-core/translate/jobs/:jobId` -> `translate.run`
- `POST /api/v1/ai-core/translate-summarize` -> `translate.run`
- `POST /api/v1/ai-core/translate-summarize/jobs` -> `translate.run`
- `POST /api/v1/ai-core/detect-language` -> `translate.run`
- `POST /api/v1/ai-core/translate/export` -> `translate.run`

### 9.6 Lịch sử dịch

- `GET /api/v1/translate/history` -> `ADMIN`
- `PATCH /api/v1/translate/history/:id` -> `translate.history.update`

### 9.7 Sessions

- `GET /api/v1/sessions` -> `sessions.read`
- `GET /api/v1/sessions/:id` -> `sessions.read`
- `GET /api/v1/sessions/:id/speakers/:label/audio` -> `sessions.read`

### 9.8 Upload audio theo purpose

Upload audio không dùng một permission cố định cho mọi request.

Hệ thống map theo `purpose`:

- `ENROLL` -> `voices.enroll`
- `IDENTIFY` -> `identify.run`
- `UPDATE_VOICE` -> `voices.update`

Điều này đảm bảo:

- cùng một endpoint upload
- nhưng mỗi loại tác vụ vẫn bị kiểm soát đúng quyền

---

## 10. Luồng tạo operator mới

Khi admin gọi:

`POST /api/v1/users/accounts`

Backend xử lý như sau:

1. Kiểm tra email và username không trùng
2. Nếu `role = ADMIN`:
   - gán full permission
3. Nếu `role = OPERATOR` và có `permissions`:
   - normalize và lưu permission đó
4. Nếu `role = OPERATOR` và không có `permissions`:
   - gán bộ quyền mặc định của operator
5. Hash password
6. Lưu account vào DB

---

## 11. Luồng admin update operator

Khi admin gọi:

`PATCH /api/v1/users/accounts/:id/account`

Backend có thể cập nhật:

- email
- username
- password
- role
- status
- permissions

Quy tắc đáng chú ý:

- nếu đổi password thì refresh token bị xóa
- nếu đổi sang `ADMIN` thì permission được nâng lên full set
- nếu là `OPERATOR` và gửi `permissions: []` thì reset về mặc định operator

---

## 12. Những gì permission không làm

Permission không thay thế hoàn toàn mọi thứ.

Permission hiện không xử lý:

- validation payload
- kiểm tra file audio hợp lệ hay không
- business rule của từng use case
- ownership của dữ liệu ở mức record-specific

Ví dụ:

- có `voices.update` không có nghĩa là update payload nào cũng hợp lệ
- có `voices.enroll` không có nghĩa là file audio sai format vẫn được chấp nhận

---

## 13. Khuyến nghị cho Frontend

Frontend nên coi permission là nguồn dữ liệu UI-level để quyết định:

- có hiển thị menu hay không
- có cho bấm button hay không
- có cho vào route hay không

Ví dụ:

- không có `voices.update` -> ẩn nút Edit Voice
- không có `voices.delete` -> ẩn nút Delete Voice
- không có `identify.run` -> ẩn màn hình Identify
- không có `sessions.read` -> ẩn menu Sessions

Nhưng frontend không được coi đây là lớp bảo mật duy nhất.

Backend mới là nơi ra quyết định cuối cùng.

---

## 14. Khuyến nghị cho Backend

Khi thêm API mới, cần xác định rõ:

1. API đó dành cho admin-only hay permission-based
2. Nếu permission-based thì dùng permission nào
3. Nếu chưa có permission phù hợp thì phải bổ sung đồng thời:
   - constant permission
   - default role mapping
   - docs
   - FE mapping

Không nên:

- reuse permission sai nghĩa chỉ để cho nhanh
- để route mới không có guard nếu route đó không public

---

## 15. Ví dụ cấu hình permission thực tế

### 15.1 Operator chỉ xem và enroll

```json
["profile.read", "voices.read", "voices.enroll"]
```

### 15.2 Operator vận hành identify nhưng không sửa xóa hồ sơ

```json
["profile.read", "voices.read", "voices.enroll", "identify.run"]
```

### 15.3 Operator quản lý voice đầy đủ nhưng không quản lý account

```json
[
  "profile.read",
  "profile.update",
  "voices.read",
  "voices.enroll",
  "voices.update",
  "voices.delete",
  "identify.run",
  "sessions.read"
]
```

### 15.4 Admin

Admin không cần cấu hình thủ công từng permission. Hệ thống auto resolve full quyền.

---

## 16. Checklist khi debug lỗi permission

Nếu gặp lỗi `403 Forbidden`, kiểm tra theo thứ tự:

1. account có đăng nhập thành công không
2. `status` có phải `ACTIVE` không
3. `role` là gì
4. `permissions` thực tế trong DB là gì
5. endpoint đang yêu cầu permission nào
6. request có đang đi qua đúng guard không
7. frontend có đang gọi đúng route không

---

## 17. Tài liệu liên quan

- [Auth Index](../auth/index.md)
- [Login & Tokens](../auth/login-tokens.md)
- [Profile Management](../auth/profile-management.md)
- [Overview: Auth](../overview/01_AUTH.md)
