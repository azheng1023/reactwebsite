import React from "react";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import Slider from "@material-ui/core/Slider";
import Container from "@material-ui/core/Container";
import LinearProgressBar from "@material-ui/core/LinearProgress";
import { LineChart, Line, YAxis, XAxis } from "recharts";
import { makeStyles } from "@material-ui/core/styles";
import { Box } from "@material-ui/core";

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
  if (props.enablePSGScoring) {
    const rawStages = props.scores.getStages(1);
    let stages = [];
    const xAxisDomain = [0, props.dataTimeRange.duration / 30];
    for (var i = 0; i < rawStages.length; i++) {
      const stage = rawStages[i];
      if (stage === 1) {
        stages.push({ t: i, r: stage });
        stages.push({ t: i + 1, r: stage });
      } else {
        stages.push({ t: i, s: stage });
        stages.push({ t: i + 1, s: stage });
      }
    }
    return (
      <React.Fragment>
        <Container maxWidth="x1" style={{ marginTop: -8 }}>
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
        <Grid container justify="space-between">
          <Typography variant="caption">Ep1</Typography>
          <Box borderRight={1} borderLeft={1} borderBottom={1}>
            <LineChart width={props.width - 48} height={28} data={stages}>
              <YAxis
                domain={[0, 4]}
                reversed={true}
                width={0}
                allowDataOverflow={true}
              />
              <XAxis
                dataKey="t"
                type="number"
                domain={xAxisDomain}
                hide={true}
                allowDataOverflow={true}
              />
              <Line dataKey="s" dot={false} />
              <Line dataKey="r" stroke="red" dot={false} />
            </LineChart>
          </Box>
          <Typography variant="caption" align="left" style={{ width: 20 }}>
            {Math.ceil(props.dataTimeRange.duration / 30)}
          </Typography>
        </Grid>
      </React.Fragment>
    );
  } else {
    return (
      <React.Fragment>
        <Container maxWidth="xl">
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
            {props.dataTimeRange.getDurationHHMMSS()}
          </Typography>
          <Typography variant="caption">
            {new Date(props.dataTimeRange.endTime * 1000).toLocaleString()}
          </Typography>
        </Grid>
      </React.Fragment>
    );
  }
}
