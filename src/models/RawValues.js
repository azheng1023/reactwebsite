export default class RawValues {
  hasStringValues = false;
  constructor(rawValues) {
    this.dataType = rawValues.dataType;
    this.zero = rawValues.zero;
    this.scalingFactor = rawValues.scalingFactor;
    this.data = rawValues.data;
    if (this.dataType === 8) {
      this.hasStringValues = true;
    } else if (this.data.length > 0 && typeof this.data[0] !== "number") {
      this.hasStringValues = true;
    }
  }

  add(rawValues, isBefore = false) {
    if (isBefore) {
      this.data = rawValues.data.concat(this.data);
    } else {
      this.data = this.data.concat(rawValues.data);
    }
    if (
      !this.hasStringValues &&
      this.data.length > 0 &&
      typeof this.data[0] !== "number"
    ) {
      this.hasStringValues = true;
    }
  }

  get count() {
    return this.data.length;
  }

  getValues(startIndex, endIndex) {
    const values = this.data.slice(startIndex, endIndex + 1);
    if (
      this.scalingFactor === 0 ||
      (this.scalingFactor === 1 && this.zero === 0)
    ) {
      return values;
    } else {
      values.forEach((item, index, array) => {
        if (!isNaN(item)) {
          array[index] = this.scalingFactor * (item - this.zero);
        }
      });
      return values;
    }
  }

  get plotRange() {
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
