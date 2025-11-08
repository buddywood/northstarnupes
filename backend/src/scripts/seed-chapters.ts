import axios from 'axios';
import * as cheerio from 'cheerio';
import { createChapter } from '../db/queries';
import pool from '../db/connection';

const WIKIPEDIA_URL = 'https://en.wikipedia.org/wiki/List_of_Kappa_Alpha_Psi_chapters';

interface ChapterData {
  name: string;
  chartered: string;
  institution?: string;
  location: string;
  status: string;
  type: 'Collegiate' | 'Alumni';
}

function parseLocation(location: string): { city: string | null; state: string | null } {
  if (!location || location.trim() === '') {
    return { city: null, state: null };
  }

  // Handle various formats: "City, ST", "City, State", "City, ST, Country", etc.
  const parts = location.split(',').map(p => p.trim());
  
  if (parts.length < 2) {
    // Try to extract state abbreviation if it's a 2-letter code at the end
    const match = location.match(/\b([A-Z]{2})\b$/);
    if (match) {
      const state = match[1];
      const city = location.replace(/\s*[A-Z]{2}\s*$/, '').trim();
      return { city: city || null, state };
    }
    return { city: location || null, state: null };
  }

  const city = parts[0] || null;
  let state = parts[1] || null;

  // If state is a full state name, try to keep it, but prefer abbreviation if available
  // For now, just use what's provided
  if (state && state.length > 2) {
    // Could add state name to abbreviation mapping here if needed
  }

  return { city, state };
}

function parseCharteredYear(chartered: string): number | null {
  if (!chartered || chartered.trim() === '') {
    return null;
  }

  // Extract year from various formats: "1911", "1911-01-01", etc.
  const yearMatch = chartered.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    return parseInt(yearMatch[0], 10);
  }

  return null;
}

function parseStatus(status: string): string {
  if (!status || status.trim() === '') {
    return 'Active';
  }
  
  const normalized = status.trim();
  // Common status values: "Active", "Inactive", "Closed", etc.
  if (normalized.toLowerCase() === 'active') {
    return 'Active';
  }
  if (normalized.toLowerCase() === 'inactive' || normalized.toLowerCase() === 'closed') {
    return 'Inactive';
  }
  
  return normalized;
}

