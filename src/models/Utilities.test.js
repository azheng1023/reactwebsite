import {binarySearch} from "./Utilities";

test.each([
  [2, 0, -1],
  [2, 1, -1],
  [2, 2, -1],
  [2, 3, -1],
])("binearySearch - no value (%i, %i)", (targetValue, option, expected) => {
  const values = [];
  expect(binarySearch(values, targetValue, option)).toEqual(expected);
});

test.each([
  [0, 0, -1],
  [0, 1, 0],
  [0, 2, -1],
  [2, 0, 0],
  [2, 1, -1],
  [0, 2, -1],
])("binearySearch - one value (%i, %i)", (targetValue, option, expected) => {
  const values = [1];
  expect(binarySearch(values, targetValue, option)).toEqual(expected);
});

test.each([
  [-1, 0, -1],
  [-1, 1, 0],
  [-1, 2, -1],
  [2, 0, 1],
  [2, 1, 1],
  [2, 2, 1],
  [2, 3, 1],
  [2.5, 0, 1],
  [2.5, 1, 2],
  [2.5, 2, -1],
  [2.5, 3, -1],
  [10.5, 0, 9],
  [10.5, 1, -1],
  [10.5, 2, -1],
])("binearySearch (%f, %i)", (targetValue, option, expected) => {
  const values = [1,2,3,4,5,6,7,8,9,10];
  expect(binarySearch(values, targetValue, option)).toEqual(expected);
});