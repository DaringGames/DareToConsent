import { expect, test } from '@playwright/test';

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

async function uploadTinyAvatar(page, code) {
  const result = await page.evaluate(async roomCode => {
    const session = JSON.parse(localStorage.getItem('dtc.session') || '{}');
    const image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=';
    const res = await fetch('/api/avatar', {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body:JSON.stringify({ code:roomCode, playerId:session.playerId, image })
    });
    return res.json();
  }, code);
  expect(result.ok).toBeTruthy();
  expect(result.url).toContain('/avatar-cache/');
  await expect(page.locator('.profile-toggle .avatar img')).toHaveAttribute('src', /avatar-cache/);
}

async function joinRoom(page, code, name) {
  await page.goto(`/#${code}`);
  await page.locator('#choose-join').click();
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
  await uploadTinyAvatar(alice, code);
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

  await waitForTurnMode(alice);
  await alice.locator('[data-mode="dare"]').click();
  await expect(alice.locator('[data-select-dare]:not([disabled])').first()).toBeVisible();
  await alice.locator('[data-select-dare]:not([disabled])').first().click();
  await expect(alice.getByRole('heading', { name: 'Waiting for responses' })).toBeVisible();
  await expect(alice.getByText('Click a player to edit')).toHaveCount(0);

  await expect(casey.getByRole('button', { name: 'Send Now' })).toBeVisible();
  await casey.getByLabel('No thanks').check();

  await expect(bob.getByRole('button', { name: 'Send Now' })).toBeVisible();
  await bob.getByLabel('Yes please').check();
  await bob.getByRole('button', { name: 'Send Now' }).click();

  await expect(alice.locator('[data-choose-partner]').first()).toBeVisible();
  await alice.locator('[data-choose-partner]').first().click();

  await expect(alice.getByRole('button', { name: 'We did it' })).toBeVisible();
  await alice.getByRole('button', { name: 'We did it' }).click();
  await expect(alice.locator('#new-dare')).toBeVisible();
  await expect(alice.locator('.spice-rating').first()).toContainText('🌶️');
  await expect(alice.locator('#examples-prev')).toContainText('❄️');
  await expect(alice.locator('#examples-next')).toContainText('🌶️');
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
  await expect(alice.getByText('Click a player to edit')).toBeVisible();

  await aliceContext.close();
  await bobContext.close();
  await caseyContext.close();
});
