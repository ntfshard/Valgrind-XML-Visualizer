/**
 * Deduplication Module
 * Groups duplicate errors by signature (kind + top non-system frame or top frame).
 */

export class ErrorDeduplicator {
  /**
   * Deduplicate an array of Valgrind errors.
   * @param {Array} errors 
   * @param {boolean} enabled - Whether deduplication is active
   * @param {string} strategy - 'user_frame' (default) or 'exact_stack'
   * @returns {Array} Array of deduplicated error groups
   */
  static process(errors, enabled = true, strategy = 'user_frame') {
    if (!enabled) {
      return errors.map(err => ({
        key: err.id,
        count: 1,
        threads: [err.tid],
        primary: err,
        instances: [err]
      }));
    }

    const groupsMap = new Map();

    errors.forEach(err => {
      const key = this.generateKey(err, strategy);

      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          key,
          count: 0,
          threads: new Set(),
          primary: err,
          instances: []
        });
      }

      const group = groupsMap.get(key);
      group.count++;
      group.threads.add(err.tid);
      group.instances.push(err);
    });

    // Convert to array and format thread list
    return Array.from(groupsMap.values()).map(group => ({
      ...group,
      threads: Array.from(group.threads).sort((a, b) => a - b)
    }));
  }

  /**
   * Generate signature key for grouping
   */
  static generateKey(error, strategy) {
    const frames = error.primaryStack?.frames || [];

    if (strategy === 'exact_stack') {
      // Hash / serialize entire call stack
      const stackSig = frames.map(f => `${f.fn}@${f.file}:${f.line}`).join('|');
      return `${error.kind}::${stackSig}`;
    }

    // Default 'user_frame': Find first non-system frame with file & line
    let keyFrame = frames.find(f => !f.isSystem && f.file && f.line !== null);

    // Fallback: first frame with file & line
    if (!keyFrame) {
      keyFrame = frames.find(f => f.file && f.line !== null);
    }

    // Fallback: very first frame
    if (!keyFrame && frames.length > 0) {
      keyFrame = frames[0];
    }

    if (keyFrame) {
      const location = keyFrame.file 
        ? `${keyFrame.file}:${keyFrame.line || '?'}`
        : (keyFrame.obj || keyFrame.ip);
      const fn = keyFrame.fn || 'unknown';
      return `${error.kind}::${location}::${fn}`;
    }

    // Fallback if no frames
    return `${error.kind}::${error.what}`;
  }
}
