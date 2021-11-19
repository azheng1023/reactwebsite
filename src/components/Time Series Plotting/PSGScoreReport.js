import React from "react";
import { Container } from "@material-ui/core";
import { DataGrid } from "@material-ui/data-grid";

const columns = [
  {
    field: "name",
    headerName: "Name",
    flex: 0.1,
    type: "string",
    align: "left",
    headerAlign: "center",
    filterable: false,
    sortable: false,
    renderCell: (params) =>
      params.value[0] === "?" ? (
        <strong>
          <span>{params.value.substring(1)}</span>
        </strong>
      ) : (
        <span>
          {"\u00A0"}
          {"\u00A0"}
          {"\u00A0"}
          {params.value}
        </span>
      ),
  },
  {
    field: "value",
    headerName: "Value",
    flex: 0.2,
    type: "string",
    align: "center",
    headerAlign: "center",
    filterable: false,
    sortable: false,
  },
];

const tableStyle = {
  height: "100vh",
  backgroundColor: "white",
};

export default function PSGScoreReport(props) {
  const rows = [];
  const summary = props.scores.getSummary();
  let id = 0;
  for (const key in summary) {
    rows.push({
      id: id,
      name: key,
      value: summary[key],
    });
    id++;
  }
  return (
    <Container maxWidth="md" style={tableStyle}>
      <DataGrid
        disableColumnMenu
        hideFooter
        density="compact"
        rows={rows}
        columns={columns}
      ></DataGrid>
    </Container>
  );
}
