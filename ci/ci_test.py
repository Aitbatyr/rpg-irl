"""Автотест сайта «Система» перед публикацией. Запуск: python ci/ci_test.py (из корня собранного сайта).
Сайт открывается с подменённой базой в памяти и вымышленными данными; реальная база не используется.
Код выхода 1, если что-то сломано: тогда публикация не происходит."""
import asyncio, json, re, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from ci_data import make
from playwright.async_api import async_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
def page_html():
    h = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
    mock = open(os.path.join(ROOT, 'ci', 'mock_supabase.js'), encoding='utf-8').read()
    data = json.dumps(make(), ensure_ascii=False).replace('</script', '<\\/script')
    h = re.sub(r'<script src="vendor/supabase\.js[^"]*"></script>', lambda m: '<script>window.__MOCK=' + data + ';</script><script>' + mock + '</script>', h)
    h = re.sub(r'<script src="config\.js[^"]*"></script>', lambda m: '<script>window.SISTEMA_CONFIG={url:"https://ci.invalid",key:"ci"};</script>', h)
    h = re.sub(r'<script src="shim\.js[^"]*"></script>', lambda m: '<script src="shim.js"></script>', h)
    h = re.sub(r'<link[^>]+fonts\.googleapis[^>]*>', '', h)
    out = os.path.join(ROOT, 'ci', '_page.html')
    open(out, 'w', encoding='utf-8').write(h.replace('<script src="shim.js"></script>', '<script src="../shim.js"></script>'))
    return out
FAIL = []
def check(cond, msg):
    print(('  ok   ' if cond else '  FAIL ') + msg)
    if not cond: FAIL.append(msg)
OVERFLOW_JS = '''() => { const out=[]; for (const e of document.querySelectorAll('body *')) { if (!e.offsetParent || !e.childNodes.length) continue;
  let sc=e.parentElement; while(sc && !['auto','scroll'].includes(getComputedStyle(sc).overflowX)) sc=sc.parentElement; if (sc) continue;
  let p=e.parentElement; while(p && !p.matches('.fold,.panel')) p=p.parentElement; if(!p) continue;
  const pr=p.getBoundingClientRect(); for (const n of e.childNodes){ if(n.nodeType!==3||!n.textContent.trim()) continue; const rg=document.createRange(); rg.selectNodeContents(n);
  for (const q of rg.getClientRects()) if (q.right>pr.right+1||q.left<pr.left-1){ out.push(n.textContent.trim().slice(0,40)); break; } } } return out.slice(0,5); }'''
async def run():
    url = 'file://' + page_html()
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, h in [(360, 780), (1280, 900)]:
            print(f'== ширина {w}')
            pg = await b.new_page(viewport={'width': w, 'height': h}); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(url); await pg.wait_for_timeout(3000)
            check(not await pg.evaluate("!!document.getElementById('boot')"), 'экран загрузки уходит после загрузки')
            check('LV' in await pg.evaluate("document.getElementById('strip').innerText"), 'полоска уровня на месте')
            n = await pg.evaluate("document.querySelectorAll('#quests .qi').length"); check(n >= 5, f'квесты дня показаны ({n})')
            for t in ['today', 'story', 'status', 'party', 'more']:
                await pg.click('#tab-' + t); await pg.wait_for_timeout(350)
                await pg.evaluate("document.querySelectorAll('details').forEach(d=>d.open=true)"); await pg.wait_for_timeout(150)
                txt = await pg.evaluate('document.body.innerText')
                bad = re.findall(r'.{0,30}(?:undefined|NaN|\[object).{0,20}', txt)
                check(not bad, f'вкладка {t}: нет undefined/NaN' + (f' {bad[:2]}' if bad else ''))
                ov = await pg.evaluate(OVERFLOW_JS); check(not ov, f'вкладка {t}: текст не вылезает за рамки' + (f' {ov}' if ov else ''))
                hs = await pg.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth'); check(hs <= 1, f'вкладка {t}: нет горизонтальной прокрутки')
            await pg.click('#tab-status'); await pg.wait_for_timeout(300)
            check(await pg.evaluate("document.querySelectorAll('#heat .hm[data-d]').length") > 20, 'карта активности нарисована')
            await pg.click('#tab-party'); await pg.wait_for_timeout(300)
            await pg.click('#party .pc[data-p=aldiyar] .nm'); await pg.wait_for_timeout(400)
            check(await pg.evaluate("!document.getElementById('friendOv').hidden"), 'окно друга открывается')
            check(await pg.evaluate("document.querySelectorAll('#fHeat .hm[data-d]').length") > 20, 'у друга есть карта активности')
            await pg.keyboard.press('Escape'); await pg.wait_for_timeout(900)
            check(await pg.evaluate("document.getElementById('friendOv').hidden"), 'окно друга закрывается')
            await pg.click('#tab-today'); await pg.wait_for_timeout(300)
            before = await pg.evaluate("document.querySelector('#strip .xpn').textContent")
            await pg.evaluate("document.querySelector('#quests .chk[aria-pressed=false]:not([disabled])').click()"); await pg.wait_for_timeout(1500)
            after = await pg.evaluate("document.querySelector('#strip .xpn').textContent")
            check(before != after, f'галочка начисляет опыт ({before} → {after})')
            await pg.fill('#qTitle', 'Автотест: новый квест'); await pg.wait_for_timeout(200)
            check(await pg.evaluate("!document.getElementById('grp-rank').hidden"), 'ползунки опыта открываются при вводе названия')
            await pg.evaluate("for (const [id, v] of [['xTime', 9], ['xEff', 2], ['xLike', 0]]) { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event('input')); }"); await pg.wait_for_timeout(150)
            xn = await pg.evaluate("document.getElementById('xNum').textContent"); check(xn == '+78', f'формула: 2 ч, сложный, не нравится = +78 XP ({xn})')
            await pg.click('#addBtn'); await pg.wait_for_timeout(800)
            qt = await pg.evaluate("document.getElementById('quests').innerText")
            check('Автотест: новый квест' in qt, 'новый квест добавляется')
            check('ЗАДАЧА' in qt and 'ПРИВЫЧКА' in qt, 'метки ЗАДАЧА и ПРИВЫЧКА видны')
            check(not re.search(r'(?m)^[EDCBAS]$', qt), 'букв рангов у квестов нет')
            check(not errs, 'ошибок JavaScript нет' + (f': {errs[:3]}' if errs else ''))
            await pg.close()
        await b.close()
asyncio.run(run())
print('ИТОГ:', 'всё прошло' if not FAIL else f'провалено {len(FAIL)}')
sys.exit(1 if FAIL else 0)
