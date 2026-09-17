import asyncio, json, sys
from playwright.async_api import async_playwright

S = json.load(open("/root/.cache/lovable-auth/session.json"))
KEY = S.get("storage_key"); SESS = S.get("session") or S
ROLE = sys.argv[1]
OUT = "/dev-server/.shots"


async def shot(page, name, y=0):
    await page.wait_for_timeout(2000)
    await page.evaluate(f"window.scrollTo(0,{y})")
    await page.wait_for_timeout(800)
    await page.screenshot(path=f"{OUT}/{name}.png")
    print("saved", name)


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True)
        ctx = await b.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=2)
        page = await ctx.new_page()
        await page.goto("http://localhost:8080", wait_until="domcontentloaded")
        await page.evaluate(f"localStorage.setItem({json.dumps(KEY)}, {json.dumps(json.dumps(SESS))})")
        await page.goto("http://localhost:8080/dashboard/" + ROLE, wait_until="domcontentloaded")
        await page.wait_for_timeout(5000)
        try:
            await page.get_by_role("button", name="Accept").first.click(timeout=3000)
        except Exception:
            pass
        await page.add_style_tag(content="button[aria-label*='chat' i]{display:none!important}")
        if ROLE == "homeowner":
            plan = [("My Projects", "ho-overview", 240), ("Quotes & Checks", "ho-quotes", 820),
                    ("Site Diary", "ho-diary", 240), ("Homeowner Manual", "ho-manual", 240)]
        else:
            plan = [("Dashboard", "tr-dashboard", 240), ("Available Jobs", "tr-jobs", 240),
                    ("Active Projects", "tr-projects", 240), ("Earnings", "tr-earnings", 240)]
        for label, name, y in plan:
            try:
                await page.get_by_role("button", name=label, exact=True).first.click(timeout=5000)
            except Exception as e:
                print("nav miss", label, type(e).__name__)
            await shot(page, name, y)
        await b.close()

asyncio.run(main())
