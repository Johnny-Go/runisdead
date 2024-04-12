import React, { useState } from "react";

import { CategoryViewModel, RunDataViewModel, RunViewModel, SubcategoryValueViewModel, SubcategoryViewModel } from "../App";
import TableContainer from "@mui/material/TableContainer";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableHead from '@mui/material/TableHead';
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import IconButton from "@mui/material/IconButton";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';

export const RunDisplay = ({ runData }: {
    runData?: RunDataViewModel;
}) => {
  if(runData) {
    return (
      <TableContainer component={Paper}>
        <Table aria-label="collapsible table">
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>Game</TableCell>
              <TableCell align="right">Categories Run</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {runData.games.map((game) => (
              <CategoryRow 
                key={game.gameId}
                name={game.gameName}
                runs={runData.runsByGameId.get(game.gameId) ?? []}
                categories={runData.categoryLookup}
                subcategories={runData.subcategoryLookup}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  } else {
    return null;
  }
};

const CategoryRow = ({ name, runs, categories, subcategories }: {
  name: string;
  runs: RunViewModel[];
  categories: Map<string, CategoryViewModel>;
  subcategories: Map<string, SubcategoryViewModel>;
}) => {
  const [open, setOpen] = useState(false);

  // we need to get every category + sub categories combination here
  /* for example:
    No Subcategories:   MMX: Any%; 100%; etc
    One Subcategory:    GCM: Any% + Easy; Co-op + Easy; etc
    Two Subcategories:  MBA: Phase 10 + 2 Players, Arcade; Phase 15 + 2 Players, Arcade; etc\
    etc
  */

  const rowData:RowData[] = [];
  runs.forEach((run) => {
    const category = categories.get(run.categoryId);
    const subcategoryValueList: SubcategoryValueViewModel[] = [];
    run.subcategories.forEach((subcategory) => {
      const subcategoryData = subcategories.get(subcategory.subcategoryId);
      const subcategoryValue = subcategoryData?.subcategoryValues.get(subcategory.subcategoryValueId);

      if(subcategoryValue) {
        subcategoryValueList.push(subcategoryValue);
      }
    });

    rowData.push({
      time: run.times.primaryTime,
      categoryId: category?.categoryId ?? "",
      categoryName: category?.categoryName ?? "",
      subcategoryValueIds: subcategoryValueList?.map((s) => s.subcategoryValueId).join(),
      subcategoryValueNames: subcategoryValueList?.map((s) => s.subcategoryValueName).join(", ")
    });
  });

  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">{name}</TableCell>
        <TableCell align="right">{runs.length}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Categories
              </Typography>
              <Table size="small" aria-label="runs">
                <TableHead>
                  <TableRow>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rowData.map((row) => (
                    <TableRow key={`${row.categoryId},${row.subcategoryValueIds}`}>
                      <TableCell component="th" scope="row">{`${row.categoryName}${row.subcategoryValueNames ? ": " + row.subcategoryValueNames : ""}`}</TableCell>
                      <TableCell align="right">{convertSecondsToTime(row.time)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};

type RowData = {
  time: number;
  categoryId: string;
  categoryName: string;
  subcategoryValueIds: string;
  subcategoryValueNames: string;
};

const convertSecondsToTime = (numSeconds: number): string => {
  let workingVar = (numSeconds * 1000);
  const d = Math.trunc(workingVar / 86400000);
  workingVar = workingVar % 86400000;
  const h = Math.trunc(workingVar / 3600000);
  workingVar = workingVar % 3600000;
  const m = Math.trunc(workingVar / 60000);
  workingVar = workingVar % 60000;
  const s = Math.trunc(workingVar / 1000);
  workingVar = workingVar % 1000;
  const ms = workingVar;

  return [
    d > 0 ? `${d}d` : [],
    h > 0 ? `${h}h` : [],
    m > 0 ? `${m}m` : [],
    s > 0 ? `${s}s` : [],
    ms > 0 ? `${ms}ms` : [],
  ].join(" ");
};