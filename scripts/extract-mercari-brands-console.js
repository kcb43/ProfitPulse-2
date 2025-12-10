/**
 * Mercari Brand Extractor - Browser Console Script
 * 
 * This script extracts all brand names visible on the current page.
 * 
 * Instructions:
 * 1. Navigate to Mercari's brand index page (e.g., https://www.mercari.com/us/brand/)
 * 2. Scroll down to load all brands on the page (or navigate to the letter section you want)
 * 3. Open browser console (F12)
 * 4. Paste this entire script and press Enter
 * 5. The script will extract all brand names visible on the current page
 * 6. Brands will be sorted alphabetically and formatted as a JavaScript array
 * 
 * The output will be a JavaScript array of brand names that can be used in the application.
 */

(function extractMercariBrands() {
  console.log('🔍 Mercari Brand Extractor Started...');
  console.log('📄 Extracting brands from the current page...\n');

  const extractBrands = async () => {
    try {
      // Wait a moment for page to fully load
      await new Promise(resolve => setTimeout(resolve, 500));

      // Find all brand elements using the data-testid selector
      const brandElements = document.querySelectorAll('[data-testid="BrandIndexBrandName"]');
      
      if (brandElements.length === 0) {
        console.error('❌ No brand elements found.');
        console.log('💡 Make sure you are on Mercari\'s brand index page.');
        console.log('💡 Looking for elements with [data-testid="BrandIndexBrandName"]');
        return;
      }

      console.log(`✅ Found ${brandElements.length} brand elements`);

      // Extract brand names from the elements
      const brands = new Set(); // Use Set to handle duplicates
      
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

      if (brands.size === 0) {
        console.error('❌ No brand names extracted. The page structure may have changed.');
        console.log('💡 Debug: Found elements:', brandElements.length);
        if (brandElements.length > 0) {
          console.log('💡 First element structure:', brandElements[0]);
        }
        return;
      }

      // Convert Set to Array and sort alphabetically
      const brandsArray = Array.from(brands);
      brandsArray.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

      console.log(`✅ Extracted ${brandsArray.length} unique brands`);

      // Format as JavaScript array
      const brandsFormatted = brandsArray.map(brand => {
        // Escape quotes in brand names
        const escaped = brand.replace(/"/g, '\\"').replace(/\n/g, ' ').replace(/\r/g, '');
        return `  "${escaped}"`;
      }).join(',\n');
      
      const output = `const MERCARI_BRANDS = [\n${brandsFormatted}\n];`;

      // Try to copy to clipboard (may fail if document is not focused)
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(output);
          console.log('✅ Brands copied to clipboard!');
          console.log('📋 Paste the output into your code.');
        } else {
          throw new Error('Clipboard API not available');
        }
      } catch (clipboardError) {
        console.log('⚠️ Could not copy to clipboard (document may not be focused).');
        console.log('📋 Here is the output - you can manually copy it:');
        console.log('\n' + '='.repeat(80));
        console.log('COPY THE OUTPUT BELOW:');
        console.log('='.repeat(80) + '\n');
      }

      // Always log the output
      console.log(output);
      console.log('\n' + '='.repeat(80));
      
      // Also log summary
      console.log(`\n✅ Extraction complete! Found ${brandsArray.length} unique brands.`);
      console.log(`📊 First brand: ${brandsArray[0]}`);
      console.log(`📊 Last brand: ${brandsArray[brandsArray.length - 1]}`);
      console.log('💡 Tip: Click anywhere on the page and run the script again to copy to clipboard automatically.');

      return brandsArray;

    } catch (error) {
      console.error('❌ Error extracting brands:', error);
      console.log('💡 Make sure you are on Mercari\'s brand index page.');
      console.log('💡 The page should have elements with [data-testid="BrandIndexBrandName"]');
    }
  };

  // Run extraction
  extractBrands();
})();

