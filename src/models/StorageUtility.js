const SessionInfoKeyName = "SessionInfo";
const LocalStorageLoginInfoKeyName = "LoginInfoKeyName";
const PreferencesKeyName = "Preferences";
const PreferencePrefixName = "PlotPropertiesPreference";
const StudyDisplayColumnsName = "StudyDisplayColumns";

export const PlotPropertyName = {
  visible: "visible",
  color: "color",
  showGrid: "showGrid",
  isAutoScaled: "isAutoScaled",
  range: "range",
  polarity: "polarity",
  lowFrequencyFilter: "lowFrequencyFilter",
  highFrequencyFilter: "highFrequencyFilter",
  notchFilter: "notchFilter",
  backgroundColor: "backgroundColor",
  showChannelLabel: "showChannelLabel",
  playingSpeed: "playingSpeed",
  displayInterval: "displayInterval",
  watermark: "watermark",
  channelOrder: "channelOrder",
  chartType: "chartType",
  referenceLines: "referenceLines",
  referenceChannels: "referenceChannels",
  respiratoryChannel: "respiratoryChannel",
};

export default class StorageUtility {
  static #currentPreference = null;
  static #preferences = null;
  static #currentPlotProperties = null;
  //
  // Preference
  //	Background color
  //  Display interval
  //  Watermark
  //  Playing speed
  //  Respiratory channel (channel to show respiratory events)
  //  Channel Properties
  // 	  Visible
  // 	  Color
  // 	  IsAutoScaled
  // 	  Range
  // 	  Polarity
  // 	  Low Frequency Filter
  // 	  High Frequency Filter
  // 	  Notch Filter
  //    Hide Channel Label
  //
  static getPlotProperty(name) {
    return this.getPlotProperties()[name];
  }

  static getPlotProperties() {
    if (this.#currentPlotProperties === null) {
      this.getPreferences();
      this.initializePreference();
    }
    return this.#currentPlotProperties;
  }

