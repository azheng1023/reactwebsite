import React, { useEffect, useState } from "react";
import { Route, Redirect } from "react-router";
import { Layout } from "./components/Layout";
import { Home } from "./components/Home";
import { SignIn } from "./components/Account/SignIn";
import { SignUp } from "./components/Account/SignUp";
import { StudySummaryTable } from "./components/StudySummaryTable";
import { StudyDetail } from "./components/Time Series Plotting/StudyDetail";
import { UserContext } from "./components/UserContext";
import { ManageAccount } from "./components/Account/ManageAccount";
import { SignOut } from "./components/Account/SignOut";
import StorageUtility from "./models/StorageUtility";

window.$websiteAlias = "/health/";
window.$isDevelopment = true;
if (window.$isDevelopment) {
  window.$restAPIURL = "https://localhost:44398/";
} else {
  window.$restAPIURL = "https://www.huneo.com/api/";
}

export default function App() {
  const [sessionInfo, setSessionInfo] = useState(() => getSessionInfo());
  const value = { sessionInfo, setSessionInfo };

  useEffect(() => {
    StorageUtility.saveSessionInfo(sessionInfo);
  }, [sessionInfo]);

  return (
    <UserContext.Provider value={value}>
      <Layout sessionInfo={sessionInfo}>
        <Route exact path="/">
          <Redirect to={window.$websiteAlias} />
        </Route>
        <Route exact path={window.$websiteAlias} component={SignIn} />
        <Route path={window.$websiteAlias + "home"} component={Home} />
        <Route path={window.$websiteAlias + "signin"} component={SignIn} />
        <Route path={window.$websiteAlias + "signup"} component={SignUp} />
        <Route path={window.$websiteAlias + "signout"} component={SignOut} />
        <Route
          path={window.$websiteAlias + "manageAccount"}
          component={ManageAccount}
        />
        <Route
          path={window.$websiteAlias + "studySummaryTable"}
          component={StudySummaryTable}
        />
        <Route
          path={window.$websiteAlias + "studyDetail"}
          render={() => <StudyDetail />}
        />
      </Layout>
    </UserContext.Provider>
  );

  function getSessionInfo() {
    return StorageUtility.getSessionInfo();
  }
}
