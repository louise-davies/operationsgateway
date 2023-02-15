import { UseQueryResult, useQuery } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { Waveform } from '../app.types';
import { readSciGatewayToken } from '../parseTokens';
import { useAppSelector } from '../state/hooks';
import { selectUrls } from '../state/slices/configSlice';

export const fetchWaveform = async (
  apiUrl: string,
  recordId: string,
  channelName: string
): Promise<Waveform> => {
  return axios
    .get(`${apiUrl}/waveforms/${recordId}/${channelName}`, {
      headers: {
        Authorization: `Bearer ${readSciGatewayToken()}`,
      },
    })
    .then((response) => {
      return {
        ...response.data,
        x: JSON.parse(response.data.x),
        y: JSON.parse(response.data.y),
      };
    });
};

export const useWaveform = (
  recordId: string,
  channelName: string
): UseQueryResult<Waveform, AxiosError> => {
  const { apiUrl } = useAppSelector(selectUrls);

  return useQuery<Waveform, AxiosError, Waveform, [string, string, string]>(
    ['waveforms', recordId, channelName],
    (params) => {
      return fetchWaveform(apiUrl, recordId, channelName);
    },
    {
      onError: (error) => {
        console.log('Got error ' + error.message);
      },
    }
  );
};
