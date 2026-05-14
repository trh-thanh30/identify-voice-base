# Rà soát trạng thái module dịch ngôn ngữ nước ngoài

Tài liệu này dùng để điền hai cột **Trạng thái** và **Ghi chú** trong bảng Excel. Cột trạng thái nên dùng giá trị ngắn như `Chưa có` hoặc `Một phần`.

| STT | Phân hệ (Module) | Tính năng chi tiết           | Trạng thái | Ghi chú                                                                                                                                                                                            |
| :-- | :--------------- | :--------------------------- | :--------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Model Hub        | Tải & Quản lý mô hình        | Chưa có    | Chưa có module tải/quản lý model dịch mã nguồn mở. Backend hiện chỉ gọi AI Core Translation qua URL cấu hình, chưa tự tải model hoặc chọn model theo ngôn ngữ.                                     |
| 2   | Pre-processing   | Chia đoạn văn bản            | Một phần   | Đã có chia text khi nội dung dài, nhưng đang chia theo word/character limit, chưa chia theo token thật và chưa đảm bảo `≤ 512 tokens`.                                                             |
| 3   | Core Engine      | Batch & Parallel Translation | Một phần   | Đã có job dịch nền và xử lý nhiều chunk, nhưng chunk đang dịch tuần tự. Chưa có batch API, parallel theo segment, retry hoặc trạng thái riêng từng đoạn.                                           |
| 4   | Prompt Design    | Cấu hình ngữ cảnh            | Chưa có    | API dịch chưa có field prompt/ngữ cảnh. Chưa hỗ trợ glossary, văn phong, domain hoặc instruction riêng cho từng lần dịch.                                                                          |
| 5   | State Manager    | Bảo toàn thứ tự & Index      | Một phần   | Thứ tự hiện được giữ ngầm do dịch tuần tự rồi nối kết quả. Chưa có `segment_id`, `index` và state riêng để đảm bảo đúng thứ tự khi dịch song song.                                                 |
| 6   | UI/UX Display    | Giao diện 2 cột song song    | Một phần   | UI đã có 2 cột nguồn/kết quả ở mức tổng thể. Chưa có bảng theo từng dòng/segment, chưa có ghi chú, nút chỉnh sửa hoặc huấn luyện lại trên từng dòng.                                               |
| 7   | Feedback Loop    | Human-in-the-loop (HITL)     | Một phần   | Backend đã có API lưu bản dịch đã chỉnh sửa vào lịch sử: `PATCH /api/v1/translate/history/:id`. Chưa có ghi chú từng dòng, chưa lưu cặp segment gốc - bản sửa, chưa có nút huấn luyện lại trên FE. |
| 8   | Fine-tuning UI   | Huấn luyện LoRA / PEFT       | Chưa có    | Chưa có UI/API fine-tune LoRA/PEFT, chưa có training job, theo dõi tiến độ hoặc quản lý model sau huấn luyện. Phần này cần AI Core hoặc training service riêng.                                    |
| 9   | Data Exporter    | Xuất dữ liệu huấn luyện      | Chưa có    | Chưa có export `.json`/`.csv` từ cặp văn bản gốc và bản dịch đã chỉnh sửa. Hiện mới lưu bản sửa ở cấp record lịch sử, chưa có dataset fine-tune riêng.                                             |
| 10  | Result Export    | Xuất bản dịch đa định dạng   | Một phần   | Đã export DOCX/PDF bản dịch thường. Chưa có TXT, chưa có file song ngữ 2 cột và chưa export kèm dữ liệu chỉnh sửa để huấn luyện lần sau.                                                           |

## Gợi ý ưu tiên triển khai không cần sửa AI Core

1. Chuẩn hóa segment/index cho văn bản đầu vào.
2. Dịch batch/parallel bằng cách gọi endpoint AI Core hiện có theo từng segment.
3. UI 2 cột theo từng segment.
4. Chỉnh sửa bản dịch và lưu lịch sử.
5. Xuất TXT/DOCX/PDF song ngữ.
6. Sinh dataset JSON/CSV từ bản dịch đã chỉnh sửa.

## Hạng mục cần AI Core hoặc service riêng

1. Tải và chạy model dịch mã nguồn mở.
2. Prompt ảnh hưởng trực tiếp đến inference nếu AI Core chưa hỗ trợ.
3. Fine-tune LoRA/PEFT thật.
4. Quản lý model sau fine-tune và dùng model mới trong pipeline dịch.
