import type { CareerEventDefinition } from './careerEventCatalog';

const modules = import.meta.glob('./data/career-events/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>;

const isEventDefinition = (value: unknown): value is CareerEventDefinition => {
  if (!value || typeof value !== 'object') return false;
  const event = value as Partial<CareerEventDefinition>;
  return typeof event.catalogId === 'string'
    && typeof event.category === 'string'
    && typeof event.kind === 'string'
    && typeof event.title === 'string'
    && typeof event.briefing === 'string'
    && Array.isArray(event.options)
    && event.options.length >= 2;
};

export const EXTERNAL_CAREER_EVENTS = Object.entries(modules)
  .sort(([left], [right]) => left.localeCompare(right))
  .flatMap(([, module]) => Array.isArray(module) ? module : [])
  .filter(isEventDefinition);
