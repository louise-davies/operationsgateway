import React from 'react';
import { useRecordCount, useRecordsPaginated } from '../api/records';
import Table from '../table/table.component';
import {
  Record,
  Order,
  QueryParams,
  Channel,
  RecordRow,
  DateRange,
  ScalarChannel,
  ImageChannel,
  WaveformChannel,
} from '../app.types';
import { Column } from 'react-table';
import DateTimeInputBox from './dateTimeInput.component';
import { useChannels } from '../api/channels';
import { roundNumber } from '../table/cellRenderers/cellContentRenderers';
import { parseISO, format } from 'date-fns';

export interface RecordTableProps {
  resultsPerPage: number;
}

const RecordTable = React.memo(
  (props: RecordTableProps): React.ReactElement => {
    const { resultsPerPage } = props;

    const [page, setPage] = React.useState(0);
    const [sort, setSort] = React.useState<{
      [column: string]: Order;
    }>({});
    const [dateRange, setDateRange] = React.useState<DateRange>({});
    const [queryParams, setQueryParams] = React.useState<QueryParams>({
      page: page,
      sort: sort,
      dateRange: dateRange,
    });
    const [availableColumns, setAvailableColumns] = React.useState<Column[]>(
      []
    );
    const [parsedData, setParsedData] = React.useState<RecordRow[]>([]);

    const { data, isLoading: dataLoading } = useRecordsPaginated(queryParams);
    const { data: count, isLoading: countLoading } = useRecordCount();

    const { data: channels, isLoading: channelsLoading } = useChannels();

    // Use this as the controlling variable for data having loaded
    // As there is a disconnect between data loaded from the backend and time before it is processed and ready for display, we use this to keep track of available data instead
    const [columnsLoaded, setColumnsLoaded] = React.useState<boolean>(false);

    const constructColumns = (parsed: RecordRow[]): Column[] => {
      let myColumns: Column[] = [];
      let accessors: Set<string> = new Set<string>();

      parsed.forEach((recordRow: RecordRow) => {
        const keys = Object.keys(recordRow);

        for (let i = 0; i < keys.length; i++) {
          if (!accessors.has(keys[i])) {
            const channelInfo = channels?.find(
              (channel) => channel.systemName === keys[i]
            );
            const newColumn: Column = {
              Header: () => {
                const headerName = channelInfo
                  ? channelInfo.userFriendlyName
                    ? channelInfo.userFriendlyName
                    : channelInfo.systemName
                  : keys[i];
                // Provide an actual header here when we have it
                // TODO: do we need to split on things other than underscore?
                const parts = headerName.split('_');
                const wordWrap = parts.map(
                  (part, i) =>
                    // \u200B renders a zero-width space character
                    // which allows line-break but isn't visible
                    part + (i < parts.length - 1 ? '_\u200B' : '')
                );
                return <React.Fragment>{wordWrap.join('')}</React.Fragment>;
              },
              accessor: keys[i],
              // TODO: get these from data channel info
              channelInfo: channelInfo,
              wordWrap: false,
            };
            if (channelInfo?.channel_dtype === 'scalar') {
              newColumn.Cell = ({ value }) =>
                typeof value === 'number' &&
                typeof channelInfo.significantFigures === 'number' ? (
                  <React.Fragment>
                    {roundNumber(
                      value,
                      channelInfo.significantFigures,
                      channelInfo.scientificNotation ?? false
                    )}
                  </React.Fragment>
                ) : (
                  <React.Fragment>{String(value ?? '')}</React.Fragment>
                );
            }
            myColumns.push(newColumn);
            accessors.add(keys[i]);
          }
        }
      });

      return myColumns;
    };

    const parseData = (data: Record[]): RecordRow[] => {
      let newData: RecordRow[] = [];

      data.forEach((record: Record) => {
        const timestampString = record.metadata.timestamp;
        const timestampDate = parseISO(timestampString);
        const formattedDate = format(timestampDate, 'yyyy-MM-dd HH:mm:ss');
        let recordRow: RecordRow = {
          timestamp: formattedDate,
          shotnum: record.metadata.shotnum,
          activeArea: record.metadata.activeArea,
          activeExperiment: record.metadata.activeExperiment,
        };

        const keys = Object.keys(record.channels);
        keys.forEach((key: string) => {
          const channel: Channel = record.channels[key];
          let channelData;
          const channelDataType = channel.metadata.channel_dtype;

          switch (channelDataType) {
            case 'scalar':
              channelData = (channel as ScalarChannel).data;
              break;
            case 'image':
              channelData = (channel as ImageChannel).thumbnail;
              // TODO make this a thumbnail later to access a larger version of image
              channelData = (
                <img src={`data:image/jpeg;base64,${channelData}`} alt={key} />
              );
              break;
            case 'waveform':
              channelData = (channel as WaveformChannel).thumbnail;
              // TODO make this a thumbnail later to access a larger version of image
              channelData = (
                <img src={`data:image/jpeg;base64,${channelData}`} alt={key} />
              );
          }

          recordRow[key] = channelData;
        });

        newData.push(recordRow);
      });

      setParsedData(newData);
      return newData;
    };

    React.useEffect(() => {
      if (data && !dataLoading && !channelsLoading) {
        const parsedData: RecordRow[] = parseData(data);
        const newAvailableColumns = constructColumns(parsedData);
        setAvailableColumns(newAvailableColumns);
        setColumnsLoaded(true);
      } else {
        setColumnsLoaded(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, dataLoading, channelsLoading]);

    React.useEffect(() => {
      setQueryParams({
        page: page,
        sort: sort,
        dateRange: dateRange,
      });
    }, [page, sort, dateRange]);

    const onPageChange = (page: number) => {
      setPage(page);
    };

    const handleSort = (column: string, order: Order | null) => {
      let columnName;
      if (
        ['timestamp', 'shotnum', 'activeArea', 'activeExperiment'].includes(
          column
        )
      ) {
        columnName = `metadata.${column}`;
      } else {
        columnName = `channels.${column}`;
      }

      let newSort = sort;
      if (order !== null) {
        newSort = {
          ...newSort,
          [columnName]: order,
        };
      } else {
        const { [columnName]: order, ...rest } = newSort;
        newSort = {
          ...rest,
        };
      }
      setSort(newSort);
    };

    const handleDateTimeChange = (
      range: 'fromDate' | 'toDate',
      date?: string
    ) => {
      setDateRange({ ...dateRange, [range]: date });
    };

    return (
      <div>
        <DateTimeInputBox onChange={handleDateTimeChange} />
        <br />
        <Table
          data={parsedData}
          availableColumns={availableColumns}
          totalDataCount={count ?? 0}
          page={page}
          loadedData={columnsLoaded}
          loadedCount={!countLoading}
          resultsPerPage={resultsPerPage}
          onPageChange={onPageChange}
          sort={sort}
          onSort={handleSort}
        />
      </div>
    );
  }
);

RecordTable.displayName = 'RecordTable';

export default RecordTable;
