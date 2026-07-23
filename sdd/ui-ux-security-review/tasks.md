# 任務清單：UI/UX + 資安規範複審

- [x] 1. 實測驗證 CSP `worker-src` 是否真的阻擋 `pdf.worker.min.js` → **(b) 未被阻擋**。以 Playwright 開啟 index.html，注入測試 PDF 執行 `renderPdfToJpgBlobs`，Console 無 CSP violation，Network 顯示 `pdf.worker.min.js` 200 成功載入且轉檔正常產出。CSP 與 tasks.md 均未變更。
- [x] 2. `js/app.js` 為 `#drop-zone` 新增 `keydown` 監聽（Enter / Space 觸發 `fileInput.click()`，並 `preventDefault()`）。已用 Playwright 鍵盤事件驗證 Enter 與 Space 皆能觸發檔案選擇對話框。
- [x] 3. 修正 `--text-muted` 對比度 → **實作時發現提案描述有誤**：只有 `css/style.css` 的 `--text-muted (#6e7681, 4.12:1)` 未達標；`plan.html`／`test.html` 原本就用 `#848d97 (5.62:1)`，已符合 AA，未變更。已將 `css/style.css` 改為 `#79818c`（對比度 4.8:1，經 Python 重算驗證）。
- [x] 4. `plan.html`、`test.html` 補上對應 CSP meta（依各頁實際載入資源客製 `script-src`/`img-src` 等白名單）。已重新載入兩頁，Console 均無 CSP violation，`test.html` 單元測試 9/9 PASS。
- [x] 5. `index.html` 三支 `<script>`（pdf.js、jszip、filesaver）與 `test.html` 的 jszip 加上 `integrity`（改用 cdnjs 官方 sha512 SRI，並以本地 openssl 重算比對一致）。`pdf.worker.min.js` 因透過 `Worker()` 動態載入而非 `<script>` 標籤，瀏覽器目前不支援對動態 Worker 做 SRI 校驗，此為已知限制，非本次可解決範圍。
- [x] 6. 統一三頁 CSS 變數命名為 `css/style.css` 的命名（`--primary-color`／`--danger-color` 等）。已用 regex 精準替換並人工核對語意對應（例如 test.html 原 `--accent` 實際值是藍色，對應的是 `--primary-color` 而非 `--accent-color`），截圖確認 `plan.html` 視覺無壞版，`test.html` 測試仍 9/9 PASS。
- [x] 7. 三頁補上 inline SVG `<link rel="icon">` 與 `<meta name="theme-color" content="#0d1117">`。原本的 favicon 404 Console error 已消失；`plan.html`／`test.html` CSP 另補 `img-src 'self' data:` 以明確允許 data URI favicon。

## 驗收條件

- 情境 1：以純鍵盤（Tab + Enter/Space）操作，能不靠滑鼠完成「聚焦上傳區 → 觸發選檔對話框」全流程
- 情境 2：以瀏覽器 DevTools 檢查 Console，載入三個頁面時皆無 CSP violation 錯誤，且 `index.html` 的 PDF 轉檔功能仍正常運作（上傳 PDF → 出現分頁預覽 → ZIP 下載成功）
- 情境 3：以線上對比度檢查工具（或算式）驗證調整後的 `--text-muted` 對背景色對比度 ≥4.5:1
- 情境 4：檢視 `plan.html`、`test.html` 原始碼，`<head>` 內出現與 `index.html` 對應的 CSP meta 標籤
- 情境 5：檢視三頁 `<script>` CDN 標籤，`integrity` 屬性存在且格式正確（`sha384-` 開頭）
- 情境 6：搜尋三份 CSS（`style.css` + 兩頁 inline style）確認同語意色彩僅用同一組變數名稱
- 情境 7：以瀏覽器分頁與行動裝置模擬檢查，分頁圖示與網址列主題色正確顯示
