import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";

function createData(value, label) {
  return { value, label };
}

const useStyles = makeStyles((theme) => ({
  formControl: {
    margin: theme.spacing(1),
    minWidth: 80,
    height: 10,
    marginTop: -5,
  },
  selectEmpty: {
    marginTop: theme.spacing(0),
  },
  selectFontStyle: {
    "& .MuiInputBase-input": {
      fontSize: 16,
    },
  },
}));

const displayIntervals = [
  createData(0.1, "0.1 sec"),
  createData(0.2, "0.2 sec"),
  createData(0.5, "0.5 sec"),
  createData(1, "1 sec"),
  createData(2, "2 sec"),
  createData(5, "5 sec"),
  createData(10, "10 sec"),
  createData(20, "20 sec"),
  createData(30, "30 sec"),
  createData(60, "1 min"),
  createData(120, "2 min"),
  createData(180, "3 min"),
  createData(300, "5 min"),
  createData(600, "10 min"),
  createData(1200, "20 min"),
  createData(1800, "30 min"),
  createData(3600, "1 hour"),
  createData(7200, "2 hour"),
  createData(10800, "3 hour"),
  createData(18000, "5 hour"),
  createData(0, "Max"),
];

export function SelectDisplayInterval(props) {
  const classes = useStyles();
  let actualIntervals = displayIntervals;
  let defaultValue = props.value;
  // If we know the study end time, we can adjust accordingly
  if (props.maxValue > 0) {
    let containsDefaultValue = false;
    actualIntervals = [];
    for (var i = 0; i < displayIntervals.length; i++) {
      if (displayIntervals[i].value <= props.maxValue) {
        actualIntervals.push(displayIntervals[i]);
        if (displayIntervals[i].value === props.value) {
          containsDefaultValue = true;
        }
      }
    }
    if (!containsDefaultValue) {
      defaultValue = actualIntervals[actualIntervals.length - 1].value;
    }
  }
  return (
    <FormControl className={classes.formControl}>
      <Select
        labelId="display-interval-select-label"
        id="display-interval-select"
        disabled={props.disabled}
        value={defaultValue}
        onChange={props.handleChange}
        style={{fontSize: 14}}
      >
        {actualIntervals.map((interval) => (
          <MenuItem
            id={interval.value}
            key={interval.value}
            value={interval.value}
            dense={true}
          >
            {interval.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
