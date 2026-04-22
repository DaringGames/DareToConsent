import { expect, test } from '@playwright/test';
const largeAvatarFixture = {
  name: 'large-selfie.svg',
  mimeType: 'image/svg+xml',
  buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="4200" height="2800"><rect width="4200" height="2800" fill="#223047"/><circle cx="2100" cy="1200" r="620" fill="#f6c39f"/><circle cx="1880" cy="1060" r="70" fill="#1f2937"/><circle cx="2320" cy="1060" r="70" fill="#1f2937"/><path d="M1760 1530 Q2100 1840 2440 1530" fill="none" stroke="#7f1d1d" stroke-width="80" stroke-linecap="round"/></svg>')
};

async function dismissAgeGate(page) {
  await expect(page.getByText('This game is intended for adults 18 years or older.')).toBeVisible();
  await page.getByRole('button', { name: 'I am 18+' }).click();
}

async function createRoom(page, name) {
  await page.goto('/');
  await expect(page.locator('#create-name')).toHaveCount(0);
  await page.locator('#choose-create').click();
  await expect(page.locator('#create-name')).toBeVisible();
  await page.locator('#create-name').fill(name);
  await page.locator('input[name="create-gender"][value="female"]').check();
  await page.locator('#create-language').selectOption('es');
  await expect(page.locator('#create-name')).toHaveValue(name);
  await expect(page.locator('input[name="create-gender"][value="female"]')).toBeChecked();
  await page.locator('#create-language').selectOption('en');
  await page.getByRole('button', { name: 'Create', exact: true }).click();
  await dismissAgeGate(page);
  await expect(page.getByRole('heading', { name: /Room:/ })).toBeVisible();
  const hash = new URL(page.url()).hash.slice(1);
  expect(hash).toMatch(/^[a-z]+-[a-z]+-[a-z]+$/);
  return hash;
}

async function uploadTinyAvatar(page) {
  await page.getByRole('button', { name: /Alice/ }).click();
  await page.locator('#selfie-input').setInputFiles(largeAvatarFixture);
  await expect(page.locator('.selfie-modal')).toBeVisible();
  const canvas = page.locator('.selfie-canvas');
  const box = await canvas.boundingBox();
  expect(box).toBeTruthy();
  const beforeDrag = Number(await page.locator('#selfie-x').inputValue());
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 36, box.y + box.height / 2 + 18);
  await page.mouse.up();
  const afterDrag = Number(await page.locator('#selfie-x').inputValue());
  expect(afterDrag).not.toBe(beforeDrag);
  const beforeWheel = Number(await page.locator('#selfie-zoom').inputValue());
  await canvas.hover();
  await page.mouse.wheel(0, -180);
  const afterWheel = Number(await page.locator('#selfie-zoom').inputValue());
  expect(afterWheel).toBeGreaterThan(beforeWheel);
  await page.locator('#selfie-zoom').evaluate(el => {
    el.value = '1.5';
    el.dispatchEvent(new Event('input', { bubbles:true }));
  });
  await page.locator('#selfie-x').evaluate(el => {
    el.value = '45';
    el.dispatchEvent(new Event('input', { bubbles:true }));
  });
  await page.getByRole('button', { name: 'Use Photo' }).click();
  await expect(page.locator('.profile-toggle .avatar img')).toHaveAttribute('src', /avatar-cache/);
}

async function joinRoom(page, code, name) {
  await page.goto(`/#${code}`);
  await expect(page.locator('#join-name')).toBeVisible();
  await page.locator('#join-name').fill(name);
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await dismissAgeGate(page);
  await expect(page.getByRole('heading', { name: /Room:/ })).toBeVisible();
}

async function completeOnboarding(page) {
  const next = page.locator('#onboard-next');
  await expect(next).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Dare #1:/ })).toBeVisible();
  await expect(page.getByText('You consent to this dare with:')).toBeVisible();
  for (let i = 0; i < 20; i++) {
    if (await next.count() === 0) return;
    await next.click();
    await page.waitForTimeout(150);
  }
  await expect(next).toHaveCount(0);
}

async function waitForTurnMode(page) {
  await expect(page.locator('[data-mode="dare"]')).toBeVisible();
  await expect(page.locator('[data-mode="player"]')).toBeVisible();
}

