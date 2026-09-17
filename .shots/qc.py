import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(headless=True)
        ctx=await b.new_context(viewport={"width":1440,"height":900},device_scale_factor=2)
        pg=await ctx.new_page()
        await pg.goto("http://localhost:8080/quote-checker",wait_until="domcontentloaded")
        await pg.wait_for_timeout(4000)
        try: await pg.get_by_role("button",name="Accept").first.click(timeout=3000)
        except Exception: pass
        await pg.evaluate("window.scrollTo(0,520)")
        await pg.wait_for_timeout(800)
        await pg.screenshot(path="/dev-server/.shots/qc.png")
        await b.close()
asyncio.run(main())
