export default class RawValues {
  constructor(rawValues) {
    this.dataType = rawValues.dataType;
    this.zero = rawValues.zero;
    this.scalingFactor = rawValues.scalingFactor;
    this.data = rawValues.data;
  }

  add(rawValues, isBefore = false) {
    if (isBefore) {
      this.data = rawValues.data.concat(this.data);
    } else {
      this.data = this.data.concat(rawValues.data);
    }
  }

  get count() {
    return this.data.length;
  }

  getValues(startIndexFraction, endIndexFraction, pixelCount) {
    let startIndex = Math.round(startIndexFraction * this.data.length);
    let endIndex = Math.round(endIndexFraction * this.data.length);
    const reductionFactor = Math.floor((endIndex - startIndex) / pixelCount);
    if (reductionFactor > 1) {
      const fractionCount = (endIndex - startIndex + 1) % reductionFactor;
      let plotDataWithinInterval = [];
      var i, sum;
      for (
        i = startIndex;
        i < endIndex - fractionCount;
        i = i + reductionFactor
      ) {
        sum = 0;
        for (var j = 0; j < reductionFactor; j++) {
          sum += this.data[i + j];
        }
        plotDataWithinInterval.push(sum / reductionFactor);
      }
      if (fractionCount !== 0) {
        sum = 0;
        for (i = endIndex - fractionCount; i < endIndex; i++) {
          sum += this.data[i];
        }
        plotDataWithinInterval.push(sum / fractionCount);
      }
      return plotDataWithinInterval;
    } else {
      return this.data.slice(startIndex, endIndex + 1);
    }
  }

  getPlotRange() {
    switch (this.dataType) {
      case 2:
        return [0, Math.pow(2, 16)];
      case 3:
        return [-Math.pow(2, 15), Math.pow(2, 15)];
      case 4:
        return [0, Math.pow(2, 32)];
      case 5:
        return [-Math.pow(2, 31), Math.pow(2, 31)];
      case 6:
      case 7:
        return [-100, 100];
      case 0:
      case 1:
      default:
        return [0, Math.pow(2, 8)];
    }
  }
}
