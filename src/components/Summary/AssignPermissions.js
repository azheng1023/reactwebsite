import React, { useState, useEffect } from "react";
import {
  Container,
  List,
  ListItem,
  ListItemText,
  Typography,
  Button,
  IconButton,
  Grid,
  FormControlLabel,
  Checkbox,
  Divider,
  TextField,
} from "@material-ui/core";
import Collapse from "@material-ui/core/Collapse";
import Alert from "@material-ui/lab/Alert";
import RemoveIcon from "@material-ui/icons/Remove";
import AddIcon from "@material-ui/icons/Add";
import ServerClient from "../../models/ServerClient";
import { MessagedProgress } from "../MessagedProgress";

const tableStyle = {
  height: "90vh",
  marginTop: "5vh",
  marginButtom: "5vh",
  backgroundColor: "white",
};

const listItemStyle = {
  marginTop: -10,
  marginButtom: -10,
};

export function AssignPermissions(props) {
  const [state, setState] = useState({
    hasChanged: false,
    addViewer: false,
    newViewer: "",
    emailValidationErrorMessage: "",
    savePermissionErrorMessage: "",
    scorers: [],
    viewers: [],
    dataRetrieved: false,
    errorMessage: "",
  });

  const handleSelectScorer = (email) => (event) => {
    state.scorers.forEach((scorer) => {
      if (scorer.email === email) {
        scorer.isSelected = !scorer.isSelected;
        setState({
          ...state,
          hasChanged: true,
        });
        return;
      }
    });
    console.log(email);
  };

  const handleDeleteViewer = (email) => (event) => {
    state.viewers.forEach((scorer) => {
      if (scorer.email === email) {
        scorer.isDeleted = true;
        setState({
          ...state,
          hasChanged: true,
        });
        return;
      }
    });
  };

  const handleAddViewer = async (event) => {
    if (state.addViewer) {
      if (state.newViewer) {
        const response = await ServerClient.getUser(state.newViewer);
        if (response.status === 200) {
          if (response.data.length > 0) {
            state.viewers.push({
              userID: response.data[0].userID,
              name: response.data[0].name,
              email: state.newViewer,
              isDeleted: false,
              isAdded: true,
            });
            setState({
              ...state,
              addViewer: false,
              newViewer: "",
              emailValidationErrorMessage: "",
              hasChanged: true,
            });
          } else {
            setState({
              ...state,
              emailValidationErrorMessage:
                "No user with this email exists on the server.",
            });
            return;
          }
        } else {
          setState({
            ...state,
            emailValidationErrorMessage:
              "Error validating this email on the server: " + response.status,
          });
          return;
        }
      } else {
        setState({
          ...state,
          addViewer: false,
        });
      }
    } else {
      setState({
        ...state,
        addViewer: true,
      });
    }
  };

  const handleNewViewer = (event) => {
    setState({
      ...state,
      emailValidationErrorMessage: "",
      newViewer: event.target.value,
    });
  };

  const handleCancelAddViewer = (event) => {
    setState({
      ...state,
      addViewer: false,
    });
  };

  const handleSaveChanges = async (event) => {
    const updatedPermissions = [];
    if (state.scorers) {
      state.scorers.forEach((scorer) => {
        if (scorer.isSelected !== scorer.wasScorer) {
          let code = -1;
          if (scorer.isSelected) {
            code = 1;
          }
          scorer.wasScorer = scorer.isSelected;
          updatedPermissions.push({
            userID: scorer.userID,
            code: code,
          });
        }
      });
    }
    if (state.viewers) {
      state.viewers.forEach((viewer) => {
        if (viewer.isAdded !== viewer.isDeleted) {
          let code = -1;
          if (viewer.isAdded) {
            code = 1;
          }
          viewer.isAdded = false;
          updatedPermissions.push({
            userID: viewer.userID,
            code: code,
          });
        }
      });
    }
    const response = await ServerClient.UpdatePermissions(
      props.dataIDs,
      updatedPermissions
    );
    if (response.status === 200) {
      setState({
        ...state,
        hasChanged: false,
      });
    } else {
      setState({
        ...state,
        savePermissionErrorMessage: response.errorMessage,
      });
    }
  };

  useEffect(() => {
    fetchAssignedPermissions(props.dataIDs);
  }, []);

  if (state.dataRetrieved) {
    return (
      <Container maxWidth="sm" style={tableStyle}>
        <Typography variant="h5" align="center" style={{ margin: 20 }}>
          Assign Scoring and Viewing Permissions
        </Typography>
        <Typography variant="h6">Scorer</Typography>
        <List>
          {state.scorers &&
            state.scorers.map((scorer) => (
              <ListItem key={scorer.name}>
                <FormControlLabel
                  control={
                    <Checkbox
                      onChange={handleSelectScorer(scorer.email)}
                      checked={scorer.isSelected}
                      color="primary"
                      name={scorer.name}
                    />
                  }
                  label={
                    scorer.name +
                    (scorer.applyToAll ? "" : " (only for some studies)")
                  }
                />
              </ListItem>
            ))}
        </List>
        <Divider />
        <Typography variant="h6">Viewers</Typography>
        <List>
          {state.viewers &&
            state.viewers.map(
              (viewer) =>
                !viewer.isDeleted && (
                  <ListItem key={viewer.name} style={listItemStyle}>
                    <ListItemText>
                      {viewer.name +
                        (viewer.applyToAll ? "" : " (only for some studies)")}
                    </ListItemText>
                    <IconButton
                      color="secondary"
                      onClick={handleDeleteViewer(viewer.email)}
                    >
                      <RemoveIcon />
                    </IconButton>
                  </ListItem>
                )
            )}
          <ListItem key="addViewer" style={listItemStyle}>
            {state.addViewer && (
              <TextField
                id="standard-required"
                placeholder="Enter Email Address"
                defaultValue=""
                fullWidth
                error={state.emailValidationErrorMessage !== ""}
                helperText={state.emailValidationErrorMessage}
                value={state.newViewer}
                onChange={handleNewViewer}
              />
            )}
            {state.addViewer && (
              <IconButton
                color="secondary"
                size="medium"
                onClick={handleCancelAddViewer}
              >
                <RemoveIcon />
              </IconButton>
            )}
            <IconButton color="primary" size="medium" onClick={handleAddViewer}>
              <AddIcon />
            </IconButton>
          </ListItem>
        </List>
        <Divider />
        <Collapse in={state.savePermissionErrorMessage !== ""}>
          <Alert severity="error">{state.savePermissionErrorMessage}</Alert>
        </Collapse>
        <Grid container justify="flex-end">
          <Button color="primary" size="medium" onClick={props.handleCancel}>
            Close
          </Button>
          <Button
            disabled={!state.hasChanged}
            color="primary"
            size="medium"
            onClick={handleSaveChanges}
          >
            Save
          </Button>
        </Grid>
        {state.errorMessage && (
          <Typography color="secondary">{state.errorMessage}</Typography>
        )}
      </Container>
    );
  } else {
    return <MessagedProgress message="Loading Permissions..." />;
  }
  async function fetchAssignedPermissions(dataIDs) {
    const getScorersResponse = await ServerClient.getPSGScorers();
    const getReadersResponse = await ServerClient.getReaders(dataIDs);
    if (getReadersResponse.status === 200) {
      const scorers = {};
      getScorersResponse.data.forEach((scorer) => {
        scorers[scorer.userID] = {
          userID: scorer.userID,
          name: scorer.name,
          isSelected: false,
          wasScorer: false,
          applyToAll: true,
        };
      });
      const readerDict = {};
      for (const [key, value] of Object.entries(getReadersResponse.data)) {
        value.forEach((reader) => {
          if (readerDict[reader.userID]) {
            readerDict[reader.userID].count++;
          } else {
            readerDict[reader.userID] = {
              userID: reader.userID,
              name: reader.name,
              email: reader.email,
              isDeleted: false,
              isAdded: false,
              count: 1,
            };
          }
        });
      }
      const readers = [];
      Object.values(readerDict).forEach((reader) => {
        reader.applyToAll = (reader.count === dataIDs.length);
        if (scorers[reader.userID]) {
          scorers[reader.userID].isSelected = true;
          scorers[reader.userID].wasScorer = true;
          scorers[reader.userID].applyToAll = reader.applyToAll;
        } else {
          readers.push(reader);
        }
      });
      setState({
        ...state,
        scorers: Object.values(scorers),
        viewers: readers,
        errorMessage: "",
        dataRetrieved: true,
      });
    } else {
      setState({
        ...state,
        errorMessage: getReadersResponse.errorMessage,
        dataRetrieved: true,
      });
    }
  }
}
