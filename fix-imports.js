#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const files = [
  'src/components/common/AdminProtectedRoute.tsx',
  'src/components/common/Layout.tsx', 
  'src/components/common/ProtectedRoute.tsx',
  'src/pages/admin/AdminDashboardPage.tsx',
  'src/pages/dashboard/DashboardPage.tsx',
  'src/pages/HomePage.tsx'
];

files.forEach(file => {
  const fullPath = path.resolve(file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Fix ReactNode imports
    content = content.replace(
      /import React, \{ ([^}]*ReactNode[^}]*) \} from 'react';/g,
      (match, imports) => {
        const nonTypeImports = imports.split(',').map(s => s.trim()).filter(s => !['ReactNode'].includes(s)).join(', ');
        const typeImports = imports.split(',').map(s => s.trim()).filter(s => ['ReactNode'].includes(s)).join(', ');
        
        let result = `import React`;
        if (nonTypeImports) result += `, { ${nonTypeImports} }`;
        result += ` from 'react';`;
        if (typeImports) result += `\nimport type { ${typeImports} } from 'react';`;
        
        return result;
      }
    );
    
    // Fix type imports from types
    content = content.replace(
      /import \{ ([^}]*) \} from ['"]\.\.\/[\.\/]*types['"];?/g,
      (match, imports) => {
        return `import type { ${imports} } from '../types';`;
      }
    );
    
    // Fix unused React import
    if (content.includes("import React from 'react'") && !content.includes('React.')) {
      content = content.replace("import React from 'react';", "// React import not needed");
    }
    
    fs.writeFileSync(fullPath, content);
    console.log(`Fixed: ${file}`);
  }
});