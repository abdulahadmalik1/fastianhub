const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '..', 'faculty_raw.csv');
const content = fs.readFileSync(csvPath, 'utf8');

function parseCSVLine(text) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }
  result.push(current.trim());
  return result;
}

const lines = content.split(/\r?\n/);
let currentDept = 'School of Computing';
const list = [];

for (let i = 0; i < lines.length; i++) {
  const rawLine = lines[i].trim();
  if (!rawLine) continue;

  if (rawLine.includes('Faculty Department of')) {
    const deptMatch = rawLine.match(/Faculty Department of\s*([^,]+)/i);
    if (deptMatch) {
      currentDept = deptMatch[1].trim();
    }
    continue;
  }

  const cols = parseCSVLine(lines[i]); // preserve original line for proper tokenization
  if (cols.length < 3) continue;

  // Header row check
  if (cols.some(c => c.toLowerCase().includes('designation')) && cols.some(c => c.toLowerCase().includes('email'))) {
    continue;
  }

  let name = '';
  let designation = '';
  let email = '';
  let office = '';

  // Case 1: First col is empty or Sr#, or Name directly
  if (cols[0] && cols[0].startsWith('Dr.') && cols[1] === '') {
    name = cols[0];
    designation = cols[2];
    email = cols[3];
    office = cols[4] || '';
  } else if (/^\d+$/.test(cols[0])) {
    name = cols[1];
    designation = cols[2];
    email = cols[3];
    office = cols[4] || '';
  } else if (cols[1] && (cols[1].startsWith('Dr.') || cols[1].startsWith('Mr.') || cols[1].startsWith('Ms.'))) {
    name = cols[1];
    designation = cols[2];
    email = cols[3];
    office = cols[4] || '';
  } else if (cols[0] && (cols[0].startsWith('Dr.') || cols[0].startsWith('Mr.') || cols[0].startsWith('Ms.'))) {
    name = cols[0];
    designation = cols[1];
    email = cols[2];
    office = cols[3] || '';
  }

  // Clean values
  name = (name || '').replace(/[\r\n\t]+/g, ' ').trim();
  designation = (designation || '').replace(/[\r\n\t]+/g, ' ').trim();
  email = (email || '').replace(/[\r\n\t\s]+/g, '').trim();
  office = (office || '').replace(/[\r\n\t]+/g, ' ').trim();

  // Normalize department names
  let normalizedDept = currentDept;
  if (normalizedDept.includes('Computer Science')) normalizedDept = 'Computer Science';
  else if (normalizedDept.includes('Artificial Intelligence')) normalizedDept = 'AI & Data Science';
  else if (normalizedDept.includes('Software Engineering')) normalizedDept = 'Software Engineering';
  else if (normalizedDept.includes('Cyber Security')) normalizedDept = 'Cyber Security';
  else if (normalizedDept.includes('Science And Humanities')) normalizedDept = 'Science & Humanities';

  if (name && email && email.includes('@')) {
    list.push({
      id: `fac-${list.length + 1}`,
      name,
      designation: designation || 'Faculty',
      email,
      office: office || 'Not Assigned',
      department: normalizedDept
    });
  }
}

console.log('Total parsed faculty:', list.length);
console.log('Sample:', list[0]);

const outPath = path.join(__dirname, '..', 'lib', 'facultyData.ts');
const fileContent = `// Auto-generated static faculty database from FAST-NUCES official directory
// Instant local access - 0ms network latency

export interface FacultyMember {
  id: string;
  name: string;
  designation: string;
  email: string;
  office: string;
  department: string;
}

export const FACULTY_DATA: FacultyMember[] = ${JSON.stringify(list, null, 2)};
`;

fs.writeFileSync(outPath, fileContent, 'utf8');
console.log('Successfully wrote', list.length, 'records to', outPath);
