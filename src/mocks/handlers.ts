import { rest } from 'msw';
import recordsJson from './records.json';
import channelsJson from './channels.json';
import experimentsJson from './experiments.json';
import colourMapsJson from './colourMaps.json';
import sessionsJson from './sessionsList.json';
import {
  Channel,
  ExperimentParams,
  isChannelScalar,
  Record,
} from '../app.types';
import { PREFERRED_COLOUR_MAP_PREFERENCE_NAME } from '../settingsMenuItems.component';
import { ColourMapsParams } from '../api/images';

// have to add undefined here due to how TS JSON parsing works
type RecordsJSONType = (Omit<Record, 'channels'> & {
  channels: {
    [channel: string]: Channel | undefined;
  };
})[];
const getRandomColourMap = function (colourMaps: ColourMapsParams) {
  const categoryKeys = Object.keys(colourMaps);
  const randomCategory =
    colourMaps[categoryKeys[(categoryKeys.length * Math.random()) << 0]];
  return randomCategory?.[Math.floor(Math.random() * randomCategory?.length)];
};

let preferredColourMap = getRandomColourMap(colourMapsJson);

export const handlers = [
  rest.post('/login', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(
        // random JWT generated by jwt.io
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwidXNlcm5hbWUiOiJKb2huIERvZSIsImlhdCI6MTUxNjIzOTAyMn0.p5Csu2THYW5zJys2CWdbGM8GaWjpY6lOQpdLoP4D7V4'
      )
    );
  }),
  rest.post('/sessions', async (req, res, ctx) => {
    const sessionID = '1';
    return res(ctx.status(200), ctx.json(sessionID));
  }),
  rest.patch('/sessions/:id', async (req, res, ctx) => {
    const sessionsParams = new URLSearchParams(req.url.search);
    const sessionName = sessionsParams.get('name');

    if (sessionName === 'test_dup') {
      return res(ctx.status(409), ctx.json(''));
    }
    const sessionID = '1';
    return res(ctx.status(200), ctx.json(sessionID));
  }),
  rest.delete('/sessions/:id', async (req, res, ctx) => {
    const { id } = req.params;

    const validId = [1, 2, 3, 4];
    if (validId.includes(Number(id))) {
      return res(ctx.status(200), ctx.json(''));
    } else res(ctx.status(422), ctx.json(''));
  }),
  rest.get('/sessions/list', async (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(sessionsJson));
  }),
  rest.get('/sessions/:id', async (req, res, ctx) => {
    const session_id = req.url.pathname.replace('/sessions/', '');
    const sessionData = sessionsJson.find(
      (session) => session._id === session_id
    );
    if (sessionData) {
      return res(ctx.status(200), ctx.json(sessionData));
    } else {
      return res(ctx.status(400), ctx.json(''));
    }
  }),
  rest.get('/channels', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(channelsJson));
  }),
  rest.get('/experiments', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(experimentsJson));
  }),
  rest.get('*/experiments', async (req, res, ctx) => {
    const originalResponse = await ctx.fetch(req);
    // Retrieve the original response data
    const originalData = await originalResponse.json();
    const adjustDates = (
      dictList: ExperimentParams[],
      rangeStart: Date,
      rangeEnd: Date
    ): ExperimentParams[] => {
      const sortedList = [...dictList].sort(
        (a, b) =>
          new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      );

      const experimentRange =
        (rangeEnd.getTime() - rangeStart.getTime()) / dictList.length;

      let currentStartDate = rangeStart;

      for (const experiment of sortedList) {
        const startDate = currentStartDate.toISOString();
        const endDate = new Date(
          currentStartDate.getTime() + experimentRange
        ).toISOString();

        experiment.start_date = startDate;
        experiment.end_date = endDate;

        currentStartDate = new Date(
          currentStartDate.getTime() + experimentRange
        );
      }

      return sortedList;
    };
    // The start and end dates are derived from the
    // operations gateway api data
    const startDate = new Date('2022-04-07 14:16:16');
    const endDate = new Date('2022-04-08 09:44:01');

    return res(
      ctx.status(200),
      ctx.json(
        adjustDates(originalData as ExperimentParams[], startDate, endDate)
      )
    );
  }),
  rest.get('/records', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(recordsJson));
  }),
  rest.get('/records/count', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(recordsJson.length));
  }),
  rest.get('/records/range_converter', (req, res, ctx) => {
    const shotnumRange = req.url.searchParams.get('shotnum_range');
    const dateRange = req.url.searchParams.get('date_range');

    if (shotnumRange) {
      const { min, max } = JSON.parse(decodeURIComponent(shotnumRange));
      const shotnumMin = Number(min);
      const shotnumMax = Number(max);

      const shotnumRangeRecord = recordsJson.filter((record) => {
        return (
          record.metadata.shotnum >= shotnumMin &&
          record.metadata.shotnum <= shotnumMax
        );
      });

      const { shotnumMaxRecord, shotnumMinRecord } = shotnumRangeRecord.reduce(
        (acc, record) => {
          if (record.metadata.shotnum > acc.shotnumMaxRecord.metadata.shotnum) {
            acc.shotnumMaxRecord = record;
          }

          if (record.metadata.shotnum < acc.shotnumMinRecord.metadata.shotnum) {
            acc.shotnumMinRecord = record;
          }

          return acc;
        },
        {
          shotnumMaxRecord: shotnumRangeRecord[0],
          shotnumMinRecord: shotnumRangeRecord[0],
        }
      );

      const reponseData = {
        from: shotnumMinRecord.metadata.timestamp,
        to: shotnumMaxRecord.metadata.timestamp,
      };

      return res(ctx.status(200), ctx.json(reponseData));
    } else if (dateRange) {
      const { from: fromDate, to: toDate } = JSON.parse(
        decodeURIComponent(dateRange)
      );

      const dateRangeRecord = recordsJson.filter((record) => {
        return (
          new Date(record.metadata.timestamp) >= new Date(fromDate) &&
          new Date(record.metadata.timestamp) <= new Date(toDate)
        );
      });

      const { fromDateRecord, toDateRecord } = dateRangeRecord.reduce(
        (acc, record) => {
          if (
            new Date(record.metadata.timestamp) >
            new Date(acc.fromDateRecord.metadata.timestamp)
          ) {
            acc.toDateRecord = record;
          }

          if (
            new Date(record.metadata.timestamp) <
            new Date(acc.toDateRecord.metadata.timestamp)
          ) {
            acc.fromDateRecord = record;
          }

          return acc;
        },
        {
          fromDateRecord: dateRangeRecord[0],
          toDateRecord: dateRangeRecord[0],
        }
      );

      const reponseData = {
        min: fromDateRecord.metadata.shotnum,
        max: toDateRecord.metadata.shotnum,
      };
      return res(ctx.status(200), ctx.json(reponseData));
    } else {
      return res(ctx.status(500), ctx.json(undefined));
    }
  }),
  rest.get('/channels/summary/:channelName', (req, res, ctx) => {
    const { channelName } = req.params;
    let channel;
    if (typeof channelName === 'string') {
      channel = (recordsJson as RecordsJSONType).find(
        (record) => channelName in record.channels
      )?.channels[channelName];
    }
    if (channel) {
      return res(
        ctx.status(200),
        ctx.json({
          first_date: '2022-01-29T00:00:00',
          most_recent_date: '2023-01-31T00:00:00',
          recent_sample: isChannelScalar(channel)
            ? [
                { '2022-01-31T00:00:00': 6 },
                { '2022-01-30T00:00:00': 5 },
                { '2022-01-29T00:00:00': 4 },
              ]
            : [
                {
                  '2022-01-31T00:00:00': channel?.thumbnail,
                },
                {
                  '2022-01-30T00:00:00': channel?.thumbnail,
                },
                {
                  '2022-01-29T00:00:00': channel?.thumbnail,
                },
              ],
        })
      );
    }
  }),
  rest.get('/waveforms/:recordId/:channelName', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        _id: '1',
        x: '[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]',
        y: '[2, 10, 8, 7, 1, 4, 5, 3, 6, 9]',
      })
    );
  }),
  rest.get('/images/colourmap_names', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(colourMapsJson));
  }),
  rest.get(
    `/user_preferences/${PREFERRED_COLOUR_MAP_PREFERENCE_NAME}`,
    (req, res, ctx) => {
      if (typeof preferredColourMap === 'undefined') {
        return res(ctx.status(404), ctx.json({ msg: 'TODO ERROR MSG' }));
      } else {
        return res(ctx.status(200), ctx.json(preferredColourMap));
      }
    }
  ),
  rest.delete(
    `/user_preferences/${PREFERRED_COLOUR_MAP_PREFERENCE_NAME}`,
    (req, res, ctx) => {
      preferredColourMap = undefined;
      return res(ctx.status(200), ctx.json(preferredColourMap));
    }
  ),
  rest.post('/user_preferences', async (req, res, ctx) => {
    preferredColourMap = (await req.json()).value;
    return res(ctx.status(200), ctx.json(preferredColourMap));
  }),
];
