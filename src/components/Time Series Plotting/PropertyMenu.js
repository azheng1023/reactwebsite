import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  Drawer,
  ListItem,
  ListItemText,
  Collapse,
  List,
  RadioGroup,
  Radio,
  TextField,
  Checkbox,
  FormControlLabel,
  IconButton,
  Switch,
} from "@material-ui/core";
import { ExpandLess, ExpandMore } from "@material-ui/icons";
import SaveIcon from "@material-ui/icons/Save";
import CancelIcon from "@material-ui/icons/Cancel";
import ArrowUpwardIcon from "@material-ui/icons/ArrowUpward";
import StorageUtility, { PlotPropertyName } from "../../models/StorageUtility";
import ColorPicker from "../ColorPicker";

const ChannelItemName = "channelsOpen";
const DisplayPropertiesItemName = "displayPropertiesOpen";
const PreferenceItemName = "preferenceOpen";
const NewPreferencePlaceholder = "New...";
const useStyles = makeStyles((theme) => ({
  drawerPaper: {
    top: 50,
    width: 275,
    height: "calc(100% - 100px)",
  },
  nested: {
    paddingLeft: theme.spacing(2),
  },
  nestedSpaceBetween: {
    display: "flex",
    justifyContent: "space-between",
    paddingLeft: theme.spacing(4),
  },
  nested2: {
    paddingLeft: theme.spacing(6),
  },
  swatch: {
    width: "28px",
    height: "28px",
    borderRadius: "8px",
    border: "3px solid #fff",
    boxShadow:
      "0 0 0 1px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(0, 0, 0, 0.5)",
    cursor: "pointer",
  },
}));

