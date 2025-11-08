import { createChapter } from '../db/queries';
import pool from '../db/connection';

interface AlumniChapterData {
  name: string;
  chartered: number | null;
  location: string;
  status: string;
  province: string | null;
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

  // Remove country if present (usually 3rd part)
  if (parts.length > 2 && parts[2].length > 2) {
    // Likely a country, keep state as is
  }

  return { city, state };
}

function parseStatus(status: string): string {
  if (!status || status.trim() === '') {
    return 'Active';
  }
  
  const normalized = status.trim();
  if (normalized.toLowerCase() === 'active') {
    return 'Active';
  }
  if (normalized.toLowerCase() === 'inactive' || normalized.toLowerCase() === 'closed') {
    return 'Inactive';
  }
  
  return normalized;
}

function parseCharteredYear(chartered: string): number | null {
  if (!chartered || chartered.trim() === '') {
    return null;
  }

  // Extract year from various formats: "1919", "1919-01-01", etc.
  const yearMatch = chartered.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    return parseInt(yearMatch[0], 10);
  }

  return null;
}

const alumniChapters: AlumniChapterData[] = [
  { name: 'Chicago (IL) Alumni Chapter', chartered: 1919, location: 'Chicago, IL', status: 'Active', province: 'North Central' },
  { name: 'Detroit (MI) Alumni Chapter', chartered: 1920, location: 'Detroit, MI', status: 'Active', province: 'Northern' },
  { name: 'Indianapolis (IN) Alumni Chapter', chartered: 1920, location: 'Indianapolis, IN', status: 'Active', province: 'North Central' },
  { name: 'Cleveland (OH) Alumni Chapter', chartered: 1920, location: 'Cleveland, OH', status: 'Active', province: 'East Central' },
  { name: 'Louisville (KY) Alumni Chapter', chartered: 1920, location: 'Louisville, KY', status: 'Active', province: 'South Central' },
  { name: 'St. Louis (MO) Alumni Chapter', chartered: 1921, location: 'St. Louis, MO', status: 'Active', province: 'Middle Western' },
  { name: 'Columbus (OH) Alumni Chapter', chartered: 1921, location: 'Columbus, OH', status: 'Active', province: 'East Central' },
  { name: 'Baltimore (MD) Alumni Chapter', chartered: 1921, location: 'Baltimore, MD', status: 'Active', province: 'Eastern' },
  { name: 'Durham (NC) Alumni Chapter', chartered: 1921, location: 'Durham, NC', status: 'Active', province: 'Middle Eastern' },
  { name: 'Oklahoma City (OK) Alumni Chapter', chartered: 1922, location: 'Oklahoma City, OK', status: 'Active', province: 'Middle Western' },
  { name: 'Philadelphia (PA) Alumni Chapter', chartered: 1922, location: 'Philadelphia, PA', status: 'Active', province: 'Northeastern' },
  { name: 'Pittsburgh (PA) Alumni Chapter', chartered: 1922, location: 'Pittsburgh, PA', status: 'Active', province: 'East Central' },
  { name: 'Kansas City (MO) Alumni Chapter', chartered: 1923, location: 'Kansas City, MO', status: 'Active', province: 'Middle Western' },
  { name: 'Cincinnati (OH) Alumni Chapter', chartered: 1923, location: 'Cincinnati, OH', status: 'Active', province: 'East Central' },
  { name: 'Atlanta (GA) Alumni Chapter', chartered: 1924, location: 'Atlanta, GA', status: 'Active', province: 'Southeastern' },
  { name: 'Washington (DC) Alumni Chapter', chartered: 1924, location: 'Washington, D.C.', status: 'Active', province: 'Eastern' },
  { name: 'Jacksonville (FL) Alumni Chapter', chartered: 1925, location: 'Jacksonville, FL', status: 'Active', province: 'Southern' },
  { name: 'Topeka (KS) Alumni Chapter', chartered: 1925, location: 'Topeka, KS', status: 'Active', province: 'Middle Western' },
  { name: 'Wichita (KS) Alumni Chapter', chartered: 1925, location: 'Wichita, KS', status: 'Active', province: 'Middle Western' },
  { name: 'Nashville (TN) Alumni Chapter', chartered: 1926, location: 'Nashville, TN', status: 'Active', province: 'South Central' },
  { name: 'Lexington (KY) Alumni Chapter', chartered: 1927, location: 'Lexington, KY', status: 'Active', province: 'South Central' },
  { name: 'Marshall (TX) Alumni Chapter', chartered: 1928, location: 'Marshall, TX', status: 'Active', province: 'Southwestern' },
  { name: 'Houston (TX) Alumni Chapter', chartered: 1928, location: 'Houston, TX', status: 'Active', province: 'Southwestern' },
  { name: 'Tampa (FL) Alumni Chapter', chartered: 1928, location: 'Tampa, FL', status: 'Active', province: 'Southern' },
  { name: 'Wilberforce (OH) Alumni Chapter', chartered: 1928, location: 'Wilberforce, OH', status: 'Active', province: 'East Central' },
  { name: 'Tuskegee (AL) Alumni Chapter', chartered: 1929, location: 'Tuskegee, AL', status: 'Active', province: 'Southern' },
  { name: 'Tulsa (OK) Alumni Chapter', chartered: 1931, location: 'Tulsa, OK', status: 'Active', province: 'Middle Western' },
  { name: 'San Antonio (TX) Alumni Chapter', chartered: 1931, location: 'San Antonio, TX', status: 'Active', province: 'Southwestern' },
  { name: 'Bluefield (WV) Alumni Chapter', chartered: 1932, location: 'Bluefield, WV', status: 'Inactive', province: 'Middle Eastern' },
  { name: 'Memphis (TN) Alumni Chapter', chartered: 1934, location: 'Memphis, TN', status: 'Active', province: 'South Central' },
  { name: 'Youngstown (OH) Alumni Chapter', chartered: 1934, location: 'Youngstown, OH', status: 'Active', province: 'East Central' },
  { name: 'Dallas (TX) Alumni Chapter', chartered: 1935, location: 'Dallas, TX', status: 'Active', province: 'Southwestern' },
  { name: 'New Orleans (LA) Alumni Chapter', chartered: 1936, location: 'New Orleans, LA', status: 'Active', province: 'Southwestern' },
  { name: 'New York (NY) Alumni Chapter', chartered: 1937, location: 'New York City, NY', status: 'Active', province: 'Northeastern' },
  { name: 'Little Rock (AR) Alumni Chapter', chartered: 1938, location: 'Little Rock, AR', status: 'Active', province: 'Southwestern' },
  { name: 'Los Angeles (CA) Alumni Chapter', chartered: 1938, location: 'Los Angeles, CA', status: 'Active', province: 'Western' },
  { name: 'Springfield (IL) Alumni Chapter', chartered: 1938, location: 'Springfield, IL', status: 'Active', province: 'North Central' },
  { name: 'Charleston (WV) Alumni Chapter', chartered: 1939, location: 'Charleston, WV', status: 'Active', province: 'East Central' },
  { name: 'Jefferson City (MO) Alumni Chapter', chartered: 1940, location: 'Jefferson City, MO', status: 'Active', province: 'Middle Western' },
  { name: 'Norfolk (VA) Alumni Chapter', chartered: 1940, location: 'Norfolk, VA', status: 'Active', province: 'Eastern' },
  { name: 'Jackson (MS) Alumni Chapter', chartered: 1941, location: 'Jackson, MS', status: 'Active', province: 'Southwestern' },
  { name: 'Pittsburg (KS) Alumni Chapter', chartered: 1941, location: 'Pittsburg, KS', status: 'Active', province: 'Middle Western' },
  { name: 'Petersburg (VA) Alumni Chapter', chartered: 1941, location: 'Petersburg, VA', status: 'Active', province: 'Eastern' },
  { name: 'Savannah (GA) Alumni Chapter', chartered: 1941, location: 'Savannah, GA', status: 'Active', province: 'Southeastern' },
  { name: 'Beckley-Southern (WV) Alumni Chapter', chartered: 1941, location: 'Beckley, WV', status: 'Active', province: 'Middle Eastern' },
  { name: 'Baton Rouge (LA) Alumni Chapter', chartered: 1942, location: 'Baton Rouge, LA', status: 'Active', province: 'Southwestern' },
  { name: 'Birmingham (AL) Alumni Chapter', chartered: 1943, location: 'Birmingham, AL', status: 'Active', province: 'Southern' },
  { name: 'Charlotte (NC) Alumni Chapter', chartered: 1944, location: 'Charlotte, NC', status: 'Active', province: 'Middle Eastern' },
  { name: 'Buffalo (NY) Alumni Chapter', chartered: 1945, location: 'Buffalo, NY', status: 'Active', province: 'Northern' },
  { name: 'Charleston (SC) Alumni Chapter', chartered: 1945, location: 'Charleston, SC', status: 'Active', province: 'Southeastern' },
  { name: 'Richmond (VA) Alumni Chapter', chartered: 1945, location: 'Richmond, VA', status: 'Active', province: 'Eastern' },
  { name: 'Gary (IN) Alumni Chapter', chartered: 1945, location: 'Gary, IN', status: 'Active', province: 'North Central' },
  { name: 'Hampton-Newport News (VA) Alumni Chapter', chartered: 1945, location: 'Hampton-Newport News, VA', status: 'Active', province: 'Eastern' },
  { name: 'Northfolk (WV) Alumni Chapter', chartered: 1945, location: 'Northfork, WV', status: 'Inactive', province: 'Middle Eastern' },
  { name: 'Muskogee (OK) Alumni Chapter', chartered: 1946, location: 'Muskogee, OK', status: 'Active', province: 'Middle Western' },
  { name: 'Chattanooga (TN) Alumni Chapter', chartered: 1946, location: 'Chattanooga, TN', status: 'Active', province: 'South Central' },
  { name: 'Greensboro (NC) Alumni Chapter', chartered: 1946, location: 'Greensboro, NC', status: 'Active', province: 'Middle Eastern' },
  { name: 'Tallahassee (FL) Alumni Chapter', chartered: 1946, location: 'Tallahassee, FL', status: 'Active', province: 'Southern' },
  { name: 'Knoxville (TN) Alumni Chapter', chartered: 1946, location: 'Knoxville, TN', status: 'Active', province: 'South Central' },
  { name: 'Miami (FL) Alumni Chapter', chartered: 1946, location: 'Miami, FL', status: 'Active', province: 'Southern' },
  { name: 'Dayton (OH) Alumni Chapter', chartered: 1946, location: 'Dayton, OH', status: 'Active', province: 'East Central' },
  { name: 'Columbia (SC) Alumni Chapter', chartered: 1947, location: 'Columbia, SC', status: 'Active', province: 'Southeastern' },
  { name: 'Pensacola (FL) Alumni Chapter', chartered: 1947, location: 'Pensacola, FL', status: 'Active', province: 'Southern' },
  { name: 'Wilmington (DE) Alumni Chapter', chartered: 1947, location: 'Wilmington, DE', status: 'Active', province: 'Northeastern' },
  { name: 'Flint (MI) Alumni Chapter', chartered: 1947, location: 'Flint, MI', status: 'Active', province: 'Northern' },
  { name: 'Orlando (FL) Alumni Chapter', chartered: 1947, location: 'Orlando, FL', status: 'Active', province: 'Southern' },
  { name: 'Cheraw (SC) Alumni Chapter', chartered: 1947, location: 'Cheraw, SC', status: 'Active', province: 'Southeastern' },
  { name: 'Berkeley (CA) Alumni Chapter', chartered: 1947, location: 'Oakland, CA', status: 'Active', province: 'Western' },
  { name: 'Phoenix (AZ) Alumni Chapter', chartered: 1947, location: 'Phoenix, AZ', status: 'Active', province: 'Western' },
  { name: 'Fort Worth (TX) Alumni Chapter', chartered: 1947, location: 'Fort Worth, TX', status: 'Active', province: 'Southwestern' },
  { name: 'Columbus (GA) Alumni Chapter', chartered: 1947, location: 'Columbus, GA', status: 'Active', province: 'Southeastern' },
  { name: 'Newark (NJ) Alumni Chapter', chartered: 1947, location: 'Newark, NJ', status: 'Active', province: 'Northeastern' },
  { name: 'Wilmington (NC) Alumni Chapter', chartered: 1948, location: 'Wilmington, NC', status: 'Active', province: 'Middle Eastern' },
  { name: 'Raleigh (NC) Alumni Chapter', chartered: 1948, location: 'Raleigh, NC', status: 'Active', province: 'Middle Eastern' },
  { name: 'Orangeburg (SC) Alumni Chapter', chartered: 1948, location: 'Orangeburg, SC', status: 'Active', province: 'Southeastern' },
  { name: 'Milwaukee (WI) Alumni Chapter', chartered: 1948, location: 'Milwaukee, WI', status: 'Active', province: 'North Central' },
  { name: 'Tyler (TX) Alumni Chapter', chartered: 1948, location: 'Tyler, TX', status: 'Active', province: 'Southwestern' },
  { name: 'Shreveport (LA) Alumni Chapter', chartered: 1948, location: 'Shreveport, LA', status: 'Active', province: 'Southwestern' },
  { name: 'Austin (TX) Alumni Chapter', chartered: 1949, location: 'Austin, TX', status: 'Active', province: 'Southwestern' },
  { name: 'Daytona Beach (FL) Alumni Chapter', chartered: 1949, location: 'Daytona Beach, FL', status: 'Active', province: 'Southern' },
  { name: 'Rocky Mount (NC) Alumni Chapter', chartered: 1949, location: 'Rocky Mount, NC', status: 'Active', province: 'Middle Eastern' },
  { name: 'Trenton (NJ) Alumni Chapter', chartered: 1949, location: 'Trenton, NJ', status: 'Active', province: 'Northeastern' },
  { name: 'Brooklyn-Long Island (NY) Alumni Chapter', chartered: 1949, location: 'Brooklyn-Long Island, NY', status: 'Active', province: 'Northeastern' },
  { name: 'Montgomery (AL) Alumni Chapter', chartered: 1949, location: 'Montgomery, AL', status: 'Active', province: 'Southern' },
  { name: 'Jackson (TN) Alumni Chapter', chartered: 1949, location: 'Jackson, TN', status: 'Active', province: 'South Central' },
  { name: 'Macon-Warner Robins (GA) Alumni Chapter', chartered: 1950, location: 'Macon-Warner Robins, GA', status: 'Active', province: 'Southeastern' },
  { name: 'Albany (GA) Alumni Chapter', chartered: 1950, location: 'Albany, GA', status: 'Active', province: 'Southeastern' },
  { name: 'Hartford (CT) Alumni Chapter', chartered: 1950, location: 'Hartford, CT', status: 'Active', province: 'Northeastern' },
  { name: 'Des Moines (IA) Alumni Chapter', chartered: 1950, location: 'Des Moines, IA', status: 'Active', province: 'North Central' },
  { name: 'San Diego (CA) Alumni Chapter', chartered: 1950, location: 'San Diego, CA', status: 'Active', province: 'Western' },
  { name: 'Mobile (AL) Alumni Chapter', chartered: 1950, location: 'Mobile, AL', status: 'Active', province: 'Southern' },
  { name: 'Winston-Salem (NC) Alumni Chapter', chartered: 1950, location: 'Winston-Salem, NC', status: 'Active', province: 'Middle Eastern' },
  { name: 'Boston (MA) Alumni Chapter', chartered: 1950, location: 'Boston, MA', status: 'Active', province: 'Northeastern' },
  { name: 'Roanoke (VA) Alumni Chapter', chartered: 1950, location: 'Roanoke, VA', status: 'Active', province: 'Eastern' },
  { name: 'Greenville (SC) Alumni Chapter', chartered: 1950, location: 'Greenville, SC', status: 'Active', province: 'Southeastern' },
  { name: 'Omaha (NE) Alumni Chapter', chartered: 1950, location: 'Omaha, NE', status: 'Active', province: 'Middle Western' },
  { name: 'Galveston (TX) Alumni Chapter', chartered: 1950, location: 'Galveston, TX', status: 'Active', province: 'Southwestern' },
  { name: 'Toledo (OH) Alumni Chapter', chartered: 1951, location: 'Toledo, OH', status: 'Active', province: 'Northern' },
  { name: 'Gadsden (AL) Alumni Chapter', chartered: 1951, location: 'Gadsden, AL', status: 'Active', province: 'Southern' },
  { name: 'Lawrenceville (VA) Alumni Chapter', chartered: 1952, location: 'Lawrenceville, VA', status: 'Active', province: 'Eastern' },
  { name: 'Hopkinsville-Fort Campbell (KY) Alumni Chapter', chartered: 1952, location: 'Hopkinsville, KY', status: 'Active', province: 'South Central' },
  { name: 'Augusta (GA) Alumni Chapter', chartered: 1952, location: 'Augusta, GA', status: 'Active', province: 'Southeastern' },
  { name: 'Port Arthur (TX) Alumni Chapter', chartered: 1953, location: 'Port Arthur, TX', status: 'Active', province: 'Southwestern' },
  { name: 'Pine Bluff (AR) Alumni Chapter', chartered: 1953, location: 'Pine Bluff, AR', status: 'Active', province: 'Southwestern' },
  { name: 'Portland (OR) Alumni Chapter', chartered: 1953, location: 'Portland, OR', status: 'Active', province: 'Western' },
  { name: 'Cape Charles-Accomac (VA) Alumni Chapter', chartered: 1953, location: 'Northampton & Accomack County, VA', status: 'Active', province: 'Eastern' },
  { name: 'Waco (TX) Alumni Chapter', chartered: 1953, location: 'Waco, TX', status: 'Active', province: 'Southwestern' },
  { name: 'Seattle (WA) Alumni Chapter', chartered: 1954, location: 'Seattle, WA', status: 'Active', province: 'Western' },
  { name: 'Greenville (MS) Alumni Chapter', chartered: 1954, location: 'Greenville, MS', status: 'Active', province: 'Southwestern' },
  { name: 'Denver (CO) Alumni Chapter', chartered: 1954, location: 'Denver, CO', status: 'Active', province: 'Middle Western' },
  { name: 'Fort Lauderdale (FL) Alumni Chapter', chartered: 1954, location: 'Fort Lauderdale, FL', status: 'Active', province: 'Southern' },
  { name: 'West Palm Beach (FL) Alumni Chapter', chartered: 1954, location: 'West Palm Beach, FL', status: 'Active', province: 'Southern' },
  { name: 'St. Paul-Minneapolis (MN) Alumni Chapter', chartered: 1954, location: 'St. Paul-Minneapolis, MN', status: 'Active', province: 'North Central' },
  { name: 'Akron (OH) Alumni Chapter', chartered: 1955, location: 'Akron, OH', status: 'Active', province: 'East Central' },
  { name: 'Asbury Park-Neptune (NJ) Alumni Chapter', chartered: 1955, location: 'Asbury Park, NJ', status: 'Active', province: 'Northeastern' },
  { name: 'East St. Louis (IL) Alumni Chapter', chartered: 1955, location: 'East St. Louis, IL', status: 'Active', province: 'North Central' },
  { name: 'Allendale (SC) Alumni Chapter', chartered: 1955, location: 'Allendale, SC', status: 'Active', province: 'Southeastern' },
  { name: 'Lake Charles (LA) Alumni Chapter', chartered: 1955, location: 'Lake Charles, LA', status: 'Active', province: 'Southwestern' },
  { name: 'Dover (DE) Alumni Chapter', chartered: 1956, location: 'Dover, DE', status: 'Active', province: 'Northeastern' },
  { name: 'Grambling (LA) Alumni Chapter', chartered: 1956, location: 'Grambling, LA', status: 'Active', province: 'Southwestern' },
  { name: 'Martinsville (VA) Alumni Chapter', chartered: 1956, location: 'Martinsville, VA', status: 'Active', province: 'Eastern' },
  { name: 'Wewoka (OK) Alumni Chapter', chartered: 1956, location: 'Wewoka, OK', status: 'Active', province: 'Middle Western' },
  { name: 'New Haven (CT) Alumni Chapter', chartered: 1956, location: 'New Haven, CT', status: 'Inactive', province: 'Northeastern' },
  { name: 'Williamson (WV) Alumni Chapter', chartered: 1956, location: 'Williamson, WV', status: 'Inactive', province: 'Middle Eastern' },
  { name: 'Fayetteville (NC) Alumni Chapter', chartered: 1956, location: 'Fayetteville, NC', status: 'Active', province: 'Middle Eastern' },
  { name: 'Amarillo (TX) Alumni Chapter', chartered: 1957, location: 'Amarillo, TX', status: 'Active', province: 'Southwestern' },
  { name: 'Gainesville (FL) Alumni Chapter', chartered: 1957, location: 'Gainesville, FL', status: 'Active', province: 'Southern' },
  { name: 'Florence (SC) Alumni Chapter', chartered: 1958, location: 'Florence, SC', status: 'Active', province: 'Southeastern' },
  { name: 'South Bend (IN) Alumni Chapter', chartered: 1958, location: 'South Bend, IN', status: 'Active', province: 'North Central' },
  { name: 'Ann Arbor-Ypsilanti-Inkster (MI) Alumni Chapter', chartered: 1958, location: 'Ann Arbor-Ypsilanti-Inkster, MI', status: 'Active', province: 'Northern' },
  { name: 'Tuscaloosa (AL) Alumni Chapter', chartered: 1958, location: 'Tuscaloosa, AL', status: 'Active', province: 'Southern' },
  { name: 'Evanston (IL) Alumni Chapter', chartered: 1959, location: 'Evanston, IL', status: 'Active', province: 'North Central' },
  { name: 'San Bernardino (CA) Alumni Chapter', chartered: 1959, location: 'San Bernardino, CA', status: 'Active', province: 'Western' },
  { name: 'Huntsville (AL) Alumni Chapter', chartered: 1960, location: 'Huntsville, AL', status: 'Active', province: 'Southern' },
  { name: 'Harrisburg (PA) Alumni Chapter', chartered: 1960, location: 'Harrisburg, PA', status: 'Active', province: 'Northeastern' },
  { name: 'Hattiesburg (MS) Alumni Chapter', chartered: 1960, location: 'Hattiesburg, MS', status: 'Active', province: 'Southwestern' },
  { name: 'Pasadena (CA) Alumni Chapter', chartered: 1961, location: 'Pasadena, CA', status: 'Active', province: 'Western' },
  { name: 'Alexandria (LA) Alumni Chapter', chartered: 1961, location: 'Alexandria, LA', status: 'Active', province: 'Southwestern' },
  { name: 'Opelousas (LA) Alumni Chapter', chartered: 1961, location: 'Opelousas, LA', status: 'Active', province: 'Southwestern' },
  { name: 'Athens (GA) Alumni Chapter', chartered: 1962, location: 'Athens, GA', status: 'Active', province: 'Southeastern' },
  { name: 'Meridian (MS) Alumni Chapter', chartered: 1962, location: 'Meridian, MS', status: 'Active', province: 'Southwestern' },
  { name: 'El Paso-Las Cruces (TX-NM) Alumni Chapter', chartered: 1962, location: 'El Paso, TX-Las Cruces, NM', status: 'Active', province: 'Southwestern' },
  { name: 'St. Petersburg (FL) Alumni Chapter', chartered: 1962, location: 'St. Petersburg, FL', status: 'Active', province: 'Southern' },
  { name: 'Lakeland (FL) Alumni Chapter', chartered: 1963, location: 'Lakeland, FL', status: 'Active', province: 'Southern' },
  { name: 'Lawton-Fort Sill (OK) Alumni Chapter', chartered: 1963, location: 'Lawton-Fort Sill, OK', status: 'Active', province: 'Middle Western' },
  { name: 'Monroe (LA) Alumni Chapter', chartered: 1963, location: 'Monroe, LA', status: 'Active', province: 'Southwestern' },
  { name: 'Natchez (MS) Alumni Chapter', chartered: 1964, location: 'Natchez, MS', status: 'Active', province: 'Southwestern' },
  { name: 'Germany Alumni Chapter', chartered: 1964, location: 'Kaiserslautern, Germany', status: 'Active', province: 'Northeastern' },
  { name: 'Las Vegas (NV) Alumni Chapter', chartered: 1964, location: 'Las Vegas, NV', status: 'Active', province: 'Western' },
  { name: 'Pontiac (MI) Alumni Chapter', chartered: 1965, location: 'Pontiac, MI', status: 'Active', province: 'Northern' },
  { name: 'Kingstree (SC) Alumni Chapter', chartered: 1965, location: 'Kingstree, SC', status: 'Active', province: 'Southeastern' },
  { name: 'Rock Hill (SC) Alumni Chapter', chartered: 1965, location: 'Rock Hill, SC', status: 'Active', province: 'Southeastern' },
  { name: 'Chicago Heights (IL) Alumni Chapter', chartered: 1965, location: 'Chicago Heights, IL', status: 'Active', province: 'North Central' },
  { name: 'Annapolis (MD) Alumni Chapter', chartered: 1965, location: 'Annapolis, MD', status: 'Active', province: 'Eastern' },
  { name: 'Gretna Alumni (LA) Chapter', chartered: 1966, location: 'Gretna, LA', status: 'Active', province: 'Southwestern' },
  { name: 'Smithfield (NC) Alumni Chapter', chartered: 1966, location: 'Smithfield, NC', status: 'Active', province: 'Middle Eastern' },
  { name: 'Galena Park Alumni (TX) Chapter', chartered: 1966, location: 'Galena Park, TX', status: 'Inactive', province: 'Southwestern' },
  { name: 'Prairie View (TX) Alumni Chapter', chartered: 1966, location: 'Prairie View, TX', status: 'Active', province: 'Southwestern' },
  { name: 'Riverside (CA) Alumni Chapter', chartered: 1967, location: 'Riverside, CA', status: 'Active', province: 'Western' },
  { name: 'Tucson-Sierra Vista (AZ) Alumni Chapter', chartered: 1967, location: 'Tucson, AZ', status: 'Active', province: 'Western' },
  { name: 'Benton Harbor (MI) Alumni Chapter', chartered: 1968, location: 'Benton Harbor, MI', status: 'Active', province: 'Northern' },
  { name: 'Poughkeepsie (NY) Alumni Chapter', chartered: 1968, location: 'Poughkeepsie, NY', status: 'Active', province: 'Northeastern' },
  { name: 'Atmore (AL) Alumni Chapter', chartered: 1969, location: 'Atmore, AL', status: 'Active', province: 'Southern' },
  { name: 'Burlington-Camden (NJ) Alumni Chapter', chartered: 1969, location: 'Burlington-Camden, NJ', status: 'Active', province: 'Northeastern' },
  { name: 'Fredericksburg (VA) Alumni Chapter', chartered: 1969, location: 'Fredericksburg, VA', status: 'Active', province: 'Eastern' },
  { name: 'Elizabeth City (NC) Alumni Chapter', chartered: 1970, location: 'Elizabeth City, NC', status: 'Active', province: 'Middle Eastern' },
  { name: 'Conway-Myrtle Beach (SC) Alumni Chapter', chartered: 1970, location: 'Conway-Myrtle Beach, SC', status: 'Active', province: 'Southeastern' },
  { name: 'Champaign-Urbana (IL) Alumni Chapter', chartered: 1970, location: 'Champaign-Urbana, IL', status: 'Active', province: 'North Central' },
  { name: 'Evansville (IN) Alumni Chapter', chartered: 1970, location: 'Evansville, IN', status: 'Active', province: 'North Central' },
  { name: 'San Jose (CA) Alumni Chapter', chartered: 1970, location: 'San Jose, CA', status: 'Active', province: 'Western' },
  { name: 'Wichita Falls (TX) Alumni Chapter', chartered: 1971, location: 'Wichita Falls, TX', status: 'Active', province: 'Southwestern' },
  { name: 'Aberdeen (MD) Alumni Chapter', chartered: 1971, location: 'Bel Air, MD', status: 'Active', province: 'Eastern' },
  { name: 'Lubbock (TX) Alumni Chapter', chartered: 1971, location: 'Lubbock, TX', status: 'Active', province: 'Southwestern' },
  { name: 'Albany (NY) Alumni Chapter', chartered: 1971, location: 'Albany, NY', status: 'Active', province: 'Northeastern' },
  { name: 'Fort Wayne (IN) Alumni Chapter', chartered: 1972, location: 'Fort Wayne, IN', status: 'Active', province: 'North Central' },
  { name: 'Honolulu (HI) Alumni Chapter', chartered: 1972, location: 'Honolulu, HI', status: 'Active', province: 'Western' },
  { name: 'Grand Rapids (MI) Alumni Chapter', chartered: 1972, location: 'Grand Rapids, MI', status: 'Active', province: 'Northern' },
  { name: 'Silver Spring (MD) Alumni Chapter', chartered: 1972, location: 'Silver Spring, MD', status: 'Active', province: 'Eastern' },
  { name: 'Saginaw (MI) Alumni Chapter', chartered: 1972, location: 'Saginaw, MI', status: 'Active', province: 'Northern' },
  { name: 'Texarkana (TX) Alumni Chapter', chartered: 1972, location: 'Texarkana, TX', status: 'Active', province: 'Southwestern' },
  { name: 'New Rochelle-White Plains (NY) Alumni Chapter', chartered: 1972, location: 'New Rochelle-White Plains, NY', status: 'Active', province: 'Northeastern' },
  { name: 'Bahamas Alumni Chapter', chartered: 1973, location: 'Nassau, Bahamas', status: 'Active', province: 'Southern' },
  { name: 'Rochester (NY) Alumni Chapter', chartered: 1973, location: 'Rochester, NY', status: 'Active', province: 'Northern' },
  { name: 'Langston (OK) Alumni Chapter', chartered: 1973, location: 'Langston, OK', status: 'Active', province: 'Middle Western' },
  { name: 'Syracuse (NY) Alumni Chapter', chartered: 1973, location: 'Syracuse, NY', status: 'Active', province: 'Northern' },
  { name: 'Clarksville (TN) Alumni Chapter', chartered: 1973, location: 'Clarksville, TN', status: 'Inactive', province: 'South Central' },
  { name: 'Peoria (IL) Alumni Chapter', chartered: 1973, location: 'Peoria, IL', status: 'Active', province: 'North Central' },
  { name: 'Beaumont (TX) Alumni Chapter', chartered: 1973, location: 'Beaumont, TX', status: 'Active', province: 'Southwestern' },
  { name: 'Portsmouth-Suffolk (VA) Alumni Chapter', chartered: 1973, location: 'Portsmouth-Suffolk, VA', status: 'Active', province: 'Eastern' },
  { name: 'Sacramento (CA) Alumni Chapter', chartered: 1974, location: 'Sacramento, CA', status: 'Active', province: 'Western' },
  { name: 'Colorado Springs (CO) Alumni Chapter', chartered: 1974, location: 'Colorado Springs, CO', status: 'Active', province: 'Middle Western' },
  { name: 'Stockton (CA) Alumni Chapter', chartered: 1974, location: 'Stockton, CA', status: 'Active', province: 'Western' },
  { name: 'Columbia (MD) Alumni Chapter', chartered: 1974, location: 'Columbia, MD', status: 'Active', province: 'Eastern' },
  { name: 'Anderson (IN) Alumni Chapter', chartered: 1974, location: 'Anderson, IN', status: 'Inactive', province: 'North Central' },
  { name: 'Blytheville (AR) Alumni Chapter', chartered: 1974, location: 'Blytheville, AR', status: 'Active', province: 'Southwestern' },
  { name: 'Moss Point (MS) Alumni Chapter', chartered: 1975, location: 'Moss Point, MS', status: 'Active', province: 'Southwestern' },
  { name: 'Beaufort (SC) Alumni Chapter', chartered: 1975, location: 'Beaufort, SC', status: 'Inactive', province: 'Southeastern' },
  { name: 'Waukegan (IL) Alumni Chapter', chartered: 1975, location: 'Waukegan, IL', status: 'Active', province: 'North Central' },
  { name: 'Rock Island (IL) Alumni Chapter', chartered: 1975, location: 'Rock Island, IL', status: 'Inactive', province: 'North Central' },
  { name: 'Charlottesville (VA) Alumni Chapter', chartered: 1975, location: 'Charlottesville, VA', status: 'Active', province: 'Eastern' },
  { name: 'Vallejo-Fairfield (CA) Alumni Chapter', chartered: 1975, location: 'Vallejo-Fairfield, CA', status: 'Active', province: 'Western' },
  { name: 'Gulfport (MS) Alumni Chapter', chartered: 1975, location: 'Gulfport, MS', status: 'Active', province: 'Southwestern' },
  { name: 'Aiken (SC) Alumni Chapter', chartered: 1975, location: 'Aiken, SC', status: 'Active', province: 'Southeastern' },
  { name: 'Frankfort (KY) Alumni Chapter', chartered: 1975, location: 'Frankfort, KY', status: 'Active', province: 'South Central' },
  { name: 'Sparta (GA) Alumni Chapter', chartered: 1975, location: 'Sparta, GA', status: 'Inactive', province: 'Southeastern' },
  { name: 'Farmville (VA) Alumni Chapter', chartered: 1975, location: 'Farmville, VA', status: 'Inactive', province: 'Eastern' },
  { name: 'Lynchburg (VA) Alumni Chapter', chartered: 1975, location: 'Lynchburg, VA', status: 'Active', province: 'Eastern' },
  { name: 'Maywood-Wheaton (IL) Alumni Chapter', chartered: 1976, location: 'Maywood-Wheaton, IL', status: 'Active', province: 'North Central' },
  { name: 'Norman (OK) Alumni Chapter', chartered: 1976, location: 'Norman, OK', status: 'Active', province: 'Middle Western' },
  { name: 'Stamford (CT) Alumni Chapter', chartered: 1976, location: 'Stamford, CT', status: 'Active', province: 'Northeastern' },
  { name: 'Alexandria-Fairfax (VA) Alumni Chapter', chartered: 1976, location: 'Alexandria-Fairfax, VA', status: 'Active', province: 'Eastern' },
  { name: 'Anniston-Piedmont (AL) Alumni Chapter', chartered: 1976, location: 'Anniston-Piedmont, AL', status: 'Active', province: 'Southern' },
  { name: 'Bowling Green (KY) Alumni Chapter', chartered: 1976, location: 'Bowling Green, KY', status: 'Active', province: 'South Central' },
  { name: 'Binghamton (NY) Alumni Chapter', chartered: 1976, location: 'Binghamton, NY', status: 'Inactive', province: 'Northeastern' },
  { name: 'Bakersfield (CA) Alumni Chapter', chartered: 1977, location: 'Bakersfield, CA', status: 'Active', province: 'Western' },
  { name: 'Pompano Beach (FL) Alumni Chapter', chartered: 1977, location: 'Pompano Beach, FL', status: 'Active', province: 'Southern' },
  { name: 'Salisbury (MD) Alumni Chapter', chartered: 1977, location: 'Salisbury, MD', status: 'Active', province: 'Eastern' },
  { name: 'Killeen (TX) Alumni Chapter', chartered: 1977, location: 'Killeen, TX', status: 'Active', province: 'Southwestern' },
  { name: 'Dothan (AL) Alumni Chapter', chartered: 1977, location: 'Dothan, AL', status: 'Active', province: 'Southern' },
  { name: 'Long Beach-Inglewood-South Bay (CA) Alumni Chapter', chartered: 1977, location: 'Long Beach-Inglewood-South Bay, CA', status: 'Active', province: 'Western' },
  { name: 'Ventura (CA) Alumni Chapter', chartered: 1977, location: 'Ventura, CA', status: 'Active', province: 'Western' },
  { name: 'Bloomington (IN) Alumni Chapter', chartered: 1977, location: 'Bloomington, IN', status: 'Inactive', province: 'North Central' },
  { name: 'Monterey (CA) Alumni Chapter', chartered: 1977, location: 'Monterey, CA', status: 'Active', province: 'Western' },
  { name: 'Kinston (NC) Alumni Chapter', chartered: 1977, location: 'Kinston, NC', status: 'Inactive', province: 'Middle Eastern' },
  { name: 'New Brunswick (NJ) Alumni Chapter', chartered: 1978, location: 'New Brunswick, NJ', status: 'Active', province: 'Northeastern' },
  { name: 'Walterboro (SC) Alumni Chapter', chartered: 1978, location: 'Walterboro, SC', status: 'Active', province: 'Southeastern' },
  { name: 'LaGrange (GA) Alumni Chapter', chartered: 1978, location: 'LaGrange, GA', status: 'Active', province: 'Southeastern' },
  { name: 'Palo Alto (CA) Alumni Chapter', chartered: 1978, location: 'Palo Alto, CA', status: 'Active', province: 'Western' },
  { name: 'Cocoa-Merritt Island (FL) Alumni Chapter', chartered: 1978, location: 'Cocoa-Merritt Island, FL', status: 'Active', province: 'Southern' },
  { name: 'Fort Myers (FL) Alumni Chapter', chartered: 1978, location: 'Fort Myers, FL', status: 'Active', province: 'Southern' },
  { name: 'Florence (AL) Alumni Chapter', chartered: 1979, location: 'Florence, AL', status: 'Active', province: 'Southern' },
  { name: 'Hyattsville-Landover (MD) Alumni Chapter', chartered: 1979, location: 'Hyattsville-Landover, MD', status: 'Active', province: 'Eastern' },
  { name: 'Selma (AL) Alumni Chapter', chartered: 1979, location: 'Selma, AL', status: 'Active', province: 'Southern' },
  { name: 'Carbondale (IL) Alumni Chapter', chartered: 1979, location: 'Carbondale, IL', status: 'Inactive', province: 'North Central' },
  { name: 'Bowling Green (OH) Alumni Chapter', chartered: 1980, location: 'Bowling Green, OH', status: 'Inactive', province: 'Northern' },
  { name: 'Madison (WI) Alumni Chapter', chartered: 1980, location: 'Madison, WI', status: 'Active', province: 'North Central' },
  { name: 'Terre Haute (IN) Alumni Chapter', chartered: 1980, location: 'Terre Haute, IN', status: 'Inactive', province: 'North Central' },
  { name: 'Sumter (SC) Alumni Chapter', chartered: 1980, location: 'Sumter, SC', status: 'Inactive', province: 'Southeastern' },
  { name: 'Prichard (AL) Alumni Chapter', chartered: 1980, location: 'Prichard, AL', status: 'Active', province: 'Southern' },
  { name: 'Muncie (IN) Alumni Chapter', chartered: 1980, location: 'Muncie, IN', status: 'Inactive', province: 'North Central' },
  { name: 'Fort Gregg-Adams (VA) Alumni Chapter', chartered: 1980, location: 'Gregg-Adams, VA', status: 'Active', province: 'Eastern' },
  { name: 'Sarasota (FL) Alumni Chapter', chartered: 1981, location: 'Sarasota, FL', status: 'Active', province: 'Southern' },
  { name: 'Corpus Christi (TX) Alumni Chapter', chartered: 1981, location: 'Corpus Christi, TX', status: 'Active', province: 'Southwestern' },
  { name: 'College Park (GA) Alumni Chapter', chartered: 1981, location: 'College Park, GA', status: 'Active', province: 'Southeastern' },
  { name: 'Decatur (GA) Alumni Chapter', chartered: 1981, location: 'Decatur, GA', status: 'Active', province: 'Southeastern' },
  { name: 'Lansing (MI) Alumni Chapter', chartered: 1981, location: 'Lansing, MI', status: 'Active', province: 'Northern' },
  { name: 'Asheville (NC) Alumni Chapter', chartered: 1981, location: 'Asheville, NC', status: 'Active', province: 'Middle Eastern' },
  { name: 'Fort Knox (KY) Alumni Chapter', chartered: 1981, location: 'Fort Knox, KY', status: 'Active', province: 'South Central' },
  { name: 'Korea Alumni Chapter', chartered: 1981, location: 'Seoul, South Korea', status: 'Active', province: 'Western' },
  { name: 'Northport (AL) Alumni Chapter', chartered: 1981, location: 'Northport, AL', status: 'Active', province: 'Southern' },
  { name: 'Joliet (IL) Alumni Chapter', chartered: 1981, location: 'Joliet, IL', status: 'Active', province: 'North Central' },
  { name: 'Willingboro-Fort Dix-McGuire Air Force Base (NJ) Alumni Chapter', chartered: 1981, location: 'Willingboro-Fort Dix-McGuire Air Force Base, NJ', status: 'Active', province: 'Northeastern' },
  { name: 'Daphne (AL) Alumni Chapter', chartered: 1981, location: 'Daphne, AL', status: 'Active', province: 'Southern' },
  { name: 'Anchorage (AK) Alumni Chapter', chartered: 1981, location: 'Anchorage, AK', status: 'Active', province: 'Western' },
  { name: 'Iowa City-Cedar Rapids (IA) Alumni Chapter', chartered: 1981, location: 'Iowa City-Cedar Rapids, IA', status: 'Active', province: 'North Central' },
  { name: 'Columbia (MO) Alumni Chapter', chartered: 1981, location: 'Columbia, MO', status: 'Active', province: 'Middle Western' },
  { name: 'Camden-Magnolia-El Dorado (AR) Alumni Chapter', chartered: 1981, location: 'Camden-Magnolia-El Dorado, AR', status: 'Active', province: 'Southwestern' },
  { name: 'Goldsboro (NC) Alumni Chapter', chartered: 1981, location: 'Goldsboro, NC', status: 'Active', province: 'Middle Eastern' },
  { name: 'Talladega-Sylacauga (AL) Alumni Chapter', chartered: 1982, location: 'Talladega-Sylacauga, AL', status: 'Active', province: 'Southern' },
  { name: 'Williamsburg (VA) Alumni Chapter', chartered: 1982, location: 'Williamsburg, VA', status: 'Inactive', province: 'Eastern' },
  { name: 'Belle Glade-Pahokee (FL) Alumni Chapter', chartered: 1982, location: 'Belle Glade-Pahokee, FL', status: 'Active', province: 'Southern' },
  { name: 'Frederick (MD) Alumni Chapter', chartered: 1982, location: 'Frederick, MD', status: 'Active', province: 'Eastern' },
  { name: 'Fort Pierce (FL) Alumni Chapter', chartered: 1982, location: 'Fort Pierce, FL', status: 'Active', province: 'Southern' },
  { name: 'Montclair (NJ) Alumni Chapter', chartered: 1982, location: 'Montclair, NJ', status: 'Active', province: 'Northeastern' },
  { name: 'Moncks Corner (SC) Alumni Chapter', chartered: 1982, location: 'Moncks Corner, SC', status: 'Active', province: 'Southeastern' },
  { name: 'Delray Beach (FL) Alumni Chapter', chartered: 1983, location: 'Delray Beach, FL', status: 'Active', province: 'Southern' },
  { name: 'Paducah (KY) Alumni Chapter', chartered: 1983, location: 'Paducah, KY', status: 'Active', province: 'South Central' },
  { name: 'Columbus (MS) Alumni Chapter', chartered: 1983, location: 'Columbus, MS', status: 'Active', province: 'Southwestern' },
  { name: 'Denmark (SC) Alumni Chapter', chartered: 1983, location: 'Denmark, SC', status: 'Active', province: 'Southeastern' },
  { name: 'Kalamazoo (MI) Alumni Chapter', chartered: 1983, location: 'Kalamazoo, MI', status: 'Active', province: 'Northern' },
  { name: 'Valdosta (GA) Alumni Chapter', chartered: 1983, location: 'Valdosta, GA', status: 'Active', province: 'Southeastern' },
  { name: 'Fort Benning (GA) Alumni Chapter', chartered: 1984, location: 'Fort Moore, GA', status: 'Inactive', province: 'Southeastern' },
  { name: 'Kenner (LA) Alumni Chapter', chartered: 1984, location: 'Kenner, LA', status: 'Active', province: 'Southwestern' },
  { name: 'Chesapeake-Virginia Beach (VA) Alumni Chapter', chartered: 1984, location: 'Chesapeake-Virginia Beach, VA', status: 'Active', province: 'Eastern' },
  { name: 'Erie (PA) Alumni Chapter', chartered: 1984, location: 'Erie, PA', status: 'Active', province: 'East Central' },
  { name: 'Richfield-Bloomington (MN) Alumni Chapter', chartered: 1984, location: 'Richfield-Bloomington, MN', status: 'Active', province: 'North Central' },
  { name: 'Upper Marlboro-Waldorf (MD) Alumni Chapter', chartered: 1984, location: 'Upper Marlboro-Waldorf, MD', status: 'Active', province: 'Eastern' },
  { name: 'Lumberton (NC) Alumni Chapter', chartered: 1984, location: 'Lumberton, NC', status: 'Active', province: 'Middle Eastern' },
  { name: 'Bermuda Alumni Chapter', chartered: 1985, location: 'Hamilton, Bermuda', status: 'Active', province: 'Eastern' },
  { name: 'Bloomington-Normal (IL) Alumni Chapter', chartered: 1985, location: 'Bloomington-Normal, IL', status: 'Active', province: 'North Central' },
  { name: 'Hinesville (GA) Alumni Chapter', chartered: 1985, location: 'Hinesville, GA', status: 'Inactive', province: 'Southeastern' },
  { name: 'Albuquerque (NM) Alumni Chapter', chartered: 1985, location: 'Albuquerque, NM', status: 'Active', province: 'Southwestern' },
  { name: 'Tacoma (WA) Alumni Chapter', chartered: 1985, location: 'Tacoma, WA', status: 'Active', province: 'Western' },
  { name: 'Ahoskie (NC) Alumni Chapter', chartered: 1985, location: 'Ahoskie, NC', status: 'Active', province: 'Middle Eastern' },
  { name: 'Norristown (PA) Alumni Chapter', chartered: 1986, location: 'Norristown, PA', status: 'Active', province: 'Northeastern' },
  { name: 'Tallulah (LA) Alumni Chapter', chartered: 1986, location: 'Tallulah, LA', status: 'Inactive', province: 'Southwestern' },
  { name: 'Greenville (NC) Alumni Chapter', chartered: 1986, location: 'Greenville, NC', status: 'Active', province: 'Middle Eastern' },
  { name: 'Fort Polk (LA) Alumni Chapter', chartered: 1986, location: 'Fort Johnson South, LA', status: 'Inactive', province: 'Southwestern' },
  { name: 'Southfield (MI) Alumni Chapter', chartered: 1986, location: 'Southfield, MI', status: 'Active', province: 'Northern' },
  { name: 'San Fernando Valley (CA) Alumni Chapter', chartered: 1986, location: 'San Fernando Valley, CA', status: 'Inactive', province: 'Western' },
  { name: 'Lafayette (LA) Alumni Chapter', chartered: 1986, location: 'Lafayette, LA', status: 'Active', province: 'Southwestern' },
  { name: 'Arlington-Grand Prairie (TX) Alumni Chapter', chartered: 1986, location: 'Arlington-Grand Prairie, TX', status: 'Active', province: 'Southwestern' },
  { name: 'Murfreesboro (TN) Alumni Chapter', chartered: 1986, location: 'Murfreesboro, TN', status: 'Active', province: 'South Central' },
  { name: 'Bellevue (WA) Alumni Chapter', chartered: 1987, location: 'Bellevue, WA', status: 'Active', province: 'Western' },
  { name: 'Englewood-Teaneck (NJ) Alumni Chapter', chartered: 1987, location: 'Englewood-Teaneck, NJ', status: 'Active', province: 'Northeastern' },
  { name: 'Vicksburg (MS) Alumni Chapter', chartered: 1987, location: 'Vicksburg, MS', status: 'Active', province: 'Southwestern' },
  { name: 'Holly Springs (MS) Alumni Chapter', chartered: 1987, location: 'Holly Springs, MS', status: 'Inactive', province: 'South Central' },
  { name: 'Canton (OH) Alumni Chapter', chartered: 1987, location: 'Canton, OH', status: 'Active', province: 'East Central' },
  { name: 'Auburn-Opelika (AL) Alumni Chapter', chartered: 1987, location: 'Auburn-Opelika, AL', status: 'Active', province: 'Southern' },
  { name: 'Kennewick-Richland-Pasco (WA) Alumni Chapter', chartered: 1988, location: 'Kennewick-Richland-Pasco, WA', status: 'Active', province: 'Western' },
  { name: 'Gastonia-Shelby (NC) Alumni Chapter', chartered: 1988, location: 'Gastonia-Shelby, NC', status: 'Active', province: 'Middle Eastern' },
  { name: 'Plainfield (NJ) Alumni Chapter', chartered: 1988, location: 'Plainfield, NJ', status: 'Active', province: 'Northeastern' },
  { name: 'Fort Walton Beach (FL) Alumni Chapter', chartered: 1988, location: 'Fort Walton Beach, FL', status: 'Active', province: 'Southern' },
  { name: 'Chester (PA) Alumni Chapter', chartered: 1988, location: 'Chester, PA', status: 'Active', province: 'Northeastern' },
  { name: 'Missouri City-Sugarland (TX) Alumni Chapter', chartered: 1988, location: 'Missouri City-Sugarland, TX', status: 'Active', province: 'Southwestern' },
  { name: 'Panama Alumni Chapter', chartered: 1988, location: 'Panama City, Panama', status: 'Inactive', province: 'Southern' },
  { name: 'Providence (RI) Alumni Chapter', chartered: 1988, location: 'Providence, RI', status: 'Active', province: 'Northeastern' },
  { name: 'Stone Mountain-Lithonia (GA) Alumni Chapter', chartered: 1988, location: 'Stone Mountain-Lithonia, GA', status: 'Active', province: 'Southeastern' },
  { name: 'Thomasville (GA) Alumni Chapter', chartered: 1988, location: 'Thomasville, GA', status: 'Active', province: 'Southeastern' },
  { name: 'Gaithersburg-Rockville (MD) Alumni Chapter', chartered: 1989, location: 'Gaithersburg-Rockville, MD', status: 'Active', province: 'Eastern' },
  { name: 'Japan Alumni Chapter', chartered: 1989, location: 'Okinawa, Japan', status: 'Active', province: 'Western' },
  { name: 'Lincoln (NE) Alumni Chapter', chartered: 1989, location: 'Lincoln, NE', status: 'Active', province: 'Middle Western' },
  { name: 'Springfield (MA) Alumni Chapter', chartered: 1989, location: 'Springfield, MA', status: 'Active', province: 'Northeastern' },
  { name: 'Fort Drum (NY) Alumni Chapter', chartered: 1989, location: 'Fort Drum, NY', status: 'Inactive', province: 'Northern' },
  { name: 'Alpharetta-Smyrna (GA) Alumni Chapter', chartered: 1989, location: 'Alpharetta-Smyrna, GA', status: 'Active', province: 'Southeastern' },
  { name: 'Grand Bahama Alumni Chapter', chartered: 1989, location: 'Freeport, Grand Bahama', status: 'Inactive', province: 'Southern' },
  { name: 'Cary (NC) Alumni Chapter', chartered: 1989, location: 'Cary, NC', status: 'Active', province: 'Middle Eastern' },
  { name: 'Queens (NY) Alumni Chapter', chartered: 1990, location: 'Queens, NY', status: 'Active', province: 'Northeastern' },
  { name: 'Germantown (TN) Alumni Chapter', chartered: 1990, location: 'Germantown, TN', status: 'Active', province: 'South Central' },
  { name: 'United Kingdom Alumni Chapter', chartered: 1990, location: 'London, England', status: 'Active', province: 'Northeastern' },
  { name: 'Natchitoches (LA) Alumni Chapter', chartered: 1991, location: 'Natchitoches, LA', status: 'Active', province: 'Southwestern' },
  { name: 'Greenwood (SC) Alumni Chapter', chartered: 1991, location: 'Greenwood, SC', status: 'Active', province: 'Southeastern' },
  { name: 'Victorville (CA) Alumni Chapter', chartered: 1991, location: 'Victorville, CA', status: 'Inactive', province: 'Western' },
  { name: 'Winter Park (FL) Alumni Chapter', chartered: 1992, location: 'Winter Park, FL', status: 'Active', province: 'Southern' },
  { name: 'Brunswick (GA) Alumni Chapter', chartered: 1993, location: 'Brunswick, GA', status: 'Active', province: 'Southeastern' },
  { name: 'Evergreen Park (IL) Alumni Chapter', chartered: 1993, location: 'Evergreen Park, IL', status: 'Active', province: 'North Central' },
  { name: 'Richardson-Plano (TX) Alumni Chapter', chartered: 1994, location: 'Richardson-Plano, TX', status: 'Active', province: 'Southwestern' },
  { name: 'Anderson (SC) Alumni Chapter', chartered: 1994, location: 'Anderson, SC', status: 'Active', province: 'Southeastern' },
  { name: 'Longview-Kilgore (TX) Alumni Chapter', chartered: 1994, location: 'Longview-Kilgore, TX', status: 'Inactive', province: 'Southwestern' },
  { name: 'Hendersonville (TN) Alumni Chapter', chartered: 1995, location: 'Hendersonville, TN', status: 'Active', province: 'South Central' },
  { name: 'Bossier City (LA) Alumni Chapter', chartered: 1995, location: 'Bossier City, LA', status: 'Active', province: 'Southwestern' },
  { name: 'Franklin-Southampton (VA) Alumni Chapter', chartered: 1995, location: 'Franklin-Southampton, VA', status: 'Active', province: 'Eastern' },
  { name: 'Lancaster-Palmdale (CA) Alumni Chapter', chartered: 1995, location: 'Lancaster-Palmdale, CA', status: 'Active', province: 'Western' },
  { name: 'Saint Thomas USVI Alumni Chapter', chartered: 1995, location: 'Charlotte Amalie, U.S. Virgin Islands', status: 'Inactive', province: 'Southern' },
  { name: 'Fayetteville (AR) Alumni Chapter', chartered: 1996, location: 'Fayetteville, AR', status: 'Active', province: 'Middle Western' },
  { name: 'Rayville (LA) Alumni Chapter', chartered: 1996, location: 'Rayville, LA', status: 'Active', province: 'Southwestern' },
  { name: 'Denton-Lewisville (TX) Alumni Chapter', chartered: 1997, location: 'Denton-Lewisville, TX', status: 'Active', province: 'Southwestern' },
  { name: 'Gaffney (SC) Alumni Chapter', chartered: 1997, location: 'Gaffney, SC', status: 'Active', province: 'Southeastern' },
  { name: 'Richmond-Perrine (FL) Alumni Chapter', chartered: 1997, location: 'Richmond-Perrine, FL', status: 'Active', province: 'Southern' },
  { name: 'Woodbridge (VA) Alumni Chapter', chartered: 1998, location: 'Woodbridge, VA', status: 'Active', province: 'Eastern' },
  { name: 'West Helena (AR) Alumni Chapter', chartered: 1998, location: 'West Helena, AR', status: 'Active', province: 'Southwestern' },
  { name: 'Danville (VA) Alumni Chapter', chartered: 1998, location: 'Danville, VA', status: 'Active', province: 'Eastern' },
  { name: 'Houma-Thibodaux (LA) Alumni Chapter', chartered: 1998, location: 'Houma-Thibodaux, LA', status: 'Active', province: 'Southwestern' },
  { name: 'DeKalb (IL) Alumni Chapter', chartered: 1998, location: 'DeKalb, IL', status: 'Inactive', province: 'North Central' },
  { name: 'Saint Croix USVI Alumni Chapter', chartered: 2000, location: 'Christiansted, U.S. Virgin Islands', status: 'Active', province: 'Southern' },
  { name: 'Tupelo (MS) Alumni Chapter', chartered: 2000, location: 'Tupelo, MS', status: 'Inactive', province: 'South Central' },
  { name: 'Blacksburg (VA) Alumni Chapter', chartered: 2001, location: 'Blacksburg, VA', status: 'Inactive', province: 'Eastern' },
  { name: 'Jonesboro (AR) Alumni Chapter', chartered: 2001, location: 'Jonesboro, AR', status: 'Active', province: 'Southwestern' },
  { name: 'Camden (SC) Alumni Chapter', chartered: 2001, location: 'Camden, SC', status: 'Active', province: 'Southeastern' },
  { name: 'Hinesville-Fort Stewart (GA) Alumni Chapter', chartered: 2002, location: 'Hinesville-Fort Stewart, GA', status: 'Inactive', province: 'Southeastern' },
  { name: 'Canton-Madison (MS) Alumni Chapter', chartered: 2002, location: 'Canton-Madison, MS', status: 'Active', province: 'Southwestern' },
  { name: 'Conway (AR) Alumni Chapter', chartered: 2003, location: 'Conway, AR', status: 'Active', province: 'Southwestern' },
  { name: 'Atlantic City (NJ) Alumni Chapter', chartered: 2003, location: 'Atlantic City, NJ', status: 'Active', province: 'Northeastern' },
  { name: 'Cleveland (MS) Alumni Chapter', chartered: 2003, location: 'Cleveland, MS', status: 'Active', province: 'Southwestern' },
  { name: 'Independence (MO) Alumni Chapter', chartered: 2003, location: 'Independence, MO', status: 'Active', province: 'Middle Western' },
  { name: 'Stockbridge-Jonesboro (GA) Alumni Chapter', chartered: 2003, location: 'Stockbridge-Jonesboro, GA', status: 'Active', province: 'Southeastern' },
  { name: 'Spartanburg (SC) Alumni Chapter', chartered: 2003, location: 'Spartanburg, SC', status: 'Active', province: 'Southeastern' },
  { name: 'Bowie-Mitchellville (MD) Alumni Chapter', chartered: 2003, location: 'Bowie-Mitchellville, MD', status: 'Active', province: 'Eastern' },
  { name: 'Harvey-Markham (IL) Alumni Chapter', chartered: 2004, location: 'Harvey-Markham, IL', status: 'Active', province: 'North Central' },
  { name: 'Fresno (CA) Alumni Chapter', chartered: 2004, location: 'Fresno, CA', status: 'Active', province: 'Western' },
  { name: 'Hartsville (SC) Alumni Chapter', chartered: 2004, location: 'Hartsville, SC', status: 'Active', province: 'Southeastern' },
  { name: 'Roseville (CA) Alumni Chapter', chartered: 2004, location: 'Roseville, CA', status: 'Active', province: 'Western' },
  { name: 'Johannesburg-Pretoria South Africa Alumni Chapter', chartered: 2004, location: 'Johannesburg-Pretoria, South Africa', status: 'Active', province: 'Southeastern' },
  { name: 'Roanoke Rapids (NC) Alumni Chapter', chartered: 2005, location: 'Roanoke Rapids, NC', status: 'Active', province: 'Middle Eastern' },
  { name: 'College Park-Sandy Spring (MD) Alumni Chapter', chartered: 2005, location: 'College Park-Sandy Spring, MD', status: 'Active', province: 'Eastern' },
  { name: 'Carrollton-Douglasville (GA) Alumni Chapter', chartered: 2005, location: 'Carrollton-Douglasville, GA', status: 'Active', province: 'Southeastern' },
  { name: 'Beverly Hills-Century City (CA) Alumni Chapter', chartered: 2005, location: 'Beverly Hills-Century City, CA', status: 'Active', province: 'Western' },
  { name: 'Abington-Ambler (PA) Alumni Chapter', chartered: 2005, location: 'Abington-Ambler, PA', status: 'Active', province: 'Northeastern' },
  { name: 'Hammond (LA) Alumni Chapter', chartered: 2006, location: 'Hammond, LA', status: 'Active', province: 'Southwestern' },
  { name: 'Miramar-Pembroke Pines (FL) Alumni Chapter', chartered: 2007, location: 'Miramar-Pembroke Pines, FL', status: 'Active', province: 'Southern' },
  { name: 'Decatur-Athens (AL) Alumni Chapter', chartered: 2007, location: 'Decatur-Athens, AL', status: 'Active', province: 'Southern' },
  { name: 'Cape Town-Western Cape South Africa Alumni Chapter', chartered: 2007, location: 'Cape Town-Western Cape, South Africa', status: 'Inactive', province: 'Southeastern' },
  { name: 'Statesboro (GA) Alumni Chapter', chartered: 2007, location: 'Statesboro, GA', status: 'Active', province: 'Southeastern' },
  { name: 'Fort Washington (MD) Alumni Chapter', chartered: 2007, location: 'Fort Washington, MD', status: 'Active', province: 'Eastern' },
  { name: 'Richton Park (IL) Alumni Chapter', chartered: 2007, location: 'Richton Park, IL', status: 'Active', province: 'North Central' },
  { name: 'Lawrenceville-Duluth (GA) Alumni Chapter', chartered: 2008, location: 'Lawrenceville-Duluth, GA', status: 'Active', province: 'Southeastern' },
  { name: 'Belleville-O\'Fallon (IL) Alumni Chapter', chartered: 2008, location: 'Belleville-O\'Fallon, IL', status: 'Active', province: 'North Central' },
  { name: 'Hot Springs-Arkadelphia-Malvern (AR) Alumni Chapter', chartered: 2008, location: 'Hot Springs-Arkadelphia-Malvern, AR', status: 'Active', province: 'Southwestern' },
  { name: 'Oxford (MS) Alumni Chapter', chartered: 2009, location: 'Oxford, MS', status: 'Active', province: 'South Central' },
  { name: 'Jersey City (NJ) Alumni Chapter', chartered: 2009, location: 'Jersey City, NJ', status: 'Active', province: 'Northeastern' },
  { name: 'Bronx (NY) Alumni Chapter', chartered: 2009, location: 'Bronx, NY', status: 'Active', province: 'Northeastern' },
  { name: 'Dulles-Leesburg (VA) Alumni Chapter', chartered: 2009, location: 'Dulles-Leesburg, VA', status: 'Active', province: 'Eastern' },
  { name: 'Edisto (SC) Alumni Chapter', chartered: 2009, location: 'Edisto, SC', status: 'Active', province: 'Southeastern' },
  { name: 'Lagos Nigeria Alumni Chapter', chartered: 2009, location: 'Lagos, Nigeria', status: 'Active', province: 'Southeastern' },
  { name: 'Maplewood-Oranges (NJ) Alumni Chapter', chartered: 2009, location: 'Maplewood-Oranges, NJ', status: 'Active', province: 'Northeastern' },
  { name: 'Leonardtown-Prince Frederick (MD) Alumni Chapter', chartered: 2009, location: 'Leonardtown-Prince Frederick, MD', status: 'Inactive', province: 'Eastern' },
  { name: 'Spring-The Woodlands-Huntsville (TX) Alumni Chapter', chartered: 2009, location: 'Spring-The Woodlands-Huntsville, TX', status: 'Active', province: 'Southwestern' },
  { name: 'Mansfield-Cedar Hill (TX) Alumni Chapter', chartered: 2009, location: 'Mansfield-Cedar Hill, TX', status: 'Active', province: 'Southwestern' },
  { name: 'Carlsbad-Laguna-Temecula (CA) Alumni Chapter', chartered: 2009, location: 'Carlsbad-Laguna-Temecula, CA', status: 'Active', province: 'Western' },
  { name: 'Brentwood (TN) Alumni Chapter', chartered: 2010, location: 'Brentwood, TN', status: 'Active', province: 'South Central' },
  { name: 'Irvine-Anaheim (CA) Alumni Chapter', chartered: 2011, location: 'Irvine-Anaheim, CA', status: 'Active', province: 'Western' },
  { name: 'Alabaster-Pelham (AL) Alumni Chapter', chartered: 2011, location: 'Albaster-Pelham, AL', status: 'Active', province: 'Southern' },
  { name: 'Conyers-Covington (GA) Alumni Chapter', chartered: 2011, location: 'Conyers-Covington, GA', status: 'Active', province: 'Southeastern' },
  { name: 'Burlington (NC) Alumni Chapter', chartered: 2011, location: 'Burlington, NC', status: 'Active', province: 'Middle Eastern' },
  { name: 'Wake Forest-Rolesville (NC) Alumni Chapter', chartered: 2011, location: 'Wake Forest-Rolesville, NC', status: 'Active', province: 'Middle Eastern' },
  { name: 'Edwardsville-Collinsville (IL) Alumni Chapter', chartered: 2013, location: 'Edwardsville-Collinsville, IL', status: 'Active', province: 'North Central' },
  { name: 'Hickory (NC) Alumni Chapter', chartered: 2013, location: 'Hickory, NC', status: 'Active', province: 'Middle Eastern' },
  { name: 'Corning-Elmira (NY) Alumni Chapter', chartered: 2013, location: 'Corning-Elmira, NY', status: 'Active', province: 'Northern' },
  { name: 'Troy (AL) Alumni Chapter', chartered: 2013, location: 'Troy, AL', status: 'Active', province: 'Southern' },
  { name: 'Southaven (MS) Alumni Chapter', chartered: 2013, location: 'Southaven, MS', status: 'Active', province: 'South Central' },
  { name: 'Salt Lake City-Ogden (UT) Alumni Chapter', chartered: 2013, location: 'Salt Lake City-Ogden, UT', status: 'Inactive', province: 'Western' },
  { name: 'San Fernando-Santa Clarita (CA) Alumni Chapter', chartered: 2013, location: 'San Fernando-Santa Clarita, CA', status: 'Active', province: 'Western' },
  { name: 'Beaufort-Jasper-Hilton Head (SC) Alumni Chapter', chartered: 2014, location: 'Beaufort-Jasper-Hilton Head, SC', status: 'Active', province: 'Southeastern' },
  { name: 'New Bern (NC) Alumni Chapter', chartered: 2014, location: 'New Bern, NC', status: 'Active', province: 'Middle Eastern' },
  { name: 'Bishopville-Manning-Shaw AFB (SC) Alumni Chapter', chartered: 2016, location: 'Bishopville-Manning-Shaw AFB, SC', status: 'Active', province: 'Southeastern' },
  { name: 'Newnan-Fairburn (GA) Alumni Chapter', chartered: 2016, location: 'Newnan-Fairburn, GA', status: 'Active', province: 'Southeastern' },
  { name: 'West Memphis-Marion (AR) Alumni Chapter', chartered: 2016, location: 'West Memphis-Marion, AR', status: 'Active', province: 'Southwestern' },
  { name: 'Leesburg (FL) Alumni Chapter', chartered: 2016, location: 'Leesburg, FL', status: 'Active', province: 'Southern' },
  { name: 'Clarksdale (MS) Alumni Chapter', chartered: 2016, location: 'Clarksdale, MS', status: 'Active', province: 'South Central' },
  { name: 'Americus-Sumter (GA) Alumni Chapter', chartered: 2017, location: 'Americus-Sumter, GA', status: 'Active', province: 'Southeastern' },
  { name: 'Dublin (GA) Alumni Chapter', chartered: 2017, location: 'Dublin, GA', status: 'Active', province: 'Southeastern' },
  { name: 'Corinth (MS) Alumni Chapter', chartered: 2017, location: 'Corinth, MS', status: 'Active', province: 'South Central' },
  { name: 'Calumet City-Lansing (IL) Alumni Chapter', chartered: 2018, location: 'Calumet City-Lansing, IL', status: 'Active', province: 'North Central' },
  { name: 'Newport-Covington (KY) Alumni Chapter', chartered: 2020, location: 'Newport-Covington, KY', status: 'Active', province: 'South Central' },
  { name: 'Pearland-Manvel-Fresno (TX) Alumni Chapter', chartered: 2020, location: 'Pearland-Manvel-Fresno, TX', status: 'Active', province: 'Southwestern' },
  { name: 'Commerce-Greenville (TX) Alumni Chapter', chartered: 2020, location: 'Commerce-Greenville, TX', status: 'Active', province: 'Southwestern' },
  { name: 'Abu Dhabi Alumni Chapter', chartered: 2020, location: 'Abu Dhabi, United Arab Emirates', status: 'Active', province: 'Southeastern' },
  { name: 'Canada Alumni Chapter', chartered: 2020, location: 'Toronto, Ontario', status: 'Active', province: 'Northern' },
  { name: 'Towson-Catonsville (MD) Alumni Chapter', chartered: 2021, location: 'Towson-Catonsville, MD', status: 'Active', province: 'Eastern' },
  { name: 'Nassau-Suffolk (NY) Alumni Chapter', chartered: 2022, location: 'Nassau-Suffolk, NY', status: 'Active', province: 'Northeastern' },
  { name: 'Katy-Fulshear (TX) Alumni Chapter', chartered: 2022, location: 'Katy-Fulshear, TX', status: 'Active', province: 'Southwestern' },
  { name: 'Frisco (TX) Alumni Chapter', chartered: 2022, location: 'Frisco, TX', status: 'Active', province: 'Southwestern' },
  { name: 'Bristol-Kingsport-Johnson City (TN) Alumni Chapter', chartered: 2022, location: 'Bristol-Kingsport-Johnson City, TN', status: 'Active', province: 'South Central' },
  { name: 'West Chester-Coatesville (PA) Alumni Chapter', chartered: 2022, location: 'West Chester-Coatesville, PA', status: 'Active', province: 'Northeastern' },
  { name: 'Brookfield (WI) Alumni Chapter', chartered: 2022, location: 'Brookfield, WI', status: 'Active', province: 'North Central' },
  { name: 'Greenwood-Grenada (MS) Alumni Chapter', chartered: 2022, location: 'Greenwood-Grenada, MS', status: 'Active', province: 'Southwestern' },
  { name: 'Dominican Republic Alumni Chapter', chartered: 2023, location: 'Punta Cana, Dominican Republic', status: 'Active', province: 'Southern' },
  { name: 'Gainesville-Manassas (VA) Alumni Chapter', chartered: 2023, location: 'Gainesville-Manassas, VA', status: 'Active', province: 'Eastern' },
  { name: 'Prattville (AL) Alumni Chapter', chartered: 2023, location: 'Prattville, AL', status: 'Active', province: 'Southern' },
  { name: 'Glendale-Peoria (AZ) Alumni Chapter', chartered: 2023, location: 'Glendale-Peoria, AZ', status: 'Active', province: 'Western' },
  { name: 'New Braunfels (TX) Alumni Chapter', chartered: 2023, location: 'New Braunfels, TX', status: 'Active', province: 'Southwestern' },
  { name: 'Grovetown-Evans-Martinez (GA) Alumni Chapter', chartered: 2023, location: 'Columbia County, GA', status: 'Active', province: 'Southeastern' },
  { name: 'Franklin (LA) Alumni Chapter', chartered: 2024, location: 'Franklin, LA', status: 'Active', province: 'Southwestern' },
  { name: 'Macomb (MI) Alumni Chapter', chartered: 2024, location: 'Macomb County, MI', status: 'Active', province: 'Northern' },
  { name: 'South Fulton (GA) Alumni Chapter', chartered: 2024, location: 'South Fulton, GA', status: 'Active', province: 'Southeastern' },
  { name: 'Oak Park-River Forest (IL) Alumni Chapter', chartered: 2024, location: 'Oak Park-River Forest, IL', status: 'Active', province: 'North Central' },
  { name: 'Slidell (LA) Alumni Chapter', chartered: 2024, location: 'Slidell, LA', status: 'Active', province: 'Southwestern' },
  { name: 'St. Augustine (FL) Alumni Chapter', chartered: 2024, location: 'St. Augustine, FL', status: 'Active', province: 'Southern' },
  { name: 'Sanford-Pinehurst (NC) Alumni Chapter', chartered: 2025, location: 'Sanford-Pinehurst, NC', status: 'Active', province: 'Middle Eastern' },
  { name: 'Diamond Bar-Ontario-Pomona (CA) Alumni Chapter', chartered: 2025, location: 'Diamond Bar-Ontario-Pomona, CA', status: 'Active', province: 'Western' },
];

