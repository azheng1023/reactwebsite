import React, { Fragment, useContext, useEffect, useState } from "react";
import Container from "@material-ui/core/Container";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";
import { UserContext } from "../UserContext";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ServerPerformanceMonitor from "./ServerPerformanceMonitor";
import AccountDetail from "./AccountDetail";
import ManageUser from "./ManageUser";
import ManageDevice from "./ManageDevice";

export function ManageAccount(props) {
  const { sessionInfo, setSessionInfo } = useContext(UserContext);
  const [buttonState, setButtonState] = useState({
    selectedButton: "Detail",
    isAdmin: sessionInfo.isAdministrator,
  });

  useEffect(() => {
    setSessionInfo({
      ...sessionInfo,
      pageTitle: "Account Management",
    });
  }, []);

  const handleClick = (buttonLabel) => () => {
    console.log(buttonLabel);
    setButtonState({
      ...buttonState,
      selectedButton: buttonLabel,
    });
  };
  const buttonLabels = ["Detail", "Devices", "Users", "Performance"];
  let component;
  switch (buttonState.selectedButton) {
    case buttonLabels[1]:
      component = <ManageDevice />;
      break;
    case buttonLabels[2]:
      component = <ManageUser />;
      break;
    case buttonLabels[3]:
      component = <ServerPerformanceMonitor />;
      break;
    case buttonLabels[0]:
    default:
      component = <AccountDetail />;
  }

  return (
    <Fragment>
      <Grid container>
        <Grid item xs={1}>
          <List component="nav">
            {buttonLabels.map((label) => (
              <ListItem
                button
                key={label}
                selected={label === buttonState.selectedButton}
                disabled={label !== buttonLabels[0] && label !== buttonLabels[1] && !buttonState.isAdmin}
                divider={true}
                onClick={handleClick(label)}
              >
                <ListItemText primary={label} />
              </ListItem>
            ))}
          </List>
        </Grid>
        <Grid item xs={11}>
          {component}
        </Grid>
      </Grid>
    </Fragment>
  );
}