export default function PropertyMenu(props) {
  let preferences = StorageUtility.getPreferences();
  preferences.push(NewPreferencePlaceholder);
  const currentPreference = StorageUtility.getCurrentPreference();

  const [state, setState] = useState({
    [ChannelItemName]: true,
    [DisplayPropertiesItemName]: true,
    [PreferenceItemName]: true,
    colorPickerOpen: false,
    lastPreference: currentPreference,
    currentPreference: currentPreference,
    isNewPreferenceSelected: preferences.length <= 1,
  });

  const handleSavePreference = () => {
    StorageUtility.saveCurrentPreference(state.currentPreference);
    setState({
      ...state,
      isNewPreferenceSelected: false,
    });
  };

  const handleDeleteOrCancelNewPreference = () => {
    if (state.isNewPreferenceSelected) {
      setState({
        ...state,
        currentPreference: state.lastPreference,
        isNewPreferenceSelected: false,
      });
    } else {
      StorageUtility.deleteCurrentPreference();
      const newCurrentPreference = StorageUtility.getCurrentPreference();
      setState({
        ...state,
        lastPreference: newCurrentPreference,
        currentPreference: newCurrentPreference,
        isNewPreferenceSelected: preferences.length <= 2,
      });
    }
  };

  const handlePreferenceChange = (event) => {
    const newPreference = event.target.value;
    if (newPreference === NewPreferencePlaceholder) {
      setState({
        ...state,
        currentPreference: "",
        isNewPreferenceSelected: true,
      });
    } else {
      if (state.isNewPreferenceSelected) {
        setState({
          ...state,
          currentPreference: newPreference,
        });
      } else {
        setState({
          ...state,
          lastPreference: newPreference,
          currentPreference: newPreference,
        });
        StorageUtility.changeCurrentPreference(newPreference);
        props.handlePreferenceChange(newPreference);
      }
    }
  };

  const handleCollapse = (itemName) => () => {
    setState({
      ...state,
      [itemName]: !state[itemName],
    });
  };

  const handleChannelMoveDown = (orderedChannelIndex) => () => {
    // TODO: Replace with drag and drop
    props.handleChannelOrderChange(
      orderedVisibleChannels[orderedChannelIndex].name,
      orderedVisibleChannels[orderedChannelIndex - 1].name
    );
  };

  let orderedVisibleChannels = [];
  props.plotProperties[PlotPropertyName.channelOrder].forEach(
    (orderedChannel) => {
      if (props.channels.includes(orderedChannel)) {
        orderedVisibleChannels.push({
          name: orderedChannel,
          visible: props.plotProperties.channels[orderedChannel].visible,
        });
      }
    }
  );
  const classes = useStyles();
  return (
    <Drawer
      classes={{
        paper: classes.drawerPaper,
      }}
      keepMounted
      open={props.openMenu}
      onClose={props.handleMenuClose}
    >
      <List component="nav">
        <ListItem
          key="channelSelection"
          button
          divider
          onClick={handleCollapse(ChannelItemName)}
        >
          <ListItemText primary="Channels" />
          {state[ChannelItemName] ? <ExpandMore /> : <ExpandLess />}
        </ListItem>
        <Collapse in={state[ChannelItemName]} timeout="auto" unmountOnExit>
          <List component="div" className={classes.nested}>
            {orderedVisibleChannels.map((channelVisibility, index) => (
              <ListItem
                key={channelVisibility.name}
                className={classes.nestedSpaceBetween}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      onChange={props.handleChannelCheckboxChange(
                        channelVisibility.name
                      )}
                      checked={channelVisibility.visible}
                      color="primary"
                      name={channelVisibility.name}
                    />
                  }
                  label={channelVisibility.name}
                />
                {index !== 0 && (
                  <IconButton onClick={handleChannelMoveDown(index)}>
                    <ArrowUpwardIcon fontSize="small" />
                  </IconButton>
                )}
              </ListItem>
            ))}
          </List>
        </Collapse>
        <ListItem
          key={DisplayPropertiesItemName}
          button
          divider
          onClick={handleCollapse(DisplayPropertiesItemName)}
        >
          <ListItemText primary="Display Properties" />
          {state[DisplayPropertiesItemName] ? <ExpandMore /> : <ExpandLess />}
        </ListItem>
        <Collapse
          in={state[DisplayPropertiesItemName]}
          timeout="auto"
          unmountOnExit
        >
          <List component="div">
            <ListItem
              key="backgroundColorProperty"
              className={classes.nestedSpaceBetween}
            >
              <ListItemText>Backgrond Color</ListItemText>
              <ColorPicker
                backgroundColor={
                  props.plotProperties[PlotPropertyName.backgroundColor]
                }
                handleColorChange={props.handleColorChange}
              />
            </ListItem>
            <ListItem
              key="showGridProperty"
              className={classes.nestedSpaceBetween}
            >
              <ListItemText>Show Plot Grid</ListItemText>
              <Switch
                checked={props.plotProperties[PlotPropertyName.showGrid]}
                onChange={props.handleShowGridChange}
                name="showGrid"
              />
            </ListItem>

            <ListItem key="watermark" className={classes.nestedSpaceBetween}>
              <ListItemText>Watermark</ListItemText>
            </ListItem>
            <RadioGroup
              aria-label="watermark"
              name="watermark"
              value="none"
              className={classes.nested2}
            >
              <FormControlLabel
                key="none"
                value="none"
                control={<Radio color="primary" disabled />}
                label="None"
              />
              <FormControlLabel
                key="time"
                value="time"
                control={<Radio color="primary" disabled />}
                label="Time"
              />
              <FormControlLabel
                key="signal"
                value="signal"
                control={<Radio color="primary" disabled />}
                label="Signal"
              />
            </RadioGroup>
          </List>
        </Collapse>
        <ListItem
          key={PreferenceItemName}
          button
          divider
          onClick={handleCollapse(PreferenceItemName)}
        >
          <ListItemText primary="Preference" />
          {state[PreferenceItemName] ? <ExpandMore /> : <ExpandLess />}
        </ListItem>
        <Collapse in={state[PreferenceItemName]} timeout="auto" unmountOnExit>
          <List component="div">
            <ListItem
              key="preference-select"
              className={classes.nestedSpaceBetween}
            >
              <TextField
                id="preference-select"
                inputProps={{
                  autocomplete: "off",
                }}
                select={!state.isNewPreferenceSelected}
                SelectProps={{
                  native: true,
                }}
                placeholder="Enter new preference"
                value={state.currentPreference}
                fullWidth={true}
                onChange={handlePreferenceChange}
              >
                {preferences.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </TextField>
              {preferences.length > 1 && (
                <IconButton
                  edge="end"
                  onClick={handleDeleteOrCancelNewPreference}
                >
                  <CancelIcon />
                </IconButton>
              )}
              <IconButton
                edge="end"
                onClick={handleSavePreference}
                disabled={
                  state.isNewPreferenceSelected &&
                  (state.currentPreference === "" ||
                    preferences.includes(state.currentPreference))
                }
              >
                <SaveIcon />
              </IconButton>
            </ListItem>
          </List>
        </Collapse>
      </List>
    </Drawer>
  );
}
