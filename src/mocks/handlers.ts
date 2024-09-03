import { bypass, http, HttpResponse } from 'msw';
import { ColourMapsParams } from '../api/images';
import {
  Channel,
  ExperimentParams,
  isChannelScalar,
  Record,
} from '../app.types';
import { PREFERRED_COLOUR_MAP_PREFERENCE_NAME } from '../settingsMenuItems.component';
import channelsJson from './channels.json';
import colourMapsJson from './colourMaps.json';
import experimentsJson from './experiments.json';
import recordsJson from './records.json';
import sessionsJson from './sessionsList.json';

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

// VITE_APP_BUILD_STANDALONE used here to determine if E2E testing or not
export let preferredColourMap =
  import.meta.env.VITE_APP_BUILD_STANDALONE === 'true'
    ? undefined
    : getRandomColourMap(colourMapsJson);

export const setMockedPreferredColourMap = (value?: string) => {
  preferredColourMap = value;
};

export const handlers = [
  http.post('/login', () => {
    return HttpResponse.json(
      // random JWT generated by jwt.io
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwidXNlcm5hbWUiOiJKb2huIERvZSIsImlhdCI6MTUxNjIzOTAyMn0.p5Csu2THYW5zJys2CWdbGM8GaWjpY6lOQpdLoP4D7V4',
      { status: 200 }
    );
  }),
  http.post('/sessions', async () => {
    const sessionID = '1';
    return HttpResponse.json(sessionID, { status: 200 });
  }),
  http.patch('/sessions/:id', async ({ request }) => {
    const url = new URL(request.url);
    const sessionName = url.searchParams.get('name');

    if (sessionName === 'test_dup') {
      return HttpResponse.json(null, { status: 409 });
    }
    const sessionID = '1';
    return HttpResponse.json(sessionID, { status: 200 });
  }),
  http.delete('/sessions/:id', async ({ params }) => {
    const { id } = params;

    const validId = [1, 2, 3, 4];
    if (validId.includes(Number(id))) {
      return new HttpResponse(null, { status: 204 });
    } else HttpResponse.json(null, { status: 422 });
  }),
  http.get('/sessions/list', async () => {
    return HttpResponse.json(sessionsJson, { status: 200 });
  }),
  http.get('/sessions/:id', async ({ request }) => {
    const url = new URL(request.url);
    const session_id = url.pathname.replace('/sessions/', '');
    const sessionData = sessionsJson.find(
      (session) => session._id === session_id
    );
    if (sessionData) {
      return HttpResponse.json(sessionData, { status: 200 });
    } else {
      return HttpResponse.json(null, { status: 400 });
    }
  }),
  http.get('/channels', () => {
    return HttpResponse.json(channelsJson, { status: 200 });
  }),
  http.get('/experiments', () => {
    return HttpResponse.json(experimentsJson, { status: 200 });
  }),
  http.get('*/experiments', async ({ request }) => {
    const originalResponse = await fetch(bypass(request));
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

    return HttpResponse.json(
      adjustDates(originalData as ExperimentParams[], startDate, endDate),
      { status: 200 }
    );
  }),
  http.get('/records', () => HttpResponse.json(recordsJson, { status: 200 })),
  http.get('/records/count', () =>
    HttpResponse.json(recordsJson.length, { status: 200 })
  ),
  http.get('/records/range_converter', ({ request }) => {
    const url = new URL(request.url);
    const shotnumRange = url.searchParams.get('shotnum_range');
    const dateRange = url.searchParams.get('date_range');

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

      return HttpResponse.json(reponseData, { status: 200 });
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
      return HttpResponse.json(reponseData, { status: 200 });
    } else {
      return HttpResponse.json(undefined, { status: 500 });
    }
  }),
  http.get('/channels/summary/:channelName', ({ params }) => {
    const { channelName } = params;
    let channel;
    if (typeof channelName === 'string') {
      channel = (recordsJson as RecordsJSONType).find(
        (record) => channelName in record.channels
      )?.channels[channelName];
    }
    if (channel) {
      return HttpResponse.json(
        {
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
        },
        { status: 200 }
      );
    }
  }),
  http.get('/waveforms/:recordId/:channelName', () => {
    return HttpResponse.json(
      {
        _id: '1',
        x: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        y: [2, 10, 8, 7, 1, 4, 5, 3, 6, 9],
      },
      { status: 200 }
    );
  }),
  http.get('/images/colourmap_names', () =>
    HttpResponse.json(colourMapsJson, { status: 200 })
  ),
  http.get(`/users/preferences/${PREFERRED_COLOUR_MAP_PREFERENCE_NAME}`, () => {
    if (typeof preferredColourMap === 'undefined') {
      return HttpResponse.json(
        { detail: 'No such attribute in database' },
        { status: 404 }
      );
    } else {
      return HttpResponse.json(preferredColourMap, { status: 200 });
    }
  }),
  http.delete(
    `/users/preferences/${PREFERRED_COLOUR_MAP_PREFERENCE_NAME}`,
    () => {
      preferredColourMap = undefined;
      return HttpResponse.json(preferredColourMap, { status: 204 });
    }
  ),
  http.post('/users/preferences', async ({ request }) => {
    // @ts-expect-error Ignoring here as don't have types defined for these endpoints
    preferredColourMap = (await request.json()).value;
    return HttpResponse.json(preferredColourMap, { status: 200 });
  }),
  http.get('/export', async ({ request }) => {
    const url = new URL(request.url);
    const enc = new TextEncoder();
    const uintarr = enc.encode(
      'timestamp,\n2022-10-03 08:09:00,\n2022-10-03 08:15:00,\n2022-10-03 08:21:00,'
    );
    const arrBuffer = uintarr.buffer;

    const testString = `${url.searchParams.get('export_scalars') === 'true' ? 'sc' : ''}${url.searchParams.get('export_images') === 'true' ? 'im' : ''}${url.searchParams.get('export_waveform_csvs') === 'true' ? 'wc' : ''}${url.searchParams.get('export_waveform_images') === 'true' ? 'wi' : ''}`;
    return new HttpResponse(arrBuffer, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="${testString}download.csv"`,
      },
      status: 200,
    });
  }),
];