async function submitNewDareConsentIfShown(page) {
  const submit = page.locator('#submit-new-dare');
  try {
    await expect(submit).toBeVisible({ timeout: 3000 });
    await submit.click();
  } catch {}
}

test('three isolated browser sessions can play a consent-flow turn', async ({ browser }) => {
  const aliceContext = await browser.newContext({ locale: 'en-US' });
  const bobContext = await browser.newContext({ locale: 'en-US' });
  const caseyContext = await browser.newContext({ locale: 'en-US' });
  const alice = await aliceContext.newPage();
  const bob = await bobContext.newPage();
  const casey = await caseyContext.newPage();

  const code = await createRoom(alice, 'Alice');
  await uploadTinyAvatar(alice);
  await joinRoom(bob, code, 'Bob');
  await joinRoom(casey, code, 'Casey');

  await expect(alice.locator('.players').getByText('Alice')).toBeVisible();
  await expect(alice.locator('.players').getByText('Bob')).toBeVisible();
  await expect(alice.locator('.players').getByText('Casey')).toBeVisible();

  await alice.getByRole('button', { name: 'Start Game' }).click();
  await Promise.all([
    completeOnboarding(alice),
    completeOnboarding(bob),
    completeOnboarding(casey)
  ]);

  await bob.locator('[data-edit-player]').first().click();
  await expect(bob.locator('.edit-panel-header .avatar')).toBeVisible();
  await bob.locator('#back-edit').click();

  await waitForTurnMode(alice);
  await alice.locator('[data-mode="dare"]').click();
  await expect(alice.locator('[data-select-dare]:not([disabled])').first()).toBeVisible();
  await alice.locator('[data-select-dare]:not([disabled])').first().click();
  await expect(alice.getByRole('heading', { name: 'Waiting for responses' })).toBeVisible();
  await expect(alice.getByText('Click a player to edit')).toHaveCount(0);

  await expect(casey.getByRole('button', { name: 'Send Now' })).toBeVisible();
  await casey.getByLabel('No thanks').check();
  await expect(casey.getByRole('button', { name: 'Send Now' })).toBeVisible();

  await expect(bob.getByRole('button', { name: 'Send Now' })).toBeVisible();
  await bob.getByLabel('Yes please').check();
  await expect(bob.getByRole('button', { name: 'Send Now' })).toBeVisible();
  await bob.getByRole('button', { name: 'Send Now' }).click();

  await expect(alice.locator('[data-choose-partner]').first()).toBeVisible();
  await alice.locator('[data-choose-partner]').first().click();

  await expect(bob.getByRole('heading', { name: 'Time to do a dare with Alice' })).toBeVisible();
  await expect(bob.locator('.performing-dare')).toBeVisible();
  await expect(bob.getByRole('button', { name: 'We did it' })).toBeVisible();
  await expect(bob.getByRole('button', { name: 'Pass' })).toBeVisible();
  await bob.getByRole('button', { name: 'We did it' }).click();
  await expect(alice.locator('#new-dare')).toBeVisible();
  await expect(alice.locator('.spice-rating .spice-glyph-hot').first()).toBeVisible();
  await expect(alice.locator('#examples-prev .spice-glyph-cool')).toBeVisible();
  await expect(alice.locator('#examples-next .spice-glyph-hot')).toBeVisible();
  await expect(alice.locator('#examples-prev')).toContainText('milder');
  await expect(alice.locator('#examples-next')).toContainText('spicier');
  await alice.locator('#new-dare').fill('Share a favorite compliment');
  await alice.locator('#add-dare').click();
  await Promise.all([
    submitNewDareConsentIfShown(alice),
    submitNewDareConsentIfShown(bob),
    submitNewDareConsentIfShown(casey)
  ]);

  await waitForTurnMode(bob);
  await alice.locator('[data-edit-player]').first().click();
  await expect(alice.locator('.edit-instruction')).toContainText('What dares do you consent to for');
  await alice.goBack();
  await expect(alice.getByRole('heading', { name: 'Manage Player Consent' })).toBeVisible();

  await aliceContext.close();
  await bobContext.close();
  await caseyContext.close();
});
