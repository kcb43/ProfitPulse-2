import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Cleans HTML from pasted text, preserving formatting like line breaks and bullet points
 * Removes HTML tags, fragments, and metadata while keeping readable text structure
 */
export function cleanHtmlText(text) {
  if (!text || typeof text !== 'string') return '';
  
  // Create a temporary div to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = text;
  
  // Remove script and style elements
  const scripts = tempDiv.querySelectorAll('script, style');
  scripts.forEach(el => el.remove());
  
  // Convert common HTML elements to text equivalents
  // Preserve line breaks from <br>, <p>, <div>
  const brs = tempDiv.querySelectorAll('br');
  brs.forEach(br => br.replaceWith('\n'));
  
  const paragraphs = tempDiv.querySelectorAll('p, div');
  paragraphs.forEach((p, index) => {
    if (index > 0) p.insertAdjacentText('beforebegin', '\n');
  });
  
  // Convert lists to text with bullet points
  const lists = tempDiv.querySelectorAll('ul, ol');
  lists.forEach(list => {
    const items = list.querySelectorAll('li');
    items.forEach((item, index) => {
      const text = item.textContent.trim();
      if (text) {
        item.textContent = `• ${text}`;
      }
    });
    list.insertAdjacentText('beforebegin', '\n');
  });
  
  // Get text content and clean up
  let cleaned = tempDiv.textContent || tempDiv.innerText || '';
  
  // Remove HTML comments and fragments
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');
  cleaned = cleaned.replace(/<!--StartFragment-->/g, '');
  cleaned = cleaned.replace(/<!--EndFragment-->/g, '');
  
  // Remove data attributes and HTML tags that might have leaked through
  cleaned = cleaned.replace(/<[^>]+>/g, '');
  cleaned = cleaned.replace(/data-[^=]+="[^"]*"/g, '');
  
  // Clean up excessive whitespace but preserve intentional line breaks
  cleaned = cleaned.replace(/[ \t]+/g, ' '); // Multiple spaces to single space
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n'); // More than 2 newlines to 2
  cleaned = cleaned.replace(/^\s+|\s+$/g, ''); // Trim start/end
  
  // Decode HTML entities
  const textarea = document.createElement('textarea');
  textarea.innerHTML = cleaned;
  cleaned = textarea.value;
  
  return cleaned;
} 