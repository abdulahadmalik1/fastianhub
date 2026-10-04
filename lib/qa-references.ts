// Primary references for the existing editorial answers. New answers should add
// their own verified references here when they make university policy claims.
const rules = { label: 'FAST-NUCES Undergraduate Academic Rules (2026 PDF)', url: 'https://nu.edu.pk/public/downloads/Academic_Rules_Handbook_2026.pdf' };
const handbook = { label: 'FAST-NUCES Student Handbook (2026 PDF)', url: 'https://nu.edu.pk/public/downloads/Student_Handbook_2026.pdf' };

export const qaReferences: Record<string, { label: string; url: string }[]> = {
  'fast-attendance-policy': [rules, handbook],
  'fast-gpa-recovery-after-mids': [rules, { label: 'FAST-NUCES academic grading', url: 'https://www.nu.edu.pk/Student/Grading' }, handbook],
  'fast-nuces-sessional-preparation': [rules, handbook],
  'fast-pf-logic-building': [rules],
  'fast-nuces-past-papers': [rules],
};
