const fs = require('fs');
const path = require('path');
const https = require('https');

const ISLAMABAD_REPO_TREE_URL = 'https://api.github.com/repos/malikhacks/fsc-past-papers/git/trees/main?recursive=1';
const ISLAMABAD_RAW_BASE = 'https://raw.githubusercontent.com/malikhacks/fsc-past-papers/main';

const KARACHI_REPO_TREE_URL = 'https://api.github.com/repos/malikhacks/PastPaper-FAST-NUCES/git/trees/main?recursive=1';
const KARACHI_RAW_BASE = 'https://raw.githubusercontent.com/malikhacks/PastPaper-FAST-NUCES/main';

const LAHORE_REPO_TREE_URL = 'https://api.github.com/repos/malikhacks/past-papers/git/trees/main?recursive=1';
const LAHORE_RAW_BASE = 'https://raw.githubusercontent.com/malikhacks/past-papers/main';

const CFD_REPO_TREE_URL = 'https://api.github.com/repos/malikhacks/FAST-NUCES-CFD/git/trees/master?recursive=1';
const CFD_RAW_BASE = 'https://raw.githubusercontent.com/malikhacks/FAST-NUCES-CFD/master';

function fetchWithRetry(url, retries = 3, delay = 1500) {
  return new Promise((resolve, reject) => {
    let finished = false;
    function attempt(n) {
      if (finished) return;
      console.log(`[buildPastPapers] Fetching tree (attempt ${4 - n}/3): ${url.split('/repos/')[1]}...`);
      const req = https.get(
        url,
        {
          headers: {
            'User-Agent': 'FastianHub-BuildScript',
            'Accept': 'application/vnd.github.v3+json'
          },
          timeout: 15000
        },
        (res) => {
          if (finished) return;
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            return https.get(res.headers.location, { headers: { 'User-Agent': 'FastianHub-BuildScript' } }, (res2) => {
              if (finished) return;
              let body = '';
              res2.on('data', chunk => body += chunk);
              res2.on('end', () => {
                finished = true;
                try { resolve(JSON.parse(body)); } catch (err) { retryOrReject(err, n); }
              });
            }).on('error', err => retryOrReject(err, n));
          }

          if (res.statusCode !== 200) {
            return retryOrReject(new Error(`GitHub API returned status ${res.statusCode}`), n);
          }

          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => {
            if (finished) return;
            try {
              const data = JSON.parse(body);
              finished = true;
              resolve(data);
            } catch (err) {
              retryOrReject(err, n);
            }
          });
        }
      );

      req.on('timeout', () => {
        req.destroy();
        retryOrReject(new Error('Request timeout'), n);
      });

      req.on('error', err => retryOrReject(err, n));
    }

    function retryOrReject(err, n) {
      if (finished) return;
      console.warn(`[buildPastPapers] Attempt failed: ${err.message}`);
      if (n > 1) {
        setTimeout(() => attempt(n - 1), delay);
      } else {
        finished = true;
        reject(err);
      }
    }

    attempt(retries);
  });
}

function encodePath(rawPath) {
  return rawPath
    .split('/')
    .map(encodeURIComponent)
    .join('/');
}

function getFileType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === '.pdf') return 'pdf';
  if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) return 'image';
  if (['.doc', '.docx'].includes(ext)) return 'doc';
  if (['.ppt', '.pptx', '.ppsx'].includes(ext)) return 'slide';
  if (['.zip', '.rar', '.7z', '.tar', '.gz'].includes(ext)) return 'archive';
  if (['.c', '.cpp', '.java', '.py', '.asm', '.html', '.css', '.js', '.ts'].includes(ext)) return 'code';
  if (ext === '.md' || ext === '.txt') return 'text';
  return 'file';
}

function cleanTitle(str) {
  return str.replace(/\.(pdf|docx?|pptx?|ppsx|jpe?g|png|webp|zip|rar|7z|txt|md|c|cpp|java|py|asm|html|json)$/i, '').trim();
}

/**
 * Robust, dynamic material classification so NO material is ever lost.
 * Classifies into: final, sessional, quiz, assignment, lab, project, outline, book_notes, additional
 */
