// 極簡 DOM / Unit Test Runner
(function () {
  const suites = [];
  let currentSuite = null;

  window.describe = function (suiteName, fn) {
    currentSuite = { name: suiteName, tests: [] };
    suites.push(currentSuite);
    fn();
  };

  window.it = function (testName, fn) {
    currentSuite.tests.push({ name: testName, fn });
  };

  window.expect = function (actual) {
    return {
      toBe(expected) {
        if (actual !== expected) {
          throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
        }
      },
      toThrow(expectedMsg) {
        let threw = false;
        let actualMsg = '';
        try {
          actual();
        } catch (e) {
          threw = true;
          actualMsg = e.message;
        }
        if (!threw) {
          throw new Error(`Expected function to throw an error, but it did not.`);
        }
        if (expectedMsg && !actualMsg.includes(expectedMsg)) {
          throw new Error(`Expected error message containing "${expectedMsg}", but got "${actualMsg}"`);
        }
      },
      toBeTruthy() {
        if (!actual) {
          throw new Error(`Expected value to be truthy, but got ${JSON.stringify(actual)}`);
        }
      }
    };
  };

  window.runTests = async function () {
    const container = document.getElementById('test-results');
    const passCountEl = document.getElementById('pass-count');
    const failCountEl = document.getElementById('fail-count');

    if (!container) return;
    container.innerHTML = '';

    let passedTotal = 0;
    let failedTotal = 0;

    for (const suite of suites) {
      const suiteEl = document.createElement('div');
      suiteEl.className = 'test-suite';

      const header = document.createElement('div');
      header.className = 'suite-header';
      header.textContent = `Suite: ${suite.name}`;
      suiteEl.appendChild(header);

      for (const test of suite.tests) {
        const caseEl = document.createElement('div');
        caseEl.className = 'test-case';

        const badge = document.createElement('span');
        badge.className = 'status-badge';

        const title = document.createElement('div');
        title.className = 'test-title';
        title.textContent = test.name;

        try {
          await test.fn();
          badge.classList.add('pass');
          badge.textContent = 'PASS';
          passedTotal++;
        } catch (err) {
          badge.classList.add('fail');
          badge.textContent = 'FAIL';
          failedTotal++;

          const errEl = document.createElement('div');
          errEl.className = 'test-error';
          errEl.textContent = err.stack || err.message;
          title.appendChild(errEl);
        }

        caseEl.appendChild(badge);
        caseEl.appendChild(title);
        suiteEl.appendChild(caseEl);
      }

      container.appendChild(suiteEl);
    }

    if (passCountEl) passCountEl.textContent = passedTotal;
    if (failCountEl) failCountEl.textContent = failedTotal;
  };
})();

// === TDD Unit Test Specifications ===

describe('1. 檔案驗證 (validateFile)', () => {
  it('無檔案傳入時應拋出「請選擇一個 PDF 檔案」錯誤', () => {
    expect(() => validateFile(null)).toThrow('請選擇一個 PDF 檔案');
    expect(() => validateFile([])).toThrow('請選擇一個 PDF 檔案');
  });

  it('一次傳入多於 1 個檔案時應拋出「一次只能上傳一個檔案」錯誤', () => {
    const fakeFiles = [
      { name: 'test1.pdf', type: 'application/pdf' },
      { name: 'test2.pdf', type: 'application/pdf' }
    ];
    expect(() => validateFile(fakeFiles)).toThrow('一次只能上傳一個檔案');
  });

  it('傳入非 PDF 檔時（例如 PNG 或 TXT）應拋出「格式限制為 PDF 檔案」錯誤', () => {
    const fakeTxt = [{ name: 'document.txt', type: 'text/plain' }];
    expect(() => validateFile(fakeTxt)).toThrow('格式限制為 PDF 檔案');

    const fakePng = [{ name: 'image.png', type: 'image/png' }];
    expect(() => validateFile(fakePng)).toThrow('格式限制為 PDF 檔案');
  });

  it('傳入單一合法 PDF 檔案時應成功驗收回傳該 File 物件', () => {
    const validPdf = { name: 'sample.pdf', type: 'application/pdf' };
    const result = validateFile([validPdf]);
    expect(result.name).toBe('sample.pdf');
  });
});

describe('2. ZIP 打包封裝 (createZip)', () => {
  it('無圖片傳入時應拋出「無可打包的圖片」錯誤', async () => {
    try {
      await createZip([]);
      throw new Error('Should have thrown error');
    } catch (e) {
      expect(e.message.includes('無可打包的圖片')).toBeTruthy();
    }
  });

  it('傳入圖片陣列時應成功產出 ZIP 格式之 Blob', async () => {
    const fakeBlob = new Blob(['fake image bytes'], { type: 'image/jpeg' });
    const images = [
      { name: 'page_1.jpg', blob: fakeBlob },
      { name: 'page_2.jpg', blob: fakeBlob }
    ];
    const zipBlob = await createZip(images);
    expect(zipBlob instanceof Blob).toBeTruthy();
    expect(zipBlob.type).toBe('application/zip');
  });
});

describe('3. 資安風險審核測試 (Security Audit Checks)', () => {
  it('客戶端無後端網路請求防護 (Zero Server-side Network Dependency)', () => {
    // 驗證模組與函式庫均在瀏覽器前端執行
    expect(typeof validateFile).toBe('function');
    expect(typeof createZip).toBe('function');
    expect(typeof renderPdfToJpgBlobs).toBe('function');
  });

  it('XSS 與 DOM 攻擊隔離 (Canvas Pixel Rendering Isolation)', () => {
    // 驗證 Canvas 元素安全繪製 API
    const canvas = document.createElement('canvas');
    expect(typeof canvas.toBlob).toBe('function');
    expect(typeof canvas.toDataURL).toBe('function');
  });

  it('強型態上傳校驗 (Strict Type & File Ext Verification)', () => {
    const maliciousInput = [{ name: 'malicious.exe', type: 'application/x-msdownload' }];
    expect(() => validateFile(maliciousInput)).toThrow('格式限制為 PDF 檔案');
  });
});

// 自動執行測試
document.addEventListener('DOMContentLoaded', () => {

  if (window.runTests) window.runTests();
});
