import os
import re

def build_offline():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dist_dir = os.path.join(base_dir, 'dist')
    os.makedirs(dist_dir, exist_ok=True)

    # 1. 讀取源頭檔案
    with open(os.path.join(base_dir, 'index.html'), 'r', encoding='utf-8') as f:
        html = f.read()

    with open(os.path.join(base_dir, 'css', 'style.css'), 'r', encoding='utf-8') as f:
        css = f.read()

    with open(os.path.join(base_dir, '.vendor', 'jszip.min.js'), 'r', encoding='utf-8') as f:
        jszip_js = f.read()

    with open(os.path.join(base_dir, '.vendor', 'FileSaver.min.js'), 'r', encoding='utf-8') as f:
        filesaver_js = f.read()

    with open(os.path.join(base_dir, '.vendor', 'pdf.min.js'), 'r', encoding='utf-8') as f:
        pdf_js = f.read()

    with open(os.path.join(base_dir, '.vendor', 'pdf.worker.min.js'), 'r', encoding='utf-8') as f:
        pdf_worker_js = f.read()

    with open(os.path.join(base_dir, 'js', 'converter.js'), 'r', encoding='utf-8') as f:
        converter_js = f.read()

    with open(os.path.join(base_dir, 'js', 'app.js'), 'r', encoding='utf-8') as f:
        app_js = f.read()

    # 2. 處理 CSS：移除 Google Fonts 引用，替換字型定義
    css_processed = re.sub(r"font-family:\s*'Inter',[^;]+;", "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;", css)

    # 3. 處理 HTML CSP header
    html = re.sub(
        r"<meta http-equiv=\"Content-Security-Policy\"[\s\S]*?>",
        '<meta http-equiv="Content-Security-Policy" content="default-src \'self\' data: blob: \'unsafe-inline\' \'unsafe-eval\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data: blob:;">',
        html
    )

    # 4. 移除外連 Google Fonts
    html = re.sub(r'<link rel="preconnect" href="https://fonts\.googleapis\.com">', '', html)
    html = re.sub(r'<link rel="preconnect" href="https://fonts\.gstatic\.com" crossorigin>', '', html)
    html = re.sub(r'<link href="https://fonts\.googleapis\.com/css2\?family=Inter[\s\S]*?rel="stylesheet">', '', html)

    # 5. 內嵌 CSS
    html = html.replace('<link rel="stylesheet" href="css/style.css">', f"<style>\n{css_processed}\n</style>")

    # 6. 移除原有 CDN script 標籤與外部 JS 標籤
    html = re.sub(r'<script\s+src="https://cdnjs\.cloudflare\.com/[^"]+"[\s\S]*?</script>', '', html)
    html = html.replace('<script src="js/converter.js"></script>', '')
    html = html.replace('<script src="js/app.js"></script>', '')

    # 7. 淨化離線獨立包 (移除所有無效的專案內部/外部導覽連結)
    # 移除頁頭徽章連結 (自動化資安掃描連結與下載按鈕)
    html = re.sub(r'<a class="scan-badge"[\s\S]*?</a>', '<span class="scan-badge" style="cursor:default;">🛡️ 100% 離線本地防護</span>', html)
    html = re.sub(r'<a class="offline-badge"[\s\S]*?</a>', '', html)

    # 替換頁腳 (Footer) 為純淨離線宣告，完全移除死連結
    clean_footer = """<footer>
      <p>PDF to JPG 100% 獨立離線版 · 純前端運算 · 免費開源工具</p>
    </footer>"""
    html = re.sub(r'<footer>[\s\S]*?</footer>', clean_footer, html)

    # 構建 Worker Blob 動態腳本
    # 將 pdf.worker.min.js 內嵌並以 Blob URL 掛載到 GlobalWorkerOptions
    inline_worker_script = f"""
<script>
/* JSZip Library */
{jszip_js}
</script>
<script>
/* FileSaver Library */
{filesaver_js}
</script>
<script>
/* PDF.js Core Library */
{pdf_js}
</script>
<script>
/* PDF.js Inline Worker Initialization */
(function() {{
  try {{
    const workerRawCode = {repr(pdf_worker_js)};
    // 使用 Data URI 替代 Blob URL，完美相容 file:// 本地檔案協定 (解決 Origin 為 null 導致的 blob:null 阻擋)
    const workerUrl = 'data:text/javascript;charset=utf-8,' + encodeURIComponent(workerRawCode);
    if (typeof pdfjsLib !== 'undefined') {{
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
    }}
  }} catch (e) {{
    console.error('Failed to initialize inline PDF worker:', e);
  }}
}})();
</script>
<script>
/* Converter App Logic */
{converter_js}
</script>
<script>
/* App UI Events */
{app_js}
</script>
"""

    # 插入頁尾 </body> 前
    html = html.replace("</body>", f"{inline_worker_script}\n</body>")

    out_path = os.path.join(dist_dir, 'pdf-to-jpg-offline.html')
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(html)

    print(f"Successfully generated offline standalone package at: {out_path}")
    print(f"File size: {os.path.getsize(out_path) / (1024*1024):.2f} MB")

if __name__ == '__main__':
    build_offline()
