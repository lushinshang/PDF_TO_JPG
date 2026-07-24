/**
 * PDF to JPG 核心業務邏輯與驗證模組
 * IIFE 封裝，避免全域命名空間污染
 */
(function () {
  'use strict';

  /**
   * 驗證上傳的檔案
   * @param {FileList|Array<File>} files
   * @returns {File} 驗證通過的 File 物件
   * @throws {Error} 當不符合單一 PDF 檔案限制時拋出錯誤
   */
  function validateFile(files) {
    if (!files || files.length === 0) {
      throw new Error('請選擇一個 PDF 檔案');
    }
    if (files.length > 1) {
      throw new Error('一次只能上傳一個檔案');
    }

    const file = files[0];
    const isPdfType = file.type === 'application/pdf';
    const isPdfExt = file.name && file.name.toLowerCase().endsWith('.pdf');

    if (!isPdfType && !isPdfExt) {
      throw new Error('格式限制為 PDF 檔案');
    }

    return file;
  }

  /**
   * 將圖片陣列打包為 ZIP 檔案
   * @param {Array<{name: string, blob: Blob}>} images
   * @param {string} zipFilename
   * @returns {Promise<Blob>} ZIP 打包 Blob
   */
  async function createZip(images, zipFilename = 'converted-images.zip') {
    if (!images || images.length === 0) {
      throw new Error('無可打包的圖片');
    }
    if (typeof JSZip === 'undefined') {
      throw new Error('JSZip 函式庫未載入');
    }

    const zip = new JSZip();
    images.forEach((img, idx) => {
      const filename = img.name || `page_${idx + 1}.jpg`;
      zip.file(filename, img.blob);
    });

    return zip.generateAsync({ type: 'blob' });
  }

  // pdf.worker.min.js 透過 Worker() 動態載入，無法用 <script integrity> 保護，
  // 故改為手動 fetch + SHA-512 比對 cdnjs 官方 SRI hash 通過才轉成 blob URL 使用，
  // 雜湊不符時直接拒絕（fail closed），避免執行遭竄改的第三方程式碼。
  const PDF_WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const PDF_WORKER_SHA512_HEX =
    '05bad9efa50d66ae41847ecb2fba67f40e13290a5078d0873a8eb9fda91f7a570805b715bd858e15028f5c8af2904dea6716239835f9ef7a1ae18c2c73bae94f';
  let cachedWorkerBlobUrl = null;

  async function getVerifiedWorkerBlobUrl() {
    if (cachedWorkerBlobUrl) return cachedWorkerBlobUrl;

    const res = await fetch(PDF_WORKER_URL);
    if (!res.ok) {
      throw new Error(`PDF.js worker 下載失敗（HTTP ${res.status}）`);
    }
    const buffer = await res.arrayBuffer();

    const digest = await crypto.subtle.digest('SHA-512', buffer);
    const hashHex = Array.from(new Uint8Array(digest))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (hashHex !== PDF_WORKER_SHA512_HEX) {
      throw new Error('PDF.js worker 完整性校驗失敗，疑似遭竄改，已拒絕載入');
    }

    const blob = new Blob([buffer], { type: 'application/javascript' });
    cachedWorkerBlobUrl = URL.createObjectURL(blob);
    return cachedWorkerBlobUrl;
  }

  /**
   * 整合 PDF.js 渲染 PDF 每一頁並導出為 JPG Blob
   * 注意：不再產生 dataUrl，由 app.js 使用 URL.createObjectURL 建立預覽，節省記憶體。
   * @param {File} pdfFile
   * @param {Function} onProgress  callback({ current, total, item })
   * @returns {Promise<Array<{pageNum: number, name: string, blob: Blob}>>}
   */
  async function renderPdfToJpgBlobs(pdfFile, onProgress) {
    if (typeof pdfjsLib === 'undefined') {
      throw new Error('PDF.js 函式庫未載入');
    }

    pdfjsLib.GlobalWorkerOptions.workerSrc = await getVerifiedWorkerBlobUrl();

    const arrayBuffer = await pdfFile.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;

    const results = [];
    const baseName = pdfFile.name.replace(/\.pdf$/i, '');

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 }); // 高品質 1.5x 縮放

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: context, viewport }).promise;

      // 僅保留 Blob，不產生 dataUrl，由外部以 createObjectURL 建立 img src
      const blob = await new Promise(resolve =>
        canvas.toBlob(resolve, 'image/jpeg', 0.92)
      );

      const pageItem = {
        pageNum,
        name: `${baseName}_page_${pageNum}.jpg`,
        blob
      };

      results.push(pageItem);

      if (typeof onProgress === 'function') {
        onProgress({ current: pageNum, total: numPages, item: pageItem });
      }
    }

    return results;
  }

  // 明確掛載至 window，供 app.js 與 tests.js 取用
  window.validateFile = validateFile;
  window.createZip = createZip;
  window.renderPdfToJpgBlobs = renderPdfToJpgBlobs;
})();
