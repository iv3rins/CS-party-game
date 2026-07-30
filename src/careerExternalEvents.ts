import type { CareerEventDefinition } from './careerEventTypes';
import { parseEventPack } from './careerEventSystem';

const modules = import.meta.glob('./data/career-events/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>;

const loaded = Object.entries(modules)
  .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
  .map(([path, module]) => ({ path, result: parseEventPack(module) }));

export const EXTERNAL_EVENT_ERRORS = loaded.flatMap(({ path, result }) => result.errors.map(error => `${path}: ${error}`));

if (EXTERNAL_EVENT_ERRORS.length) {
  throw new Error(`职业事件 JSON 校验失败：\n${EXTERNAL_EVENT_ERRORS.join('\n')}`);
}

export const EXTERNAL_CAREER_EVENTS: readonly CareerEventDefinition[] = loaded
  .flatMap(({ result }) => result.events)
  .sort((left, right) => left.catalogId < right.catalogId ? -1 : left.catalogId > right.catalogId ? 1 : 0);