async function seedAlumniChapters() {
  console.log(`Starting to seed ${alumniChapters.length} Alumni chapters...`);

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const chapterData of alumniChapters) {
    try {
      // Check if chapter already exists
      const existing = await pool.query(
        'SELECT id FROM chapters WHERE name = $1 AND type = $2',
        [chapterData.name, 'Alumni']
      );

      if (existing.rows.length > 0) {
        console.log(`Skipping duplicate: ${chapterData.name}`);
        skipped++;
        continue;
      }

      const { city, state } = parseLocation(chapterData.location);
      const status = parseStatus(chapterData.status);

      await createChapter({
        name: chapterData.name,
        type: 'Alumni',
        status,
        chartered: chapterData.chartered,
        province: chapterData.province,
        city,
        state,
        contact_email: null,
      });

      inserted++;
      if (inserted % 50 === 0) {
        console.log(`Inserted ${inserted} Alumni chapters...`);
      }
    } catch (error) {
      console.error(`Error inserting chapter ${chapterData.name}:`, error);
      errors++;
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Total Alumni chapters: ${alumniChapters.length}`);
  console.log(`Inserted: ${inserted}`);
  console.log(`Skipped (duplicates): ${skipped}`);
  console.log(`Errors: ${errors}`);
}

async function main() {
  try {
    await seedAlumniChapters();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    await pool.end();
    process.exit(1);
  }
}

main();

