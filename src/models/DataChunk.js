import TimeRange from "./TimeRange";
import RawValues from "./RawValues";

export default class DataChunk {
  #times;
  #values;
  #isEvenlySpaced;
  samplingTime = 0;
  timeRange;
  constructor(times, values) {
    this.#times = times;
    this.#values = new RawValues(values);
    this.#isEvenlySpaced = times.length <= 2;
    this.timeRange = new TimeRange(times);
    if (times.length > 1) {
      this.samplingTime = this.timeRange.duration / (this.#values.count - 1);
    }
  }

  add(times, values) {
    if (!this.#isEvenlySpaced) {
      return false;
    }
    if (times.length > 2) {
      return false;
    }
    if (
      this.#values.dataType !== values.dataType ||
      this.#values.zero !== values.zero ||
      this.#values.scalingFactor !== values.scalingFactor
    ) {
      return false;
    }
    //
    // Check to see if it is continuous
    //     ST1        ET1  ST2        ET2
    //       EventCount1     EventCount2
    //
    const timeRange = new TimeRange(times);
    let samplingTime = timeRange.startTime - this.timeRange.endTime;
    if (samplingTime < 0) {
      samplingTime = this.timeRange.startTime - timeRange.endTime;
    }
    const samplingTime2 = timeRange.duration / (values.data.length - 1);
    if (
      Math.abs(this.samplingTime - samplingTime2) < 0.01 * this.samplingTime &&
      Math.abs(samplingTime - this.samplingTime) < 0.01 * this.samplingTime
    ) {
      // Merge
      if (timeRange.startTime > this.timeRange.endTime) {
        this.#times[1] = timeRange.endTime;
        this.#values.add(values);
      } else {
        this.#times[0] = timeRange.startTime;
        this.#values.add(values, true);
      }
      this.timeRange = new TimeRange(this.#times);
      return true;
    }
    return false;
  }

  getData(timeRange) {
    const startIndex = this.findValueIndex(timeRange.startTime);
    const endIndex = this.findValueIndex(timeRange.endTime, false);
    let times = [];
    if (this.#isEvenlySpaced) {
      const samplingTime = this.timeRange.duration / (this.#values.count - 1);
      const startTime = this.timeRange.startTime;
      for (let i = startIndex; i <= endIndex; i++) {
        times.push(startTime + i * samplingTime);
      }
    } else {
      times = this.#times.slice(startIndex, endIndex + 1);
    }
    const values = this.#values.getValues(startIndex, endIndex);
    return {
      times: times,
      values: values,
      plotRange: this.plotRange,
      isEvenlySpaced: this.#isEvenlySpaced,
      samplingTime: this.samplingTime,
      hasStringValues: this.#values.hasStringValues,
    };
  }

  get plotRange(){
    if (this.#values){
      return this.#values.plotRange;
    } else{
      return null;
    }
  }

  findValueIndex(time, before = true) {
    if (this.#times.length === 0) {
      return -1;
    } else if (this.#times.length === 1) {
      return 0;
    }
    if (time <= this.timeRange.startTime) {
      return 0;
    } else if (time >= this.timeRange.endTime) {
      return this.#values.count - 1;
    }
    if (this.#isEvenlySpaced) {
      const samplingTime = (this.#values.count - 1) / this.timeRange.duration;
      const valueIndex = (time - this.timeRange.startTime) * samplingTime;
      if (
        Math.abs(Math.round(valueIndex) - valueIndex) <
        0.001 * samplingTime
      ) {
        return Math.round(valueIndex);
      } else if (before) {
        return Math.floor(valueIndex);
      } else {
        return Math.ceil(valueIndex);
      }
    }
    let start = 0;
    let end = this.#times.length - 1;
    while (start < end - 1) {
      const middle = Math.round((start + end) / 2);
      const middleTime = this.#times[middle];
      if (middleTime === time) {
        return middle;
      } else if (middleTime > time) {
        end = middle;
      } else {
        start = middle;
      }
    }
    return before ? start : end;
  }
}
