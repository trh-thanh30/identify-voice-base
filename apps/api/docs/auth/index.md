# Module Quản Lý Xác Thực & Tài Khoản

Chào mừng bạn đến với tài liệu kỹ thuật của khối **Auth / UserAuth**. Đây là lớp bảo mật và quản lý account đăng nhập cho toàn bộ hệ thống, đảm bảo chỉ các tài khoản hợp lệ mới có thể thao tác với dữ liệu giọng nói.

---

## 1. Triết lý bảo mật (Security Philosophy)

Hệ thống của chúng tôi áp dụng các tiêu chuẩn bảo mật hiện đại nhất dành cho ứng dụng Enterprise, tập trung vào tính toàn vẹn và khả năng kiểm soát truy cập.

### 1.1 Xác thực đa lớp (Hybrid Authentication)

Chúng tôi sử dụng mô hình kết hợp giữa **JWT (JSON Web Token)** và **Secure Cookies**:

- **Access Token**: Được lưu trong bộ nhớ (Memory/State) của Frontend để truy cập API nhanh.
- **Refresh Token**: Được lưu trong **HttpOnly Cookie** để đảm bảo an toàn tối đa trước các cuộc tấn công XSS (Cross-Site Scripting).

### 1.2 Phân quyền kết hợp Role + Permission

Hệ thống hiện dùng 2 tầng:

- **Role**: xác định nhóm tài khoản (`ADMIN`, `OPERATOR`)
- **Permission**: xác định thao tác cụ thể được phép thực hiện

`ADMIN` có toàn quyền hệ thống.

`OPERATOR` mặc định chỉ có:

- `profile.read`
- `voices.read`
- `voices.enroll`

Admin có thể cấu hình lại `permissions` của từng operator sau khi tạo account.

---

## 2. Danh mục tài liệu chi tiết

Khối Auth/UserAuth hiện được chia thành các phần chính:

| Tài liệu                                                   | Nội dung chính                                      | Đối tượng      |
| :--------------------------------------------------------- | :-------------------------------------------------- | :------------- |
| **[Đăng nhập & Quản lý Token](./login-tokens.md)**         | Hướng dẫn login, refresh, logout, reset-password.   | FE / Mobile    |
| **[Quản lý tài khoản đăng nhập](./profile-management.md)** | Self account APIs và admin account APIs.            | FE / BE        |
| **[Permission Matrix](../permissions/index.md)**           | Ý nghĩa từng permission, nơi dùng và mapping route. | FE / BE        |
| **[Cấu trúc bảo mật hệ thống](./security-design.md)**      | Bcrypt, JWT payload, guards và permission checks.   | BE / DevSecOps |

---

## 3. Workflow bảo mật chuẩn (Standard Workflow)

1. **Khởi tạo**: Người dùng đăng nhập bằng Username/Password qua kênh HTTPS.
2. **Cấp phát**: Backend kiểm tra thông tin, nếu đúng sẽ sinh ra cặp Access/Refresh Token.
3. **Thực thi**: Frontend sử dụng `Authorization: Bearer <token>` để gọi các API nghiệp vụ.
4. **Duy trì**: Khi Access Token hết hạn (thường sau 15p), FE tự động sử dụng Refresh Token (trong cookie) để lấy Token mới mà không bắt người dùng đăng nhập lại.
5. **Kết thúc**: Khi người dùng logout hoặc account bị vô hiệu hóa, refresh token trong DB sẽ bị xóa và cookie tại client bị clear.

---

## 4. Các thực thể dữ liệu liên quan

- **Auth Accounts**: Lưu thông tin đăng nhập, role, status, permissions và refresh token hiện hành.
- **Permissions**: Lưu dưới dạng JSON array trong `auth_accounts.permissions`.

---

## 5. Lưu ý dành cho Frontend

- **Cookie Management**: Vì Refresh Token nằm trong HttpOnly Cookie, FE không cần (và không thể) can thiệp vào cookie này bằng JS. Các API `/refresh` hoặc `/logout` sẽ tự động nhận và xử lý cookie này.
- **Token Storage**: Tuyệt đối không lưu Access Token vào `localStorage` vì dễ bị tấn công XSS. Hãy lưu vào một biến Global State (Redux, Vuex, hoặc biến cục bộ).
- **Interceptors**: Nên cài đặt một `Axios Interceptor` để tự động đính kèm Token vào Header và xử lý mã lỗi `401 Unauthorized` để thực hiện luồng Refresh Token một cách trong suốt (Transparently).

---

> [!CAUTION]
> Luôn sử dụng giao thức HTTPS trong môi trường Production. Việc gửi mật khẩu hoặc Token qua HTTP thường sẽ bị hệ thống chặn đứng hoặc cảnh báo nghiêm trọng.

---

> **Tài liệu tham khảo tiếp theo:** [Đăng nhập & Quản lý Token](./login-tokens.md)
