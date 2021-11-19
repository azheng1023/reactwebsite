import DataChunk from "./DataChunk";
import TimeRange from "./TimeRange";

test("timeRange", () => {
  const startTime = 123456;
  const endTime = startTime + 1;
  const testData = getTestData(startTime, endTime, [0, 1]);
  const testChunk = new DataChunk(testData.times, testData.values);
  expect(testChunk.timeRange.startTime).toEqual(startTime);
  expect(testChunk.timeRange.endTime).toEqual(endTime);
});

test("add true", () => {
  const startTime = 123456;
  const endTime = startTime + 1;
  const testData = getTestData(startTime, endTime, [0, 1]);
  const testChunk = new DataChunk(testData.times, testData.values);
  const testData2 = getTestData(startTime + 2, startTime + 3, [23, -10]);
  expect(testChunk.add(testData2.times, testData2.values)).toEqual(true);
  expect(
    testChunk.getData(new TimeRange([startTime, startTime + 3]), 2000).values
      .length
  ).toEqual(4);
});

test("add false - different sampling times", () => {
  const startTime = 123456;
  const endTime = startTime + 1;
  const testData = getTestData(startTime, endTime, [0, 1]);
  const testChunk = new DataChunk(testData.times, testData.values);
  const testData2 = getTestData(startTime + 2, startTime + 4, [23, -10]);
  expect(testChunk.add(testData2.times, testData2.values)).toEqual(false);
});

test("add false - gap not equal to sampling time", () => {
  const startTime = 123456;
  const endTime = startTime + 1;
  const testData = getTestData(startTime, endTime, [0, 1]);
  const testChunk = new DataChunk(testData.times, testData.values);
  const testData2 = getTestData(startTime + 3, startTime + 4, [23, -10]);
  expect(testChunk.add(testData2.times, testData2.values)).toEqual(false);
});

test.each([
  [1, 1, true],
  [1, 2, false],
  [1, 3, false],
  [2, 1, false],
  [3, 1, false],
])("add dataType (%i, %i)", (dataType1, dataType2, expected) => {
  const startTime = 123456;
  const endTime = startTime + 1;
  const testData = getTestData(startTime, endTime, [0, 1], dataType1);
  const testChunk = new DataChunk(testData.times, testData.values);
  const testData2 = getTestData(
    startTime + 2,
    startTime + 3,
    [23, -10],
    dataType2
  );
  expect(testChunk.add(testData2.times, testData2.values)).toEqual(expected);
});

test.each([
  [0, 0, true],
  [1, 0, false],
  [0, 1, false],
])("add zero (%i, %i)", (zero1, zero2, expected) => {
  const startTime = 123456;
  const endTime = startTime + 1;
  const testData = getTestData(startTime, endTime, [0, 1], 1, zero1);
  const testChunk = new DataChunk(testData.times, testData.values);
  const testData2 = getTestData(
    startTime + 2,
    startTime + 3,
    [23, -10],
    1,
    zero2
  );
  expect(testChunk.add(testData2.times, testData2.values)).toEqual(expected);
});

test.each([
  [1, 1, true],
  [1, 2, false],
  [2, 1, false],
])("add scalingFactor (%i, %i)", (scalingFactor1, scalingFactor2, expected) => {
  const startTime = 123456;
  const endTime = startTime + 1;
  const testData = getTestData(
    startTime,
    endTime,
    [0, 1],
    1,
    0,
    scalingFactor1
  );
  const testChunk = new DataChunk(testData.times, testData.values);
  const testData2 = getTestData(
    startTime + 2,
    startTime + 3,
    [23, -10],
    1,
    0,
    scalingFactor2
  );
  expect(testChunk.add(testData2.times, testData2.values)).toEqual(expected);
});

