import { useId, KeyboardEvent, useState, ComponentProps } from "react";

import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import OutlinedInput from "@mui/material/OutlinedInput";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import IconButton from "@mui/material/IconButton";

export const SearchBar = (props: {
  label: string;
  onSearch: (searchString: string) => void;
  sx?: ComponentProps<typeof FormControl>["sx"];
}) => {
  const { label, onSearch } = props;
  const { handleKeyPress, input, setInput, id } = useStateForSearchBar(props);

  return (
    <Box>
      <div>
        <FormControl sx={{ m: 1, width: "40ch", ...props.sx }} variant="outlined">
          <InputLabel htmlFor={id}>{label}</InputLabel>
          <OutlinedInput
            id={id}
            endAdornment={
              <InputAdornment position="end">
                <IconButton edge="end" onClick={() => onSearch(input)}>
                  <SearchIcon />
                </IconButton>
              </InputAdornment>
            }
            value={input}
            label={label}
            onChange={(e) => setInput(e.target.value)}
            onKeyUp={(e) => handleKeyPress(e)}
          />
        </FormControl>
      </div>
    </Box>
  );
};

const useStateForSearchBar = ({ onSearch }: ComponentProps<typeof SearchBar>) => {
  const [input, setInput] = useState("");
  const id = useId();

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSearch(input);
    }
  };

  return {
    input,
    setInput,
    id,
    handleKeyPress,
  };
};