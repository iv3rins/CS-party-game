import type { CareerEventDefinition } from './careerEventTypes';
import { EXTERNAL_CAREER_EVENTS } from './careerExternalEvents';

export type { CareerEventDefinition, EventCategory } from './careerEventTypes';

export const ALL_CAREER_EVENTS: readonly CareerEventDefinition[] = [...EXTERNAL_CAREER_EVENTS]
  .sort((left,right)=>left.catalogId<right.catalogId?-1:left.catalogId>right.catalogId?1:0);

export const EVENT_CATALOG_SIZE = ALL_CAREER_EVENTS.filter(event=>event.catalogId.startsWith('core-')).length;
export const TOTAL_EVENT_COUNT = ALL_CAREER_EVENTS.length;
