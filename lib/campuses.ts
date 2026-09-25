import type { CampusId } from './papers';

// Only campuses with a browsable archive belong here. Legacy IDs are not campuses.
// Shared by the existing selector, SEO routes, and sitemap to prevent drift.
export const campusOptions = [
  { id: 'islamabad', name: 'Islamabad', slug: 'islamabad', searchName: 'Islamabad' },
  { id: 'karachi', name: 'Karachi', slug: 'karachi', searchName: 'Karachi' },
  { id: 'lahore', name: 'Lahore', slug: 'lahore', searchName: 'Lahore' },
  { id: 'cfd', name: 'Chiniot–Faisalabad', slug: 'chiniot-faisalabad', searchName: 'Chiniot-Faisalabad (CFD)' },
] satisfies { id: CampusId; name: string; slug: string; searchName: string }[];

export type SupportedCampusId = (typeof campusOptions)[number]['id'];

export function getCampusBySlug(slug: string) {
  return campusOptions.find(campus => campus.slug === slug);
}
