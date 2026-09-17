import asyncio, json
from playwright.async_api import async_playwright
S=json.load(open("/root/.cache/lovable-auth/session.json"));KEY=S["storage_key"];SESS=S.get("session") or S
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(headless=True)
        ctx=await b.new_context(viewport={"width":1440,"height":900},device_scale_factor=2)
        pg=await ctx.new_page()
        await pg.goto("http://localhost:8080",wait_until="domcontentloaded")
        await pg.evaluate(f"localStorage.setItem({json.dumps(KEY)}, {json.dumps(json.dumps(SESS))})")
        await pg.goto("http://localhost:8080/dashboard/trade",wait_until="domcontentloaded")
        await pg.wait_for_timeout(5000)
        await pg.get_by_role("button",name="Find Work",exact=True).first.click()
        await pg.wait_for_timeout(2500)
        for lbl in ["NEW (200)","ALL IN VIEW"]:
            try:
                await pg.get_by_text(lbl,exact=True).first.click(timeout=2500); await pg.wait_for_timeout(2000)
                txt=await pg.inner_text("body")
                print(lbl,"empty" if "No applications match" in txt else "HAS RESULTS")
            except Exception as e: print(lbl,"miss")
        await pg.evaluate("window.scrollTo(0,380)"); await pg.wait_for_timeout(800)
        await pg.screenshot(path="/dev-server/.shots/tr-jobs.png")
        await b.close()
asyncio.run(main())
