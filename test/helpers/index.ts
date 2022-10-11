const isWin = process.platform === 'win32';

// unixify path for cross-platform testing
export function unixify(str: string) {
  return isWin ? str.replace(/\\/g, '/') : str;
}

function toIgnore(str: string) {
  return !str.includes('.DS_Store');
}

export function order(arr: string[]) {
  return arr.filter(toIgnore).map(unixify).sort();
}

