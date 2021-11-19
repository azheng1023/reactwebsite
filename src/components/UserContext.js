import React, { useState } from "react";

// set the defaults
export const UserContext = React.createContext({
  userName: "",
  isLoggedIn: false,
  pageTitle: "",
  dataIDs: [0],
  setSessionInfo: () => {},
});

export function UserContextProvider({ children }) {
  const [sessionInfo, setSessionInfo] = useState({
    userID: 0,
    userName: "",
    email: "",
    phoneNumber: "",
    isLoggedIn: false,
    pageTitle: "",
    dataIDs: [0],
  });
  const value = { sessionInfo, setSessionInfo };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
