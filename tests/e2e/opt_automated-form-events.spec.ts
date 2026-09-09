import { test, expect, Page } from '@playwright/test';
import {
  openAppRoot,
  openNewRecord,
  waitForD365Ready,
  isVisibleWithin,
} from '@helpers/d365';
import { createRecord, deleteRecord, queryRecords, generateTestName } from '@helpers/test-data';

/**
 * `opt_automated` is exposed only through the ADW Skill Test App — the environment's
 * default app (Sales Hub) has no navigation entry for it. openAppRoot() resolves the app
 * id from QA_APP_ID before falling back to project.config.json's appIds.default, so this
 * override must be set before each openAppRoot() call. See docs/okfs/e2e-testing/entities/
 * opt_automated/entity_context.md, Testing Notes.
 */
const APP_ID = '39e7b4c1-f49e-f111-aaad-0022480b1bfa';
const ENTITY_LOGICAL_NAME = 'opt_automated';
const ENTITY_SET = 'opt_automateds';
const ENTITY_DISPLAY_NAME = 'Automated';

// Form command bar's accessible name has not been confirmed as entity-specific (per
// entity_context.md Testing Notes), so Save is triggered via the stable data-id selector
// instead of clickCommand().
const SAVE_SELECTOR = '[data-id$="Mscrm.Form.opt_automated.Save"]';

// Native ApplicationRequired validation message for opt_newcolumn ("New column"),
// re-captured live from this environment's rendered banner (the previously recorded
// text, "New column is required before saving.", does not match anything D365 renders here).
const NATIVE_REQUIRED_MESSAGE = 'New column : Required fields must be filled in.';

