import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildDashboardCatalog, collectMaterials, filterMaterials, readCourseIds, applyCourseSelection, groupDashboardCourses, dashboardSubject } from '../lib/dashboard-data.ts';

const paper = (path, category, isSolution = false) => ({ fileName: `${path}.pdf`, title: path, path: `${path}.pdf`, size: 12, fileType: 'pdf', category, isSolution });
const campus = (name, semesters) => ({ id: name, name, shortName: name, totalFiles: 10, semesters });
const courses = buildDashboardCatalog({
  islamabad: campus('Islamabad', [
    { semester: 2, courses: [{ course: 'Data Structures', files: [paper('DS Mid 2024', 'sessional', true), paper('DS Quiz', 'quiz'), paper('README', 'additional')] }] },
    { semester: 3, courses: [{ course: 'Data Structures', files: [paper('DS Mid 2024', 'sessional', true)] }] },
  ]),
  lahore: campus('Lahore', [{ semester: 2, courses: [{ course: 'Data Structures', files: [paper('DS Final', 'final')] }] }]),
});
assert.equal(courses.length, 3);
assert.equal(new Set(courses.map(course => course.id)).size, 3, 'Same title across campus or semester has a distinct identity');
const materials = collectMaterials(courses);
const base = { course: 'all', type: 'all', query: '', solutions: false };
assert.equal(filterMaterials(materials, base).length, 3, 'Deduplicate shared source files, excluding README files');
assert.equal(filterMaterials(materials, { ...base, course: courses[1].id }).length, 1, 'A shared file is available when filtering either owning course');
assert.equal(filterMaterials(materials, { ...base, type: 'sessional', query: '2024 Islamabad', solutions: true }).length, 1);
assert.equal(filterMaterials(materials, { ...base, type: 'quiz', solutions: true }).length, 0);
assert.equal(filterMaterials(materials, { ...base, course: courses[2].id, type: 'final' }).length, 1);
assert.equal(filterMaterials(materials, { ...base, course: courses[2].id, type: 'sessional' }).length, 0);
assert.deepEqual(readCourseIds(['a', 'a', 12, null, 'b']), ['a', 'b']);
assert.deepEqual(readCourseIds(null), []);
assert.deepEqual(applyCourseSelection(['A', 'B', 'remote-add'], ['A', 'B'], ['B', 'local-add']), ['B', 'remote-add', 'local-add']);
assert.deepEqual(applyCourseSelection(['A'], ['A', 'remote-removed'], ['A', 'remote-removed']), ['A'], 'An unchanged selection must not restore another device’s removal');
assert.deepEqual(applyCourseSelection(['A'], ['A'], []), [], 'Removing every course is supported');
assert.throws(() => applyCourseSelection(Array.from({ length: 50 }, (_, i) => String(i)), [], ['overflow']), /50/);
const real = buildDashboardCatalog(JSON.parse(readFileSync(new URL('../data/pastPapers.json', import.meta.url), 'utf8')).campuses);
assert.ok(real.length > 100);
assert.equal(new Set(real.map(course => course.id)).size, real.length, 'Real archive course IDs are unique');
for (const id of ['islamabad', 'karachi', 'lahore', 'cfd']) assert.ok(real.some(course => course.campus === id));
const pf = groupDashboardCourses(real).find(group => group.name === 'Programming Fundamentals');
assert.equal(new Set(pf.courses.map(course => course.campus)).size, 4, 'All campuses combines PF and Programming Fundamentals from all four campuses');
assert.notEqual(dashboardSubject('PF-Lab').id, dashboardSubject('PF').id, 'Labs are a separate choice');
assert.equal(dashboardSubject('PF-Lab').id, dashboardSubject('PF Lab').id, 'Lab spelling variants combine');
const pfResults = filterMaterials(collectMaterials(pf.courses), { ...base, course: pf.id });
assert.equal(new Set(pfResults.map(result => result.course.campus)).size, 4, 'Grouped course filter retains every selected campus');
const selected = real.filter(course => course.course.toLowerCase().includes('programming')).slice(0, 4);
assert.ok(filterMaterials(collectMaterials(selected), base).length > 0);
console.log(`PASS: dashboard identity, filtering, deduplication, limits, concurrent edits, and ${real.length} real courses.`);
