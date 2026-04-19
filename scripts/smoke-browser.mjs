import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";

const PRESET_IDENTITIES = [
  { slug: "luna", displayName: "Luna" },
  { slug: "nova", displayName: "Nova" },
  { slug: "iris", displayName: "Iris" },
];

const SMOKE_UPLOAD_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9p2G2WQAAAAASUVORK5CYII=";

async function importGarment(page, appUrl, uploadPath, garment) {
  await page.goto(`${appUrl}/import`, { waitUntil: "networkidle" });
  await page.locator('input[type="file"]').setInputFiles(uploadPath);
  await page.locator('input[name="name"]').fill(garment.name);
  await page.locator('select[name="subcategory"]').selectOption(garment.subcategory);
  await page.locator('select[name="color"]').selectOption(garment.color);
  await page.locator('input[name="brand"]').fill(garment.brand);
  await page.locator('textarea[name="notes"]').fill(garment.notes);
  await page.locator('[data-testid="import-form"] button[type="submit"]').click();
  await page.waitForURL(/\/garment\//, { timeout: 60000 });
  await page.waitForLoadState("networkidle");
}

async function importGarmentBatch(page, appUrl, uploadPaths, batch) {
  await page.goto(`${appUrl}/import`, { waitUntil: "networkidle" });
  await page.locator('[data-testid="import-mode-batch"]').click();
  await page.locator('[data-testid="import-batch-form"]').waitFor();
  await page.locator('[data-testid="batch-image-input"]').setInputFiles(uploadPaths);
  await page
    .locator('[data-testid="import-batch-form"] select[name="subcategory"]')
    .selectOption(batch.subcategory);
  await page
    .locator('[data-testid="import-batch-form"] select[name="color"]')
    .selectOption(batch.color);
  await page
    .locator('[data-testid="import-batch-form"] select[name="season"]')
    .selectOption(batch.season);
  await page
    .locator('[data-testid="import-batch-form"] input[name="brand"]')
    .fill(batch.brand);
  await page
    .locator('[data-testid="import-batch-form"] textarea[name="notes"]')
    .fill(batch.notes);
  await page.locator('[data-testid="batch-import-submit"]').click();
  await page.waitForURL(/\/import\?mode=batch&createdCount=\d+/, { timeout: 60000 });
  await page.waitForLoadState("networkidle");

  const createdCount = (
    await page.locator('[data-testid="batch-import-created-count"]').textContent()
  )?.trim();

  if (createdCount !== String(uploadPaths.length)) {
    throw new Error(`Unexpected batch import count: ${createdCount}`);
  }
}

async function locatorExists(locator) {
  return (await locator.count()) > 0;
}

async function loginWithIdentity(page, appUrl, identity) {
  await page.goto(`${appUrl}/login`, { waitUntil: "networkidle" });

  const presetButton = page.locator(
    [
      `[data-testid="preset-identity-${identity.slug}"] button`,
      `[data-testid="preset-identity-card-${identity.slug}"] button`,
      `[data-testid="${identity.slug}-identity"] button`,
      `form:has-text("${identity.displayName}") button`,
      `button:has-text("${identity.displayName}")`,
    ].join(", "),
  );

  if (await locatorExists(presetButton)) {
    await presetButton.first().click();
    await page.waitForURL("**/wardrobe", { timeout: 60000 });
    await page.waitForLoadState("networkidle");
    return "preset-button";
  }

  const presetSelect = page.locator(
    'select[name="identity"], select[name="presetIdentity"], [data-testid="preset-identity-select"]',
  );

  if (await locatorExists(presetSelect)) {
    await presetSelect.first().selectOption(identity.slug);

    const submitButton = page.locator(
      [
        '[data-testid="preset-login-form"] button[type="submit"]',
        '[data-testid="preset-session-form"] button[type="submit"]',
        "form button[type=\"submit\"]",
      ].join(", "),
    );

    if (!(await locatorExists(submitButton))) {
      throw new Error("Found preset identity select input but no submit button");
    }

    await submitButton.first().click();
    await page.waitForURL("**/wardrobe", { timeout: 60000 });
    await page.waitForLoadState("networkidle");
    return "preset-select";
  }

  const legacyDemoButton = page.locator('[data-testid="demo-login-form"] button[type="submit"]');
  if (await locatorExists(legacyDemoButton)) {
    await legacyDemoButton.click();
    await page.waitForURL("**/wardrobe", { timeout: 60000 });
    await page.waitForLoadState("networkidle");
    return "legacy-demo";
  }

  throw new Error("Unable to find a supported login flow on /login");
}

async function assertWardrobeDoesNotShow(page, garmentName, message) {
  if (await page.getByText(garmentName, { exact: true }).count()) {
    throw new Error(message);
  }
}

async function applySearch(page, value) {
  await page.locator('input[name="q"]').fill(value);
  await page.locator('[data-testid="wardrobe-filters"] button[type="submit"]').click();
  await page.waitForLoadState("networkidle");
}

async function firstExistingLocator(page, selectors) {
  for (const selector of selectors) {
    const locator = page.locator(selector);
    if (await locatorExists(locator)) {
      return locator.first();
    }
  }

  return null;
}

async function expectRecommendedPlaceholder(page) {
  const placeholder = await firstExistingLocator(page, [
    '[data-testid="recommended-outfits-placeholder"]',
    '[data-testid="outfits-recommendation-placeholder"]',
    'section:has-text("推荐搭配"):has-text("Coming Soon")',
    'section:has-text("推荐搭配"):has-text("coming soon")',
    'text=推荐搭配',
  ]);

  if (!placeholder) {
    throw new Error("Unable to find the outfits recommendation placeholder");
  }
}

async function createOutfit(page, appUrl, outfit) {
  await page.goto(`${appUrl}/outfits/new`, { waitUntil: "networkidle" });

  const outfitForm = await firstExistingLocator(page, [
    '[data-testid="outfit-form"]',
    '[data-testid="outfit-editor-form"]',
    'form:has(select[name="topGarmentId"])',
  ]);

  if (!outfitForm) {
    throw new Error("Unable to find the outfit creation form");
  }

  const topSelect = await firstExistingLocator(page, [
    'select[name="topGarmentId"]',
    '[data-testid="outfit-slot-top"] select',
  ]);
  const bottomSelect = await firstExistingLocator(page, [
    'select[name="bottomGarmentId"]',
    '[data-testid="outfit-slot-bottom"] select',
  ]);

  if (!topSelect || !bottomSelect) {
    throw new Error("Outfit creation form is missing top/bottom slot selectors");
  }

  await topSelect.selectOption({ label: outfit.topName });
  await bottomSelect.selectOption({ label: outfit.bottomName });

  if (outfit.outerwearName) {
    const outerwearSelect = await firstExistingLocator(page, [
      'select[name="outerwearGarmentId"]',
    ]);

    if (!outerwearSelect) {
      throw new Error("Unable to find the outerwear selector");
    }

    await outerwearSelect.selectOption({ label: outfit.outerwearName });
  }

  if (outfit.accessoryName) {
    const accessoryCard = page.locator("label").filter({ hasText: outfit.accessoryName });

    if (!(await locatorExists(accessoryCard))) {
      throw new Error(`Unable to find accessory option for ${outfit.accessoryName}`);
    }

    await accessoryCard.first().click();
  }

  const generatedName = await firstExistingLocator(page, [
    '[data-testid="outfit-generated-name"]',
    '[data-testid="generated-outfit-name"]',
    '[data-testid="outfit-name-preview"]',
  ]);

  if (!generatedName) {
    throw new Error("Unable to find the generated outfit name preview");
  }

  await generatedName.waitFor();
  const previewText = (await generatedName.textContent())?.trim() ?? "";
  if (!previewText.includes(outfit.topToken) || !previewText.includes(outfit.bottomToken)) {
    throw new Error(`Unexpected generated outfit name preview: ${previewText}`);
  }

  const nameInput = await firstExistingLocator(page, [
    'input[name="name"]',
    '[data-testid="outfit-name-input"]',
  ]);

  if (!nameInput) {
    throw new Error("Unable to find the outfit name input");
  }

  await nameInput.fill(outfit.manualName);

  const submitButton = await firstExistingLocator(page, [
    '[data-testid="outfit-form"] button[type="submit"]',
    '[data-testid="outfit-editor-form"] button[type="submit"]',
    'form button[type="submit"]',
  ]);

  if (!submitButton) {
    throw new Error("Unable to find the outfit submit button");
  }

  await submitButton.click();
  await page.waitForURL(/\/outfits\/(?!new(?:[/?]|$))[^/?]+/, { timeout: 60000 });
  await page.waitForLoadState("networkidle");

  const outfitId = /\/outfits\/([^/?]+)/.exec(page.url())?.[1];
  if (!outfitId) {
    throw new Error(`Unable to parse outfit id from ${page.url()}`);
  }

  return { outfitId, previewText };
}

async function deleteCurrentOutfit(page) {
  page.once("dialog", (dialog) => dialog.accept());

  const deleteButton = await firstExistingLocator(page, [
    '[data-testid="delete-outfit-form"] button[type="submit"]',
    'form:has-text("删除搭配") button[type="submit"]',
    'button:has-text("删除搭配")',
  ]);

  if (!deleteButton) {
    throw new Error("Unable to find the delete outfit control");
  }

  await deleteButton.click();
  await page.waitForURL(/\/outfits\?deleted=1/, { timeout: 60000 });
  await page.waitForLoadState("networkidle");
}

async function collectGarmentCards(page) {
  const cards = page.locator("article");
  const count = await cards.count();
  const results = [];

  for (let index = 0; index < count; index += 1) {
    const card = cards.nth(index);
    const title = ((await card.locator("h2").first().textContent()) ?? "").trim();
    const href = await card.locator('a[href*="/garment/"]').first().getAttribute("href");
    const garmentId = href?.split("/garment/")[1]?.split("?")[0] ?? "";

    if (title && garmentId) {
      results.push({ title, garmentId });
    }
  }

  return results;
}

async function deleteGarmentById(page, appUrl, garmentId) {
  if (!garmentId) {
    return false;
  }

  page.once("dialog", (dialog) => dialog.accept());
  await page.goto(`${appUrl}/garment/${garmentId}`, { waitUntil: "networkidle" });

   if (page.url().includes("/login")) {
    return false;
  }

  const deleteButton = await firstExistingLocator(page, [
    '[data-testid="delete-garment-form"] button[type="submit"]',
    "form:last-of-type button[type=\"submit\"]",
    'button:has-text("删除")',
  ]);

  if (!deleteButton) {
    return false;
  }

  await deleteButton.click();
  try {
    await page.waitForURL(/\/wardrobe\?deleted=1/, { timeout: 15000 });
    await page.waitForLoadState("networkidle");
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const token = Date.now().toString(36);
  const batchToken = Math.random().toString(36).slice(2, 10);
  const uploadPath = path.join(os.tmpdir(), `smartwardrobe-upload-${token}.png`);
  const batchUploadPaths = [
    path.join(os.tmpdir(), `smartwardrobe-batch-a-${token}.png`),
    path.join(os.tmpdir(), `smartwardrobe-batch-b-${token}.png`),
  ];
  const firstGarment = {
    name: `Nebula Shirt ${token}`,
    subcategory: "shirt",
    color: "blue",
    brand: `Moon Brand ${token}`,
    notes: `nebula-note-${token}`,
  };
  const secondGarment = {
    name: `Aurora Coat ${token}`,
    subcategory: "coat",
    color: "black",
    brand: `Aurora Brand ${token}`,
    notes: `aurora-note-${token}`,
  };
  const thirdGarment = {
    name: `Nova Skirt ${token}`,
    subcategory: "skirt",
    color: "red",
    brand: `Nova Brand ${token}`,
    notes: `nova-note-${token}`,
  };
  const fourthGarment = {
    name: `Iris Shirt ${token}`,
    subcategory: "shirt",
    color: "white",
    brand: `Iris Brand ${token}`,
    notes: `iris-note-${token}`,
  };
  const accessoryGarment = {
    name: `Star Hat ${token}`,
    subcategory: "hat",
    color: "white",
    brand: `Star Brand ${token}`,
    notes: `star-note-${token}`,
  };
  const batchImport = {
    subcategory: "shirt",
    color: "white",
    season: "winter",
    brand: `Batch Brand ${batchToken}`,
    notes: `batch-note-${batchToken}`,
  };

  fs.writeFileSync(uploadPath, Buffer.from(SMOKE_UPLOAD_PNG_BASE64, "base64"));
  for (const batchUploadPath of batchUploadPaths) {
    fs.writeFileSync(batchUploadPath, Buffer.from(SMOKE_UPLOAD_PNG_BASE64, "base64"));
  }

  const browser = await chromium.launch({ headless: true });
  const primaryContext = await browser.newContext();
  const page = await primaryContext.newPage();
  let secondaryContext = null;
  let secondaryPage = null;
  let firstGarmentId = "";
  let secondGarmentId = "";
  let thirdGarmentId = "";
  let fourthGarmentId = "";
  let accessoryGarmentId = "";
  let batchGarmentIds = [];
  let batchGarmentNames = [];

  try {
    const loginMode = await loginWithIdentity(page, appUrl, PRESET_IDENTITIES[0]);

    await importGarment(page, appUrl, uploadPath, firstGarment);
    firstGarmentId = /\/garment\/([^?]+)/.exec(page.url())?.[1] ?? "";
    if (!firstGarmentId) {
      throw new Error(`Unable to parse first garment id from ${page.url()}`);
    }

    const autoCategory = await page.locator('select[name="category"]').inputValue();
    const autoSeason = await page.locator('select[name="season"]').inputValue();
    if (autoCategory !== "tops" || autoSeason !== "spring") {
      throw new Error(`Unexpected auto classification: ${autoCategory}/${autoSeason}`);
    }

    await page.locator('select[name="category"]').selectOption("tops");
    await page.locator('select[name="subcategory"]').selectOption("shirt");
    await page.locator('select[name="color"]').selectOption("black");
    await page.locator('select[name="season"]').selectOption("winter");
    await page.locator('textarea[name="notes"]').fill(`manual-note-${token}`);
    await page.locator('[data-testid="garment-edit-form"] button[type="submit"]').click();
    await page.waitForURL(/saved=1/);

    await importGarment(page, appUrl, uploadPath, secondGarment);
    secondGarmentId = /\/garment\/([^?]+)/.exec(page.url())?.[1] ?? "";
    await importGarment(page, appUrl, uploadPath, thirdGarment);
    thirdGarmentId = /\/garment\/([^?]+)/.exec(page.url())?.[1] ?? "";
    await importGarment(page, appUrl, uploadPath, accessoryGarment);
    accessoryGarmentId = /\/garment\/([^?]+)/.exec(page.url())?.[1] ?? "";

    const outfitManualName = `Moonlight Commute ${token}`;
    const { outfitId } = await createOutfit(page, appUrl, {
      topName: firstGarment.name,
      bottomName: thirdGarment.name,
      outerwearName: secondGarment.name,
      accessoryName: accessoryGarment.name,
      topToken: "Nebula Shirt",
      bottomToken: "Nova Skirt",
      manualName: outfitManualName,
    });

    await page.locator('[data-testid="outfit-detail-display"]').waitFor();
    if ((await page.locator('[data-testid="outfit-detail-display"] > div').count()) < 4) {
      throw new Error("Outfit detail display did not render the full outfit collage");
    }

    await page.locator(`input[name="name"][value="${outfitManualName}"]`).waitFor();
    await page.goto(`${appUrl}/outfits`, { waitUntil: "networkidle" });
    await page.locator("article").filter({ hasText: outfitManualName }).first().waitFor();
    if ((await page.locator(`[data-testid="outfit-card-collage-${outfitId}"] > div`).count()) < 4) {
      throw new Error("Outfit list card did not render the collage tiles");
    }
    await expectRecommendedPlaceholder(page);

    await importGarmentBatch(page, appUrl, batchUploadPaths, batchImport);
    await page.goto(`${appUrl}/wardrobe`, { waitUntil: "networkidle" });
    await applySearch(page, batchImport.brand);
    const batchCards = await collectGarmentCards(page);
    batchGarmentIds = batchCards.map((card) => card.garmentId);
    batchGarmentNames = batchCards.map((card) => card.title);
    if (batchCards.length !== 2) {
      throw new Error(`Expected 2 batch-imported garments, received ${batchCards.length}`);
    }
    if (
      !batchGarmentNames.some((name) => name.includes("1")) ||
      !batchGarmentNames.some((name) => name.includes("2"))
    ) {
      throw new Error(`Batch import names were not sequential: ${batchGarmentNames.join(", ")}`);
    }

    await page.goto(`${appUrl}/wardrobe`, { waitUntil: "networkidle" });

    await applySearch(page, "Nebula Shirt");
    await page.getByText(firstGarment.name).waitFor();
    await assertWardrobeDoesNotShow(
      page,
      secondGarment.name,
      "Name search returned an unexpected second garment",
    );

    await applySearch(page, `Moon Brand ${token}`);
    await page.getByText(firstGarment.name).waitFor();

    await applySearch(page, `manual-note-${token}`);
    await page.getByText(firstGarment.name).waitFor();

    await page.goto(`${appUrl}/wardrobe`, { waitUntil: "networkidle" });
    await page.locator('select[name="sort"]').selectOption("name-asc");
    await applySearch(page, token);
    const firstCardAsc = (await page.locator("article h2").first().textContent())?.trim();
    if (firstCardAsc !== secondGarment.name) {
      throw new Error(`Unexpected first card for name-asc: ${firstCardAsc}`);
    }

    await page.locator('select[name="sort"]').selectOption("oldest");
    await applySearch(page, token);
    const firstCardOldest = (await page.locator("article h2").first().textContent())?.trim();
    if (firstCardOldest !== firstGarment.name) {
      throw new Error(`Unexpected first card for oldest sort: ${firstCardOldest}`);
    }

    if (loginMode !== "legacy-demo") {
      secondaryContext = await browser.newContext();
      secondaryPage = await secondaryContext.newPage();
      await loginWithIdentity(secondaryPage, appUrl, PRESET_IDENTITIES[1]);
      await secondaryPage.goto(`${appUrl}/wardrobe`, { waitUntil: "networkidle" });
      await assertWardrobeDoesNotShow(
        secondaryPage,
        firstGarment.name,
        "Primary identity garment leaked into the secondary identity wardrobe",
      );
      await assertWardrobeDoesNotShow(
        secondaryPage,
        secondGarment.name,
        "Second primary garment leaked into the secondary identity wardrobe",
      );
      await secondaryPage.goto(`${appUrl}/outfits`, { waitUntil: "networkidle" });
      await expectRecommendedPlaceholder(secondaryPage);
      await assertWardrobeDoesNotShow(
        secondaryPage,
        outfitManualName,
        "Primary identity outfit leaked into the secondary identity outfits list",
      );

      await importGarment(secondaryPage, appUrl, uploadPath, fourthGarment);
      fourthGarmentId = /\/garment\/([^?]+)/.exec(secondaryPage.url())?.[1] ?? "";
      await secondaryPage.goto(`${appUrl}/wardrobe`, { waitUntil: "networkidle" });
      await secondaryPage.getByText(fourthGarment.name).waitFor();

      await page.goto(`${appUrl}/wardrobe`, { waitUntil: "networkidle" });
      await applySearch(page, token);
      await page.getByText(firstGarment.name).waitFor();
      await assertWardrobeDoesNotShow(
        page,
        fourthGarment.name,
        "Secondary identity garment leaked into the primary identity wardrobe",
      );
      for (const batchGarmentName of batchGarmentNames) {
        await assertWardrobeDoesNotShow(
          secondaryPage,
          batchGarmentName,
          "Primary identity batch garment leaked into the secondary identity wardrobe",
        );
      }
    }

    await page.goto(`${appUrl}/outfits/${outfitId}`, { waitUntil: "networkidle" });
    await deleteCurrentOutfit(page);
    await assertWardrobeDoesNotShow(page, outfitManualName, "Deleted outfit is still visible in outfits list");
    await expectRecommendedPlaceholder(page);

    await deleteGarmentById(page, appUrl, firstGarmentId);

    await assertWardrobeDoesNotShow(page, firstGarment.name, "Deleted garment is still visible in wardrobe");

    await page.goto(`${appUrl}/garment/${firstGarmentId}`, { waitUntil: "networkidle" });
    if (await locatorExists(page.locator('[data-testid="garment-edit-form"]'))) {
      throw new Error("Deleted garment detail page is still editable");
    }

    console.log("BROWSER_SMOKE_OK");
  } finally {
    try {
      for (const batchGarmentId of batchGarmentIds) {
        await deleteGarmentById(page, appUrl, batchGarmentId);
      }
    } catch {}

    try {
      if (accessoryGarmentId) {
        await deleteGarmentById(page, appUrl, accessoryGarmentId);
      }
    } catch {}

    try {
      if (thirdGarmentId) {
        await deleteGarmentById(page, appUrl, thirdGarmentId);
      }
    } catch {}

    try {
      if (secondGarmentId) {
        await deleteGarmentById(page, appUrl, secondGarmentId);
      }
    } catch {}

    try {
      if (firstGarmentId) {
        await deleteGarmentById(page, appUrl, firstGarmentId);
      }
    } catch {}

    try {
      if (secondaryPage && fourthGarmentId) {
        await deleteGarmentById(secondaryPage, appUrl, fourthGarmentId);
      }
    } catch {}

    try {
      if (secondaryContext) {
        await secondaryContext.close();
      }
    } catch {}

    await primaryContext.close();
    await browser.close();
    try {
      fs.unlinkSync(uploadPath);
    } catch {}
    for (const batchUploadPath of batchUploadPaths) {
      try {
        fs.unlinkSync(batchUploadPath);
      } catch {}
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
