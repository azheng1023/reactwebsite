import React, { useState, useEffect, useRef, useReducer } from "react";
import {
  Container,
  Grid,
  IconButton,
  TextField,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
  FormControl,
  Dialog,
  DialogContent,
  Typography,
  Button,
  Checkbox,
  FormControlLabel,
} from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";
import { Search, Edit, Save, Cancel, Refresh } from "@material-ui/icons";
import ServerClient from "../../models/ServerClient";
import { DataGrid, GridToolbarContainer } from "@material-ui/data-grid";

const columns = [
  {
    field: "id",
    headerName: "ID",
    flex: 0.0,
    type: "string",
    hide: true,
    sortable: false,
    align: "left",
    headerAlign: "left",
  },
  {
    field: "time",
    headerName: "Time",
    width: 200,
    type: "string",
    align: "left",
    headerAlign: "left",
    sortable: false,
    valueFormatter: (params) =>
      params.value ? new Date(params.value * 1000).toLocaleString() : "",
  },
  {
    field: "body",
    headerName: "Message",
    flex: 0.9,
    type: "string",
    align: "left",
    headerAlign: "left",
    sortable: false,
    renderCell: (params) =>
      params.id < 0 ? (
        <Button color="primary">{params.value}</Button>
      ) : (
        params.value
      ),
  },
];
let retrieveLatestMessagesCallScheduled = false;

