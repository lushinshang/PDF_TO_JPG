# 任務清單：pdf-to-jpg-web (SDD + TDD 規範)

## TDD 開發原則
1. **Red**：先編寫/更新單元測試案例（`js/tests.js`），確認測試未通過或紅燈。
2. **Green**：撰寫最簡可行代碼（`js/converter.js` / `js/app.js`）使測試通過綠燈。
3. **Refactor**：重構優化代碼，保持測試全部通過。

---

## 實作任務條目
- [x] 1. 建立 SDD + TDD 實作計畫頁面（`plan.html`）與單元測試 Runner 頁面（`test.html`）
- [x] 2. [TDD - Red/Green] 撰寫檔案上傳驗證單元測試（限單檔、副檔名必為 `.pdf`），並實作 `validateFile(files)` 驗證模組使測試通過
- [x] 3. [TDD - Red/Green] 撰寫 ZIP 打包名稱與 Blob 結構驗證測試，並實作 `createZip(images)` 封裝模組使測試通過
- [x] 4. 建立 `index.html` 網頁 UI 結構與 `css/style.css` 美觀視覺風格（包含拖曳上傳區、進度條、預覽網格、下載按鈕）
- [x] 5. 實作 PDF.js 整合模組 `renderPdfToJpgBlobs(pdfFile, onProgress)`，將 PDF 頁面繪製至 Canvas 並導出 JPG Blobs
- [x] 6. 整合 UI 與邏輯 (`js/app.js`)：實現檔案拖曳/點擊上傳、轉換進度條更新、JPG 預覽圖呈現與 ZIP 一鍵下載
- [x] 7. 執行完整 TDD 測試套件驗證與人工端到端情境測試

---

## 驗收條件
- 情境：當上傳多於 1 個檔案或非 `.pdf` 檔時，`validateFile` 拋出相應錯誤提示，網頁阻擋該次上傳（TDD 單元測試涵蓋）。
- 情境：當傳入圖片 Blob 陣列時，`createZip` 能正確建立 `.zip` 檔案 Blob 且壓縮包檔名包含時間戳與原檔名（TDD 單元測試涵蓋）。
- 情境：在瀏覽器開啟 `index.html`，上傳任意測試 PDF，頁面順利顯示每一頁的 JPG 預覽圖，並可點擊下載完整的 ZIP 壓縮檔。
- 情境：瀏覽器開啟 `test.html` 時，所有單元測試皆呈現綠燈通過狀態。
