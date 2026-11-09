// sanitizes and joins path to base URL

function makeUrl(base, requestPath) {
  if (!base) throw new Error('base URL is required');

  const url = new URL(base);

  let relative = String(requestPath ?? '').trim();

  // Reject absolute URLs and protocol-relative URLs such as //evil.example.
  if (/^[a-z][a-z0-9+.-]*:/i.test(relative) || relative.startsWith('//')) {
    throw new Error('requestPath must be a path, not an absolute URL');
  }

  // Remove leading slashes so URL resolution appends instead of replacing.
  relative = relative.replace(/^\/+/, '');

  const originalPath = url.pathname;
  const baseDir = originalPath.endsWith('/')
      ? originalPath
      : originalPath + '/';

  // Paths such as /chat/completions need a trailing slash on the base path.
  // Pure query/hash references do not.
  if (
      relative &&
      !relative.startsWith('?') &&
      !relative.startsWith('#') &&
      !url.pathname.endsWith('/')
  ) {
    url.pathname += '/';
  }

  const result = new URL(relative, url);

  // Optional but useful: prevent ../ traversal from escaping the base path.
  const allowed =
      result.pathname === originalPath ||
      result.pathname.startsWith(baseDir);

  if (!allowed) {
    throw new Error('requestPath escapes base URL path');
  }

  return result;
}

module.exports = makeUrl
