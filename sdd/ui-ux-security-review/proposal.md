# 提案：UI/UX + 資安規範複審（RWD／護眼配色／閱讀友善）

> 審查角色：模擬數十年經驗 UI/UX 前端工程師，針對 `index.html`、`plan.html`、`test.html` 三頁與其相依的 `css/style.css`、`js/app.js`、`js/converter.js` 進行第二輪審查（第一輪已修正的 12 項問題見 README.md 階段四）。本次聚焦使用者體驗（RWD、行動/桌機閱讀友善、護眼配色）與安全規範落實度，找出**上一輪修正後仍殘留或新增的問題**。

## 為什麼做

上一輪（README 對話輪次 #8–#11）已修正 12 項高/中/低嚴重問題，但實際重讀目前程式碼後發現：
1. 部分「已強化」的宣稱與程式碼實際狀態不符（例如 SRI 只加了 `crossorigin`，未加 `integrity`）。
2. CSP 只部署在 `index.html`，`plan.html`／`test.html` 沒有對應保護，資安基準不一致。
3. 護眼配色的其中一組文字色（`--text-muted`）實測對比度未達 WCAG AA。
4. 鍵盤操作性有缺陷：拖曳上傳區 `role="button" tabindex="0"` 但沒有對應 `keydown` 處理，鍵盤使用者按 Enter/Space 無法觸發選檔。
5. CSP `worker-src` 設定與 PDF.js Worker 實際載入來源可能不匹配，有導致核心轉檔功能被瀏覽器靜默阻擋的風險，需要在下一階段實測確認。

## 要改什麼

依嚴重度排列，共 7 項發現：

| 嚴重度 | 檔案 | 問題 | 影響 |
|:---:|:---|:---|:---|
| 🔴 高 | `index.html` + `js/converter.js` | CSP `worker-src blob:` 未涵蓋 PDF.js worker 的實際載入來源 `https://cdnjs.cloudflare.com/.../pdf.worker.min.js`（`converter.js:69` 直接指定 CDN URL 字串，非 blob URL） | 嚴格遵守 CSP 的瀏覽器可能阻擋 Worker 建立，導致 PDF 轉檔功能整個失效或退化為極慢的主執行緒渲染。需列入實作階段實測驗證。 |
| 🔴 高 | `index.html`（`#drop-zone`）+ `js/app.js` | `drop-zone` 標記 `role="button" tabindex="0"`，但只綁定 `click`，沒有 `keydown` 監聽 Enter/Space | 純鍵盤使用者 Tab 進上傳區後，按 Enter/Space 完全無反應，違反 WAI-ARIA APG button pattern 的基本鍵盤操作性要求 |
| 🟡 中 | `css/style.css` `--text-muted: #6e7681`；`plan.html`／`test.html` inline style 同色 | 對背景 `#0d1117` 實測對比度 **4.125:1**，低於 WCAG AA 一般文字門檻 4.5:1；使用此色的元素包含 footer 說明文字、`plan.html` TDD 步驟說明 (`.step-content p`)、`test.html` 資安卡片條列文字 | 小字級（0.8–0.85rem）長時間閱讀更吃力，與「護眼」訴求矛盾，可能造成弱視/中高齡使用者閱讀困難 |
| 🟡 中 | `plan.html`、`test.html` | 兩頁完全沒有 `<meta http-equiv="Content-Security-Policy">`，但 `test.html` 仍載入外部 CDN（JSZip） | 資安防護基準不一致；`index.html` 標榜「純前端安全防護」，另外兩頁卻毫無 CSP 保護 |
| 🟡 中 | `index.html` `<script>` 標籤 | 上一輪宣稱「CDN 加上 SRI」，但實際只加了 `crossorigin="anonymous"`，並未加 `integrity="sha384-..."` hash | `crossorigin` 只影響 CORS 請求模式，**不提供任何完整性驗證**；CDN 若被竄改置換惡意腳本，瀏覽器不會阻擋。四支 CDN 腳本（pdf.js、pdf.worker.min.js、jszip、filesaver）皆未受保護，先前的資安審核報告對此描述不精確 |
| 🟢 低 | `css/style.css` vs `plan.html`／`test.html` inline `<style>` | 同一組品牌色在三處用不同變數名：`style.css` 用 `--primary-color`／`--danger-color`，`plan.html` 用 `--primary`／`--danger`，`test.html` 用 `--accent`／`--fail` | 三份色彩系統各自獨立維護，未來若要調色需同步改三處，容易遺漏造成三頁配色不一致 |
| 🟢 低 | `index.html`、`plan.html`、`test.html` | 三頁皆無 `<link rel="icon">` 與 `<meta name="theme-color">` | 每次載入觸發瀏覽器預設 favicon 404 請求；行動裝置（iOS Safari／Android Chrome）網址列/工具列不會套用深色主題色，桌機分頁圖示空白，體驗不完整 |

## 影響範圍

- 修改檔案：`index.html`、`plan.html`、`test.html`、`css/style.css`、`js/app.js`（新增 keydown 處理）
- 不涉及 `js/converter.js` 的轉檔核心邏輯，僅涉及其中 CSP 相容性的驗證（第 1 項需要瀏覽器實測，若確認阻擋才需調整 workerSrc 策略，例如改用 `pdfjsLib.GlobalWorkerOptions.workerSrc` 指向本地打包的 worker 或改用 `importScripts` 相容寫法）
- 不影響既有 TDD 測試案例（`js/tests.js`）的 PASS 狀態，但會依 JUDGMENT 驗收標準新增對應測試斷言（如可行）
- 純前端靜態調整，無資料遷移、無破壞性操作

## 補充：工作目錄說明（與制度檔案的落差）

`ops/WORKFLOW.md` 預設工作目錄為 `/Users/lanss/projects/sdd/<短名稱>/`，但本專案在第一輪開發時已自行建立並使用專案內 `sdd/pdf-to-jpg-web/`（歸檔於專案內 `sdd/archive/2026-07-23-pdf-to-jpg-web/`，見 README.md）。為與既有專案內慣例一致，本次提案沿用專案內路徑 `sdd/ui-ux-security-review/`，特此回報此不一致，若您希望改回全域路徑請告知。
