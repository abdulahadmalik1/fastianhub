import type { CampusMetadata, CourseGroup, PaperFile } from './papers';
import { isVisiblePaperFile } from './paper-visibility.mjs';

export const MAX_DASHBOARD_COURSES = 50;
export const materialTypes = {
  final: 'Finals', sessional: 'Mids / Sessionals', quiz: 'Quizzes',
  assignment: 'Assignments', lab: 'Labs & Tasks', project: 'Projects',
  outline: 'Outlines', book_notes: 'Notes & Books', additional: 'Other resources',
};
export type DashboardCourse = CourseGroup & { id: string; campusName: string };
export type DashboardMaterial = { id: string; course: DashboardCourse; file: PaperFile };

// Explicit aliases keep familiar abbreviations together without guessing at unrelated courses.
const subjectAliases: Record<string, string> = {
  pf: 'Programming Fundamentals', oop: 'Object Oriented Programming',
  dld: 'Digital Logic Design', db: 'Database Systems', os: 'Operating Systems',
  coal: 'Computer Organization and Assembly Language',
  'computer organization and assembly language': 'Computer Organization and Assembly Language',
  cnet: 'Computer Networks', ai: 'Artificial Intelligence',
  pdc: 'Parallel and Distributed Computing', cps: 'Communication and Presentation Skills',
  sda: 'Software Design and Analysis', tbw: 'Technical and Business Writing',
  nlp: 'Natural Language Processing', smd: 'Software for Mobile Devices',
  'design and analysis of algorithms': 'Design and Analysis of Algorithms',
  'analysis of algorithms': 'Design and Analysis of Algorithms',
};

export function dashboardSubject(name: string): { id: string; name: string } {
  const title = name.replace(/\([^)]*\)/g, '').replace(/&/g, 'and').replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
  const lab = /\blab$/i.test(title);
  const base = lab ? title.replace(/\s*lab$/i, '').trim() : title;
  const label = `${subjectAliases[base.toLowerCase()] || base}${lab ? ' Lab' : ''}`;
  return { id: `subject:${label.toLowerCase()}`, name: label };
}

export function groupDashboardCourses(courses: DashboardCourse[]) {
  const groups = new Map<string, { id: string; name: string; courses: DashboardCourse[] }>();
  for (const course of courses) {
    const subject = dashboardSubject(course.course);
    const group = groups.get(subject.id) || { ...subject, courses: [] };
    group.courses.push(course);
    groups.set(subject.id, group);
  }
  return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function buildDashboardCatalog(campuses: Record<string, CampusMetadata>): DashboardCourse[] {
  return ['islamabad', 'karachi', 'lahore', 'cfd'].flatMap(campusId => {
    const campus = campuses[campusId];
    if (!campus) return [];
    const groups = [
      ...campus.semesters.map(group => ({ label: `Semester ${group.semester}`, semester: group.semester as number | 'outlines', courses: group.courses })),
      ...(campus.outlines || []).map(group => ({ label: `Outlines · ${group.group}`, semester: 'outlines' as const, courses: group.courses, suffix: group.group })),
    ];
    return groups.flatMap(group => group.courses.flatMap(item => {
      const files = item.files.filter(isVisiblePaperFile);
      if (!files.length) return [];
      const course = 'suffix' in group ? `${item.course} (${group.suffix})` : item.course;
      return [{ id: JSON.stringify([campusId, group.semester, course]), course,
        campus: campusId as DashboardCourse['campus'], campusName: campus.shortName || campus.name,
        semesterNum: group.semester, semesterLabel: group.label, files, fileCount: files.length }];
    }));
  });
}

export function readCourseIds(value: unknown): string[] {
  return Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === 'string' && id.length <= 500))].slice(0, MAX_DASHBOARD_COURSES) : [];
}

// Apply only this editor's changes; retain additions made on another device.
export function applyCourseSelection(current: string[], original: string[], draft: string[]): string[] {
  const removed = new Set(original.filter(id => !draft.includes(id)));
  const added = draft.filter(id => !original.includes(id));
  const result = [...new Set([...current.filter(id => !removed.has(id)), ...added])];
  if (result.length > MAX_DASHBOARD_COURSES) throw new Error(`Choose up to ${MAX_DASHBOARD_COURSES} courses.`);
  return result;
}

export function collectMaterials(courses: DashboardCourse[]): DashboardMaterial[] {
  const seen = new Set<string>();
  return courses.flatMap(course => course.files.flatMap(file => {
    const id = `${course.id}:${file.path}`;
    if (seen.has(id)) return [];
    seen.add(id);
    return [{ id, course, file }];
  }));
}

export function filterMaterials(materials: DashboardMaterial[], filters: { course: string; type: string; query: string; solutions: boolean }): DashboardMaterial[] {
  const terms = filters.query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const seen = new Set<string>();
  return materials.filter(({ course, file }) =>
    (filters.course === 'all' || course.id === filters.course || dashboardSubject(course.course).id === filters.course) &&
    (filters.type === 'all' || (file.category || 'additional') === filters.type) &&
    (!filters.solutions || file.isSolution === true) &&
    terms.every(term => `${course.course} ${course.campusName} ${file.title} ${file.fileName} ${file.badge || ''}`.toLowerCase().includes(term)))
    .filter(({ course, file }) => {
      const source = `${course.campus}:${file.path}`;
      if (seen.has(source)) return false;
      seen.add(source);
      return true;
    });
}