test.each([
  [0, 0, 6],
  [-1, 0, 6],
  [0, 1, 6],
  [1, 0, 5],
  [0, -1, 5],
])("getData (%i, %i)", (startDelta, endDelta, expected) => {
  const startTime = 123456;
  const endTime = startTime + 5;
  const testData = getTestData(startTime, endTime, [0, 1, 2, 3, 4, 5]);
  const testChunk = new DataChunk(testData.times, testData.values);
  const data = testChunk.getData(
    new TimeRange([startTime + startDelta, endTime + endDelta]),
    2000
  );
  expect(data.values.length).toEqual(expected);
});

// TODO: Need to move this to ChannelData
test.skip.each([
  [0, 0, 6],
  [-1, 0, 2],
  [0, 1, 2],
  [1, 0, 3],
  [0, -1, 3],
])(
  "getData count > 2 x pixel count (%i, %i)",
  (startDelta, endDelta, expected) => {
    const startTime = 123456;
    const endTime = startTime + 5;
    const testData = getTestData(startTime, endTime, [0, 1, 2, 3, 4, 5]);
    const testChunk = new DataChunk(testData.times, testData.values);
    const data = testChunk.getData(
      new TimeRange([startTime + startDelta, endTime + endDelta]),
      1
    );
    expect(data.values.length).toEqual(expected);
  }
);

test.skip.each([
  [0, 0, 3],
  [-1, 0, 3],
  [0, 1, 3],
  [1, 0, 3],
  [0, -1, 3],
])(
  "getData uneven data, count > 2 x pixel count (%i, %i)",
  (startDelta, endDelta, expected) => {
    const startTime = 123456;
    const endTime = startTime + 5;
    const testData = getTestData(startTime, endTime, [0, 1, 2, 3, 4, 5]);
    const testChunk = new DataChunk(
      [
        startTime,
        startTime + 0.1,
        startTime + 2,
        startTime + 3,
        startTime + 6,
        startTime + 7.2,
      ],
      testData.values
    );
    const data = testChunk.getData(
      new TimeRange([startTime + startDelta, endTime + endDelta]),
      1
    );
    expect(data.values.length).toEqual(expected);
  }
);

test.each([
  [0, true, 0],
  [123456, false, 0],
  [123456, true, 0],
  [123456.5, true, 0],
  [123456.5, false, 1],
  [123458, false, 2],
  [123458, true, 2],
  [123460.9, true, 4],
  [123460.9, false, 5],
  [123461, false, 5],
  [123461, true, 5],
  [123471, false, 5],
  [123471, true, 5],
])("findIndex evenly spaced data (%d, %s)", (time, before, expected) => {
  const startTime = 123456;
  const endTime = startTime + 5;
  const testData = getTestData(startTime, endTime, [0, 1, 2, 3, 4, 5]);
  const testChunk = new DataChunk(testData.times, testData.values);
  expect(testChunk.findValueIndex(time, before)).toEqual(expected);
});

test.each([
  [0, true, 0],
  [123456, false, 0],
  [123456, true, 0],
  [123456.5, true, 1],
  [123456.5, false, 2],
  [123458, false, 2],
  [123458, true, 2],
  [123460.9, true, 3],
  [123460.9, false, 4],
  [123471, false, 5],
  [123471, true, 5],
])("findIndex non-evenly spaced data (%d, %s)", (time, before, expected) => {
  const startTime = 123456;
  const testData = getTestData(startTime, startTime + 2, [0, 1, 2, 3, 4, 5]);
  const testChunk = new DataChunk(
    [
      startTime,
      startTime + 0.1,
      startTime + 2,
      startTime + 3,
      startTime + 6,
      startTime + 7.2,
    ],
    testData.values
  );
  expect(testChunk.findValueIndex(time, before)).toEqual(expected);
});

function getTestData(
  startTime,
  endTime,
  data,
  dataType = 1,
  zero = 0,
  scalingFactor = 1
) {
  return {
    times: [startTime, endTime],
    values: {
      dataType: dataType,
      zero: zero,
      scalingFactor: scalingFactor,
      data: data,
    },
  };
}
