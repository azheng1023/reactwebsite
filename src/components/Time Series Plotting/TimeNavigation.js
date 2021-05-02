import React from "react";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import Slider from "@material-ui/core/Slider";
import Container from "@material-ui/core/Container";
import LinearProgressBar from "@material-ui/core/LinearProgress";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles({
  rectangleStyle: {
    "& .MuiSlider-thumb": {
      height: 12,
      width: (props) => props.width,
      borderRadius: "0%",
    },
  },
});

export function TimeNavigation(props) {
  return (
    <React.Fragment>
      <Container maxWidth="xl" style={{ marginTop: -8 }}>
        <Slider
          //className={classes.rectangleStyle}
          track={false}
          value={props.sliderValue}
          step={props.displayInterval}
          max={props.sliderMax}
          onChangeCommitted={props.handleSliderChange}
          aria-labelledby="continuous-slider"
        />
        <LinearProgressBar
          variant="buffer"
          value={props.progressBarValue}
          style={{ marginTop: -22 }}
          valueBuffer={props.isLiveData ? 98 : 100}
        />
      </Container>
      <Grid container justify="space-between" style={{ marginTop: 5 }}>
        <Typography variant="caption">
          {new Date(props.dataTimeRange.startTime * 1000).toLocaleString()}
        </Typography>
        <Typography variant="caption">
          {props.dataTimeRange.getDurationHHMMSS() }
        </Typography>
        <Typography variant="caption">
          {new Date(props.dataTimeRange.endTime * 1000).toLocaleString()}
        </Typography>
      </Grid>
    </React.Fragment>
  );
}
