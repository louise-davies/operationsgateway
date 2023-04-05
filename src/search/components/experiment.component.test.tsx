import React from 'react';
import Experiment, { type ExperimentProps } from './experiment.component';
import {
  screen,
  render,
  type RenderResult,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import experimentsJson from '../../mocks/experiments.json';

describe('Experiment search', () => {
  let props: ExperimentProps;
  const onExperimentChange = jest.fn();
  let user;

  const createView = (): RenderResult => {
    return render(<Experiment {...props} />);
  };

  beforeEach(() => {
    props = {
      experiments: experimentsJson,
      onExperimentChange,
      experiment: null,
    };

    user = userEvent.setup();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', async () => {
    const { asFragment } = createView();
    await user.click(screen.getByLabelText('open experiment search box'));
    expect(asFragment()).toMatchSnapshot();
  });

  it('can open and close its popup window', async () => {
    createView();

    await user.click(screen.getByLabelText('open experiment search box'));
    const experimentPopup = screen.getByRole('dialog');
    expect(
      within(experimentPopup).getByLabelText('Select your experiment')
    ).toBeInTheDocument();
    await user.click(screen.getByLabelText('close experiment search box'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Select your experiment')
    ).not.toBeInTheDocument();
  });

  it('displays the experiment id', () => {
    props = {
      ...props,
      experiment: {
        _id: '18325019-5',
        end_date: '2019-06-12T17:00:00',
        experiment_id: '18325019',
        part: 5,
        start_date: '2019-06-12T09:00:00',
      },
    };
    createView();
    expect(screen.getByText('ID 18325019')).toBeInTheDocument();
  });

  it('should call onExperimentChange when option is selected and not when it is cleared', async () => {
    createView();

    const expectedExperiment = {
      _id: '18325019-4',
      end_date: '2020-01-06T18:00:00',
      experiment_id: '18325019',
      part: 4,
      start_date: '2020-01-03T10:00:00',
    };

    await user.click(screen.getByLabelText('open experiment search box'));
    const experimentPopup = screen.getByLabelText('Select your experiment');

    await user.type(experimentPopup, '183{arrowdown}{enter}');

    expect(onExperimentChange).toHaveBeenCalledWith(expectedExperiment);
    expect(experimentPopup).toHaveValue('18325019');
  });
});
