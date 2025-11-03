#!/usr/bin/env node

/*
 * Open Course Factory - Color Replacement Script
 * Copyright (C) 2023-2025 Solution Libre
 *
 * Replaces hardcoded hex colors with CSS variables for dark mode support
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load color mappings
const mappingsPath = path.join(__dirname, 'colorMappings.json');
const { mappings } = JSON.parse(fs.readFileSync(mappingsPath, 'utf8'));

// Configuration
const COMPONENTS_DIR = path.join(__dirname, '..', 'src', 'components');
const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

// Statistics
const stats = {
  filesProcessed: 0,
  filesModified: 0,
  replacementsMade: 0,
  skippedFiles: [],
  replacementDetails: {}
};

// Files to skip (special cases)
const SKIP_FILES = [
  'TerminalConsole.vue',  // XTerm colors
  'TerminalViewer.vue',   // Terminal-specific colors
];

/**
 * Check if file should be skipped
 */
function shouldSkipFile(filePath) {
  const fileName = path.basename(filePath);
  return SKIP_FILES.includes(fileName);
}

/**
 * Replace hardcoded colors in CSS content
 */
function replaceColors(content, filePath) {
  let modified = false;
  let replacements = 0;
  let newContent = content;

  // Sort mappings by length (longest first) to avoid partial matches
  const sortedMappings = Object.entries(mappings).sort((a, b) => b[0].length - a[0].length);

  for (const [hexColor, cssVar] of sortedMappings) {
    // Case-insensitive regex for hex colors
    const hexPattern = hexColor.replace('#', '\\#');
    const regex = new RegExp(hexPattern, 'gi');

    // Check if color exists in content
    if (regex.test(newContent)) {
      // Count matches
      const matches = newContent.match(regex);
      if (matches) {
        replacements += matches.length;
        modified = true;

        // Track replacement details
        if (!stats.replacementDetails[hexColor]) {
          stats.replacementDetails[hexColor] = 0;
        }
        stats.replacementDetails[hexColor] += matches.length;

        if (VERBOSE) {
          console.log(`  ${hexColor} → ${cssVar} (${matches.length} occurrences)`);
        }

        // Replace all occurrences
        newContent = newContent.replace(regex, cssVar);
      }
    }
  }

  if (modified) {
    stats.filesModified++;
    stats.replacementsMade += replacements;
  }

  return { modified, newContent, replacements };
}

/**
 * Process a single Vue file
 */
function processFile(filePath) {
  stats.filesProcessed++;

  if (shouldSkipFile(filePath)) {
    stats.skippedFiles.push(filePath);
    if (VERBOSE) {
      console.log(`⏭️  Skipping: ${path.relative(COMPONENTS_DIR, filePath)}`);
    }
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const { modified, newContent, replacements } = replaceColors(content, filePath);

  if (modified) {
    const relativePath = path.relative(COMPONENTS_DIR, filePath);
    console.log(`✅ ${relativePath} (${replacements} replacements)`);

    if (!DRY_RUN) {
      fs.writeFileSync(filePath, newContent, 'utf8');
    }
  }
}

/**
 * Recursively find all Vue files
 */
function findVueFiles(dir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      results = results.concat(findVueFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.vue')) {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * Main execution
 */
function main() {
  console.log('🎨 OCF Color Replacement Script\n');

  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No files will be modified\n');
  }

  // Find all Vue files
  console.log(`📂 Scanning ${COMPONENTS_DIR}...\n`);
  const vueFiles = findVueFiles(COMPONENTS_DIR);
  console.log(`Found ${vueFiles.length} Vue files\n`);

  // Process each file
  console.log('🔄 Processing files...\n');
  vueFiles.forEach(processFile);

  // Print statistics
  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary Statistics');
  console.log('='.repeat(60));
  console.log(`Files processed:      ${stats.filesProcessed}`);
  console.log(`Files modified:       ${stats.filesModified}`);
  console.log(`Files skipped:        ${stats.skippedFiles.length}`);
  console.log(`Total replacements:   ${stats.replacementsMade}`);

  if (stats.skippedFiles.length > 0) {
    console.log('\n⏭️  Skipped files (require manual review):');
    stats.skippedFiles.forEach(file => {
      console.log(`  - ${path.relative(COMPONENTS_DIR, file)}`);
    });
  }

  if (Object.keys(stats.replacementDetails).length > 0) {
    console.log('\n🎨 Color replacements breakdown:');
    const sorted = Object.entries(stats.replacementDetails)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    sorted.forEach(([color, count]) => {
      console.log(`  ${color.padEnd(10)} → ${mappings[color].padEnd(35)} (${count}x)`);
    });

    if (Object.keys(stats.replacementDetails).length > 10) {
      console.log(`  ... and ${Object.keys(stats.replacementDetails).length - 10} more`);
    }
  }

  console.log('\n' + '='.repeat(60));

  if (DRY_RUN) {
    console.log('\n💡 Run without --dry-run to apply changes');
  } else {
    console.log('\n✅ Done! All changes have been applied.');
    console.log('💡 Run `npm run build` to verify no errors were introduced.');
  }
}

// Execute
try {
  main();
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
