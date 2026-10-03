// Example: open the Pirates' blaster carbine and pick Sall as the target.
//   node scripts/ui/shot.mjs roller scripts/ui/example-steps.mjs --fixture playtest-2026-07-30
import { IDS, makeActive } from './lib.mjs';

export default async (page) => {
  await makeActive(page, IDS.pirates);
  await page.getByText('Blaster carbine').first().click();
  await page.getByRole('button', { name: 'Pick a target' }).click();
  await page.getByRole('menuitem', { name: 'Sall' }).click();
  await page.waitForTimeout(300);
};
