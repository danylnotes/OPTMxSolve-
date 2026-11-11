// Seed the local data file with fictional, free-form demo posts.
// Posts carry no tags: themes are derived by the analyzer (Claude if ANTHROPIC_API_KEY
// is set, otherwise the keyword heuristic).
// Usage: npm run seed   (refuses to overwrite existing data unless --force)
import { existsSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Store } from '../lib/store.js';
import { validateStory } from '../lib/validate.js';
import { createAnalyzer } from '../lib/analyzer.js';
import { hashPassword } from '../lib/auth.js';

const file = process.env.DATA_FILE || join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'linkedout.json');
if (existsSync(file)) {
  if (!process.argv.includes('--force')) {
    console.error(`${file} exists. Re-run with --force to replace it.`);
    process.exit(1);
  }
  rmSync(file);
}

// All companies and usernames below are fictional. [username, company, role, tenure, text, anonymous?]
const demo = [
  ['quietquitter', 'Globex Corporation', 'Product Manager', '1-3y',
    'Three review cycles in a row my manager told me the promotion was basically done and just needed sign-off. Then the role went to an external hire I had to onboard. The career ladder only exists on a slide, and I was promised a title change that never happened.'],
  ['night_pager', 'Globex Corporation', 'Support Engineer', '6m-1y',
    'On-call every other week with four people covering a 24/7 product. We were paged several times a night and still expected at standup at 9am. When I raised it I was told this is what startups are like, at a 2,000 person company. Total burnout in six months.'],
  ['numbers_blamed', 'Globex Corporation', 'Data Analyst', '1-3y',
    'My manager yelled at people in meetings and blamed the team whenever a number was off. I watched three good colleagues quit. Toxic is the only word for it.'],
  ['cover_sheet', 'Initech', 'Business Analyst', '3-5y',
    'I reported to one manager on paper and at least four in practice. Each wanted the same status report in a different format, and any decision needed three approvals. Micromanagement to the point that I stopped trying.'],
  ['frozen_pay', 'Initech', 'QA Analyst', '1-3y',
    'Lovely people, but no raises for two years while living costs kept climbing. The answer was always budget constraints. I left for a 30% bump. The salary freeze was the whole reason.'],
  ['stuck_senior', 'Initech', 'Developer', '3-5y',
    'There was nowhere to go. I was passed over for promotion twice, the career ladder stopped at senior, and my manager hovered over every ticket and wanted approval for everything.'],
  ['safety_first', 'Umbrella Logistics', 'Warehouse Lead', 'gt5y',
    'We reported broken safety equipment repeatedly. Nothing was fixed until someone got hurt, and the people who complained loudest got retaliated against with the worst shifts. HR was there to protect the company, not us. Illegal, honestly.'],
  ['overtime_ollie', 'Umbrella Logistics', 'Dispatcher', '1-3y',
    'Mandatory overtime, nights and weekends, and unpaid breaks. My boss screamed over the radio when anything slipped. I was exhausted all the time and underpaid for what they asked.'],
  ['remote_was_promised', 'Hooli Labs', 'Software Engineer', 'lt6m',
    'My offer letter said remote. Four months in, a company-wide email ordered everyone back to the office five days a week, 200km from where I live. No relocation, no exceptions. They promised flexibility and it never happened.'],
  ['reorg_survivor', 'Hooli Labs', 'Designer', '1-3y',
    'Four reorgs in eighteen months. Every quarter a new VP arrived, scrapped the roadmap and restructured the teams. Rumors of layoffs every Friday and morale at rock bottom.'],
  ['headcount_ghost', 'Hooli Labs', 'Engineering Manager', '3-5y',
    'Leadership promised us headcount and a roadmap, then another reorg and a hiring freeze wiped it out. Layoffs hit my team twice. Politics and cliques decided who survived.'],
];

const store = new Store(file);
const analyzer = createAnalyzer();
const DAY = 86_400_000;
const passHash = await hashPassword(`demo-${Math.random()}`); // demo accounts are not meant to be logged into
for (const [i, [username, company, role, tenure, story]] of demo.entries()) {
  const r = validateStory({ company, role, tenure, story, agree: true });
  if (!r.ok) throw new Error(`Bad seed #${i}: ${JSON.stringify(r.errors)}`);
  const user = store.createUser({ username, passHash });
  const s = store.create(r.value, { userId: user.id, anonymous: i === 6, now: Date.now() - (demo.length - i) * 5 * DAY });
  store.setAnalysis(s.id, await analyzer.analyze(r.value.story));
}
console.log(`Seeded ${demo.length} demo posts into ${file} (analysis: ${analyzer.backend})`);
