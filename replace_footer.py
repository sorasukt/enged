import os
import re

html_files = [
    'index.html',
    'sys.html',
    'checkup.html',
    'budget.html',
    'vote/index.html',
    'vote/info.html',
    'vote/ivote.html',
    'vote/results.html',
    'vote/backend.html',
    'vote/base44.html',
    '404.html',
    'aum/checkup.html'
]

new_footer = """        <footer class="site-footer">
            <div class="footer-logo"><em>/</em>sorasukt</div>
            <div>
                © 2026 
                <span data-en>All Rights Reserved.</span>
                <span data-th>สงวนลิขสิทธิ์ทุกประการ</span>
            </div>
        </footer>"""

for file in html_files:
    filepath = os.path.join(r"c:\Users\sorasukt\Documents\GitHub\enged", file)
    if not os.path.exists(filepath):
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    new_content = re.sub(r'<footer.*?</footer>', new_footer, content, flags=re.DOTALL)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
        print(f"Updated footer in {file}")
