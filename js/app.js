/**
 * PDF 轉 JPG UI 事件綁定與互動主邏輯
 * 修正：DOM API 取代 innerHTML、objectURL 節省記憶體、
 *       dragCounter 解決 dragleave 閃爍、error-banner 加關閉與自動消除
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM 元素引用
  const dropZone        = document.getElementById('drop-zone');
  const fileInput       = document.getElementById('file-input');
  const errorBanner     = document.getElementById('error-banner');
  const errorMsg        = document.getElementById('error-msg');
  const errorClose      = document.getElementById('error-close');
  const statusSection   = document.getElementById('status-section');
  const statusMessage   = document.getElementById('status-message');
  const statusPercentage= document.getElementById('status-percentage');
  const progressBar     = document.getElementById('progress-bar');
  const actionHeader    = document.getElementById('action-header');
  const pageCountTitle  = document.getElementById('page-count-title');
  const btnDownloadAll  = document.getElementById('btn-download-all');
  const previewGrid     = document.getElementById('preview-grid');

  // 狀態變數
  let currentFile    = null;
  let convertedItems = []; // Array<{ pageNum, name, blob }>
  let objectUrls     = []; // 記錄所有 createObjectURL 以便後續 revoke
  let errorTimer     = null;
  let dragCounter    = 0;  // 解決 dragleave 在子元素上閃爍

  // ── 關閉錯誤 Banner ───────────────────────────────────────
  errorClose.addEventListener('click', hideError);

  // ── 拖曳上傳事件（dragCounter 防閃爍）────────────────────
  dropZone.addEventListener('click', () => fileInput.click());

  // role="button" 的自訂元素不會內建鍵盤觸發行為，需自行處理 Enter/Space
  dropZone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      fileInput.click();
    }
  });

  dropZone.addEventListener('dragenter', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter++;
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter--;
    if (dragCounter <= 0) {
      dragCounter = 0;
      dropZone.classList.remove('drag-over');
    }
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter = 0;
    dropZone.classList.remove('drag-over');
    const files = e.dataTransfer ? e.dataTransfer.files : null;
    handleFilesSelected(files);
  });

  fileInput.addEventListener('change', (e) => {
    handleFilesSelected(e.target.files);
  });

  // ── 選擇檔案後處理 ────────────────────────────────────────
  async function handleFilesSelected(files) {
    hideError();
    resetState();

    try {
      currentFile = window.validateFile(files);
      await startConversion(currentFile);
    } catch (err) {
      showError(err.message);
    }
  }

  // ── 執行 PDF 轉檔 ─────────────────────────────────────────
  async function startConversion(pdfFile) {
    statusSection.style.display = 'block';
    updateProgress(0, '正在讀取 PDF 檔案資訊...');

    try {
      convertedItems = await window.renderPdfToJpgBlobs(pdfFile, ({ current, total, item }) => {
        const percent = Math.round((current / total) * 100);
        updateProgress(percent, `正在轉檔第 ${current} / ${total} 頁...`);
        appendPagePreview(item);
      });

      updateProgress(100, `轉檔成功！共處理 ${convertedItems.length} 頁。`);
      actionHeader.style.display = 'flex';
      pageCountTitle.textContent = `轉檔完成 (${convertedItems.length} 頁)`;

    } catch (err) {
      showError(`PDF 解析失敗：${err.message}`);
      statusSection.style.display = 'none';
    }
  }

  // ── 追加預覽卡片（純 DOM API，無 innerHTML）───────────────
  function appendPagePreview(item) {
    // 建立 objectURL 供 img src 使用（比 base64 dataUrl 省記憶體）
    const objectUrl = URL.createObjectURL(item.blob);
    objectUrls.push(objectUrl);

    const pageCard = document.createElement('div');
    pageCard.className = 'page-card';

    // 圖片預覽區
    const wrapper = document.createElement('div');
    wrapper.className = 'page-preview-wrapper';

    const img = document.createElement('img');
    img.src = objectUrl;
    img.alt = `第 ${item.pageNum} 頁 JPG 預覽圖`;  // 無障礙中文 alt
    img.loading = 'lazy';
    wrapper.appendChild(img);

    // 頁碼與下載按鈕欄
    const infoBar = document.createElement('div');
    infoBar.className = 'page-info';

    const label = document.createElement('span');
    label.textContent = `第 ${item.pageNum} 頁`;

    const btnSingle = document.createElement('button');
    btnSingle.className = 'btn-sm';
    btnSingle.textContent = '下載單張';
    btnSingle.addEventListener('click', (e) => {
      e.stopPropagation();
      downloadSingleImage(item);
    });

    infoBar.appendChild(label);
    infoBar.appendChild(btnSingle);
    pageCard.appendChild(wrapper);
    pageCard.appendChild(infoBar);
    previewGrid.appendChild(pageCard);
  }

  // ── 單張下載 ──────────────────────────────────────────────
  function downloadSingleImage(item) {
    if (typeof saveAs !== 'undefined') {
      saveAs(item.blob, item.name);
    } else {
      const url = URL.createObjectURL(item.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.name;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  // ── 下載全部 ZIP ──────────────────────────────────────────
  btnDownloadAll.addEventListener('click', async () => {
    if (convertedItems.length === 0) return;

    const originalHTML = btnDownloadAll.innerHTML;
    try {
      btnDownloadAll.disabled = true;
      btnDownloadAll.textContent = '打包中...';

      const baseName = currentFile ? currentFile.name.replace(/\.pdf$/i, '') : 'images';
      const zipFilename = `${baseName}_jpg.zip`;

      const zipBlob = await window.createZip(convertedItems, zipFilename);

      if (typeof saveAs !== 'undefined') {
        saveAs(zipBlob, zipFilename);
      } else {
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = zipFilename;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      showError(`ZIP 打包失敗：${err.message}`);
    } finally {
      btnDownloadAll.disabled = false;
      btnDownloadAll.innerHTML = originalHTML;
    }
  });

  // ── UI 輔助函式 ───────────────────────────────────────────
  function updateProgress(percent, msg) {
    progressBar.style.width = `${percent}%`;
    statusPercentage.textContent = `${percent}%`;
    statusMessage.textContent = msg;
  }

  function showError(msg) {
    errorMsg.textContent = msg;
    errorBanner.style.display = 'flex';
    // 5 秒後自動消除
    clearTimeout(errorTimer);
    errorTimer = setTimeout(hideError, 5000);
  }

  function hideError() {
    clearTimeout(errorTimer);
    errorBanner.style.display = 'none';
  }

  function resetState() {
    // Revoke 所有 objectURL，釋放記憶體
    objectUrls.forEach(url => URL.revokeObjectURL(url));
    objectUrls = [];
    convertedItems = [];
    previewGrid.innerHTML = '';
    actionHeader.style.display = 'none';
    statusSection.style.display = 'none';
    progressBar.style.width = '0%';
    fileInput.value = '';
  }

  // 頁面卸載時也清除所有 objectURL
  window.addEventListener('pagehide', resetState);
});
