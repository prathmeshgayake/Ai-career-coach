/**
 * Sanitizes raw HTML into readable plain text.
 */
export function stripHtml(html: string): string {
  if (!html) return '';

  return html
    // Remove script and style tags completely with their contents
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    // Replace block-level elements and line breaks with newlines
    .replace(/<\/(div|p|h[1-6]|li|tr|section|article)>/gi, '\n')
    .replace(/<br\s*[\/]?>/gi, '\n')
    // Remove all remaining HTML tags
    .replace(/<[^>]+>/g, ' ')
    // Decode common HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Normalize consecutive spaces and newlines
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n\n')
    .trim();
}

/**
 * Truncates and cleans general input strings.
 */
export function sanitizeString(input: unknown, maxLength = 10000): string {
  if (typeof input !== 'string') {
    return '';
  }
  // Remove null bytes and non-printable control characters except \r, \n, \t
  const cleaned = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  return cleaned.slice(0, maxLength).trim();
}

/**
 * Normalizes file paths and prevents path traversal (../).
 */
export function sanitizeFilePath(path: string): string {
  return path
    .replace(/\\/g, '/')
    .replace(/\.\.+[\/\\]/g, '')
    .replace(/^\/+/, '')
    .trim();
}

/**
 * Validates whether a commit SHA is a valid git hex SHA.
 */
export function isValidGitSha(sha: string): boolean {
  return /^[0-9a-f]{7,40}$/i.test(sha);
}
