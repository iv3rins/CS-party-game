import { writeFileSync } from 'node:fs';
import { CAREER_EVENT_CATALOG, DREAM_EVENT_CATALOG } from '../src/careerEventCatalog';

writeFileSync('src/data/career-events/core-catalog.json', JSON.stringify(CAREER_EVENT_CATALOG, null, 2) + '\n');
writeFileSync('src/data/career-events/dream-events.json', JSON.stringify(DREAM_EVENT_CATALOG, null, 2) + '\n');
console.log(`exported ${CAREER_EVENT_CATALOG.length} core and ${DREAM_EVENT_CATALOG.length} dream events`);
