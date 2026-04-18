import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";

async function main() {
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const uploadPath = path.join(os.tmpdir(), "smartwardrobe-upload.svg");

  fs.writeFileSync(
    uploadPath,
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="800" viewBox="0 0 640 800"><rect width="640" height="800" fill="#efe6da"/><rect x="180" y="140" width="280" height="520" rx="36" fill="#ffffff" stroke="#8f5b33" stroke-width="8"/><path d="M248 210c26-42 118-42 144 0l42 66-48 30-26-42v298H280V264l-26 42-48-30 42-66z" fill="#d7e7f7" stroke="#5f381a" stroke-width="6"/></svg>`,
  );

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(`${appUrl}/login`, { waitUntil: "networkidle" });
    await page.locator('form button[type="submit"]').click();
    await page.waitForURL("**/wardrobe");

    await page.locator('a[href="/import"]').nth(1).click();
    await page.waitForURL("**/import");

    await page.locator('input[type="file"]').setInputFiles(uploadPath);
    await page.locator('input[name="name"]').fill("Blue Shirt");
    await page.locator('select[name="subcategory"]').selectOption("shirt");
    await page.locator('select[name="color"]').selectOption("blue");
    await page.locator('input[name="brand"]').fill("Demo Label");
    await page
      .locator('textarea[name="notes"]')
      .fill("Browser smoke test");
    await page.locator('form button[type="submit"]').click();

    await page.waitForURL(/\/garment\//);
    await page.waitForLoadState("networkidle");

    const autoCategory = await page.locator('select[name="category"]').inputValue();
    const autoSeason = await page.locator('select[name="season"]').inputValue();

    if (autoCategory !== "tops" || autoSeason !== "spring") {
      throw new Error(`Unexpected auto classification: ${autoCategory}/${autoSeason}`);
    }

    await page.locator('select[name="category"]').selectOption("outerwear");
    await page.locator('select[name="subcategory"]').selectOption("jacket");
    await page.locator('select[name="color"]').selectOption("black");
    await page.locator('select[name="season"]').selectOption("winter");
    await page
      .locator('textarea[name="notes"]')
      .fill("Manual override from browser smoke test");
    await page.locator('form button[type="submit"]').click();

    await page.waitForURL(/saved=1/);
    await page.waitForLoadState("networkidle");

    const savedCategory = await page.locator('select[name="category"]').inputValue();
    const savedSeason = await page.locator('select[name="season"]').inputValue();
    const savedColor = await page.locator('select[name="color"]').inputValue();

    if (
      savedCategory !== "outerwear" ||
      savedSeason !== "winter" ||
      savedColor !== "black"
    ) {
      throw new Error(
        `Unexpected saved values: ${savedCategory}/${savedSeason}/${savedColor}`,
      );
    }

    await page.locator('a[href="/wardrobe"]').last().click();
    await page.waitForURL("**/wardrobe");
    await page.locator('select[name="category"]').selectOption("outerwear");
    await page.locator('button[type="submit"]').click();
    await page.locator("text=Blue Shirt").first().waitFor();

    console.log("BROWSER_SMOKE_OK");
  } finally {
    await browser.close();
    try {
      fs.unlinkSync(uploadPath);
    } catch {}
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
