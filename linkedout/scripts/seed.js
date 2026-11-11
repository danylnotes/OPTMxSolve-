// Seed the local data file with fictional demo stories.
// Usage: npm run seed   (refuses to overwrite existing data unless --force)
import { existsSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Store } from '../lib/store.js';
import { validateStory } from '../lib/validate.js';

const file = process.env.DATA_FILE || join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'linkedout.json');
if (existsSync(file)) {
  if (!process.argv.includes('--force')) {
    console.error(`${file} exists. Re-run with --force to replace it.`);
    process.exit(1);
  }
  rmSync(file);
}

// All companies below are fictional.
const demo = [
  ['Globex Corporation', 'Product Manager', '1-3y', 2, ['broken_promises', 'no_growth'], 'Promised a promotion three review cycles in a row',
    'Every review cycle my manager told me the promotion was "basically done" and just needed sign-off from leadership. Three cycles later, the role was given to an external hire I then had to onboard.\n\nThe work itself was interesting, but the career ladder only existed on a slide.',
    'Ask to see the written promotion criteria and how many people were promoted last year.'],
  ['Globex Corporation', 'Support Engineer', '6m-1y', 1, ['burnout', 'toxic_management'], 'On-call every other week with no compensation',
    'The on-call rotation had four people for a 24/7 product. We were paged several times a night and still expected at standup at 9am. When I raised it, I was told "this is what startups are like" — at a 2,000 person company.',
    'Ask how many pages per week on-call gets and whether it is paid.'],
  ['Initech', 'Business Analyst', '3-5y', 2, ['micromanagement', 'culture'], 'Eight bosses, one stapler',
    'I reported to one manager on paper and at least four in practice. Each wanted the same status report in a different format. Any decision, no matter how small, needed three approvals.',
    ''],
  ['Initech', 'QA Analyst', '1-3y', 3, ['underpaid', 'no_growth'], 'Fine people, frozen salaries',
    'My team was genuinely nice. But there were no raises for two years while the cost of living kept climbing, and the only answer we got was "budget constraints". I left for a 30% bump.',
    'Negotiate hard on day one; it is the only raise you will get.'],
  ['Umbrella Logistics', 'Warehouse Lead', 'gt5y', 1, ['unethical', 'harassment'], 'Safety complaints went into a black hole',
    'We reported broken equipment repeatedly. Nothing was fixed until someone got hurt, and the people who complained loudest suddenly got the worst shifts. HR was clearly there to protect the company, not us.',
    'Document everything in writing and know your local labor board.'],
  ['Hooli Labs', 'Software Engineer', 'lt6m', 2, ['rto', 'broken_promises'], 'Hired as remote, ordered back in 4 months',
    'My offer letter said "remote". Four months in, a company-wide email told everyone to be in the office five days a week, 200km from where I live. No relocation, no exceptions.',
    'Get remote status explicitly in your contract, not just the job ad.'],
  ['Hooli Labs', 'Designer', '1-3y', 2, ['instability', 'culture'], 'Four reorgs in eighteen months',
    'Every quarter a new VP arrived, scrapped the roadmap, and reorganized the teams. We shipped almost nothing, and morale was rock bottom. Rumors of layoffs every Friday.',
    ''],
];

const store = new Store(file);
const DAY = 86_400_000;
demo.forEach(([company, role, tenure, rating, reasons, title, story, advice], i) => {
  const r = validateStory({ company, role, tenure, rating, reasons, title, story, advice, agree: true });
  if (!r.ok) throw new Error(`Bad seed #${i}: ${JSON.stringify(r.errors)}`);
  store.create(r.value, { now: Date.now() - (demo.length - i) * 9 * DAY });
});
console.log(`Seeded ${demo.length} demo stories into ${file}`);
