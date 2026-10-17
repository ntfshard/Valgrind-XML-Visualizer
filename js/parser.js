/**
 * Valgrind XML Parser
 * Zero dependencies - relies exclusively on browser native DOMParser.
 */

export class ValgrindParser {
  /**
   * Parse Valgrind XML string into a structured report object.
   * @param {string} xmlString 
   * @returns {Object} Report model
   */
  static parse(xmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'text/xml');

    // Check for parse errors
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      throw new Error(`XML Parsing Error: ${parserError.textContent.trim()}`);
    }

    const valgrindOutput = doc.querySelector('valgrindoutput');
    if (!valgrindOutput) {
      throw new Error('Invalid format: Root <valgrindoutput> element not found. Make sure valgrind was run with --xml=yes');
    }

    const tool = this.getText(valgrindOutput, 'protocoltool') || this.getText(valgrindOutput, 'tool') || 'valgrind';
    const protocolVersion = this.getText(valgrindOutput, 'protocolversion') || 'unknown';
    const pid = this.getText(valgrindOutput, 'pid') || '';
    const ppid = this.getText(valgrindOutput, 'ppid') || '';

    // Extract preamble & command line
    const preambleLines = Array.from(valgrindOutput.querySelectorAll('preamble > line')).map(l => l.textContent.trim());
    const command = this.extractCommand(valgrindOutput, preambleLines);

    // Parse errors
    const errorNodes = valgrindOutput.querySelectorAll('error');
    const errors = [];
    let totalLeakedBytes = 0;
    let totalLeakedBlocks = 0;

    errorNodes.forEach((errNode, idx) => {
      const err = this.parseError(errNode, idx);
      if (err.leakedBytes) {
        totalLeakedBytes += err.leakedBytes;
      }
      if (err.leakedBlocks) {
        totalLeakedBlocks += err.leakedBlocks;
      }
      errors.push(err);
    });

    return {
      tool,
      protocolVersion,
      pid,
      ppid,
      command,
      preambleLines,
      errors,
      stats: {
        totalErrors: errors.length,
        totalLeakedBytes,
        totalLeakedBlocks
      }
    };
  }

  static extractCommand(root, preambleLines) {
    // Try to get command from <args><argv>
    const argvNodes = root.querySelectorAll('args > argv > *');
    if (argvNodes.length > 0) {
      return Array.from(argvNodes).map(node => node.textContent.trim()).join(' ');
    }
    // Fallback: search in preamble lines for "Command: "
    for (const line of preambleLines) {
      if (line.startsWith('Command:')) {
        return line.substring(8).trim();
      }
    }
    return '';
  }

  static parseError(errorNode, index) {
    const unique = this.getText(errorNode, 'unique') || `0x${index.toString(16)}`;
    const tid = parseInt(this.getText(errorNode, 'tid') || '1', 10);
    const kind = this.getText(errorNode, 'kind') || 'UnknownError';

    // What message
    let what = this.getText(errorNode, 'what');
    let leakedBytes = null;
    let leakedBlocks = null;

    const xwhatNode = errorNode.querySelector('xwhat');
    if (xwhatNode) {
      what = this.getText(xwhatNode, 'text') || what;
      const lb = this.getText(xwhatNode, 'leakedbytes');
      const lblocks = this.getText(xwhatNode, 'leakedblocks');
      if (lb) leakedBytes = parseInt(lb, 10);
      if (lblocks) leakedBlocks = parseInt(lblocks, 10);
    }

    // Children iteration to associate <auxwhat> with subsequent <stack>
    let primaryStack = null;
    const auxiliary = [];
    let currentAux = null;

    const childElements = errorNode.children 
      ? Array.from(errorNode.children) 
      : Array.from(errorNode.childNodes).filter(n => n.nodeType === 1);

    for (const child of childElements) {
      const tag = child.tagName.toLowerCase();
      if (tag === 'stack') {
        const stackObj = this.parseStack(child);
        if (!primaryStack) {
          primaryStack = stackObj;
        } else if (currentAux) {
          currentAux.stack = stackObj;
        } else {
          auxiliary.push({ info: 'Additional stack trace', stack: stackObj });
        }
      } else if (tag === 'auxwhat' || tag === 'annwhat') {
        currentAux = {
          info: child.textContent.trim(),
          stack: null
        };
        auxiliary.push(currentAux);
      }
    }

    // Suppression block
    let suppression = null;
    const suppNode = errorNode.querySelector('suppression');
    if (suppNode) {
      const rawText = this.getText(suppNode, 'rawtext');
      suppression = (rawText || suppNode.textContent || '').trim();
    }

    return {
      id: `err-${index}-${unique}`,
      unique,
      tid,
      kind,
      category: this.categorizeKind(kind),
      what: what || kind,
      leakedBytes,
      leakedBlocks,
      primaryStack: primaryStack || { frames: [] },
      auxiliary,
      suppression
    };
  }

  static parseStack(stackNode) {
    const frames = [];
    const frameNodes = stackNode.querySelectorAll('frame');

    frameNodes.forEach(fNode => {
      const ip = this.getText(fNode, 'ip') || '';
      const obj = this.getText(fNode, 'obj') || '';
      const fn = this.getText(fNode, 'fn') || '';
      const dir = this.getText(fNode, 'dir') || '';
      const file = this.getText(fNode, 'file') || '';
      const lineStr = this.getText(fNode, 'line');
      const line = lineStr ? parseInt(lineStr, 10) : null;

      const isSystem = this.detectSystemFrame(obj, file, fn, line);

      frames.push({
        ip,
        obj,
        fn,
        dir,
        file,
        line,
        isSystem
      });
    });

    return { frames };
  }

  static detectSystemFrame(obj, file, fn, line) {
    const lowerObj = obj.toLowerCase();
    const lowerFile = file.toLowerCase();

    // System libraries patterns
    const sysPatterns = [
      'libc.so', 'ld-linux', 'libstdc++', 'libpthread',
      'vgpreload', 'libgcc', 'libm.so', 'ld-2.', 'libc-2.'
    ];

    for (const pat of sysPatterns) {
      if (lowerObj.includes(pat)) return true;
    }

    // Standard system paths without user source
    if (lowerObj.startsWith('/usr/lib') || lowerObj.startsWith('/lib')) {
      if (!file || file.startsWith('/usr/include')) {
        return true;
      }
    }

    // If there's no file or line info, and obj is in system dir
    if (!file && !line) {
      if (lowerObj.includes('/lib')) return true;
    }

    return false;
  }

  static categorizeKind(kind) {
    if (kind.startsWith('Leak_')) {
      return 'leak';
    }
    if (['InvalidRead', 'InvalidWrite', 'InvalidFree', 'MismatchedFree', 'Overlap'].includes(kind)) {
      return 'memory_corruption';
    }
    if (['UninitCondition', 'UninitValue', 'SyscallParam'].includes(kind)) {
      return 'uninitialized';
    }
    if (['Race', 'LockOrder', 'PossibleDataRace', 'Misc'].includes(kind)) {
      return 'concurrency';
    }
    return 'other';
  }

  static getText(parent, selector) {
    const el = parent.querySelector(selector);
    return el ? el.textContent.trim() : '';
  }
}
