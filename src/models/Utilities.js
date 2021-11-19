export function debounce(func, msTimeout) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout((_) => {
      timer = null;
      func.apply(this, args);
    }, msTimeout);
  };
}

export function binarySearch(sortedValues, targetValue, option = 0) {
  // sortedValues: value array sorted in ascending order
  // targetValue: target value to search
  // option
  //   0: index at or right before
  //   1: index at or right after
  //   2: index at; returns -1 if no exact match is found
  if (sortedValues.length === 0) {
    return -1;
  }
  let start = 0;
  let end = sortedValues.length - 1;
  while (start < end - 1) {
    const middle = Math.round((start + end) / 2);
    const middleValue = sortedValues[middle];
    if (middleValue === targetValue) {
      return middle;
    } else if (middleValue > targetValue) {
      end = middle;
    } else {
      start = middle;
    }
  }
  switch (option) {
    case 0:
      if (start === 0 && sortedValues[0] > targetValue) {
        return -1;
      } else if (
        end === sortedValues.length - 1 &&
        sortedValues[end] < targetValue
      ) {
        return end;
      } else {
        return start;
      }
    case 1:
      if (end === sortedValues.length - 1 && sortedValues[end] < targetValue) {
        return -1;
      } else if (start === 0 && sortedValues[start] > targetValue) {
        return start;
      } else {
        return end;
      }
    case 2:
    default:
      return -1;
  }
}
