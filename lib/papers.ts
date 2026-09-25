export type CampusId = 'islamabad' | 'karachi' | 'lahore' | 'cfd' | 'central';

export interface PaperFile {
  fileName: string;
  subPath?: string;
  title: string;
  path: string;
  downloadUrl: string;
  size: number;
  fileType: string;
  campus?: CampusId;
  category?: 'final' | 'sessional' | 'quiz' | 'assignment' | 'lab' | 'project' | 'outline' | 'book_notes' | 'additional';
  categoryLabel?: string;
  badge?: string;
  isSolution?: boolean;
  badgeColor?: string;
}

export interface CourseGroup {
  course: string;
  semesterLabel: string;
  semesterNum: number | 'outlines';
  fileCount: number;
  files: PaperFile[];
  campus: CampusId;
}

export interface CampusMetadata {
  id: string;
  name: string;
  shortName: string;
  totalFiles: number;
  semesters: Array<{
    semester: number;
    courses: Array<{ course: string; fileCount: number; files: PaperFile[] }>;
  }>;
  outlines?: Array<{
    group: string;
    courses: Array<{ course: string; fileCount: number; files: PaperFile[] }>;
  }>;
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function getCourseDescription(courseName: string): string {
  const lower = courseName.toLowerCase();
  if (lower.includes('lab')) {
    return 'Practical task sheets, lab manuals, viva questions, and terminal exams.';
  }
  if (lower.includes('calculus') || lower.includes('differential') || lower.includes('linear algebra') || lower.includes('probability')) {
    return 'Mathematical derivations, analytical problem sets, and past examination papers.';
  }
  if (lower.includes('physics')) {
    return 'Core physics concepts, problem sheets, midterms, and past final exam papers.';
  }
  if (lower.includes('programming') || lower.includes('pf') || lower.includes('oop') || lower.includes('data structure') || lower.includes('algo') || lower.includes('dsa')) {
    return 'Programming theory, algorithm analysis, code tracing, and past sessionals.';
  }
  if (lower.includes('database') || lower.includes('sql') || lower.includes('adc')) {
    return 'Database architecture, query design, normalization, sessionals, and final exams.';
  }
  if (lower.includes('operating') || lower.includes('os') || lower.includes('aos')) {
    return 'Process scheduling, concurrency, memory management, and past final exams.';
  }
  if (lower.includes('architecture') || lower.includes('coal') || lower.includes('dld') || lower.includes('digital logic') || lower.includes('assembly')) {
    return 'Logic circuits, processor architectures, instruction sets, and examination papers.';
  }
  if (lower.includes('network') || lower.includes('security') || lower.includes('ncys')) {
    return 'Protocols, packet analysis, cryptography, network configuration, and exam papers.';
  }
  if (lower.includes('ai') || lower.includes('intelligence') || lower.includes('learning') || lower.includes('retrieval')) {
    return 'Search algorithms, neural representations, perceptron models, and past exams.';
  }
  if (lower.includes('english') || lower.includes('communication') || lower.includes('writing')) {
    return 'Reading comprehension, presentation mechanics, and past semester exam papers.';
  }
  if (lower.includes('pakistan') || lower.includes('islamic') || lower.includes('civics') || lower.includes('professional') || lower.includes('marketing')) {
    return 'Course materials, study notes, midterms, and final exam papers.';
  }
  return 'Curated collection of midterm sessionals, quizzes, assignments, and past final papers.';
}
