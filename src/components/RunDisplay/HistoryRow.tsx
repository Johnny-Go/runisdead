import React, { useMemo, useCallback, useState } from "react";

import { SubcategoryValueDataViewModel, SubcategoryDataViewModel } from "../../App";
import { remote } from "../../remote";
import { capitalizeFirstLetter, convertSecondsToTime } from "../../utility";
import { RunHistoryRowData, RunRowData } from "./RunDisplayTypes";
import { styles } from "./RunDisplayStyles";

import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from "@mui/material/IconButton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from '@mui/material/TableHead';
import TableRow from "@mui/material/TableRow";
import Typography from '@mui/material/Typography';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';

export const HistoryRow = ({ userId, gameId, rowData }: {
  userId: string;
  gameId: string;
  rowData: RunRowData;
}) => {
  const { open, loading, runHistoryData, handleExpand } = useStateForHistoryRow(rowData);

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
                        <TableCell align="right">
                          {(row.reason)
                            ? <Tooltip title={row.reason}>
                                <u className="dotted">{capitalizeFirstLetter(row.status ?? "")}</u>
                              </Tooltip>
                            : capitalizeFirstLetter(row.status ?? "")
                          }
                        </TableCell>
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

const useStateForHistoryRow = (rowData: RunRowData) => {
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
          reason: run.status.reason,
          date: run.date,
          categoryId: run.category.data.id,
          categoryName: run.category.data.name,
        });
      }
    });

    setRunHistoryData(runHistoryArray.sort((a,b) => a.time - b.time));
    setLoading(false);
  }, [open, rowData, runHistoryData]);

  return useMemo(() => ({
    open,
    loading,
    runHistoryData,
    handleExpand
  }), [open, loading, runHistoryData, handleExpand]);
};