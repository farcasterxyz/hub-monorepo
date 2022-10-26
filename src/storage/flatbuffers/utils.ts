export const bytesCompare = (a: Uint8Array, b: Uint8Array): number => {
  if (a[0] === 0) {
    return bytesCompare(a.slice(1), b);
  }

  if (b[0] === 0) {
    return bytesCompare(a, b.slice(1));
  }

  if (a.length > b.length) {
    return 1;
  } else if (a.length < b.length) {
    return -1;
  }

  if (a[0] > b[0]) {
    return 1;
  } else if (a[0] < b[0]) {
    return -1;
  }

  if (a.length > 1 && b.length > 1) {
    return bytesCompare(a.slice(1), b.slice(1));
  } else {
    return 0;
  }
};
