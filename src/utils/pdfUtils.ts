/**
 * Utility to accurately detect the total number of pages in a PDF file
 */
export async function detectPdfPageCount(file: File): Promise<number> {
  try {
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      return 1;
    }

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    // Decode text using latin1/ascii decoder
    const decoder = new TextDecoder('latin1');
    const text = decoder.decode(bytes);

    // Method 1: Look for root /Type /Pages ... /Count N
    const countMatches = text.match(/\/Type\s*\/Pages[\s\S]*?\/Count\s+(\d+)/i);
    if (countMatches && countMatches[1]) {
      const count = parseInt(countMatches[1], 10);
      if (!isNaN(count) && count > 0) {
        return count;
      }
    }

    // Method 2: Fallback scan for standalone /Count N
    const standaloneCount = text.match(/\/Count\s+(\d+)/);
    if (standaloneCount && standaloneCount[1]) {
      const count = parseInt(standaloneCount[1], 10);
      if (!isNaN(count) && count > 0 && count <= 500) {
        return count;
      }
    }

    // Method 3: Count individual /Type /Page objects (excluding /Type /Pages)
    const pageObjects = text.match(/\/Type\s*\/Page\b(?!s)/g);
    if (pageObjects && pageObjects.length > 0) {
      return pageObjects.length;
    }

    return 1;
  } catch (err) {
    console.warn('[PDF Utils] Could not calculate exact page count, defaulting to 1:', err);
    return 1;
  }
}
