export default class ServerClient {
  static #scorers = null;

  static async getPerformanceStats() {
    const url = window.$restAPIURL + "GetPerformanceStats";
    return await this.fetchData(url);
  }

  static async getCounterHistory(counterID) {
    const url = window.$restAPIURL + "GetCounterHistory?counterID=" + counterID;
    return await this.fetchData(url);
  }

  static async getLogLevel() {
    const url = window.$restAPIURL + "getLogLevel";
    return await this.fetchData(url);
  }

  static async setLogLevel(level) {
    const url = window.$restAPIURL + "setLogLevel?logLevel=" + level;
    return await this.fetchData(url);
  }

  static async getMessages(messageID, isAfter = true) {
    const url =
      window.$restAPIURL +
      "getMessages?messageID=" +
      messageID +
      "&isAfter=" +
      isAfter;
    return await this.fetchData(url);
  }

  static async signIn(email, password, rememberMe) {
    const url =
      window.$restAPIURL +
      "connect?email=" +
      email +
      "&password=" +
      password +
      "&rememberMe=" +
      rememberMe;
    return await this.fetchData(url);
  }

  static async forgetPassword(email) {
    const url = window.$restAPIURL + "forgetPassword?email=" + email;
    return await this.fetchData(url);
  }

  static async validate2FACode(code, rememberOption) {
    const url =
      window.$restAPIURL +
      "validate2FACode?code=" +
      code +
      "&rememberOption=" +
      rememberOption;
    return await this.fetchData(url);
  }

  static async signUp(user) {
    const url = window.$restAPIURL + "signUp";
    return await this.fetchData(url, "Put", user);
  }

  static async editUser(userInfo) {
    const url = window.$restAPIURL + "editUser";
    return await this.fetchData(url, "Put", userInfo);
  }

  static async editUsers(users) {
    const url = window.$restAPIURL + "editUsers";
    return await this.fetchData(url, "Put", users);
  }

  static async signOut() {
    const url = window.$restAPIURL + "disconnect";
    await this.fetchData(url);
  }

  static async getStudySummary() {
    const url = window.$restAPIURL + "getstudylist";
    const query = {};
    return await this.fetchData(url, "Put", query);
  }

  static async getTimeSeriesData(query) {
    const url = window.$restAPIURL + "getdata";
    return await this.fetchData(url, "Put", query);
  }

  static async getDevices() {
    const url = window.$restAPIURL + "getDevices";
    return await this.fetchData(url);
  }

  static async assignDevices(data) {
    const url = window.$restAPIURL + "assignDevices";
    return await this.fetchData(url, "Put", data);
  }

  static async clearDeviceAssignment(hardwareID) {
    const url = window.$restAPIURL + "assignDevice";
    const device = {
      hardwareID: hardwareID,
      assignedUser: {
        email: "",
        phoneNumber: "",
        name: "",
      },
    };
    return await this.fetchData(url, "Put", device);
  }

  static async addDevice(data) {
    const url = window.$restAPIURL + "createDevice";
    return await this.fetchData(url, "Put", data);
  }

  static async getUser(email) {
    const url = window.$restAPIURL + "getUsers";
    return await this.fetchData(url, "Put", { email: email });
  }

  static async getUsers(userInfo) {
    const url = window.$restAPIURL + "getUsers";
    return await this.fetchData(url, "Put", userInfo);
  }

  static async getPSGScorers() {
    if (this.#scorers === null) {
      const url = window.$restAPIURL + "getScorers";
      this.#scorers = await this.fetchData(url);
    }
    return this.#scorers;
  }

  static async getReaders(dataIDs) {
    const url = window.$restAPIURL + "getReaders";
    return await this.fetchData(url, "Put", dataIDs);
  }

  static async createStudy(data) {
    const url = window.$restAPIURL + "createStudy";
    return await this.fetchData(url, "Put", data);
  }

  static async UpdatePermissions(dataIDs, updatedPermissions) {
    if (
      dataIDs.length > 0 &&
      updatedPermissions &&
      updatedPermissions.length > 0
    ) {
      const url = window.$restAPIURL + "updatePermissions";
      const data = {
        dataIDs: dataIDs,
        permissions: updatedPermissions,
      };
      return await this.fetchData(url, "Put", data);
    }
  }

  static async savePSGScores(dataChunks) {
    const url = window.$restAPIURL + "savePSGScores";
    const data = {
      dataChunks: dataChunks,
    };
    return await this.fetchData(url, "Put", data);
  }

  static async fetchData(url, method = "Get", query = null) {
    try {
      let response;
      if (method === "Get") {
        response = await this.fetchGet(url);
      } else {
        response = await this.fetchPut(url, query);
      }
      if (response.status === 200) {
        try {
          const data = await response.json();
          return {
            status: response.status,
            data: data,
            errorMessage: "",
          };
        } catch (err) {}
        return {
          status: response.status,
          data: null,
          errorMessage: "",
        };
      } else {
        const errorMessage = await response.text();
        return {
          status: response.status,
          data: null,
          errorMessage: errorMessage,
        };
      }
    } catch (err) {
      return {
        status: -1,
        data: null,
        errorMessage: err.message,
      };
    }
  }

  static async fetchGet(url) {
    return await fetch(url, {
      method: "Get",
      credentials: window.$isDevelopment ? "include" : "same-origin",
    });
  }

  static async fetchPut(url, query) {
    return await fetch(url, {
      method: "PUT",
      credentials: window.$isDevelopment ? "include" : "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(query),
    });
  }
}
