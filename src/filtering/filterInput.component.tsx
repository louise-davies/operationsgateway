import { Autocomplete, TextField } from '@mui/material';
import React from 'react';
import { Token, ParserError, operators, parseFilter } from './filterParser';

interface FilterInputProps {
  channels: string[];
  value: Token[];
  setValue: (value: Token[]) => void;
  error: string;
  setError: (error: string) => void;
}

const FilterInput = (props: FilterInputProps) => {
  const { channels, value, setValue, error, setError } = props;
  const options = React.useMemo(() => {
    const channelTokens: Token[] = channels.map((c) => ({
      type: 'channel',
      value: c,
    }));
    return [...channelTokens, ...operators];
  }, [channels]);
  const [inputValue, setInputValue] = React.useState<string>('');

  React.useEffect(() => {
    try {
      parseFilter(value);
      setError('');
    } catch (e) {
      if (e instanceof ParserError) setError(e.message);
    }
  }, [value, setError]);

  return (
    <Autocomplete
      multiple
      id="tags-outlined"
      options={options}
      freeSolo
      autoHighlight
      size="small"
      fullWidth
      inputValue={inputValue}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      value={value}
      getOptionLabel={(option: Token | string) =>
        typeof option !== 'string' ? option.value : option
      }
      onChange={(
        event: unknown,
        newValue: (string | Token)[],
        reason: string
      ) => {
        // createOption implies a value which is not in options so either
        // a number, a string (surrounded by quotes) or we should reject
        if (reason === 'createOption') {
          // newTerm is a string not a Token so use that fact to find it
          const newTerm = newValue.find((v) => typeof v === 'string');
          if (newTerm && typeof newTerm === 'string') {
            const newTermIndex = newValue.indexOf(newTerm);
            // new term is a valid number so allow it to be added
            if (!Number.isNaN(Number(newTerm))) {
              newValue[newTermIndex] = { type: 'number', value: newTerm };
              setValue(newValue as Token[]);
            } // new term is a string specified by either single or double quotes so allow it
            else if (
              (newTerm[0] === '"' && newTerm[newTerm.length - 1] === '"') ||
              (newTerm[0] === "'" && newTerm[newTerm.length - 1] === "'")
            ) {
              newValue[newTermIndex] = { type: 'string', value: newTerm };
              setValue(newValue as Token[]);
            } else {
              // otherwise don't add the new term & leave it in textbox
              setInputValue(newTerm);
            }
          }
        } else {
          setValue(newValue as Token[]);
        }
      }}
      // this is need to allow user to repeatedly select the same tag
      isOptionEqualToValue={(option, value) => false}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Filter"
          error={error.length > 0}
          helperText={error}
        />
      )}
    />
  );
};

export default FilterInput;