export default function ManageLogging() {
  const mounted = useRef(false);
  const [state, setState] = useState({
    messages: [],
    startMessageID: 0,
    endMessageID: 0,
    messageInDetail: "",
    serverLoggingLevel: 0,
    loggingLevel: 0,
    editLoggingLevel: false,
    refreshMessage: true,
    searchText: "",
    errorMessage: "",
  });

  const stateRef = useRef({});
  stateRef.current = state;

  const handleCellClick = async (event) => {
    if (event.id < 0) {
      if (stateRef.current.startMessageID <= 1) {
        return;
      }
      const response = await ServerClient.getMessages(
        stateRef.current.startMessageID - 1,
        false
      );
      if (response.status === 200) {
        let messages = [];
        stateRef.current.messages.forEach((message) => {
          messages.push(message);
        });
        messages.pop();
        const [startMessageID, endMessageID, newMessages] = getMessages(
          response.data
        );
        messages = messages.concat(newMessages);
        setState({
          ...stateRef.current,
          messages: messages,
          startMessageID: startMessageID,
        });
      } else {
        setState({
          ...stateRef.current,
          errorMessage: response.errorMessage,
        });
      }
    } else {
      setState({
        ...stateRef.current,
        messageInDetail: event.value,
      });
    }
  };

  const handleDetailMessageClose = (event) => {
    setState({
      ...stateRef.current,
      messageInDetail: "",
    });
  };

  const handleSaveLoggingLevel = async (event) => {
    const response = await ServerClient.setLogLevel(
      stateRef.current.loggingLevel
    );
    if (response.status === 200) {
      setState({
        ...stateRef.current,
        serverLoggingLevel: stateRef.current.loggingLevel,
      });
    } else {
      setState({
        ...stateRef.current,
        errorMessage: response.errorMessage,
      });
    }
  };

  const handleCancel = (event) => {
    setState({
      ...stateRef.current,
      loggingLevel: stateRef.current.serverLoggingLevel,
    });
  };

  const handleLoggingLevelChange = (event) => {
    setState({
      ...stateRef.current,
      loggingLevel: event.target.value,
    });
  };

  const handleUpdateNewMessageChange = (event) => {
    setState({
      ...stateRef.current,
      refreshMessage: event.target.checked,
    });
    if (event.target.checked && !retrieveLatestMessagesCallScheduled) {
      retrieveLatestMessagesCallScheduled = true;
      setTimeout(() => {
        retrieveLatestMessages(stateRef.current.endMessageID + 1);
      }, 2000);
    }
  };

  useEffect(() => {
    async function fetchMessages() {
      const response = await ServerClient.getLogLevel();
      if (response.status === 200) {
        setState({
          ...stateRef.current,
          serverLoggingLevel: response.data,
          loggingLevel: response.data,
        });
      } else {
        setState({
          ...stateRef.current,
          serverLoggingLevel: -1,
          loggingLevel: -1,
          errorMessage: response.errorMessage,
        });
      }
      const response2 = await ServerClient.getMessages(0);
      if (response2.status === 200) {
        const [startMessageID, endMessageID, messages] = getMessages(
          response2.data
        );
        setState({
          ...stateRef.current,
          messages: messages,
          startMessageID: startMessageID,
          endMessageID: endMessageID,
        });
        retrieveLatestMessagesCallScheduled = true;
        setTimeout(() => {
          retrieveLatestMessages(endMessageID + 1);
        }, 2000);
      } else {
        setState({
          ...stateRef.current,
          errorMessage: response2.errorMessage,
        });
      }
    }
    mounted.current = true;
    fetchMessages();
    return () => {
      mounted.current = false;
    };
  }, []);

  const divStyle = {
    margin: 10,
    height: window.innerHeight - 120,
    width: "100%",
  };

  return (
    <Container fixed>
      <div style={divStyle}>
        <DataGrid
          pagination
          columns={columns}
          rows={stateRef.current.messages}
          disableColumnFilter
          disableColumnMenu
          disableSelectionOnClick
          onCellClick={handleCellClick}
        ></DataGrid>
      </div>
      <Collapse in={stateRef.current.errorMessage !== ""}>
        <Alert severity="error">{stateRef.current.errorMessage}</Alert>
      </Collapse>
      <Dialog
        maxWidth="lg"
        open={stateRef.current.messageInDetail}
        onClose={handleDetailMessageClose}
      >
        <DialogContent>
          <Typography variant="body1">
            {stateRef.current.messageInDetail}
          </Typography>
        </DialogContent>
      </Dialog>
      <Grid>
        <FormControlLabel
          control={
            <Checkbox
              color="primary"
              onChange={handleUpdateNewMessageChange}
              defaultChecked
              name="Update Messages"
            />
          }
          label="Update with new messages"
        />
        <FormControl style={{ minWidth: 200 }}>
          <InputLabel id="demo-simple-select-helper-label">
            Server Logging Level
          </InputLabel>
          <Select
            labelId="demo-simple-select-helper-label"
            id="demo-simple-select-helper"
            value={stateRef.current.loggingLevel}
            label="Logging Level"
            onChange={handleLoggingLevelChange}
          >
            <MenuItem value={0}>Debug</MenuItem>
            <MenuItem value={1}>Information</MenuItem>
            <MenuItem value={2}>Warning</MenuItem>
            <MenuItem value={3}>Error</MenuItem>
          </Select>
        </FormControl>
        <IconButton
          color="primary"
          size="medium"
          disabled={
            stateRef.current.serverLoggingLevel ===
            stateRef.current.loggingLevel
          }
          onClick={handleSaveLoggingLevel}
        >
          <Save />
        </IconButton>
        <IconButton
          color="primary"
          disabled={
            stateRef.current.serverLoggingLevel ===
            stateRef.current.loggingLevel
          }
          onClick={handleCancel}
        >
          <Cancel />
        </IconButton>
      </Grid>
    </Container>
  );

  async function retrieveLatestMessages(startMessageID) {
    console.log(Date.now());
    if (!mounted.current || !stateRef.current.refreshMessage) {
      retrieveLatestMessagesCallScheduled = false;
      return;
    }
    const response = await ServerClient.getMessages(startMessageID);
    if (response.status === 200) {
      const [startMessageID, endMessageID, messages] = getMessages(
        response.data,
        false
      );
      if (messages.length > 0) {
        stateRef.current.messages.forEach((message) => {
          messages.push(message);
        });
        setState({
          ...stateRef.current,
          messages: messages,
          endMessageID: endMessageID,
        });
      } 
      if (!mounted.current || !stateRef.current.refreshMessage){
        retrieveLatestMessagesCallScheduled = false;
        return;
      }
      retrieveLatestMessagesCallScheduled = true;
      setTimeout(() => {
        retrieveLatestMessages(endMessageID + 1);
      }, 2000);
    }
  }

  function getMessages(data, appendButton = true) {
    const messages = [];
    const splitArray = data.channelName.split("-");
    const endMessageID = parseInt(splitArray[1]);
    const startMessageID = endMessageID - data.times.length + 1;
    for (var i = 0; i < data.times.length; i++) {
      messages.push({
        id: endMessageID - i,
        time: data.times[i],
        body: data.values.data[i],
      });
    }
    if (
      appendButton &&
      startMessageID > 1 &&
      endMessageID - startMessageID >= 0
    ) {
      messages.push({
        id: -1,
        time: "",
        body: "Retrieve More Messages From Server...",
      });
    }
    return [startMessageID, endMessageID, messages];
  }
}
