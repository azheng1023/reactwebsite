import React from "react";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import { SelectDisplayInterval } from "./SelectDisplayInterval";

export function XAxis(props) {
  return (
    <Grid
      container
      spacing={2}
      justify="space-between"
      style={{ width: window.innerWidth, margin: "auto", marginTop: -5 }}
    >
      <Grid item>
        <Typography variant="caption">
          {new Date(props.displayTimeRange.startTime * 1000).toLocaleString()}
        </Typography>
      </Grid>
      <Grid item>
        <SelectDisplayInterval
          disabled={props.disabled}
          handleChange={props.handleIntervalChange}
          value={props.displayInterval}
          maxValue={props.dataTimeRange.duration}
        />
      </Grid>
      <Grid item>
        <Typography variant="caption">
          {new Date(props.displayTimeRange.endTime * 1000).toLocaleString()}
        </Typography>
      </Grid>
    </Grid>
  );
}
