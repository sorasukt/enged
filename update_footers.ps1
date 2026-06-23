$files = @(
    "index.html",
    "sys.html",
    "checkup.html",
    "budget.html",
    "vote/index.html",
    "vote/info.html",
    "vote/ivote.html",
    "vote/results.html",
    "vote/backend.html",
    "vote/base44.html",
    "404.html",
    "terms.html",
    "privacy.html",
    "aum/checkup.html",
    "aum/budget.html"
)

$newFooter = @"
        <footer class="site-footer">
            <div class="footer-logo"><em>/</em>sorasukt</div>
            <div>
                © 2026 
                <span data-en>All Rights Reserved.</span>
                <span data-th>สงวนลิขสิทธิ์ทุกประการ</span>
            </div>
            <div class="footer-links">
                <a href="/enged/terms.html">ข้อกำหนดการใช้งาน</a>
                <span class="sep">•</span>
                <a href="/enged/privacy.html">นโยบายความเป็นส่วนตัว</a>
            </div>
        </footer>
"@

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content -Path $file -Raw -Encoding UTF8
        $content = $content -replace '(?s)[ \t]*<footer class="site-footer">.*?</footer>', $newFooter
        Set-Content -Path $file -Value $content -Encoding UTF8
        Write-Host "Updated $file"
    }
}
