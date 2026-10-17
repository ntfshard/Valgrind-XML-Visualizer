/**
 * Filtering Pipeline Module
 * Filters error groups by filename, function name, kind/category, and user code constraints.
 */

export class ErrorFilter {
  /**
   * Apply all active filter criteria to an array of error groups.
   * @param {Array} groups 
   * @param {Object} criteria 
   * @returns {Array} Filtered groups
   */
  static apply(groups, criteria) {
    const {
      fileFilter = '',
      fnFilter = '',
      kindFilter = 'all',
      userCodeOnly = false
    } = criteria;

    const normFile = fileFilter.trim().toLowerCase();
    const normFn = fnFilter.trim().toLowerCase();

    return groups.filter(group => {
      const err = group.primary;

      // 1. Kind / Category filter
      if (kindFilter !== 'all') {
        if (err.category !== kindFilter && err.kind !== kindFilter) {
          return false;
        }
      }

      // Collect all stacks (primary + auxiliary stacks) for thorough frame search
      const allStacks = [err.primaryStack];
      if (err.auxiliary && err.auxiliary.length > 0) {
        err.auxiliary.forEach(aux => {
          if (aux.stack) allStacks.push(aux.stack);
        });
      }

      // 2. User code only filter: check if at least one frame is non-system
      if (userCodeOnly) {
        const hasUserFrame = allStacks.some(stack => 
          stack.frames.some(f => !f.isSystem && f.file)
        );
        if (!hasUserFrame) return false;
      }

      // 3. Filename filter (matches file name or directory path)
      if (normFile) {
        const matchesFile = allStacks.some(stack =>
          stack.frames.some(f => {
            const fName = (f.file || '').toLowerCase();
            const fDir = (f.dir || '').toLowerCase();
            return fName.includes(normFile) || fDir.includes(normFile);
          })
        );
        if (!matchesFile) return false;
      }

      // 4. Function name filter (matches fn name)
      if (normFn) {
        const matchesFn = allStacks.some(stack =>
          stack.frames.some(f => {
            const fnName = (f.fn || '').toLowerCase();
            return fnName.includes(normFn);
          })
        );
        if (!matchesFn) return false;
      }

      return true;
    });
  }

  /**
   * Extract unique kinds and categories present in the error set for the filter dropdown
   */
  static getFilterOptions(errors) {
    const kinds = new Set();
    const categories = new Set();

    errors.forEach(err => {
      kinds.add(err.kind);
      categories.add(err.category);
    });

    return {
      kinds: Array.from(kinds).sort(),
      categories: Array.from(categories).sort()
    };
  }
}