  static initializePreference() {
    this.#currentPlotProperties = this.getFromLocalStorage(
      this.currentPreferenceKeyName
    );
    if (this.#currentPlotProperties === null) {
      this.initializeCurrentPlotProperties();
    }
  }

  static initializeCurrentPlotProperties() {
    this.#currentPlotProperties = {
      [PlotPropertyName.backgroundColor]: "#FFFFFF",
      [PlotPropertyName.showGrid]: true,
      [PlotPropertyName.showChannelLabel]: true,
      [PlotPropertyName.displayInterval]: 30,
      [PlotPropertyName.watermark]: "",
      [PlotPropertyName.playingSpeed]: 1,
      [PlotPropertyName.channelOrder]: [],
      [PlotPropertyName.respiratoryChannel]: "", 
      channels: {},
    };
  }

  static updatePlotProperty(name, value) {
    if (this.#currentPlotProperties[name] !== undefined) {
      this.#currentPlotProperties[name] = value;
    }
  }

  static getChannelProperty(channelName, propertyName) {
    return this.getChannelProperties(channelName)[propertyName];
  }

  static getChannelProperties(channelName) {
    const plotProperties = this.getPlotProperties();
    let channelProperties = plotProperties.channels[channelName];
    if (channelProperties === undefined || channelProperties === null) {
      channelProperties = {
        [PlotPropertyName.chartType]: "Trend",
        [PlotPropertyName.visible]: true,
        [PlotPropertyName.color]: "#8884d8",
        [PlotPropertyName.isAutoScaled]: false,
        [PlotPropertyName.range]: null,
        [PlotPropertyName.polarity]: false,
        [PlotPropertyName.lowFrequencyFilter]: "No Filter",
        [PlotPropertyName.highFrequencyFilter]: "No Filter",
        [PlotPropertyName.notchFilter]: "None",
        [PlotPropertyName.referenceChannels]: [],
        [PlotPropertyName.referenceLines]: [],
      };
      this.#currentPlotProperties.channels[channelName] = channelProperties;
      plotProperties[PlotPropertyName.channelOrder].push(channelName);
    }
    return channelProperties;
  }

  static getVisibleOrderedChannels(channelNames) {
    if (channelNames) {
      const visibleChannels = [];
      channelNames.forEach((channelName) => {
        if (this.getChannelProperties(channelName).visible) {
          visibleChannels.push(channelName);
        }
      });
      const orderedChannels = this.getPlotProperties()[
        PlotPropertyName.channelOrder
      ];
      const visibleOrderedChannels = [];
      orderedChannels.forEach((orderedChannel) => {
        if (visibleChannels.includes(orderedChannel)) {
          visibleOrderedChannels.push(orderedChannel);
        }
      });
      return visibleOrderedChannels;
    } else {
      return [];
    }
  }

  static switchChannelOrder(channel1Name, channel2Name) {
    const currentOrderedChannels = this.getPlotProperties()[PlotPropertyName.channelOrder];
    const channel1Index = currentOrderedChannels.indexOf(channel1Name);
    const channel2Index = currentOrderedChannels.indexOf(channel2Name);
    if (channel1Index >= 0 && channel2Index >=0){
      currentOrderedChannels[channel1Index] = channel2Name;
      currentOrderedChannels[channel2Index] = channel1Name;
    }
  }

  static updateChannelProperty(channelName, propertyName, propertyValue) {
    if (
      this.#currentPlotProperties.channels[channelName][propertyName] !==
      undefined
    ) {
      this.#currentPlotProperties.channels[channelName][
        propertyName
      ] = propertyValue;
    }
  }

  static getCurrentPreference() {
    return this.#currentPreference;
  }

  static getPreferences() {
    if (this.#preferences === null) {
      this.#preferences = this.getFromLocalStorage(PreferencesKeyName);
      if (this.#preferences && this.#preferences.length > 0) {
        // The first one is the last preference used
        this.#currentPreference = this.#preferences[0];
        this.#preferences.splice(0, 1);
      } else {
        this.#preferences = [];
        this.#currentPreference = "";
      }
    }
    return [...this.#preferences];
  }

  static savePreferences() {
    if (this.#preferences !== null) {
      let preferences = [...this.#preferences];
      preferences.splice(0, 0, this.#currentPreference);
      this.saveToLocalStorage(PreferencesKeyName, preferences);
    }
  }

  static get currentPreferenceKeyName() {
    return PreferencePrefixName + "_" + this.#currentPreference;
  }

  static changeCurrentPreference(preferenceName) {
    if (
      this.#currentPreference !== null &&
      this.#currentPreference !== preferenceName
    ) {
      this.#currentPreference = preferenceName;
      this.initializePreference();
      this.savePreferences();
    }
  }

  static saveCurrentPreference(preferenceName = "") {
    if (preferenceName !== "") {
      this.#currentPreference = preferenceName;
      if (!this.#preferences.includes(preferenceName)) {
        this.#preferences.push(preferenceName);
      }
    }
    this.saveToLocalStorage(
      this.currentPreferenceKeyName,
      this.#currentPlotProperties
    );
    this.savePreferences();
  }

  static deleteCurrentPreference() {
    if (this.#currentPreference) {
      let index = this.#preferences.indexOf(this.#currentPreference);
      this.#preferences.splice(index, 1);
      if (index > 0) {
        index--;
      }
      if (index < this.#preferences.length) {
        this.changeCurrentPreference(this.#preferences[index]);
      } else {
        this.#currentPreference = null;
        this.initializeCurrentPlotProperties();
        this.saveCurrentPreference();
      }
      window.localStorage.removeItem(this.currentPreferenceKeyName);
    }
  }
  //
  // Study display columns
  //
  static getStudyDisplayColumns(){
    const visibleColumns = this.getFromLocalStorage(StudyDisplayColumnsName);
    return (visibleColumns ? visibleColumns : "");
  }

  static saveStudyDisplayColumns(value){
    this.saveToLocalStorage(StudyDisplayColumnsName, value);
  }
  //
  // Session information
  //
  static saveSessionInfo(value) {
    this.saveToSessionStorage(SessionInfoKeyName, value);
  }

  static getSessionInfo() {
    let sessionInfo = this.getFromSessionStorage(SessionInfoKeyName);
    if (sessionInfo) {
      return sessionInfo;
    } else {
      return {
        userName: "",
        isLoggedIn: false,
        isAdmin: false,
        pageTitle: "",
        dataIDs: [0],
      };
    }
  }

  //
  // General save and get from session storage
  //
  static saveToSessionStorage(key, value) {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  }

  static getFromSessionStorage(key) {
    return JSON.parse(window.sessionStorage.getItem(key));
  }

  //
  // Persist login across sessions
  //
  static saveLogin(value) {
    this.saveToLocalStorage(LocalStorageLoginInfoKeyName, value);
  }

  static getLogin() {
    return this.getFromLocalStorage(LocalStorageLoginInfoKeyName);
  }

  //
  // General save and get from local storage
  //
  static saveToLocalStorage(key, value) {
    window.localStorage.setItem(key, JSON.stringify(value));
  }

  static getFromLocalStorage(key) {
    const value = window.localStorage.getItem(key);
    return JSON.parse(value);
  }
}
