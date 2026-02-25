// Utility functions - try generating tests with AI!

export function formatCurrency(amount, locale = 'de-DE', currency = 'EUR') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
}

export function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

export function groupBy(array, key) {
  return array.reduce((groups, item) => {
    const group = typeof key === 'function' ? key(item) : item[key];
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {});
}

export function retry(fn, maxAttempts = 3, delay = 1000) {
  return async function (...args) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn.apply(this, args);
      } catch (err) {
        if (attempt === maxAttempts) throw err;
        await new Promise(r => setTimeout(r, delay * attempt));
      }
    }
  };
}
