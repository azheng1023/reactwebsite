import React, { useContext, useEffect } from "react";
import { UserContext } from "./UserContext";
import { MessagedProgress } from "./MessagedProgress";

export function Home() {
  const { sessionInfo, setSessionInfo } = useContext(UserContext);

  useEffect(() => {
    setSessionInfo({
      ...sessionInfo,
      pageTitle: "Welcome",
    });
  }, []);

  return (
    <MessagedProgress
      message="Welcome to the Huneo Time Series Data Service (v 1.1)."
      hideProgress={true}
    />
  );
}
