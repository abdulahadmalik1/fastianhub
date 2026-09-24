import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function parseCSVLine(text: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          current += '"';
          i++; // Skip escaped quote
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

export async function GET() {
  try {
    const response = await fetch('https://docs.google.com/spreadsheets/d/1HF6g11HUJdnHo9D35fvtCzSxR2fTeu_K/export?format=csv&gid=473774965');
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
    }
    
    const csvText = await response.text();
    const lines = csvText.split(/\r?\n/);
    
    let headerFound = false;
    const facultyList = [];
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      const cols = parseCSVLine(line);
      
      // Look for the header row to start processing
      if (!headerFound) {
        if (cols.some(c => c.toLowerCase().includes('name')) && cols.some(c => c.toLowerCase().includes('email'))) {
          headerFound = true;
        }
        continue;
      }
      
      // Stop condition or skip section headers (e.g., "Faculty Department of Computer Science")
      // Section headers usually don't have emails
      if (cols.length >= 4) {
        let name = '';
        let designation = '';
        let email = '';
        let office = '';
        
        // Handle quirk: Sometimes Name is in col 0 (if no Sr#), sometimes in col 1
        // E.g., "Dr. Hasan Mujtaba,," vs "1,Dr. Muhammad Arshad Islam"
        if (cols[0] && cols[0].toLowerCase().includes('dr.')) {
          name = cols[0];
          designation = cols[2] || cols[1]; // Often in col 2 if it's shifted, or col 1
          email = cols[3];
          office = cols[4] || '';
        } else if (cols[1]) {
          name = cols[1];
          designation = cols[2];
          email = cols[3];
          office = cols[4] || '';
        } else if (cols[0]) {
          name = cols[0];
          designation = cols[1] || '';
          email = cols[2] || '';
          office = cols[3] || '';
        }
        
        // Only add if there is a valid email
        if (name && email && email.includes('@nu.edu.pk')) {
          facultyList.push({
            name: name.trim(),
            designation: designation.trim(),
            email: email.trim(),
            office: office.trim()
          });
        }
      }
    }
    
    return NextResponse.json({ faculty: facultyList });
  } catch (error: any) {
    console.error('API Error fetching faculty:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch faculty data' }, { status: 500 });
  }
}
