import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { AppBar, Toolbar, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import Link from "@material-ui/core/Link";

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  customizeToolbarHeight: {
    minHeight: 36,
  },
  startLink: {
    marginRight: theme.spacing(2),
  },
  title: {
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
  },
  link: {
    marginRight: theme.spacing(2),
  },
}));

export default function NavMenu(props) {
  const classes = useStyles();

  if (props.sessionInfo.isLoggedIn) {
    return (
      <AppBar
        position="static"
        color="transparent"
        style={{ margin: "5 0 5 0" }}
      >
        <Toolbar className={classes.customizeToolbarHeight}>
          <Link
            className={classes.startLink}
            component={RouterLink}
            to={window.$websiteAlias + "home"}
          >
            Huneo
          </Link>
          <Typography variant="subtitle1" className={classes.title}>
            {props.sessionInfo.pageTitle}
          </Typography>
          <Link
            className={classes.link}
            component={RouterLink}
            to={window.$websiteAlias + "studySummaryTable"}
          >
            My Studies
          </Link>
          <Link
            className={classes.link}
            component={RouterLink}
            to={window.$websiteAlias + "manageAccount"}
          >
            My Account
          </Link>
          <Link
            className={classes.link}
            component={RouterLink}
            to={window.$websiteAlias + "signout"}
          >
            Sign Out
          </Link>
        </Toolbar>
      </AppBar>
    );
  } else {
    return (
      <AppBar
        position="static"
        color="transparent"
        style={{ margin: "5 0 5 0" }}
      >
        <Toolbar className={classes.customizeToolbarHeight}>
          <Link
            className={classes.startLink}
            component={RouterLink}
            to={window.$websiteAlias + "home"}
          >
            Huneo
          </Link>
          <Typography variant="h6" className={classes.title}>
            {props.sessionInfo.pageTitle}
          </Typography>
          <Link
            className={classes.link}
            component={RouterLink}
            to={window.$websiteAlias + "signin"}
          >
            Sign In
          </Link>
        </Toolbar>
      </AppBar>
    );
  }
}
