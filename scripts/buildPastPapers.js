const fs = require('fs');
const path = require('path');
const https = require('https');

const REPO_TREE_URL = 'https://api.github.com/repos/malikhacks/fsc-past-papers/git/trees/main?recursive=1';
const RAW_BASE = 'https://raw.githubusercontent.com/malikhacks/fsc-past-papers/main';

function fetchWithRetry(url, retries = 5, delay = 2000) {
  return new Promise((resolve, reject) => {
    let finished = false;
    function attempt(n) {
      if (finished) return;
      console.log(`[buildPastPapers] Fetching tree (attempt ${6 - n}/5)...`);
      const req = https.get(
        url,
        {
          headers: {
            'User-Agent': 'FastiFlex-BuildScript',
            'Accept': 'application/vnd.github.v3+json'
          },
          timeout: 15000
        },
        (res) => {
          if (finished) return;
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            return https.get(res.headers.location, { headers: { 'User-Agent': 'FastiFlex-BuildScript' } }, (res2) => {
              if (finished) return;
              let body = '';
              res2.on('data', chunk => body += chunk);
              res2.on('end', () => {
                finished = true;
                resolve(JSON.parse(body));
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
  if (['.zip', '.rar', '.7z'].includes(ext)) return 'archive';
  if (ext === '.md' || ext === '.txt') return 'text';
  return 'file';
}

function cleanTitle(str) {
  return str.replace(/\.(pdf|docx?|jpe?g|png|zip|txt|md)$/i, '').trim();
}

async function main() {
  console.log('[buildPastPapers] Starting static tree fetch...');
  const data = await fetchWithRetry(REPO_TREE_URL);

  if (!data || !Array.isArray(data.tree)) {
    throw new Error('Invalid GitHub tree payload');
  }

  console.log(`[buildPastPapers] Received ${data.tree.length} total items in tree.`);

  // Data structure:
  // semesters: {
  //   "1": {
  //      courses: {
  //         "Applied Physics": [ { name, path, downloadUrl, size, type } ]
  //      }
  //   }
  // }
  // outlines: {
  //   "Semester-1": {
  //      courses: {
  //         "Applied Physics": [ ... ]
  //      }
  //   }
  // }

  const semesters = {};
  for (let i = 1; i <= 8; i++) {
    semesters[i] = { semester: i, courses: {} };
  }

  const outlines = {};
  let totalFilesIndexed = 0;

  for (const item of data.tree) {
    if (item.type !== 'blob') continue;
    const itemPath = item.path;

    // Ignore top-level root files like README.md, .gitignore
    if (!itemPath.includes('/')) continue;

    // 1. Process semester-{1-8} folders
    if (itemPath.startsWith('semester-')) {
      const parts = itemPath.split('/');
      // e.g. ["semester-1", "Applied Physics", "Mid 1 2022.pdf"]
      const semMatch = parts[0].match(/^semester-(\d+)$/i);
      if (!semMatch) continue;
      const semNum = parseInt(semMatch[1], 10);
      if (semNum < 1 || semNum > 8) continue;

      if (parts.length < 3) {
        // file right inside semester-N/
        const fileName = parts[1];
        if (fileName.toLowerCase() === 'readme.md' || fileName === '.gitkeep') continue;
        const course = 'General / Miscellaneous';
        if (!semesters[semNum].courses[course]) semesters[semNum].courses[course] = [];
        semesters[semNum].courses[course].push({
          fileName,
          title: cleanTitle(fileName),
          path: itemPath,
          downloadUrl: `${RAW_BASE}/${encodePath(itemPath)}`,
          size: item.size || 0,
          fileType: getFileType(fileName)
        });
        totalFilesIndexed++;
      } else {
        const course = parts[1].trim();
        const fileName = parts.slice(2).join('/');
        const baseName = parts[parts.length - 1];

        // Filter out all README and markdown files
        if (baseName.toLowerCase().startsWith('readme') || baseName.toLowerCase().endsWith('.md') || baseName === '.gitkeep') {
          continue;
        }

        if (!semesters[semNum].courses[course]) {
          semesters[semNum].courses[course] = [];
        }

        semesters[semNum].courses[course].push({
          fileName: baseName,
          subPath: parts.slice(2, -1).join('/'),
          title: cleanTitle(baseName),
          path: itemPath,
          downloadUrl: `${RAW_BASE}/${encodePath(itemPath)}`,
          size: item.size || 0,
          fileType: getFileType(baseName)
        });
        totalFilesIndexed++;
      }
    }

    // 2. Process Course Outlines folder
    else if (itemPath.startsWith('Course Outlines/')) {
      const parts = itemPath.split('/');
      if (parts.length < 3) continue;

      let group = parts[1]; // e.g. "Semester-1"
      let course = parts[2];
      let fileName = parts.slice(3).join('/') || parts[2];

      if (parts.length === 3) {
        group = 'General';
        course = parts[1];
        fileName = parts[2];
      } else {
        fileName = parts[parts.length - 1];
      }

      // Filter out all README and markdown files
      if (fileName.toLowerCase().startsWith('readme') || fileName.toLowerCase().endsWith('.md') || fileName === '.gitkeep') {
        continue;
      }

      if (!outlines[group]) outlines[group] = {};
      if (!outlines[group][course]) outlines[group][course] = [];

      outlines[group][course].push({
        fileName,
        title: cleanTitle(fileName),
        path: itemPath,
        downloadUrl: `${RAW_BASE}/${encodePath(itemPath)}`,
        size: item.size || 0,
        fileType: getFileType(fileName)
      });
      totalFilesIndexed++;
    }
  }

  // Convert to clean array format for easy frontend filtering & sorting
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

  const outputPayload = {
    repo: 'malikhacks/fsc-past-papers',
    lastGenerated: new Date().toISOString(),
    totalFiles: totalFilesIndexed,
    semesters: formattedSemesters,
    outlines: formattedOutlines
  };

  const outputDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'pastPapers.json');
  fs.writeFileSync(outputPath, JSON.stringify(outputPayload, null, 2), 'utf-8');

  console.log(`[buildPastPapers] SUCCESS! Generated static JSON with ${totalFilesIndexed} files across 8 semesters and course outlines.`);
  console.log(`[buildPastPapers] Saved to ${outputPath}`);
}

main().catch(err => {
  console.error('[buildPastPapers] Fatal Error:', err);
  process.exit(1);
});