async function scrapeChapters(): Promise<void> {
  console.log('Fetching Wikipedia page...');
  const response = await axios.get(WIKIPEDIA_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  const $ = cheerio.load(response.data);
  const chapters: ChapterData[] = [];

  // Build a map of tables to their section by iterating through document in order
  // This is more reliable than trying to find headings backwards
  let currentSection: 'Collegiate' | 'Alumni' = 'Collegiate';
  const tableSectionMap = new Map<cheerio.Element, 'Collegiate' | 'Alumni'>();
  
  // Get the main content area (usually #content or #bodyContent)
  const $content = $('#content, #bodyContent, .mw-parser-output').first();
  const $elements = $content.length > 0 ? $content : $('body');
  
  // First, log all headings to see what we're working with
  console.log('\n=== All section headings found ===');
  $elements.find('h2, h3').each((_, heading) => {
    const $heading = $(heading);
    console.log(`Heading: "${$heading.text()}" (${heading.tagName})`);
  });
  console.log('================================\n');
  
  // Iterate through headings and tables in document order
  $elements.find('h2, h3, table.wikitable').each((_, elem) => {
    const $elem = $(elem);
    const tagName = elem.tagName?.toLowerCase() || '';
    
    // Check if this is a section heading
    if (tagName === 'h2' || tagName === 'h3') {
      const text = $elem.text().toLowerCase().trim();
      // Check for "Alumni chapters" or just "Alumni" (but not "Collegiate/Undergraduate chapters")
      if ((text.includes('alumni chapters') || (text.includes('alumni') && !text.includes('collegiate') && !text.includes('undergraduate')))) {
        currentSection = 'Alumni';
        console.log(`Found Alumni section: "${$elem.text()}"`);
      } else if (text.includes('collegiate') || text.includes('undergraduate')) {
        currentSection = 'Collegiate';
        console.log(`Found Collegiate section: "${$elem.text()}"`);
      }
    }
    
    // If this is a table, assign it to the current section
    if (tagName === 'table' && $elem.hasClass('wikitable')) {
      tableSectionMap.set(elem, currentSection);
    }
  });

  // Find all tables on the page
  const tables = $('table.wikitable');
  console.log(`Found ${tables.length} tables on the page`);

  tables.each((tableIndex, table) => {
    const $table = $(table);
    const headers: string[] = [];
    
    // Get headers from the first row
    $table.find('tr').first().find('th, td').each((_, cell) => {
      headers.push($(cell).text().trim());
    });

    // Get the section for this table from our map
    let chapterType: 'Collegiate' | 'Alumni' = tableSectionMap.get(table) || 'Collegiate';
    
    // Also check for table caption
    const $caption = $table.find('caption');
    if ($caption.length) {
      const captionText = $caption.text().toLowerCase();
      if (captionText.includes('alumni')) {
        chapterType = 'Alumni';
        console.log(`Table ${tableIndex + 1}: Detected as Alumni from caption: "${$caption.text()}"`);
      }
    }
    
    // Fallback: use prevAll if not in map
    if (!tableSectionMap.has(table) && !$caption.length) {
      // Look for the closest heading before this table
      const prevHeading = $table.prevAll('h2, h3, h4').first();
      if (prevHeading.length) {
        const headingText = prevHeading.text().toLowerCase();
        if (headingText.includes('alumni chapters') || (headingText.includes('alumni') && !headingText.includes('collegiate') && !headingText.includes('undergraduate'))) {
          chapterType = 'Alumni';
          console.log(`Table ${tableIndex + 1}: Detected as Alumni from heading: "${prevHeading.text()}"`);
        } else if (headingText.includes('collegiate') || headingText.includes('undergraduate')) {
          chapterType = 'Collegiate';
          console.log(`Table ${tableIndex + 1}: Detected as Collegiate from heading: "${prevHeading.text()}"`);
        }
      } else {
        console.log(`Table ${tableIndex + 1}: Defaulting to Collegiate (no heading or caption found)`);
      }
    } else {
      console.log(`Table ${tableIndex + 1}: ${chapterType}`);
    }

    // Find the column indices - handle various header formats
    const nameIndex = headers.findIndex(h => {
      const lower = h.toLowerCase();
      return lower.includes('name') || lower === '' || lower === 'chapter';
    });
    const charteredIndex = headers.findIndex(h => h.toLowerCase().includes('chartered'));
    const locationIndex = headers.findIndex(h => {
      const lower = h.toLowerCase();
      return lower.includes('location') || lower.includes('city') || lower.includes('state');
    });
    const statusIndex = headers.findIndex(h => h.toLowerCase().includes('status'));

    // Skip if we don't have the essential columns (name is required)
    if (nameIndex === -1) {
      console.log(`Skipping table ${tableIndex + 1}: No name column found`);
      return;
    }

    // Process each row (skip header row)
    $table.find('tr').slice(1).each((_, row) => {
      const $row = $(row);
      const cells = $row.find('td, th');
      
      if (cells.length === 0) {
        return;
      }

      const name = cells.eq(nameIndex).text().trim();
      if (!name || name === '') {
        return;
      }

      // If the chapter name contains "Alumni", it's definitely an Alumni chapter
      // This is a reliable indicator since all Alumni chapters have "Alumni" in their name
      let finalChapterType = chapterType;
      if (name.toLowerCase().includes('alumni')) {
        finalChapterType = 'Alumni';
      } else if (name.toLowerCase().includes('collegiate') || name.toLowerCase().includes('undergraduate')) {
        finalChapterType = 'Collegiate';
      }

      const chartered = charteredIndex >= 0 ? cells.eq(charteredIndex).text().trim() : '';
      const location = locationIndex >= 0 ? cells.eq(locationIndex).text().trim() : '';
      const status = statusIndex >= 0 ? cells.eq(statusIndex).text().trim() : 'Active';

      chapters.push({
        name,
        chartered,
        location,
        status,
        type: finalChapterType,
      });
    });
  });

  console.log(`Found ${chapters.length} chapters to process`);

  // Insert chapters into database
  let inserted = 0;
  let skipped = 0;
  let errors = 0;
  let insertedCollegiate = 0;
  let insertedAlumni = 0;

  for (const chapterData of chapters) {
    try {
      // Check if chapter already exists
      const existing = await pool.query(
        'SELECT id FROM chapters WHERE name = $1 AND type = $2',
        [chapterData.name, chapterData.type]
      );

      if (existing.rows.length > 0) {
        console.log(`Skipping duplicate: ${chapterData.name} (${chapterData.type})`);
        skipped++;
        continue;
      }

      const { city, state } = parseLocation(chapterData.location);
      const charteredYear = parseCharteredYear(chapterData.chartered);
      const status = parseStatus(chapterData.status);

      await createChapter({
        name: chapterData.name,
        type: chapterData.type,
        status,
        chartered: charteredYear,
        province: null,
        city,
        state,
        contact_email: null,
      });

      inserted++;
      if (chapterData.type === 'Collegiate') {
        insertedCollegiate++;
      } else {
        insertedAlumni++;
      }
      if (inserted % 10 === 0) {
        console.log(`Inserted ${inserted} chapters...`);
      }
    } catch (error) {
      console.error(`Error inserting chapter ${chapterData.name}:`, error);
      errors++;
    }
  }

  // Count by type
  const collegiateCount = chapters.filter(c => c.type === 'Collegiate').length;
  const alumniCount = chapters.filter(c => c.type === 'Alumni').length;

  console.log('\n=== Summary ===');
  console.log(`Total chapters found: ${chapters.length}`);
  console.log(`  - Collegiate: ${collegiateCount}`);
  console.log(`  - Alumni: ${alumniCount}`);
  console.log(`Inserted: ${inserted}`);
  console.log(`  - Collegiate: ${insertedCollegiate}`);
  console.log(`  - Alumni: ${insertedAlumni}`);
  console.log(`Skipped (duplicates): ${skipped}`);
  console.log(`Errors: ${errors}`);
}

async function main() {
  try {
    await scrapeChapters();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    await pool.end();
    process.exit(1);
  }
}

main();

