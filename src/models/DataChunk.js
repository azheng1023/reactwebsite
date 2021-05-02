import TimeRange from "./TimeRange";
import RawValues from "./RawValues";

export default class DataChunk {
  #times;
  #values;
  constructor(times, values) {
    this.#times = times;
    this.#values = new RawValues(values);
  }

  add(times, values) {
    if (times.length !== 2 && times.length !== 2) {
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
    const currentTimeRange = this.timeRange;
    const timeRange = new TimeRange(times);
    let samplingTime = timeRange.startTime - currentTimeRange.endTime;
    if (samplingTime < 0) {
      samplingTime = currentTimeRange.startTime - timeRange.endTime;
    }
    const samplingTime1 =
      currentTimeRange.duration / (this.#values.count - 1);
    const samplingTime2 = timeRange.duration / (values.data.length - 1);
    if (
      Math.abs(samplingTime1 - samplingTime2) < 0.01 * samplingTime1 &&
      Math.abs(samplingTime - samplingTime1) < 0.01 * samplingTime1
    ) {
      // Merge
      if (timeRange.startTime > currentTimeRange.endTime) {
        this.#times[1] = timeRange.endTime;
        this.#values.add(values);
      } else {
        this.#times[0] = timeRange.startTime;
        this.#values.add(values, true);
      }
      return true;
    }
    return false;
  }

  get timeRange() {
    return new TimeRange(this.#times);
  }

  getData(timeRange, pixelCount) {
    const dataTimeRange = this.timeRange;
    let startIndex =
      (timeRange.startTime - dataTimeRange.startTime) /
      dataTimeRange.duration;
    if (startIndex < 0) {
      startIndex = 0;
    }
    let endIndex =
      (timeRange.endTime - dataTimeRange.startTime) /
      dataTimeRange.duration;
    if (endIndex > 1) {
      endIndex = 1;
    }
    return {
      times: timeRange,
      values: this.#values.getValues(startIndex, endIndex, pixelCount),
      plotRange: this.#values.getPlotRange(),
    };
  }
}
