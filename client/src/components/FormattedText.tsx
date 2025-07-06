import React from 'react';

// Rich Text Formatter - converts markdown-like syntax to HTML
export function formatRichText(text: string): string {
  if (!text) return '';
  
  return text
    // Bold text: **text** -> <strong>text</strong>
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic text: *text* -> <em>text</em>
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Underlined text: _text_ -> <u>text</u>
    .replace(/_(.*?)_/g, '<u>$1</u>')
    // Headers: ## text -> <h2>text</h2>
    .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mb-2">$1</h2>')
    // Smaller headers: ### text -> <h3>text</h3>
    .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mb-2">$1</h3>')
    // Bullet lists: - text -> • text
    .replace(/^- (.*$)/gm, '<div class="ml-4">• $1</div>')
    // Numbered lists: 1. text -> 1. text
    .replace(/^(\d+)\. (.*$)/gm, '<div class="ml-4">$1. $2</div>')
    // Line breaks
    .replace(/\n/g, '<br>');
}

// Component wrapper for formatted text display
export function FormattedText({ 
  text, 
  className = '',
  maxLength = null 
}: { 
  text: string | undefined | null; 
  className?: string;
  maxLength?: number | null;
}) {
  if (!text || text.trim() === '') return <span className={className}></span>;
  
  let displayText = text;
  let isTruncated = false;
  
  // Truncate if needed (before formatting to avoid breaking HTML tags)
  if (maxLength && text.length > maxLength) {
    displayText = text.substring(0, maxLength) + '...';
    isTruncated = true;
  }
  
  const formattedText = formatRichText(displayText);
  
  return (
    <div 
      className={`formatted-text ${className}`}
      dangerouslySetInnerHTML={{ __html: formattedText }}
    />
  );
}