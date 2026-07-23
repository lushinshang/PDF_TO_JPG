# 提案：純前端 PDF 轉 JPG 網頁工具 (SDD + TDD 規範)

## 技術可行性說明
**完全可行！**
1. **PDF 解析與渲染**：使用 Mozilla 的 `PDF.js` 函式庫，在瀏覽器客戶端直接讀取 PDF 檔案並繪製到 HTML5 `<canvas>`。
2. **JPG 轉換**：使用 Canvas 的 `.toDataURL('image/jpeg')` 或 `.toBlob()` 匯出為 JPG 圖片。
3. **打包下載**：使用 `JSZip` 函式庫將所有轉換後的 JPG 圖片在瀏覽器端打包成一個 ZIP 檔，並直接觸發瀏覽器下載。
4. **TDD 測試架構**：建立純前端測試套件 (`js/tests.js` 與 `test.html`)，針對驗證邏輯、頁數解析、Blob 轉換與打包進行單元測試（Red-Green-Refactor）。
5. **GitHub Pages 部署**：整個應用不需任何伺服器與後端 API，100% 在使用者瀏覽器執行，非常適合直接放置於 GitHub Pages 免費託管。

---

## 為什麼做
提供一個安全、免上傳伺服器（保護隱私）、快速且免費的純前端 PDF 轉 JPG 工具，並透過 SDD 與 TDD 確保軟體品質與高測試覆蓋率。

## 要改什麼
新增以下檔案建立單頁應用程式與測試套件：
1. `index.html`：網頁主結構（上傳區、進度條、圖片預覽區、下載按鈕）。
2. `css/style.css`：質感 UI 與響應式排版樣式。
3. `js/app.js`：PDF 載入、Canvas 繪製轉檔、預覽與 JSZip 打包下載邏輯。
4. `js/converter.js`：解耦合的可測試核心邏輯單元（驗證、頁面處理、Zip 封裝）。
5. `js/tests.js` / `test.html`：TDD 自動化單元測試 runner 與測試案例。
6. `plan.html`：SDD + TDD 實作計畫頁面。

## 影響範圍
- `README.md`
- `sdd/pdf-to-jpg-web/proposal.md`
- `sdd/pdf-to-jpg-web/tasks.md`
- `plan.html`
- `index.html`
- `test.html`
- `css/style.css`
- `js/converter.js`
- `js/app.js`
- `js/tests.js`
