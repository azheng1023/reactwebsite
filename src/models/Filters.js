export class LowPassFilter {
  _filterConstant;
  _previousFilteredValue = 0;
  constructor(cuttoffFrequency, samplingTimeInSeconds) {
    if (isNaN(cuttoffFrequency) || cuttoffFrequency === "" || cuttoffFrequency < 0) {
      this._filterConstant = 1;
    } else {
      const filterTimeConstant = 1 / (2 * Math.PI * cuttoffFrequency);
      this._filterConstant =
        samplingTimeInSeconds / (filterTimeConstant + samplingTimeInSeconds);
    }
  }

  filter(newValue) {
    this._previousFilteredValue =
      this._previousFilteredValue +
      this._filterConstant * (newValue - this._previousFilteredValue);
    return this._previousFilteredValue;
  }

  reset() {
    this._previousFilteredValue = 0;
  }
}

export class HighPassFilter {
  _filterConstant;
  _previousInputValue = 0;
  _previousFilteredValue = 0;
  constructor(cuttoffFrequency, samplingTimeInSeconds) {
    if (isNaN(cuttoffFrequency) || cuttoffFrequency === "" || cuttoffFrequency <= 0) {
      this._filterConstant = 1;
    } else {
      const filterTimeConstant = 1 / (2 * Math.PI * cuttoffFrequency);
      this._filterConstant =
        filterTimeConstant / (filterTimeConstant + samplingTimeInSeconds);
    }
  }

  filter(newValue) {
    this._previousFilteredValue =
      this._filterConstant *
      (this._previousFilteredValue + newValue - this._previousInputValue);
    this._previousInputValue = newValue;
    return this._previousFilteredValue;
  }

  reset() {
    this._previousFilteredValue = 0;
    this._previousInputValue = 0;
  }
}

export class BandPassFilter {
  _lowPassFilter;
  _highPassFilter;
  constructor(
    lowerCutoffFrequency,
    upperCutoffFrequency,
    samplingTimeInSeconds
  ) {
    this._lowPassFilter = new HighPassFilter(
      lowerCutoffFrequency,
      samplingTimeInSeconds
    );
    this._highPassFilter = new LowPassFilter(
      upperCutoffFrequency,
      samplingTimeInSeconds
    );
  }

  filter(newValue) {
    return this._highPassFilter.filter(this._lowPassFilter.filter(newValue));
  }

  reset() {
    this._lowPassFilter.reset();
    this._highPassFilter.reset();
  }
}

export class NotchFilter {
  _a1 = 0;
  _a2 = 0;
  _b0 = 0;
  _b1 = 0;
  _b2 = 0;
  _ukminus1 = 0;
  _ukminus2 = 0;
  _ykminus1 = 0;
  _ykminus2 = 0;

  constructor(notchFrequency, samplingTimeInSeconds) {
    if (notchFrequency * samplingTimeInSeconds > 0.5) {
      //
      // Find the alias frequency that is less than the nyquist frequency (1/Sampling Frequency)
      //    (first alias frequency = Sampling Frequency - notchFrequency)
      //
      notchFrequency = 1 / samplingTimeInSeconds - notchFrequency;
    }
    const theta = 2 * Math.PI * notchFrequency * samplingTimeInSeconds;
    const d = Math.exp(-Math.PI * samplingTimeInSeconds);
    this._a1 = (1 + d * d) * Math.cos(theta);
    this._a2 = -d * d;
    this._b0 = (1 + d * d) / 2;
    this._b1 = -2 * this._b0 * Math.cos(theta);
    this._b2 = this._b0;
  }

  filter(newValue) {
    let filteredValue =
      this._a1 * this._ykminus1 +
      this._a2 * this._ykminus2 +
      this._b0 * newValue +
      this._b1 * this._ukminus1 +
      this._b2 * this._ukminus2;
    this._ukminus2 = this._ukminus1;
    this._ukminus1 = newValue;
    this._ykminus2 = this._ykminus1;
    this._ykminus1 = filteredValue;
    return filteredValue;
  }

  reset() {
    this._ukminus1 = 0;
    this._ukminus2 = 0;
    this._ykminus1 = 0;
    this._ykminus2 = 0;
  }
}
