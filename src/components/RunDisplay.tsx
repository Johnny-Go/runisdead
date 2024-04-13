import React, { useCallback, useState } from "react";

import { CategoryDataViewModel, GameDataViewModel, PersonalBestDataViewModel, RunDataViewModel, SubcategoryValueDataViewModel, SubcategoryDataViewModel } from "../App";
import { remote } from "../remote";
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

export const RunDisplay = ({ userId, runData, loading }: {
  userId: string;
  runData?: PersonalBestDataViewModel;
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
                    key={`${userId}-${game.gameId}`}
                    userId={userId}
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

const CategoryRow = ({ userId, game, runs, categories, subcategories }: {
  userId: string;
  game: GameDataViewModel;
  runs: RunDataViewModel[];
  categories: Map<string, CategoryDataViewModel>;
  subcategories: Map<string, SubcategoryDataViewModel>;
}) => {
  const [open, setOpen] = useState<boolean>(false);

  //we need to get every category + sub categories combination here
  /* for example:
    No Subcategories:   MMX: Any%; 100%; etc
    One Subcategory:    GCM: Any% + Easy; Co-op + Easy; etc
    Two Subcategories:  MBA: Phase 10 + 2 Players, Arcade; Phase 15 + 2 Players, Arcade; etc
    etc
  */

  const rowDataMap = new Map<string, RunRowData>();
  runs.forEach((run) => {
    const category = categories.get(run.categoryId);
    const subcategoryValueList: SubcategoryValueDataViewModel[] = [];
    run.subcategories.forEach((subcategory) => {
      const subcategoryData = subcategories.get(subcategory.subcategoryId);
      const subcategoryValue = subcategoryData?.subcategoryValues.get(subcategory.subcategoryValueId);

      if(subcategoryValue) {
        subcategoryValueList.push(subcategoryValue);
      }
    });

    const subcategoryValueIds = subcategoryValueList?.map((s) => s.subcategoryValueId).join()
    const rowData: RunRowData = {
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
    const checkId = category?.categoryId + "," + subcategoryValueIds;
    const checkRowData = rowDataMap.get(checkId);
    if (checkRowData) {
      if (rowData.time > checkRowData.time) {
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
          <Collapse in={open} timeout="auto">
            <Box sx={styles.box}>
              <Typography variant="h6" gutterBottom component="div">
                Categories
              </Typography>
              <Table size="small" aria-label="runs">
                <TableHead>
                  <TableRow>
                    <TableCell />
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Time</TableCell>
                    <TableCell align="right">Place</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedRowData.map((row) => (
                    <HistoryRow key={`history-${row.runId}`} userId={userId} gameId={game.gameId} rowData={row} />
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

const HistoryRow = ({ userId, gameId, rowData }: {
  userId: string;
  gameId: string;
  rowData: RunRowData;
}) => {
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [runHistoryData, setRunHistoryData] = useState<RunHistoryRowData[]>();

  const handleExpand = useCallback(async (userId: string, gameId: string, categoryId: string) => {
    setOpen(!open);

    //don't hit the API repeatedly once we have data
    if (runHistoryData) {
      return;
    } else {
      setLoading(true);
    }

    const runHistory = await remote.speedrun.getUserRunHistory(userId, gameId, categoryId);
    
    const runHistoryArray: RunHistoryRowData[] = [];
    //parse run history here, need to make sure we get the correct subcategories for runs, then sort by best time first
    runHistory.forEach((run) => {
      //don't include ILs, this probably isn't necessary because we get run by category, but it can't hurt either
      if (run.level) {
        return;
      }

      //get subcategories for each category, as well as their values
      const mappedSubcategoriesBySubcategoryId = new Map<string, SubcategoryDataViewModel>();
      run.category.data.variables.data.forEach((subcategory) => {
        if (subcategory["is-subcategory"] === true) {
          const subcategoryValuesMap = new Map<string, SubcategoryValueDataViewModel>();
          //lol this JSON, why isn't this an array?
          for (const [key, value] of Object.entries(subcategory.values.values)) {
            subcategoryValuesMap.set(key, {
              subcategoryValueId: key,
              subcategoryValueName: value.label,
            });
          }

          mappedSubcategoriesBySubcategoryId.set(subcategory.id, {
              subcategoryId: subcategory.id,
              subcategoryName: subcategory.name,
              subcategoryValues: subcategoryValuesMap,
          });
        }
      });

      //get the subcategories for the run
      const runSubcategories = [];
      for (const [key, value] of Object.entries(run.values)) {
        if (mappedSubcategoriesBySubcategoryId.get(key)) {
          runSubcategories.push({
            subcategoryId: key,
            subcategoryValueId: value,
          });
        }
      }

      //map run subcategory values
      const subcategoryValueList: SubcategoryValueDataViewModel[] = [];
      runSubcategories.forEach((subcategory) => {
        const subcategoryData = mappedSubcategoriesBySubcategoryId.get(subcategory.subcategoryId);
        const subcategoryValue = subcategoryData?.subcategoryValues.get(subcategory.subcategoryValueId);

        if (subcategoryValue) {
          subcategoryValueList.push(subcategoryValue);
        }
      });

      const runSubCategoryValueIds = subcategoryValueList?.map((s) => s.subcategoryValueId).join();
      if (rowData.subcategoryValueIds === runSubCategoryValueIds) {
        runHistoryArray.push({
          runId: run.id,
          runUrl: run.weblink,
          time: run.times.primary_t,
          status: run.status.status,
          date: run.date,
          categoryId: run.category.data.id,
          categoryName: run.category.data.name,
        });
      }
    });

    setRunHistoryData(runHistoryArray.sort((a,b) => a.time - b.time));
    setLoading(false);
  }, [open, rowData, runHistoryData]);

  return (
    <React.Fragment key={`${rowData.runId}`}>
      <TableRow key={`${rowData.runId}`} sx={styles.tableRow}>
        <TableCell sx={styles.tableCell.noBottomBorder}>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => handleExpand(userId, gameId, rowData.categoryId)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row" sx={styles.tableCell.noBottomBorder}>{`${rowData.categoryName}${rowData.subcategoryValueNames ? ": " + rowData.subcategoryValueNames : ""}`}</TableCell>
        <TableCell align="right" sx={styles.tableCell.noBottomBorder}>
          <a href={rowData.runUrl} target="_blank">{convertSecondsToTime(rowData.time)}</a>
        </TableCell>
        <TableCell align="right" sx={styles.tableCell.noBottomBorder}>{rowData.place}</TableCell>
      </TableRow>
      {(loading)
        ? <TableRow sx={styles.tableRow}>
            <TableCell align="center" colSpan={3}>
              <CircularProgress />
            </TableCell>
          </TableRow>
        : <TableRow key={"history"}>
          <TableCell sx={styles.tableCell.noTopBottomPadding} colSpan={4}>
            <Collapse in={open} timeout="auto">
              <Box sx={styles.box}>
                <Typography variant="h6" gutterBottom component="div">
                  History
                </Typography>
                <Table size="small" aria-label="runs">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Time</TableCell>
                      <TableCell align="right">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {runHistoryData?.map((row) => (
                      <TableRow key={row.runId}>
                        <TableCell>{row.date}</TableCell>
                        <TableCell align="right"><a href={row.runUrl} target="_blank">{convertSecondsToTime(row.time)}</a></TableCell>
                        <TableCell align="right">{capitalizeFirstLetter(row.status ?? "")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      }
    </React.Fragment>
  );
};

type BaseRunRowData = {
  runId: string;
  runUrl: string;
  time: number;
  categoryId: string;
  categoryName: string;
};

type RunRowData = {
  place: number;
  subcategoryValueIds: string;
  subcategoryValueNames: string;
} & BaseRunRowData;

type RunHistoryRowData = {
  date: string;
  status: string;
} & BaseRunRowData;

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

const capitalizeFirstLetter = (word: string): string => {
  return word.charAt(0).toUpperCase() + word.slice(1);
};