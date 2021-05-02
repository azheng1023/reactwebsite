import React, { useContext, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { UserContext } from "../UserContext";
import {MessagedProgress} from "../MessagedProgress";
import StorageUtility from "../../models/StorageUtility";
import ServerClient from "../../models/ServerClient";

export function SignOut(props) {
  const { setSessionInfo } = useContext(UserContext);
  const history = useHistory();

  useEffect(() => {
    async function signOut(){
      await ServerClient.signOut();
      StorageUtility.saveLogin(null);
      setSessionInfo({
        userName: "",
        isLoggedIn: false,
        pageTitle: "",
        studyID: 0,
      });
      history.push(window.$websiteAlias);  
    }
    signOut();
  }, []);

  return (
    <MessagedProgress message = "Logging out..." />
  );
}