const GUID_IN_URL = /[?&]id=([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
const NOTIFICATION_REGION = '[role="alert"], [role="status"], [aria-live="polite"], [aria-live="assertive"]';

test.beforeEach(async () => {
  process.env.QA_APP_ID = APP_ID;
});

async function openExistingRecordById(page: Page, id: string): Promise<void> {
  // Safe via page.goto for this entity: opt_automated is a standalone parent-style
  // entity, not a child/detail entity that requires Xrm.Navigation.openForm().
  await page.goto(
    `/main.aspx?appid=${APP_ID}&pagetype=entityrecord&etn=${ENTITY_LOGICAL_NAME}&id=${id}`,
    { waitUntil: 'domcontentloaded' },
  );
  await waitForD365Ready(page, 3000);
  await page.waitForFunction(
    (name: string) =>
      (globalThis as { Xrm?: { Page?: { data?: { entity?: { getEntityName?: () => string } } } } })
        .Xrm?.Page?.data?.entity?.getEntityName?.() === name,
    ENTITY_LOGICAL_NAME,
    { timeout: 20_000 },
  );
  await page.waitForTimeout(1500);
}

async function openGrid(page: Page): Promise<void> {
  await page.goto(`/main.aspx?appid=${APP_ID}&pagetype=entitylist&etn=${ENTITY_LOGICAL_NAME}`, {
    waitUntil: 'domcontentloaded',
  });
  await waitForD365Ready(page);
  // The grid ribbon (and its command-bar accessible name) renders after the shell
  // reports ready; clicking "New" immediately is a race that intermittently misses it.
  // Bumped from 2000ms, then from 4000ms after a run-1-form-1273bc14 execution still hit
  // "element to be visible, enabled and stable" timeouts on the New menuitem at 4000ms —
  // the grid's rows were still populating/reflowing the ribbon layout at that point.
  await page.waitForTimeout(8000);
}

/**
 * openNewRecord() clicks the grid's "New" ribbon command via an accessible-name
 * locator; on this environment the grid can still be reflowing rows (populating the
 * homepage grid) right after openGrid()'s settle wait, which intermittently leaves the
 * button resolved but not yet "stable" long enough for Playwright's click action to land
 * within the shared helper's fixed timeout. One retry with an extra settle window absorbs
 * that race without touching the shared click helper.
 */
async function openNewRecordWithRetry(
  page: Page,
  entityDisplayName: string,
  entityLogicalName: string,
): Promise<void> {
  try {
    await openNewRecord(page, entityDisplayName, entityLogicalName);
  } catch {
    await page.waitForTimeout(5000);
    await openNewRecord(page, entityDisplayName, entityLogicalName);
  }
}

/**
 * True when any rendered notification banner is visible, regardless of its text.
 *
 * Used only for the empty-`opt_name` cases (TC-03, TC-12), where no message text is ever
 * set by the script, so there is nothing for `assertNoFormNotification`'s text-match to
 * check against — absence has to be asserted against the notification region itself.
 */
async function anyNotificationVisible(page: Page, timeoutMs = 2_000): Promise<boolean> {
  return isVisibleWithin(page.locator(NOTIFICATION_REGION), timeoutMs);
}

/**
 * True once a matching notification is visible on screen.
 *
 * `page.getByText(message)` matches every element carrying this text, and this
 * environment renders it twice: an aria-live announcer node kept permanently
 * invisible for assistive tech, and the actual on-screen banner. The announcer
 * node consistently resolves first, so `.first()` (what the shared
 * `waitForFormNotification` helper uses) waits on a node that can never become
 * visible — no timeout budget fixes that; run-1-form-1273bc14 confirmed the
 * on-screen banner was already showing the exact expected text (screenshots,
 * test-failed-1.png) while that helper's wait still failed at 60s/90s. Polling
 * every match for the first one that is actually visible sidesteps the ordering.
 */
async function waitForVisibleNotification(
  page: Page,
  message: string,
  timeoutMs = 60_000,
): Promise<boolean> {
  const locator = page.getByText(message);
  const deadline = Date.now() + timeoutMs;
  do {
    const count = await locator.count();
    for (let i = 0; i < count; i++) {
      if (await locator.nth(i).isVisible().catch(() => false)) {
        return true;
      }
    }
    await page.waitForTimeout(250);
  } while (Date.now() < deadline);
  return false;
}

async function fillPrimaryName(page: Page, value: string): Promise<void> {
  const primaryInput = page.locator('input[data-id="opt_newcolumn.fieldControl-text-box-text"]');
  await primaryInput.click();
  await primaryInput.fill(value);
  await primaryInput.press('Tab');
}

test.describe('opt_automated_main_operations.js — Automated form', () => {
  // TC-01
  test('formOnLoad sets the record-name notification when opt_name is populated on an existing record', async ({
    page,
  }) => {
    // Default test timeout (120_000ms) leaves too little headroom above the 90_000ms
    // notification wait below plus setup/teardown; extended so a slow-but-correct
    // render doesn't get cut off by the outer test timeout instead.
    test.setTimeout(180_000);
    await openAppRoot(page);
    const recordName = generateTestName('OptAutomated RecordName');
    const id = await createRecord(page, ENTITY_SET, {
      opt_newcolumn: generateTestName('OptAutomated PrimaryName'),
      opt_name: recordName,
    });

    try {
      await openExistingRecordById(page, id);

      // formOnLoad sets the notification's text to opt_name's literal value
      // (per the deployed script), so matching on the value the record was
      // created with is the exact text the script sets — not an invented string.
      // Bumped from 60_000: a run-1-form-1273bc14 execution timed out here while the
      // banner still hadn't rendered, but the post-failure DOM snapshot showed the exact
      // expected text present moments later — the notification renders correctly, just
      // slower than the prior budget on this environment.
      expect(await waitForVisibleNotification(page, recordName, 90_000)).toBe(true);
    } finally {
      await deleteRecord(page, ENTITY_SET, id).catch(() => undefined);
    }
  });

  // TC-02
  test('formOnLoad sets no record-name notification on a blank create form', async ({ page }) => {
    await openAppRoot(page);
    await openGrid(page);
    await openNewRecordWithRetry(page, ENTITY_DISPLAY_NAME, ENTITY_LOGICAL_NAME);

    expect(await anyNotificationVisible(page, 3_000)).toBe(false);
  });

  // TC-04
  test('save with opt_newcolumn empty is blocked only by native required-field validation', async ({
    page,
  }) => {
    // See TC-01: the 35_000ms notification wait plus two save round-trips need more
    // than the default 120_000ms test timeout to avoid the outer timeout preempting it.
    test.setTimeout(180_000);
    await openAppRoot(page);
    await openGrid(page);
    await openNewRecordWithRetry(page, ENTITY_DISPLAY_NAME, ENTITY_LOGICAL_NAME);

    await page.locator(SAVE_SELECTOR).first().click();

    expect(await waitForVisibleNotification(page, NATIVE_REQUIRED_MESSAGE, 35_000)).toBe(true);
    expect(page.url()).not.toMatch(GUID_IN_URL);

    // Filling the required field and re-saving must succeed without any residual
    // custom blocking — proof formOnSave never read opt_newcolumn or called preventDefault().
    await fillPrimaryName(page, generateTestName('OptAutomated PrimaryName'));
    // Clicking Save immediately after the Tab-triggered client-side revalidation of
    // opt_newcolumn raced the save and was silently swallowed (form stayed on the
    // create screen, "Unsaved", field visibly populated with no error banner) — a
    // settle window before the second click, matching the pattern already used after
    // other field commits in this spec, gives that revalidation time to finish first.
    await page.waitForTimeout(1500);

    await page.locator(SAVE_SELECTOR).first().click();
    await page.waitForURL(GUID_IN_URL, { timeout: 25_000 });

    const match = page.url().match(GUID_IN_URL);
    if (match) {
      await deleteRecord(page, ENTITY_SET, match[1]).catch(() => undefined);
    }
  });

  // TC-06
  test('formOnSave does not clear or overwrite the record-name notification on save', async ({
    page,
  }) => {
    // See TC-01: two 90_000ms notification waits in this test need more than the
    // default 120_000ms test timeout to avoid the outer timeout preempting them.
    test.setTimeout(240_000);
    await openAppRoot(page);
    const recordName = generateTestName('OptAutomated RecordName');
    const id = await createRecord(page, ENTITY_SET, {
      opt_newcolumn: generateTestName('OptAutomated PrimaryName'),
      opt_name: recordName,
    });

    try {
      await openExistingRecordById(page, id);
      expect(await waitForVisibleNotification(page, recordName, 90_000)).toBe(true);

      const titleInput = page.locator('input[data-id="opt_title.fieldControl-text-box-text"]');
      await titleInput.click();
      await titleInput.fill(generateTestName('OptAutomated Title'));
      await titleInput.press('Tab');

      await page.locator(SAVE_SELECTOR).first().click();
      await waitForD365Ready(page, 3000);

      expect(await waitForVisibleNotification(page, recordName, 90_000)).toBe(true);
    } finally {
      await deleteRecord(page, ENTITY_SET, id).catch(() => undefined);
    }
  });

  // TC-11
  test('reopening a saved record recomputes the record-name notification fresh', async ({ page }) => {
    // See TC-01: two 90_000ms notification waits in this test need more than the
    // default 120_000ms test timeout to avoid the outer timeout preempting them.
    test.setTimeout(240_000);
    await openAppRoot(page);
    const recordName = generateTestName('OptAutomated RecordName');
    const id = await createRecord(page, ENTITY_SET, {
      opt_newcolumn: generateTestName('OptAutomated PrimaryName'),
      opt_name: recordName,
    });

    try {
      await openExistingRecordById(page, id);
      expect(await waitForVisibleNotification(page, recordName, 90_000)).toBe(true);

      await openGrid(page);
      await openExistingRecordById(page, id);

      expect(await waitForVisibleNotification(page, recordName, 90_000)).toBe(true);
    } finally {
      await deleteRecord(page, ENTITY_SET, id).catch(() => undefined);
    }
  });

  // TC-05
  test('Save completes normally on Automated form with the onsave handler registered', async ({
    page,
  }) => {
    await openAppRoot(page);
    await openGrid(page);
    await openNewRecordWithRetry(page, ENTITY_DISPLAY_NAME, ENTITY_LOGICAL_NAME);

    await fillPrimaryName(page, generateTestName('OptAutomated PrimaryName'));

    await page.locator(SAVE_SELECTOR).first().click();
    await page.waitForURL(GUID_IN_URL, { timeout: 25_000 });

    const match = page.url().match(GUID_IN_URL);
    expect(match).not.toBeNull();
    if (match) {
      await deleteRecord(page, ENTITY_SET, match[1]).catch(() => undefined);
    }
  });

  // TC-09
  test('a pre-existing record loads without a script error under the new formOnLoad handler', async ({
    page,
  }) => {
    // See TC-01: same 90_000ms notification wait needs more than the default
    // 120_000ms test timeout to avoid the outer timeout preempting it.
    test.setTimeout(180_000);
    await openAppRoot(page);

    const existing = await queryRecords(
      page,
      ENTITY_SET,
      'opt_name ne null',
      'opt_automatedid,opt_name',
      1,
    );

    let id: string;
    let recordName: string;
    let createdHere = false;
    if (existing.length > 0) {
      id = existing[0].opt_automatedid as string;
      recordName = existing[0].opt_name as string;
    } else {
      recordName = generateTestName('OptAutomated RecordName');
      id = await createRecord(page, ENTITY_SET, {
        opt_newcolumn: generateTestName('OptAutomated PrimaryName'),
        opt_name: recordName,
      });
      createdHere = true;
    }

    try {
      const pageErrors: Error[] = [];
      page.on('pageerror', (err) => pageErrors.push(err));

      await openExistingRecordById(page, id);

      expect(pageErrors).toEqual([]);
      expect(await waitForVisibleNotification(page, recordName, 90_000)).toBe(true);
    } finally {
      if (createdHere) {
        await deleteRecord(page, ENTITY_SET, id).catch(() => undefined);
      }
    }
  });

  // TC-08
  test('typing into opt_name does not set a live notification before load or save', async ({
    page,
  }) => {
    await openAppRoot(page);
    await openGrid(page);
    await openNewRecordWithRetry(page, ENTITY_DISPLAY_NAME, ENTITY_LOGICAL_NAME);

    expect(await anyNotificationVisible(page, 2_000)).toBe(false);

    const nameInput = page.locator('input[data-id="opt_name.fieldControl-text-box-text"]');
    await nameInput.click();
    await nameInput.fill(generateTestName('OptAutomated LiveType'));

    expect(await anyNotificationVisible(page, 1_000)).toBe(false);

    await nameInput.press('Tab');

    expect(await anyNotificationVisible(page, 1_500)).toBe(false);
  });
});