function categorizeMaterial(fileName, fullPath) {
  const name = fileName.toLowerCase();
  const full = (fileName + ' ' + fullPath).toLowerCase();
  const ext = path.extname(fileName).toLowerCase();

  const isSolution = /solut|solved|_sol\b|\bsol\b|soution|\bkey\b/i.test(name);

  // 1. Lab check
  if (/\blab\b|\blabs\b/i.test(full)) {
    let specific = 'Lab Task';
    if (/final/i.test(name)) specific = 'Lab Final';
    else if (/mid/i.test(name)) specific = 'Lab Mid';
    else if (/manual/i.test(name)) specific = 'Lab Manual';
    return {
      category: 'lab',
      categoryLabel: 'Lab & Tasks',
      badge: specific,
      isSolution,
      badgeColor: 'teal'
    };
  }

  // 2. Project check
  if (/\bproject\b|\bprojects\b/i.test(full)) {
    return {
      category: 'project',
      categoryLabel: 'Project',
      badge: 'Project',
      isSolution,
      badgeColor: 'violet'
    };
  }

  // 3. Assignment / Homework
  if (/assign|homework|\bhw\b/i.test(full)) {
    const numMatch = name.match(/assign(?:ment)?\s*[-#]?\s*(\d+)/i) || name.match(/homework\s*[-#]?\s*(\d+)/i) || name.match(/\bhw\s*[-#]?\s*(\d+)/i);
    const specific = numMatch ? `Assignment ${numMatch[1]}` : 'Assignment';
    return {
      category: 'assignment',
      categoryLabel: 'Assignment',
      badge: specific,
      isSolution,
      badgeColor: 'emerald'
    };
  }

  // 4. Quiz / Test
  if (/quiz|one hour test|\btest\b/i.test(full)) {
    const qMatch = name.match(/quiz\s*(?:[-+#_])*\s*(i{1,3}|iv|v|\d+)/i);
    let specific = 'Quiz';
    if (qMatch) specific = `Quiz ${qMatch[1].toUpperCase()}`;
    else if (/one hour test/i.test(name)) specific = 'One Hour Test';
    return {
      category: 'quiz',
      categoryLabel: 'Quiz / Test',
      badge: specific,
      isSolution,
      badgeColor: 'amber'
    };
  }

  // 5. Final Exam
  if (/final|terminal/i.test(full)) {
    let specific = 'Final Exam';
    if (/retake/i.test(name)) specific = 'Final Retake';
    else if (/deficiency/i.test(name)) specific = 'Final Deficiency';
    return {
      category: 'final',
      categoryLabel: 'Final Exam',
      badge: specific,
      isSolution,
      badgeColor: 'indigo'
    };
  }

  // 6. Midterm / Sessional
  if (/mid|sessional|midterm|mt1|mt2|mt-1|mt-2|-m1-|-m2-|_m1_|_m2_/i.test(full)) {
    let specific = 'Mid / Sessional';
    if (/mid\s*#?\s*1|mid-?1|midterm\s*1|mt-?1|-m1-|_m1_/i.test(name)) specific = 'Mid 1';
    else if (/mid\s*#?\s*2|mid-?2|midterm\s*2|mt-?2|-m2-|_m2_/i.test(name)) specific = 'Mid 2';
    else if (/sessional\s*#?\s*1|sessional-?i\b/i.test(name)) specific = 'Sessional I';
    else if (/sessional\s*#?\s*2|sessional-?ii\b/i.test(name)) specific = 'Sessional II';
    return {
      category: 'sessional',
      categoryLabel: 'Mid / Sessional',
      badge: specific,
      isSolution,
      badgeColor: 'sky'
    };
  }

  // 7. Course Outline / Syllabus
  if (/outline|syllabus/i.test(full)) {
    return {
      category: 'outline',
      categoryLabel: 'Course Outline',
      badge: 'Course Outline',
      isSolution,
      badgeColor: 'slate'
    };
  }

  // 8. Books & Notes
  if (/note|book|slide|handout|lecture/i.test(full)) {
    let specific = 'Notes';
    if (/book/i.test(name)) specific = 'Book / Reference';
    else if (/slide|lecture/i.test(name)) specific = 'Lecture Slides';
    return {
      category: 'book_notes',
      categoryLabel: 'Books & Notes',
      badge: specific,
      isSolution,
      badgeColor: 'rose'
    };
  }

  // 9. Additional Material / Out of Box
  let specific = 'Additional Material';
  if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
    specific = 'Question / Paper Scan';
  } else if (/example|practice|sample/i.test(name)) {
    specific = 'Practice Questions';
  } else if (/past\s*paper/i.test(name)) {
    specific = 'Past Paper';
  } else if (['.c', '.cpp', '.java', '.py', '.asm'].includes(ext)) {
    specific = 'Source Code / Solution';
  } else {
    specific = 'Study Resource';
  }

  return {
    category: 'additional',
    categoryLabel: 'Additional Material',
    badge: specific,
    isSolution,
    badgeColor: 'gray'
  };
}

const KARACHI_COURSE_METADATA = {
  'Programming Fundamentals': { semester: 1, cleanName: 'Programming Fundamentals' },
  'Object Oriented Porgamming': { semester: 2, cleanName: 'Object Oriented Programming' },
  'Digital Logic Design': { semester: 2, cleanName: 'Digital Logic Design' },
  'Differential Equations': { semester: 2, cleanName: 'Differential Equations' },
  'Computer Organization and Assembly Language (COAL)': { semester: 3, cleanName: 'Computer Organization & Assembly Language (COAL)' },
  'Database Systems': { semester: 4, cleanName: 'Database Systems' },
  'Operating Systems': { semester: 4, cleanName: 'Operating Systems' },
  'NUMERICAL COMPUTING': { semester: 4, cleanName: 'Numerical Computing' },
  'Probability & Statistics': { semester: 4, cleanName: 'Probability & Statistics' },
  'Alanysis of Algorithms': { semester: 5, cleanName: 'Analysis of Algorithms' },
  'Theory of Automata': { semester: 5, cleanName: 'Theory of Automata' },
  'Software Engineering': { semester: 5, cleanName: 'Software Engineering' },
  'Computer Networks': { semester: 6, cleanName: 'Computer Networks' },
  'Artificial Intelligence': { semester: 6, cleanName: 'Artificial Intelligence' },
  'Parallel and Distributed Computing': { semester: 6, cleanName: 'Parallel & Distributed Computing' },
  'Technical and Business Writing': { semester: 6, cleanName: 'Technical & Business Writing' },
  'Information Security': { semester: 7, cleanName: 'Information Security' },
  'Deep Learning with Perception': { semester: 7, cleanName: 'Deep Learning with Perception' },
  'Information Retrieval': { semester: 7, cleanName: 'Information Retrieval' },
  'Ncys': { semester: 7, cleanName: 'Network & Cyber Security' },
  'Professional Practices in IT': { semester: 8, cleanName: 'Professional Practices in IT' },
  'ECC': { semester: 8, cleanName: 'Enterprise Connected Computing (ECC)' }
};

const CFD_COURSE_METADATA = {
  '1. PF_(Programming Fundamental)_': { semester: 1, cleanName: 'Programming Fundamentals (PF)' },
  'Applied Physics': { semester: 1, cleanName: 'Applied Physics' },
  'DLD': { semester: 1, cleanName: 'Digital Logic Design (DLD)' },
  'ICT Lab': { semester: 1, cleanName: 'Information & Communication Tech (ICT) Lab' },
  'Islamic Studies': { semester: 1, cleanName: 'Islamic Studies' },
  'Pak-studies': { semester: 1, cleanName: 'Pakistan Studies' },
  'OOP Course': { semester: 2, cleanName: 'Object Oriented Programming (OOP)' },
  'Data Structures': { semester: 3, cleanName: 'Data Structures (DSA)' },
  'Differential': { semester: 3, cleanName: 'Differential Equations' },
  'Marketing Management': { semester: 3, cleanName: 'Marketing Management' },
  'Database Systems': { semester: 4, cleanName: 'Database Systems' },
  'Operating Systems': { semester: 4, cleanName: 'Operating Systems' },
  'SDA -Software Design & Analysis': { semester: 5, cleanName: 'Software Design & Analysis (SDA)' }
};

const LAHORE_COURSE_SEMESTER_MAP = {
  'pf': 1, 'pf lab': 1, 'programming fundamentals': 1, 'applied physics': 1, 'calculus': 1,
  'english comprehension and composition': 1, 'english comprehension lab': 1, 'iict': 1, 'islamic studies': 1,
  'oop': 2, 'oop lab': 2, 'dld': 2, 'dld lab': 2, 'cps': 2, 'cps lab': 2, 'expository writing': 2, 'expository writing lab': 2,
  'pakistan studies': 2, 'civics and community engagement': 2, 'discrete structures': 2,
  'data structures': 3, 'data structures lab': 3, 'coal': 3, 'coal lab': 3, 'linear algebra': 3,
  'fundamentals of software engineering': 3, 'differential equations (cal-ii)': 3, 'mvc (calculus-iii)': 3,
  'db': 4, 'db lab': 4, 'os': 4, 'os lab': 4, 'probability': 4, 'numerical computing': 4,
  'design and analysis of algorithms': 4,
  'theory of automata': 5, 'computer networks': 5, 'computer networks lab': 5, 'software design and architecture': 5,
  'software design and analysis': 5, 'sda lab': 5, 'scd': 5, 'scd lab': 5, 'technical & business writing': 5,
  'computer architecture': 5, 'web programming': 5, 'web engineering': 5, 'web engineering lab': 5,
  'artificial intelligence': 6, 'artificial intelligence lab': 6, 'parallel and distributed computing': 6,
  'software quality engineering': 6, 'sqe': 6, 'sqa': 6, 'software testing': 6, 'compiler construction': 6,
  'is': 6, 'ns': 6, 'cyber security tools and technologies': 6,
  'data science': 7, 'intro to data science': 7, 'data analysis and vizualization': 7, 'deep learning': 7,
  'applied machine learning': 7, 'computer vision': 7, 'digital image processing': 7, 'cloud computing': 7,
  'dw': 7, 'data warehousing and data mining': 7, 'nlp': 7, 'ir': 7, 'smd': 7, 'software for mobile devices': 7,
  'pp': 8, 'entrepreneurship': 8, 'big data': 8, 'generative ai': 8, 'quantum computing': 8, 'spm': 8,
  'accounting and finance': 8
};

function getLahoreCourseSemester(c) {
  const lower = c.toLowerCase().trim();
  if (LAHORE_COURSE_SEMESTER_MAP[lower]) return LAHORE_COURSE_SEMESTER_MAP[lower];
  if (lower.includes('lab')) {
    const base = lower.replace(/\s*lab\b/i, '').trim();
    if (LAHORE_COURSE_SEMESTER_MAP[base]) return LAHORE_COURSE_SEMESTER_MAP[base];
  }
  if (lower.includes('advanced')) return 7;
  if (lower.includes('history') || lower.includes('policy') || lower.includes('relations') || lower.includes('management') || lower.includes('marketing') || lower.includes('behavior') || lower.includes('leadership') || lower.includes('psychology') || lower.includes('sociology') || lower.includes('critical')) return 8;
  return 7;
}

function parseIslamabadTree(tree) {
  const semesters = {};
  for (let i = 1; i <= 8; i++) {
    semesters[i] = { semester: i, courses: {} };
  }

  const outlines = {};
  let totalFilesIndexed = 0;

  for (const item of tree) {
    if (item.type !== 'blob') continue;
    const itemPath = item.path;
    if (!itemPath.includes('/')) continue;

    if (itemPath.startsWith('semester-')) {
      const parts = itemPath.split('/');
      const semMatch = parts[0].match(/^semester-(\d+)$/i);
      if (!semMatch) continue;
      const semNum = parseInt(semMatch[1], 10);
      if (semNum < 1 || semNum > 8) continue;

      if (parts.length < 3) {
        const fileName = parts[1];
        if (fileName.toLowerCase() === 'readme.md' || fileName === '.gitkeep') continue;
        const course = 'General / Miscellaneous';
        if (!semesters[semNum].courses[course]) semesters[semNum].courses[course] = [];
        const cat = categorizeMaterial(fileName, itemPath);
        semesters[semNum].courses[course].push({
          fileName,
          title: cleanTitle(fileName),
          path: itemPath,
          downloadUrl: `${ISLAMABAD_RAW_BASE}/${encodePath(itemPath)}`,
          size: item.size || 0,
          fileType: getFileType(fileName),
          campus: 'islamabad',
          ...cat
        });
        totalFilesIndexed++;
      } else {
        const course = parts[1].trim();
        const baseName = parts[parts.length - 1];

        if (baseName.toLowerCase().startsWith('readme') || baseName.toLowerCase().endsWith('.md') || baseName === '.gitkeep') {
          continue;
        }

        if (!semesters[semNum].courses[course]) {
          semesters[semNum].courses[course] = [];
        }

        const cat = categorizeMaterial(baseName, itemPath);
        semesters[semNum].courses[course].push({
          fileName: baseName,
          subPath: parts.slice(2, -1).join('/'),
          title: cleanTitle(baseName),
          path: itemPath,
          downloadUrl: `${ISLAMABAD_RAW_BASE}/${encodePath(itemPath)}`,
          size: item.size || 0,
          fileType: getFileType(baseName),
          campus: 'islamabad',
          ...cat
        });
        totalFilesIndexed++;
      }
    } else if (itemPath.startsWith('Course Outlines/')) {
      const parts = itemPath.split('/');
      if (parts.length < 3) continue;

      let group = parts[1];
      let course = parts[2];
      let fileName = parts.slice(3).join('/') || parts[2];

      if (parts.length === 3) {
        group = 'General';
        course = parts[1];
        fileName = parts[2];
      } else {
        fileName = parts[parts.length - 1];
      }

      if (fileName.toLowerCase().startsWith('readme') || fileName.toLowerCase().endsWith('.md') || fileName === '.gitkeep') {
        continue;
      }

      if (!outlines[group]) outlines[group] = {};
      if (!outlines[group][course]) outlines[group][course] = [];

      const cat = categorizeMaterial(fileName, itemPath);
      outlines[group][course].push({
        fileName,
        title: cleanTitle(fileName),
        path: itemPath,
        downloadUrl: `${ISLAMABAD_RAW_BASE}/${encodePath(itemPath)}`,
        size: item.size || 0,
        fileType: getFileType(fileName),
        campus: 'islamabad',
        ...cat
      });
      totalFilesIndexed++;
    }
  }

  const formattedSemesters = Object.keys(semesters).map(semNum => {
    const sem = semesters[semNum];
    const coursesList = Object.keys(sem.courses)
      .sort((a, b) => a.localeCompare(b))
      .map(courseName => {
        const files = sem.courses[courseName].sort((a, b) => a.fileName.localeCompare(b.fileName));
        return {
          course: courseName,
          fileCount: files.length,
          files
        };
      });

    return {
      semester: parseInt(semNum, 10),
      totalCourses: coursesList.length,
      totalFiles: coursesList.reduce((acc, c) => acc + c.fileCount, 0),
      courses: coursesList
    };
  });

  const formattedOutlines = Object.keys(outlines).map(groupName => {
    const group = outlines[groupName];
    const coursesList = Object.keys(group)
      .sort((a, b) => a.localeCompare(b))
      .map(courseName => {
        const files = group[courseName].sort((a, b) => a.fileName.localeCompare(b.fileName));
        return {
          course: courseName,
          fileCount: files.length,
          files
        };
      });

    return {
      group: groupName,
      totalCourses: coursesList.length,
      totalFiles: coursesList.reduce((acc, c) => acc + c.fileCount, 0),
      courses: coursesList
    };
  });

  return {
    id: 'islamabad',
    name: 'FAST Islamabad',
    shortName: 'Islamabad',
    repo: 'malikhacks/fsc-past-papers',
    rawBase: ISLAMABAD_RAW_BASE,
    totalFiles: totalFilesIndexed,
    semesters: formattedSemesters,
    outlines: formattedOutlines
  };
}

function parseKarachiTree(tree) {
  const semesters = {};
  for (let i = 1; i <= 8; i++) {
    semesters[i] = { semester: i, courses: {} };
  }

  let totalFilesIndexed = 0;

  for (const item of tree) {
    if (item.type !== 'blob') continue;
    const itemPath = item.path;
    if (!itemPath.includes('/')) continue;

    const parts = itemPath.split('/');
    const rawCourseName = parts[0].trim();
    const baseName = parts[parts.length - 1];

    if (baseName.toLowerCase().startsWith('readme') || baseName.toLowerCase().endsWith('.md') || baseName === '.gitkeep') {
      continue;
    }

    const meta = KARACHI_COURSE_METADATA[rawCourseName] || { semester: 1, cleanName: rawCourseName };
    const semNum = meta.semester || 1;
    const displayName = meta.cleanName || rawCourseName;

    if (!semesters[semNum].courses[displayName]) {
      semesters[semNum].courses[displayName] = [];
    }

    const cat = categorizeMaterial(baseName, itemPath);
    semesters[semNum].courses[displayName].push({
      fileName: baseName,
      title: cleanTitle(baseName),
      path: itemPath,
      downloadUrl: `${KARACHI_RAW_BASE}/${encodePath(itemPath)}`,
      size: item.size || 0,
      fileType: getFileType(baseName),
      campus: 'karachi',
      ...cat
    });
    totalFilesIndexed++;
  }

  const formattedSemesters = Object.keys(semesters).map(semNum => {
    const sem = semesters[semNum];
    const coursesList = Object.keys(sem.courses)
      .sort((a, b) => a.localeCompare(b))
      .map(courseName => {
        const files = sem.courses[courseName].sort((a, b) => a.fileName.localeCompare(b.fileName));
        return {
          course: courseName,
          fileCount: files.length,
          files
        };
      });

    return {
      semester: parseInt(semNum, 10),
      totalCourses: coursesList.length,
      totalFiles: coursesList.reduce((acc, c) => acc + c.fileCount, 0),
      courses: coursesList
    };
  });

  return {
    id: 'karachi',
    name: 'FAST Karachi',
    shortName: 'Karachi',
    repo: 'malikhacks/PastPaper-FAST-NUCES',
    rawBase: KARACHI_RAW_BASE,
    totalFiles: totalFilesIndexed,
    semesters: formattedSemesters,
    outlines: []
  };
}

function parseLahoreTree(tree) {
  const semesters = {};
  for (let i = 1; i <= 8; i++) {
    semesters[i] = { semester: i, courses: {} };
  }

  const outlines = {};
  let totalFilesIndexed = 0;

  for (const item of tree) {
    if (item.type !== 'blob') continue;
    const itemPath = item.path;
    if (itemPath === 'README.md' || !itemPath.includes('/')) continue;

    const parts = itemPath.split('/');
    const rootFolder = parts[0];

    // Completely omit Books & Notes per user requirement to keep course list clean
    if (rootFolder.startsWith('---- Books & Notes ----')) {
      continue;
    }

    // Case 1: Course Outlines
    if (rootFolder === '---- Course Outlines ----') {
      const course = parts[1] || 'General';
      const baseName = parts[parts.length - 1];
      if (baseName.toLowerCase() === 'readme.md' || baseName === '.gitkeep') continue;

      if (!outlines['General']) outlines['General'] = {};
      if (!outlines['General'][course]) outlines['General'][course] = [];

      const cat = categorizeMaterial(baseName, itemPath);
      outlines['General'][course].push({
        fileName: baseName,
        title: cleanTitle(baseName),
        path: itemPath,
        downloadUrl: `${LAHORE_RAW_BASE}/${encodePath(itemPath)}`,
        size: item.size || 0,
        fileType: getFileType(baseName),
        campus: 'lahore',
        ...cat
      });
      totalFilesIndexed++;
    }
    // Case 2: Pure Course Folders (122 courses)
    else {
      const rawCourse = rootFolder;
      const semNum = getLahoreCourseSemester(rawCourse);
      const course = rawCourse;
      const baseName = parts[parts.length - 1];
      if (baseName.toLowerCase() === 'readme.md' || baseName === '.gitkeep') continue;

      if (!semesters[semNum].courses[course]) {
        semesters[semNum].courses[course] = [];
      }

      const cat = categorizeMaterial(baseName, itemPath);
      semesters[semNum].courses[course].push({
        fileName: baseName,
        subPath: parts.slice(1, -1).join('/'),
        title: cleanTitle(baseName),
        path: itemPath,
        downloadUrl: `${LAHORE_RAW_BASE}/${encodePath(itemPath)}`,
        size: item.size || 0,
        fileType: getFileType(baseName),
        campus: 'lahore',
        ...cat
      });
      totalFilesIndexed++;
    }
  }

  const formattedSemesters = Object.keys(semesters).map(semNum => {
    const sem = semesters[semNum];
    const coursesList = Object.keys(sem.courses)
      .sort((a, b) => a.localeCompare(b))
      .map(courseName => {
        const files = sem.courses[courseName].sort((a, b) => a.fileName.localeCompare(b.fileName));
        return {
          course: courseName,
          fileCount: files.length,
          files
        };
      });

    return {
      semester: parseInt(semNum, 10),
      totalCourses: coursesList.length,
      totalFiles: coursesList.reduce((acc, c) => acc + c.fileCount, 0),
      courses: coursesList
    };
  });

  const formattedOutlines = Object.keys(outlines).map(groupName => {
    const group = outlines[groupName];
    const coursesList = Object.keys(group)
      .sort((a, b) => a.localeCompare(b))
      .map(courseName => {
        const files = group[courseName].sort((a, b) => a.fileName.localeCompare(b.fileName));
        return {
          course: courseName,
          fileCount: files.length,
          files
        };
      });

    return {
      group: groupName,
      totalCourses: coursesList.length,
      totalFiles: coursesList.reduce((acc, c) => acc + c.fileCount, 0),
      courses: coursesList
    };
  });

  return {
    id: 'lahore',
    name: 'FAST Lahore',
    shortName: 'Lahore',
    repo: 'malikhacks/past-papers',
    rawBase: LAHORE_RAW_BASE,
    totalFiles: totalFilesIndexed,
    semesters: formattedSemesters,
    outlines: formattedOutlines
  };
}

function parseCfdTree(tree) {
  const semesters = {};
  for (let i = 1; i <= 8; i++) {
    semesters[i] = { semester: i, courses: {} };
  }

  const junkExts = new Set([
    '.vsidx', '.lock', '.db', '.tlog', '.ilk', '.obj', '.idb', '.pdb',
    '.ipch', '.lastbuildstate', '.recipe', '.suo', '.user', '.log',
    '.cache', '.resources', '.enc', '.exe', '.csproj'
  ]);

  let totalFilesIndexed = 0;

  for (const item of tree) {
    if (item.type !== 'blob') continue;
    const itemPath = item.path;

    if (itemPath.startsWith('.') || itemPath.toLowerCase().endsWith('readme.md')) continue;
    if (
      itemPath.includes('/.vs/') ||
      itemPath.includes('\\.vs\\') ||
      itemPath.includes('/bin/') ||
      itemPath.includes('/obj/') ||
      itemPath.includes('Assig_ Code Fall_22') ||
      itemPath.includes('RegistrationFormApp')
    ) {
      continue;
    }

    const ext = path.extname(itemPath).toLowerCase();
    if (!ext || junkExts.has(ext)) continue;

    const parts = itemPath.split('/');
    if (parts.length < 2) continue;

    const semMatch = parts[0].match(/(\d+)/);
    const semNum = semMatch ? parseInt(semMatch[1], 10) : 1;
    const rawCourseName = parts[1].trim();
    const baseName = parts[parts.length - 1];

    const meta = CFD_COURSE_METADATA[rawCourseName] || { cleanName: rawCourseName };
    const displayName = meta.cleanName || rawCourseName;

    if (!semesters[semNum].courses[displayName]) {
      semesters[semNum].courses[displayName] = [];
    }

    const cat = categorizeMaterial(baseName, itemPath);
    semesters[semNum].courses[displayName].push({
      fileName: baseName,
      subPath: parts.slice(1, -1).join('/'),
      title: cleanTitle(baseName),
      path: itemPath,
      downloadUrl: `${CFD_RAW_BASE}/${encodePath(itemPath)}`,
      size: item.size || 0,
      fileType: getFileType(baseName),
      campus: 'cfd',
      ...cat
    });
    totalFilesIndexed++;
  }

  const formattedSemesters = Object.keys(semesters).map(semNum => {
    const sem = semesters[semNum];
    const coursesList = Object.keys(sem.courses)
      .sort((a, b) => a.localeCompare(b))
      .map(courseName => {
        const files = sem.courses[courseName].sort((a, b) => a.fileName.localeCompare(b.fileName));
        return {
          course: courseName,
          fileCount: files.length,
          files
        };
      });

    return {
      semester: parseInt(semNum, 10),
      totalCourses: coursesList.length,
      totalFiles: coursesList.reduce((acc, c) => acc + c.fileCount, 0),
      courses: coursesList
    };
  });

  return {
    id: 'cfd',
    name: 'FAST CFD',
    shortName: 'CFD',
    repo: 'malikhacks/FAST-NUCES-CFD',
    rawBase: CFD_RAW_BASE,
    totalFiles: totalFilesIndexed,
    semesters: formattedSemesters,
    outlines: []
  };
}

async function main() {
  console.log('[buildPastPapers] Starting 4-campus past papers build (Islamabad, Karachi, Lahore, CFD)...');
  let islamabadTree = null;
  let karachiTree = null;
  let lahoreTree = null;
  let cfdTree = null;

  // 1. Fetch Islamabad
  try {
    const isbData = await fetchWithRetry(ISLAMABAD_REPO_TREE_URL, 2, 1000);
    if (isbData && Array.isArray(isbData.tree)) {
      islamabadTree = isbData.tree;
      console.log(`[buildPastPapers] Received ${islamabadTree.length} items for Islamabad.`);
    }
  } catch (err) {
    console.warn('[buildPastPapers] Warning: Could not fetch live Islamabad tree:', err.message);
  }

  // 2. Fetch Karachi
  try {
    const khiData = await fetchWithRetry(KARACHI_REPO_TREE_URL, 2, 1000);
    if (khiData && Array.isArray(khiData.tree)) {
      karachiTree = khiData.tree;
      console.log(`[buildPastPapers] Received ${karachiTree.length} items for Karachi.`);
    }
  } catch (err) {
    console.warn('[buildPastPapers] Warning: Could not fetch live Karachi tree:', err.message);
  }

  // 3. Lahore Campus (check local cache first if available, else fetch)
  const cachedLahorePath = path.join(__dirname, 'cache_lahore_tree.json');
  const cachedCentralPath = path.join(__dirname, 'cache_central_tree.json');
  const cachePathToUse = fs.existsSync(cachedLahorePath) ? cachedLahorePath : (fs.existsSync(cachedCentralPath) ? cachedCentralPath : null);

  if (cachePathToUse) {
    console.log(`[buildPastPapers] Using cached ${path.basename(cachePathToUse)}...`);
    lahoreTree = JSON.parse(fs.readFileSync(cachePathToUse, 'utf8'));
  } else {
    try {
      const lahoreData = await fetchWithRetry(LAHORE_REPO_TREE_URL, 3, 2000);
      if (lahoreData && Array.isArray(lahoreData.tree)) {
        lahoreTree = lahoreData.tree;
        fs.writeFileSync(cachedLahorePath, JSON.stringify(lahoreTree), 'utf8');
        console.log(`[buildPastPapers] Received ${lahoreTree.length} items for Lahore Campus.`);
      }
    } catch (err) {
      console.warn('[buildPastPapers] Warning: Could not fetch Lahore tree:', err.message);
    }
  }

  // 4. CFD Campus (check local cache first if available, else fetch)
  const cachedCfdPath = path.join(__dirname, 'cache_cfd_tree.json');
  if (fs.existsSync(cachedCfdPath)) {
    console.log(`[buildPastPapers] Using cached cache_cfd_tree.json...`);
    cfdTree = JSON.parse(fs.readFileSync(cachedCfdPath, 'utf8'));
  } else {
    try {
      const cfdData = await fetchWithRetry(CFD_REPO_TREE_URL, 3, 2000);
      if (cfdData && Array.isArray(cfdData.tree)) {
        cfdTree = cfdData.tree;
        fs.writeFileSync(cachedCfdPath, JSON.stringify(cfdTree), 'utf8');
        console.log(`[buildPastPapers] Received ${cfdTree.length} items for CFD Campus.`);
      }
    } catch (err) {
      console.warn('[buildPastPapers] Warning: Could not fetch CFD tree:', err.message);
    }
  }

  const existingPath = path.join(__dirname, '..', 'data', 'pastPapers.json');
  let prevData = null;
  if (fs.existsSync(existingPath)) {
    try {
      prevData = JSON.parse(fs.readFileSync(existingPath, 'utf8'));
    } catch { /* The live trees can still rebuild a missing or invalid snapshot. */ }
  }

  let islamabadCampusData;
  if (islamabadTree) {
    islamabadCampusData = parseIslamabadTree(islamabadTree);
  } else if (prevData && prevData.campuses && prevData.campuses.islamabad) {
    islamabadCampusData = prevData.campuses.islamabad;
  } else {
    throw new Error('Islamabad past papers data missing');
  }

  let karachiCampusData;
  if (karachiTree) {
    karachiCampusData = parseKarachiTree(karachiTree);
  } else if (prevData && prevData.campuses && prevData.campuses.karachi) {
    karachiCampusData = prevData.campuses.karachi;
  } else {
    throw new Error('Karachi past papers data missing');
  }

  let lahoreCampusData;
  if (lahoreTree) {
    lahoreCampusData = parseLahoreTree(lahoreTree);
  } else if (prevData && prevData.campuses && (prevData.campuses.lahore || prevData.campuses.central)) {
    lahoreCampusData = prevData.campuses.lahore || prevData.campuses.central;
  } else {
    throw new Error('Lahore past papers data missing');
  }

  let cfdCampusData;
  if (cfdTree) {
    cfdCampusData = parseCfdTree(cfdTree);
  } else if (prevData && prevData.campuses && prevData.campuses.cfd) {
    cfdCampusData = prevData.campuses.cfd;
  } else {
    throw new Error('CFD past papers data missing');
  }

  const outputPayload = {
    lastGenerated: new Date().toISOString(),
    campuses: {
      islamabad: islamabadCampusData,
      karachi: karachiCampusData,
      lahore: lahoreCampusData,
      cfd: cfdCampusData,
      central: lahoreCampusData // Backwards compatibility alias
    },
    // Backward compatibility for components expecting root-level fields
    repo: islamabadCampusData.repo,
    totalFiles: islamabadCampusData.totalFiles + karachiCampusData.totalFiles + lahoreCampusData.totalFiles + cfdCampusData.totalFiles,
    semesters: islamabadCampusData.semesters,
    outlines: islamabadCampusData.outlines
  };

  const outputDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // This snapshot is bundled for browsers. Upstream locations stay in the
  // build script and server-side paper proxy, never in the public archive.
  const serverOnlyFields = new Set(['repo', 'rawBase', 'downloadUrl']);
  fs.writeFileSync(existingPath, JSON.stringify(outputPayload, (key, value) => serverOnlyFields.has(key) ? undefined : value, 2), 'utf-8');

  console.log(`[buildPastPapers] SUCCESS! Generated 4-campus past papers archive:`);
  console.log(`  - FAST Islamabad: ${islamabadCampusData.totalFiles} files`);
  console.log(`  - FAST Karachi: ${karachiCampusData.totalFiles} files`);
  console.log(`  - FAST Lahore: ${lahoreCampusData.totalFiles} files`);
  console.log(`  - FAST CFD: ${cfdCampusData.totalFiles} files`);
  console.log(`  - Total Unified: ${outputPayload.totalFiles} files`);
  console.log(`[buildPastPapers] Saved to ${existingPath}`);
}

main().catch(err => {
  console.error('[buildPastPapers] Fatal Error:', err);
  process.exit(1);
});
