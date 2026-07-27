# SDD 任務清單：單檔案離線 Package 與主頁下載整合

- **專案**：offline-package
- **狀態**：已完成

## 任務列表

- [x] **Task 1: 下載離線第三方函式庫資源**
  - [x] 下載 `pdf.min.js` (v3.11.174)
  - [x] 下載 `pdf.worker.min.js` (v3.11.174)
  - [x] 下載 `jszip.min.js` (v3.10.1)
  - [x] 下載 `FileSaver.min.js` (v2.0.5)

- [x] **Task 2: 構建打包腳本並生成 `dist/pdf-to-jpg-offline.html`**
  - [x] 整合 CSS、Worker Data URI、核心 JS 與依賴至單一 HTML
  - [x] 確保無任何外連 CDN 或 Font 請求
  - [x] 淨化離線包標題與頁腳連結，確保無無效死連結

- [x] **Task 3: 在 `index.html` 加入下載按鈕**
  - [x] 於 `index.html` 加入下載 `dist/pdf-to-jpg-offline.html` 的按鈕與導覽
  - [x] 更新 `index.html` 的 CSP 標頭以支援 `data:` worker-src

- [x] **Task 4: 測試與離線驗收**
  - [x] 驗證離線單檔轉檔與下載 ZIP 功能
  - [x] 驗證 `file://` 協定下使用 Data URI 成功解決 `blob:null` 錯誤
  - [x] 執行全方位健康檢查 (DOM 完整性 10/10、網路零依賴、核心邏輯 6/6 全通過)
