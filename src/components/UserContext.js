import React, { useState } from "react";

// set the defaults
export const UserContext = React.createContext({
  userName: "",
  isLoggedIn: false,
  pageTitle: "",
  studyID: 0,
  setSessionInfo: () => {},
});

export function UserContextProvider({ children }) {
  const [sessionInfo, setSessionInfo] = useState({
    userName: "",
    isLoggedIn: false,
    pageTitle: "",
    studyID: 0,
  });
  const value = { sessionInfo, setSessionInfo };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
