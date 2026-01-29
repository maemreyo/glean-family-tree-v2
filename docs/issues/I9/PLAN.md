# I9: Kéo node spouse (kéo chung hay riêng)

**Mục tiêu**: Xác định UX tối ưu cho việc kéo node có quan hệ spouse để vừa nhanh khi cần dời cặp, vừa giữ khả năng chỉnh riêng từng người khi cần.

## Hiện trạng
- Kéo node hiện tại chỉ áp dụng cho node đang drag.
- Quan hệ spouse chỉ ảnh hưởng layout ban đầu (đặt nằm ngang) và cập nhật edge cho shared child khi kéo.

## Nghiên cứu nhanh
- React Flow hỗ trợ mô hình parent/child (sub flows): child có thể di chuyển theo parent khi parent drag, phù hợp cho grouping có điều kiện. [Source](https://reactflow.dev/learn/layouting/sub-flows)
- React Flow hỗ trợ drag handle để giới hạn vùng kéo, giúp thiết kế affordance cho kéo nhóm khi cần. [Source](https://reactflow.dev/examples/nodes/drag-handle)
- React Flow có ví dụ grouping động theo selection (nhóm/ungroup). [Source](https://reactflow.dev/examples/nodes/dynamic-grouping)

## Các lựa chọn UX
### Option A: Mặc định kéo riêng, kéo chung bằng modifier (khuyến nghị)
- **Default**: kéo 1 node = chỉ node đó.
- **Modifier**: giữ Shift/Alt để kéo cả spouse group.
- **Ưu điểm**: dễ học, không cản trở chỉnh riêng; vẫn nhanh khi cần dời cặp.
- **Nhược**: cần học phím tắt, cần hint UI.

### Option B: Toggle “Move spouses together”
- Toggle trong toolbar hoặc context menu node.
- Khi bật: kéo một spouse sẽ kéo cả group (nhiều spouse nếu có).
- **Ưu điểm**: rõ ràng; phù hợp người dùng không quen phím tắt.
- **Nhược**: khi cần chỉnh riêng phải tắt toggle.

### Option C: Group node bằng parentId (sub flow)
- Tạo group node ẩn hoặc container cho cặp spouse, child nằm trong group.
- **Ưu điểm**: đúng chuẩn grouping của React Flow, drag ổn định. [Source](https://reactflow.dev/learn/layouting/sub-flows)
- **Nhược**: phức tạp: layout, edge z-index, hitbox, selection; khó chỉnh riêng nếu không tách group.

## Khuyến nghị
- **Mặc định kéo riêng + modifier để kéo chung** là tối ưu nhất về UX.
- Bổ sung **toggle tuỳ chọn** (Option B) để hỗ trợ người dùng không quen phím tắt.

## Kế hoạch triển khai (chưa thực hiện)
1. **Tạo spouse group map dùng lại logic hiện có**
   - Tái sử dụng `findSpouseGroups` trong `dagre-layout.ts` hoặc tách ra helper để dùng runtime.
   - Phục vụ xác định nhóm khi drag.

2. **Cơ chế kích hoạt kéo nhóm**
   - **Modifier**: Shift/Alt trong `onNodeDragStart`/`onNodeDrag`.
   - **Toggle**: cờ trong UI store (ví dụ `moveSpouseTogether`).
   - Khi kích hoạt, tính `delta = currentPos - lastPos` và áp dụng cho toàn bộ spouse group.

3. **Cập nhật vị trí & persist**
   - Trong `onNodeDrag`: apply delta cho group (trừ node đang drag).
   - Trong `onNodeDragStop`: gọi `saveNodePosition` cho tất cả node trong group.
   - Gọi `updateSharedChildEdges` với tập nodes đã thay đổi.

4. **UI Affordance**
   - Tooltip nhỏ: “Giữ Shift để kéo cả cặp”.
   - Nếu có toggle: thêm vào toolbar hoặc context menu.

5. **Edge cases**
   - Một người có nhiều spouse: kéo chung theo group hiện tại.
   - Read-only: không cho kéo.
   - Layout đã lưu: không phá vỡ vị trí lưu.

## File liên quan
- `components/dashboard/FamilyTree/index.tsx` (onNodeDrag / onNodeDragStop)
- `components/dashboard/FamilyTree/utils/dagre-layout.ts` (findSpouseGroups)
- `components/dashboard/FamilyTree/hooks/usePositionManagement.ts` (save vị trí)

