export function debugLog(...content: string[]): void {
  if (process.env.NODE_ENV === 'development') {
    console.debug(content.join(' '));
  }
}
