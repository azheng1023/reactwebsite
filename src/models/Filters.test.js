import {
  LowPassFilter,
  HighPassFilter,
  BandPassFilter,
  NotchFilter,
} from "./Filters";

test.each([
  [0, 1, [0, 1, 1], 0],
  [Infinity, 1, [0, 1, 1], 1],
  [1, 1, [0, 1, 1], 0.98],
  [0.5, 2, [0, 1, 1], 0.98],
  [0.1, 2, [0, 1, 1], 0.804],
  [1, 0.2, [0, 1, 1], 0.804],
  [0.3, 0.01, [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], 0.186],
])(
  "LowPassFilter (%f, %f)",
  (frequency, samplingTimeSeconds, inputSequence, expected) => {
    const filter = new LowPassFilter(frequency, samplingTimeSeconds);
    let output = NaN;
    inputSequence.forEach((inputValue) => {
      output = filter.filter(inputValue);
    });
    expect(output).toBeCloseTo(expected);
  }
);

test.each([
  [0, 1, [0, 1, 1], 1],
  [Infinity, 1, [0, 1, 1], 0],
  [1, 1, [0, 1, 1], 0.02],
  [0.5, 2, [0, 1, 1], 0.02],
  [0.1, 2, [0, 1, 1], 0.2],
  [1, 0.2, [0, 1, 1], 0.2],
  [0.3, 0.01, [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], 0.814],
])(
  "HighPassFilter (%f, %f)",
  (frequency, samplingTimeSeconds, inputSequence, expected) => {
    const filter = new HighPassFilter(frequency, samplingTimeSeconds);
    let output = NaN;
    inputSequence.forEach((inputValue) => {
      output = filter.filter(inputValue);
    });
    expect(output).toBeCloseTo(expected);
  }
);

test.each([
  [0.3, 10, 0.01],
  [10, 1, 0.01],
])(
  "BandPassFilter (%f, %f)",
  (lowFrequency, highFrequency, samplingTimeSeconds) => {
    const lowPassFilter = new LowPassFilter(highFrequency, samplingTimeSeconds);
    const highPassFilter = new HighPassFilter(
      lowFrequency,
      samplingTimeSeconds
    );
    const bandPassFilter = new BandPassFilter(
      lowFrequency,
      highFrequency,
      samplingTimeSeconds
    );
    for (let i = 0; i < 100; i++) {
      const inputValue = (Math.random() - 0.5) * 100;
      const output1 = lowPassFilter.filter(inputValue);
      const output2 = highPassFilter.filter(output1);
      const output3 = bandPassFilter.filter(inputValue);
      expect(output2).toBeCloseTo(output3);
    }
  }
);

test.each([
  [50, 0.01, [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], 0.984],
  [
    50,
    0.01,
    [
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
    ],
    0,
  ],
  [
    60,
    0.01,
    [
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
    ],
    1,
  ],
  [
    60,
    1.0/120,
    [
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
      -1,
      1,
    ],
    0,
  ],
])(
  "NotchFilter (%f, %f)",
  (frequency, samplingTimeSeconds, inputSequence, expected) => {
    const filter = new NotchFilter(frequency, samplingTimeSeconds);
    let output = NaN;
    inputSequence.forEach((inputValue) => {
      output = filter.filter(inputValue);
    });
    expect(output).toBeCloseTo(expected);
  }
);
