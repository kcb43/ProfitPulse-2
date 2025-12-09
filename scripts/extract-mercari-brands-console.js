/**
 * Mercari Brand Extractor - Enhanced Browser Console Script
 * 
 * This enhanced version automatically navigates through all letter sections (A-Z)
 * and extracts ALL brands from Mercari's brand index page.
 * 
 * Instructions:
 * 1. Navigate to Mercari's brand index page (e.g., https://www.mercari.com/us/brand/)
 * 2. Open browser console (F12)
 * 3. Paste this entire script and press Enter
 * 4. The script will automatically:
 *    - Extract brands from the current page
 *    - Navigate through all letter sections (A-Z)
 *    - Collect all brands from all pages
 *    - Output a complete sorted array
 * 5. The process may take a few minutes - be patient!
 * 
 * The output will be a JavaScript array of ALL brand names that can be used in the application.
 */

(function extractMercariBrands() {
  console.log('🔍 Mercari Brand Extractor (Enhanced) Started...');
  console.log('📄 This will extract brands from ALL letter sections (A-Z)...');
  console.log('⏳ This may take a few minutes. Please be patient!\n');

  const allBrands = new Set();
  const processedLetters = new Set();
  let currentLetterIndex = 0;
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  // Function to extract brands from current page
  const extractBrandsFromPage = () => {
    const brands = new Set();
    
    // Find all brand elements using the data-testid selector
    const brandElements = document.querySelectorAll('[data-testid="BrandIndexBrandName"]');
    
    brandElements.forEach(element => {
      // Try to find the <p> tag with the brand text
      const brandTextElement = element.querySelector('p.brandIndex__BrandText-sc-1c6ecbe-3') ||
                              element.querySelector('p[class*="brandIndex__BrandText"]') ||
                              element.querySelector('p');
      
      if (brandTextElement) {
        const brandName = brandTextElement.textContent?.trim();
        if (brandName && brandName.length > 0) {
          brands.add(brandName);
        }
      } else {
        // Fallback: get text directly from the element
        const brandName = element.textContent?.trim();
        if (brandName && brandName.length > 0) {
          brands.add(brandName);
        }
      }
    });
    
    return brands;
  };

  // Function to find and click letter navigation links
  const findLetterLink = (letter) => {
    // Try multiple selectors for letter navigation
    const selectors = [
      `a[href*="/brand/${letter.toLowerCase()}"]`,
      `a[href*="/brand/${letter}"]`,
      `button[aria-label*="${letter}"]`,
      `a:contains("${letter}")`,
      `[data-testid*="${letter}"]`,
    ];
    
    for (const selector of selectors) {
      try {
        const links = Array.from(document.querySelectorAll(selector));
        const link = links.find(el => {
          const text = el.textContent?.trim().toUpperCase();
          const href = el.getAttribute('href') || '';
          return text === letter || href.includes(`/brand/${letter.toLowerCase()}`) || href.includes(`/brand/${letter}`);
        });
        if (link) return link;
      } catch (e) {
        // Continue to next selector
      }
    }
    
    return null;
  };

  // Function to scroll and wait for content to load
  const waitForContent = async (maxWait = 5000) => {
    const startTime = Date.now();
    while (Date.now() - startTime < maxWait) {
      const elements = document.querySelectorAll('[data-testid="BrandIndexBrandName"]');
      if (elements.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Extra wait for dynamic content
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    return false;
  };

  // Main extraction function
  const extractAllBrands = async () => {
    try {
      // First, extract brands from the current page
      console.log('📄 Extracting brands from current page...');
      await waitForContent();
      const currentBrands = extractBrandsFromPage();
      currentBrands.forEach(brand => allBrands.add(brand));
      console.log(`✅ Current page: Found ${currentBrands.size} brands (Total so far: ${allBrands.size})`);

      // Try to find letter navigation
      console.log('\n🔍 Looking for letter navigation...');
      const letterLinks = [];
      
      // Try to find all letter links at once
      for (const letter of letters) {
        const link = findLetterLink(letter);
        if (link) {
          letterLinks.push({ letter, link });
        }
      }

      if (letterLinks.length === 0) {
        console.log('⚠️ No letter navigation found. Extracting from current page only.');
        console.log('💡 If the page has pagination, you may need to manually navigate through pages.');
      } else {
        console.log(`✅ Found ${letterLinks.length} letter links. Navigating through them...\n`);
        
        // Process each letter
        for (let i = 0; i < letterLinks.length; i++) {
          const { letter, link } = letterLinks[i];
          
          if (processedLetters.has(letter)) {
            console.log(`⏭️  Skipping ${letter} (already processed)`);
            continue;
          }

          console.log(`📌 Processing letter: ${letter} (${i + 1}/${letterLinks.length})`);
          
          try {
            // Click the letter link
            link.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await new Promise(resolve => setTimeout(resolve, 300));
            link.click();
            
            // Wait for page to load
            await new Promise(resolve => setTimeout(resolve, 1000));
            await waitForContent(5000);
            
            // Extract brands from this letter's page
            const letterBrands = extractBrandsFromPage();
            letterBrands.forEach(brand => allBrands.add(brand));
            
            processedLetters.add(letter);
            console.log(`   ✅ ${letter}: Found ${letterBrands.size} brands (Total: ${allBrands.size})`);
            
            // Small delay between letters to avoid overwhelming the page
            await new Promise(resolve => setTimeout(resolve, 500));
            
          } catch (error) {
            console.error(`   ❌ Error processing ${letter}:`, error);
            // Continue with next letter
          }
        }
      }

      // Check for pagination on current page
      console.log('\n🔍 Checking for pagination...');
      const nextButtons = Array.from(document.querySelectorAll('button, a')).filter(el => {
        const text = el.textContent?.trim().toLowerCase();
        return text.includes('next') || text.includes('more') || el.getAttribute('aria-label')?.toLowerCase().includes('next');
      });
      
      if (nextButtons.length > 0) {
        console.log(`⚠️ Found ${nextButtons.length} potential "next" buttons.`);
        console.log('💡 You may need to manually click through pagination if brands are split across multiple pages.');
      }

      // Final extraction from current page (in case we're on a different page now)
      const finalBrands = extractBrandsFromPage();
      finalBrands.forEach(brand => allBrands.add(brand));

      // Convert Set to Array and sort alphabetically
      const brandsArray = Array.from(allBrands);
      brandsArray.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

      console.log(`\n✅ Extraction complete! Found ${brandsArray.length} unique brands total.`);
      console.log(`📊 First brand: ${brandsArray[0]}`);
      console.log(`📊 Last brand: ${brandsArray[brandsArray.length - 1]}`);

      // Format as JavaScript array
      const brandsFormatted = brandsArray.map(brand => {
        // Escape quotes in brand names
        const escaped = brand.replace(/"/g, '\\"').replace(/\n/g, ' ').replace(/\r/g, '');
        return `  "${escaped}"`;
      }).join(',\n');
      
      const output = `const MERCARI_BRANDS = [\n${brandsFormatted}\n];`;

      // Try to copy to clipboard
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(output);
          console.log('\n✅ Brands copied to clipboard!');
          console.log('📋 Paste the output into CrosslistComposer.jsx');
        } else {
          throw new Error('Clipboard API not available');
        }
      } catch (clipboardError) {
        console.log('\n⚠️ Could not copy to clipboard (document may not be focused).');
        console.log('📋 Here is the output - you can manually copy it:');
        console.log('\n' + '='.repeat(80));
        console.log('COPY THE OUTPUT BELOW:');
        console.log('='.repeat(80) + '\n');
      }

      // Always log the output
      console.log(output);
      console.log('\n' + '='.repeat(80));
      console.log(`\n✅ Complete! Found ${brandsArray.length} unique brands.`);
      console.log('💡 Replace the MERCARI_BRANDS array in src/pages/CrosslistComposer.jsx with the output above.');

      return brandsArray;

    } catch (error) {
      console.error('❌ Error extracting brands:', error);
      console.log('💡 Make sure you are on Mercari\'s brand index page.');
      console.log('💡 The page should have elements with [data-testid="BrandIndexBrandName"]');
      
      // Still try to extract from current page
      try {
        const currentBrands = extractBrandsFromPage();
        console.log(`\n⚠️ Partial extraction: Found ${currentBrands.size} brands on current page.`);
        if (currentBrands.size > 0) {
          const brandsArray = Array.from(currentBrands).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
          const brandsFormatted = brandsArray.map(brand => {
            const escaped = brand.replace(/"/g, '\\"').replace(/\n/g, ' ').replace(/\r/g, '');
            return `  "${escaped}"`;
          }).join(',\n');
          console.log(`const MERCARI_BRANDS = [\n${brandsFormatted}\n];`);
        }
      } catch (e) {
        console.error('Failed to extract even from current page:', e);
      }
    }
  };

  // Run extraction
  extractAllBrands();
})();

