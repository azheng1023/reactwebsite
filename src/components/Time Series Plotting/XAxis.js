import React from "react";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import { Button, ButtonGroup } from "@material-ui/core";
import { SelectDisplayInterval } from "./SelectDisplayInterval";
import { Fragment } from "react";
import PSGScoring from "../../models/PSGScoring";

export function XAxis(props) {
  const startEpochNumber = Math.round(
    1 + (props.displayTimeRange.startTime - props.dataTimeRange.startTime) / 30
  );
  const maxEpochNumber = 1 + Math.ceil(props.dataTimeRange.duration/30);
  const numberOfEpochs = Math.round(props.displayTimeRange.duration / 30);
  let epochLabel = "Epoch " + startEpochNumber;
  if (numberOfEpochs > 1) {
    epochLabel += " - " + (startEpochNumber + numberOfEpochs - 1);
  }
  const sleepStages = [];
  if (props.enablePSGScoring && numberOfEpochs <= 10) {
    for (
      let i = startEpochNumber - 3;
      i < Math.min(maxEpochNumber + 1, startEpochNumber + numberOfEpochs + 3);
      i++
    ) {
      if (i > 0) {
        const stage = props.scores.getStages(i, 1);
        const stageLabel = PSGScoring.getStageLabel(stage);
        if (
          i >= startEpochNumber &&
          i <= startEpochNumber + numberOfEpochs - 1
        ) {
          sleepStages.push({
            deltaEpoch: 0,
            stageLabel: stageLabel,
            variant: "contained",
            color: "default",
          });
        } else {
          sleepStages.push({
            deltaEpoch:
              i < startEpochNumber
                ? i - startEpochNumber
                : i - (startEpochNumber + numberOfEpochs - 1),
            stageLabel: stageLabel,
            variant: "outlined",
            color: "primary",
          });
        }
      }
    }
  }

  return (
    <Grid
      container
      spacing={2}
      justify="space-between"
      style={{
        width: props.width,
        margin: "auto",
        marginTop: -5,
        marginBottom: -5,
        marginLeft: 0,
      }}
    >
      <Grid item>
        <Typography variant="caption">
          {new Date(props.displayTimeRange.startTime * 1000).toLocaleString()}
        </Typography>
      </Grid>
      <Grid item>
        {props.enablePSGScoring && (
          <Fragment>
            <Typography variant="caption">{epochLabel}</Typography>
            <ButtonGroup
              size="small"
              disableElevation
              color="primary"
              aria-label="outlined primary button group"
              style={{
                height: 24,
                marginBottom: -4,
                marginLeft: 30,
                marginRight: 30,
              }}
            >
              {sleepStages.map((stage, index) => (
                <Button
                  variant={stage.variant}
                  color={stage.color}
                  onClick={() => props.handleEpochClick(stage.deltaEpoch)}
                >
                  {stage.stageLabel}
                </Button>
              ))}
            </ButtonGroup>
          </Fragment>
        )}
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
