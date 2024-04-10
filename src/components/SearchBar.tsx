import {KeyboardEvent, useState} from "react"

import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import OutlinedInput from "@mui/material/OutlinedInput";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import { IconButton } from "@mui/material";

export const SearchBar = ({ id, inputLabel, searchFunction }: {
  id: string;
  inputLabel: string;
  searchFunction: (a: string) => void;
}) => {
  const [input, setInput] = useState("");

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (e.key === "Enter") {
      searchFunction(input);
    }
  }

  return (
    <Box>
      <div>
        <FormControl
          sx={{ m: 1, width: '25ch' }} 
          variant="outlined"
        >
          <InputLabel htmlFor={id}>{inputLabel}</InputLabel>
          <OutlinedInput
            id={id}
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  onClick={() => searchFunction(input)}
                  edge="end"
                >
                  <SearchIcon />
                </IconButton>
              </InputAdornment>
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyUp={(e) => handleKeyPress(e)}
            label={inputLabel}
          />
        </FormControl>
      </div>
    </Box>
  );
};