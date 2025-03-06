const fs = require('fs');
const path = require('path');

// Files to update for createServerComponentClient
const serverComponentFiles = [
  'src/components/reports/project-summary-report.tsx',
  'src/app/map/page.tsx',
  'src/app/reports/page.tsx',
  'src/app/projects/page.tsx',
  'src/app/projects/[id]/page.tsx',
  'src/app/prioritization/page.tsx',
  'src/app/projects/new/page.tsx',
  'src/app/notifications/page.tsx',
  'src/app/dashboard/layout.tsx',
  'src/app/community/page.tsx',
  'src/app/community/layout.tsx',
  'src/app/community/feedback/page.tsx',
  'src/app/community/feedback/analytics/page.tsx',
  'src/app/api/community/feedback/response/route.ts',
  'src/app/api/community/feedback/sentiment/route.ts',
  'src/app/api/community/feedback/moderate/route.ts',
  'src/app/admin/page.tsx',
  'src/app/admin/layout.tsx'
];

// Files to update for createAdminClient
const adminClientFiles = [
  'src/lib/api/score-project-api.ts',
  'src/app/api/projects/score/route.ts'
];

// Update imports for createServerComponentClient
serverComponentFiles.forEach(filePath => {
  try {
    const fullPath = path.resolve(filePath);
    if (fs.existsSync(fullPath)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      content = content.replace(
        /import\s+\{\s*createServerComponentClient\s*\}\s+from\s+['"]@\/lib\/supabase\/client['"]/g,
        "import { createServerComponentClient } from '@/lib/supabase/server'"
      );
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    } else {
      console.log(`File not found: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error);
  }
});

// Update imports for createAdminClient
adminClientFiles.forEach(filePath => {
  try {
    const fullPath = path.resolve(filePath);
    if (fs.existsSync(fullPath)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      content = content.replace(
        /import\s+\{\s*createAdminClient\s*\}\s+from\s+['"]@\/lib\/supabase\/client['"]/g,
        "import { createAdminClient } from '@/lib/supabase/server'"
      );
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    } else {
      console.log(`File not found: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error);
  }
});

console.log('Import updates completed!'); 