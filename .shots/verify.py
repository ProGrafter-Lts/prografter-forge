import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(headless=True)
        ctx=await b.new_context(viewport={"width":1280,"height":1800})
        pg=await ctx.new_page()
        await pg.goto("http://localhost:8080/platform-tour",wait_until="domcontentloaded")
        await pg.wait_for_timeout(4000)
        await pg.evaluate("window.scrollTo(0,900)"); await pg.wait_for_timeout(1500)
        await pg.screenshot(path="/dev-server/.shots/verify.png")
        await b.close()
asyncio.run(main())
