/** @param {{ fileName: string }} file */
export function isVisiblePaperFile(file) {
  const name = file.fileName.trim().toLowerCase();

  // Match placeholder names exactly so resources about templates remain visible.
  const isPlaceholder = /^(?:temp|tmp)\d*(?:\.[^.]+)?$/.test(name);
  const isTemporary = name.startsWith('~$') || /(?:\.(?:tmp|temp|bak|swp|swo)|~)$/.test(name);
  const isMetadata = name.startsWith('.') || name === 'thumbs.db' || name === 'desktop.ini';

  return !!name && !/^readme/.test(name) && !name.endsWith('.md') &&
    !isPlaceholder && !isTemporary && !isMetadata;
}
