# API & Security: Đăng Nhập, Token Và Reset Password

Tài liệu này hướng dẫn chi tiết về cơ chế xác thực, cấp phát và duy trì phiên làm việc trong hệ thống thông qua JWT và cơ chế bảo mật Cookie.

---

## 1. Luồng đăng nhập (Login Workflow)

Hệ thống hiện sử dụng **email + password** để xác thực người dùng ban đầu.

- **Endpoint**: `POST /api/v1/auth/login`
- **Tác vụ**: Xác thực danh tính và trả về bộ khóa truy cập.

### Các bước xử lý tại Backend:

1. **Tìm kiếm tài khoản**: Truy vấn trong bảng `auth_accounts` theo `email`. Nếu không thấy -> `401 Unauthorized`.
2. **Kiểm tra mật khẩu**: Sử dụng thuật toán `bcrypt` để so sánh mật khẩu người dùng gửi lên với bản băm (hash) trong DB.
3. **Kiểm tra trạng thái**: Nếu account không ở trạng thái `ACTIVE` -> từ chối đăng nhập.
4. **Phát hành Token**:
   - Sinh **Access Token**: chứa `id`, `email`, `username`, `role`, `status`, `permissions`.
   - Sinh **Refresh Token**: JWT dài hạn dùng để cấp lại access token.
5. **Lưu trữ Cookie**: Refresh Token được đính kèm vào `Set-Cookie`.
6. **Phản hồi**: Trả về `access_token`, `refresh_token`, `expires_in`, `account`.

---

## 2. Làm mới Token (Token Refreshing)

Để đảm bảo người dùng không bị văng khỏi hệ thống khi Access Token hết hạn, chúng tôi cung cấp cơ chế Silent Refresh.

- **Endpoint**: `POST /api/v1/auth/refresh`
- **Cơ chế**: Tự động lấy Refresh Token từ Cookie gửi kèm trong Request.

### Quy trình Silent Refresh dành cho Frontend:

1. FE nhận mã lỗi `401 Unauthorized` từ một API bất kỳ.
2. FE dừng các yêu cầu khác và gọi ngay API `/auth/refresh` (Không cần gửi body).
3. Nếu thành công, FE nhận được Access Token mới và thực hiện lại yêu cầu bị lỗi ban đầu.
4. Nếu thất bại (Refresh Token hết hạn), FE xóa trạng thái đăng nhập và đẩy người dùng về trang Login.

---

## 3. Cấu trúc Token & Cookie (Technical Specs)

### 3.1 Access Token Payload

```json
{
  "id": "uuid-nguoi-dung",
  "email": "operator@example.com",
  "username": "operator01",
  "role": "OPERATOR",
  "status": "ACTIVE",
  "permissions": ["profile.read", "voices.read", "voices.enroll"],
  "iat": 1712764800,
  "exp": 1712765700
}
```

### 3.2 Chính sách Cookie (Set-Cookie Settings)

| Cờ (Flag)  | Giá trị  | Ý nghĩa                                                                     |
| :--------- | :------- | :-------------------------------------------------------------------------- |
| `HttpOnly` | `true`   | Ngăn chặn JavaScript truy cập vào cookie (Chống XSS).                       |
| `Secure`   | `true`   | Chỉ gửi cookie qua kết nối HTTPS (Môi trường production).                   |
| `SameSite` | `Strict` | Ngăn chặn việc gửi cookie trong các request từ trang web khác (Chống CSRF). |
| `Max-Age`  | `604800` | Token tồn tại trong 7 ngày (7 _ 24 _ 3600).                                 |

---

## 4. Đăng xuất (Logout Flow)

Đăng xuất trong hệ thống của chúng tôi không chỉ đơn giản là xóa token ở FE mà còn phải thực hiện "Dọn dẹp" ở Server.

- **Endpoint**: `POST /api/v1/auth/logout`
- **Method**: `POST` (Yêu cầu xác thực Bearer Token).

### Các bước xử lý:

1. Backend xác định `user_id` từ token hiện hành.
2. Xóa toàn bộ Refresh Tokens liên quan đến session này trong Database.
3. Gửi instruction `Clear-Cookie` về trình duyệt để xóa Refresh Token tại Client.
4. (Tùy chọn) Đưa Access Token hiện tại vào danh sách Blacklist (Nếu cần bảo mật tuyệt đối).

---

## 5. Đổi mật khẩu khi đã đăng nhập

- **Endpoint**: `POST /api/v1/auth/reset-password`
- **Yêu cầu**: Bearer token hợp lệ

### Body mẫu

```json
{
  "old_password": "old_password123",
  "new_password": "new_password456",
  "confirm_new_password": "new_password456"
}
```

### Xử lý backend

1. Xác thực access token để lấy `user.id`.
2. So sánh `old_password` với mật khẩu hash hiện tại.
3. Kiểm tra `new_password` và `confirm_new_password` khớp nhau.
4. Hash mật khẩu mới và cập nhật DB.
5. Xóa refresh token cũ nếu cần buộc đăng nhập lại.

---

## 6. Hướng dẫn dành cho Frontend (Interceptors)

Khuyến nghị sử dụng **Axios Interceptors** để xử lý tập trung logic Token.

### Ví dụ xử lý 401 tự động:

```javascript
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { data } = await axios.post('/api/v1/auth/refresh');
        localStorage.setItem('access_token', data.access_token);
        axios.defaults.headers.common['Authorization'] =
          `Bearer ${data.access_token}`;
        return axios(originalRequest);
      } catch (refreshError) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);
```

---

## 7. Xử lý lỗi (Error Handling)

- **401 Unauthorized**:
  - Sai mật khẩu/username.
  - Access Token hết hạn hoặc không hợp lệ.
  - Refresh Token trong cookie đã hết hạn hoặc bị thu hồi.
- **403 Forbidden**: Không đủ quyền truy cập tài nguyên.
- **429 Too Many Requests**: Hệ thống phát hiện tấn công Brute-force và tạm thời chặn yêu cầu từ IP của bạn.

---

## 8. Ràng buộc bảo mật nâng cao

### 7.1 Mật khẩu an toàn

- Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và chữ số.
- Backend không bao giờ lưu mật khẩu dạng Plain-text.

### 7.2 Rate Limiting

Endpoint Login được bảo vệ bởi tầng `Throttler` (Rate limiter). Nếu một IP gửi quá 5 yêu cầu sai mật khẩu liên tiếp, IP đó sẽ bị khóa trong 15 phút.

---

> [!IMPORTANT]
> Toàn bộ logic làm mới token nên được thực hiện ở tầng hạ tầng (Infrastructure) của Frontend để các lập trình viên tính năng không cần quan tâm đến việc quản lý Token thủ công.

---

> **Các tài liệu liên kết:**
>
> - [Quản lý tài khoản cá nhân](./profile-management.md)
> - [Module Nhận dạng (Identify Engine)](../identify/index.md)
