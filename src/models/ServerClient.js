export default class ServerClient {
  static async fetchPerformanceStats() {
    const url = window.$restAPIURL + "GetPerformanceStats";
    return await this.fetchData(url);
  }

  static async signIn(email, password) {
    const url =
      window.$restAPIURL + "connect?email=" + email + "&password=" + password;
    return await this.fetchData(url);
  }

  static async signOut() {
    const url = window.$restAPIURL + "disconnect";
    await this.fetchData(url);
  }

  static async getStudySummary() {
    const url = window.$restAPIURL + "getdatalist";
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

  static async assignDevice(data) {
    const url = window.$restAPIURL + "assignDevice";
    const device = {
      hardwareID: data.hardwareID,
      assignedUser: {
        email: data.email,
        phoneNumber: data.phoneNumber,
        name: data.name,
      },
    };
    return await this.fetchData(url, "Put", device);
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
