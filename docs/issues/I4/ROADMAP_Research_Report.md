# ROADMAP Research Report: Glean Family Tree v2 (I4)

## 1. Đánh giá các thư viện và framework có sẵn

Dựa trên yêu cầu của ROADMAP.md và nền tảng ReactFlow hiện có, dưới đây là các thư viện hỗ trợ tối ưu:

### A. Visualization & Layout
*   **ReactFlow (Core)**: Đã tích hợp. Cung cấp nền tảng mạnh mẽ cho custom nodes, zoom/pan, và interaction.
    *   **Ưu điểm**: Linh hoạt tuyệt đối, hiệu suất tốt với `memo`, cộng đồng lớn.
    *   **Nhược điểm**: Cần tự xử lý logic layout phức tạp và virtualization cho 5000+ nodes.
*   **ELKjs (Eclipse Layout Kernel)**: Đề xuất thay thế Dagre cho các cây gia phả lớn và phức tạp.
    *   **Chức năng**: Thuật toán layout phân lớp (layered), hỗ trợ port-based layout, tránh chồng chéo node/edge.
    *   **Ưu điểm**: Cấu hình cực kỳ chi tiết, xử lý tốt các mối quan hệ đa tuyến (nhiều vợ/chồng, con chung/riêng).
    *   **Tài liệu**: [ELKjs GitHub](https://github.com/kieler/elkjs)
*   **react-d3-tree**: Một lựa chọn thay thế nếu muốn chuyển sang hướng tree-specific hơn.
    *   **Ưu điểm**: Đã tối ưu cho tree, dễ setup.
    *   **Nhược điểm**: Khó tùy biến UI sâu như ReactFlow, không phù hợp với cấu trúc DAG (Directed Acyclic Graph) phức tạp của gia phả.

### B. Utilities & UI Components
*   **react-hotkeys-hook**: Đã có trong `package.json`. Hỗ trợ toàn bộ Keyboard Shortcuts (I4.2).
*   **Radix UI**: Đã có trong `package.json`. Cung cấp các component Accessible cho Filters (I4.3) và Context Menus.
*   **Zustand**: Thư viện quản lý state nhẹ, phù hợp để tách biệt state của nodes/edges khỏi React component tree nhằm tối ưu hiệu suất.

---

## 2. Xác định các phần cần tự phát triển (Custom Development)

Dù có các thư viện hỗ trợ, một số tính năng đặc thù cần được xây dựng riêng để đảm bảo hiệu suất và nghiệp vụ:

### A. Virtualization & LOD (Level of Detail)
*   **Lý do**: ReactFlow mặc định render tất cả nodes trong DOM. Với 5000+ nodes, hiệu suất sẽ giảm nghiêm trọng.
*   **Giải pháp**: Tự phát triển `useVirtualNodes` hook (đã có prototype trong ROADMAP.md) để:
    *   Chỉ render nodes trong viewport cộng với một khoảng padding.
    *   Sử dụng LOD để đơn giản hóa render khi zoom out xa (chỉ hiển thị box màu hoặc tên thay vì đầy đủ thông tin/ảnh).

### B. Thuật toán phát hiện mối quan hệ & Trùng lặp (Relationship & Duplicate Detection)
*   **Lý do**: Không có thư viện JavaScript "mì ăn liền" nào xử lý tốt logic gia phả tiếng Việt (họ tên, vai vế, quy tắc dòng tộc).
*   **Giải pháp**:
    *   **Phát hiện trùng lặp**: Kết hợp thuật toán Levenshtein (độ tương đồng tên) và logic so khớp ngày sinh/cha mẹ.
    *   **Phát hiện mối quan hệ**: Xây dựng engine dựa trên Graph Traversal (DFS/BFS) để tìm đường đi ngắn nhất giữa 2 node và gán nhãn quan hệ (anh em họ, chú bác, v.v.).

### C. Custom Edge Routing cho Gia phả
*   **Lý do**: Các đường nối mặc định của ReactFlow (smoothstep) có thể bị chồng chéo khi có nhiều mối quan hệ đan xen.
*   **Giải pháp**: Tự viết custom edge component để vẽ các đường nối theo quy tắc gia phả (đường vuông góc, điểm nối từ giữa các cặp vợ chồng xuống con cái).

---

## 3. Đề xuất giải pháp kết hợp (Integrated Solutions)

### A. Tối ưu hóa hiệu suất (ReactFlow + Custom Virtualization)
1.  **Cấu trúc dữ liệu**: Sử dụng `Map` hoặc `Zustand` để lưu trữ data gốc, chỉ convert sang ReactFlow Nodes/Edges cho những phần cần hiển thị.
2.  **Memoization**: Tất cả Custom Nodes phải được bọc trong `React.memo`. Các callback như `onNodesChange` phải dùng `useCallback`.
3.  **Virtualization Steps**:
    *   Sử dụng `useStore` của ReactFlow để lấy `transform` (zoom/pan).
    *   Tính toán `visibleNodes` dựa trên bounding box của viewport.
    *   Cập nhật `hidden` property của node thay vì xóa khỏi array để giữ reference.

### B. Tích hợp ELKjs cho Layout tự động
1.  **Cài đặt**: `npm install elkjs`.
2.  **Workflow**:
    *   Fetch dữ liệu từ Supabase.
    *   Chuyển đổi sang định dạng JSON của ELK.
    *   Chạy thuật toán layout (async).
    *   Ánh xạ tọa độ `x, y` trở lại ReactFlow nodes.
    *   Lưu tọa độ mới vào Database (batch update).

### C. Keyboard Shortcuts với `react-hotkeys-hook`
*   **Tích hợp**: Tạo `useFamilyTreeShortcuts` bọc quanh các action của ReactFlow (zoom in/out, fit view, delete node, undo/redo).
*   **Ví dụ**: `useHotkeys('ctrl+f', () => reactFlowInstance.fitView())`.

---

## 4. Ước lượng nguồn lực & Kế hoạch (Resource Estimation)

| Tính năng | Độ phức tạp | Công nghệ chính | Ước tính thời gian |
| :--- | :--- | :--- | :--- |
| Virtualization & LOD | Cao | ReactFlow API, Custom Hook | 3-5 ngày |
| ELKjs Layout Integration | Trung bình | ELKjs, Web Workers | 2-3 ngày |
| Filters & UI (Radix) | Thấp | Radix UI, Tailwind | 1-2 ngày |
| Relationship Engine | Cao | Graph Algos, Logic VN | 5-7 ngày |
| Shortcuts & Hotkeys | Thấp | react-hotkeys-hook | 0.5 ngày |

**Kết luận**: Việc tận dụng ReactFlow là hướng đi đúng đắn. Tuy nhiên, để đạt được quy mô 5000+ nodes, trọng tâm phát triển phải nằm ở việc **tối ưu hóa render (Virtualization)** và **tinh chỉnh layout engine (ELKjs)**.
