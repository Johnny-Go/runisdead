import React, { useState } from "react";

import { CategoryViewModel, GameViewModel, RunDataViewModel, RunViewModel, SubcategoryValueViewModel, SubcategoryViewModel } from "../App";
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from "@mui/material/IconButton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from '@mui/material/TableHead';
import TableRow from "@mui/material/TableRow";
import Typography from '@mui/material/Typography';
import Paper from "@mui/material/Paper";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import CircularProgress from '@mui/material/CircularProgress';

const styles = {
  tableContainer: {
    maxHeight: "75vh",
    minHeight: "10vh",
  },
  table: {
    minWidth: 650
  },
  tableRow: {
    "& > *": { borderBottom: "unset" },
    "&:last-child td, &:last-child th": { border: 0 }
  },
  tableCell: {
    noBottomBorder: {
      borderBottom: "none"
    },
    noTopBottomPadding: {
      paddingBottom: 0,
      paddingTop: 0
    }
  },
  box: {
    margin: 1
  },
};

export const RunDisplay = ({ runData, loading }: {
    runData?: RunDataViewModel;
    loading: boolean;
}) => {
  return (
    <TableContainer component={Paper} sx={styles.tableContainer}>
      <Table stickyHeader size="small" aria-label="collapsible table" sx={styles.table}>
        <TableHead>
          <TableRow>
            <TableCell align="center" colSpan={3}>Total Games Run: {runData?.games?.length ?? "none"}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell />
            <TableCell align="left">Game</TableCell>
            <TableCell align="right">Categories Run</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {
            (loading)
            ? <TableRow sx={styles.tableRow}>
                <TableCell align="center" colSpan={3}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            : (runData && runData.games.length > 0)
              ?
                runData.games.map((game) => (
                  <CategoryRow 
                    key={game.gameId}
                    game={game}
                    runs={runData.runsByGameId.get(game.gameId) ?? []}
                    categories={runData.categoryLookup}
                    subcategories={runData.subcategoryLookup}
                  />
              ))
              :
                <TableRow sx={styles.tableRow}>
                  <TableCell align="center" colSpan={3}>No data to display</TableCell>
                </TableRow>
          }
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const CategoryRow = ({ game, runs, categories, subcategories }: {
  game: GameViewModel;
  runs: RunViewModel[];
  categories: Map<string, CategoryViewModel>;
  subcategories: Map<string, SubcategoryViewModel>;
}) => {
  const [open, setOpen] = useState(false);

  // we need to get every category + sub categories combination here
  /* for example:
    No Subcategories:   MMX: Any%; 100%; etc
    One Subcategory:    GCM: Any% + Easy; Co-op + Easy; etc
    Two Subcategories:  MBA: Phase 10 + 2 Players, Arcade; Phase 15 + 2 Players, Arcade; etc
    etc
  */

  const rowDataMap = new Map<string, RowData>();
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

    const subcategoryValueIds = subcategoryValueList?.map((s) => s.subcategoryValueId).join()
    const rowData: RowData = {
      runId: run.runId,
      runUrl: run.runUrl,
      place: run.place,
      time: run.times.primaryTime,
      categoryId: category?.categoryId ?? "",
      categoryName: category?.categoryName ?? "",
      subcategoryValueIds: subcategoryValueIds,
      subcategoryValueNames: subcategoryValueList?.map((s) => s.subcategoryValueName).join(", ")
    };

    //some code to filter out older runs because the /personal-bests endpoint includes old runs sometimes
    const checkId = category?.categoryId + "," + subcategoryValueList?.map((s) => s.subcategoryValueId).join();
    const checkRowData = rowDataMap.get(checkId);
    if(checkRowData) {
      if(rowData.time > checkRowData.time) {
        return;
      }
    }
    rowDataMap.set(checkId, rowData);
  });
  const sortedRowData = Array.from(rowDataMap.values()).sort((a,b) => a.categoryName.localeCompare(b.categoryName) || a.subcategoryValueNames.localeCompare(b.subcategoryValueNames));

  return (
    <React.Fragment>
      <TableRow sx={styles.tableRow} >
        <TableCell sx={styles.tableCell.noBottomBorder}>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell sx={styles.tableCell.noBottomBorder} align="left" component="th" scope="row">
          <a href={game.gameUrl} target="_blank">{game.gameName}</a>
        </TableCell>
        <TableCell sx={styles.tableCell.noBottomBorder} align="right">{sortedRowData.length}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell sx={styles.tableCell.noTopBottomPadding} colSpan={3}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={styles.box}>
              <Typography variant="h6" gutterBottom component="div">
                Categories
              </Typography>
              <Table size="small" aria-label="runs">
                <TableHead>
                  <TableRow>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Time</TableCell>
                    <TableCell align="right">Place</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedRowData.map((row) => (
                    <TableRow key={`${row.runId}`} sx={styles.tableRow}>
                      <TableCell component="th" scope="row">{`${row.categoryName}${row.subcategoryValueNames ? ": " + row.subcategoryValueNames : ""}`}</TableCell>
                      <TableCell align="right">
                        <a href={row.runUrl} target="_blank">{convertSecondsToTime(row.time)}</a>
                      </TableCell>
                      <TableCell align="right">{row.place}</TableCell>
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
  runId: string;
  runUrl: string;
  place: number;
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
    h > 0 ? `${h}h` : (d > 0) && h === 0 ? "0h" : [],
    m > 0 ? `${m}m` : (d > 0 || h > 0) && m === 0 ? "0m" : [],
    s > 0 ? `${s}s` : (d > 0 || h > 0 || m > 0) && s === 0 ? "0s" : [],
    ms > 0 ? `${ms}ms` : [],
  ].join(" ");
};
