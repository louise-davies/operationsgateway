import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RootState } from '../state/store';
import { getInitialState, renderComponentWithStore } from '../testUtils';
import PlotList from './plotList.component';

describe('Plot List component', () => {
  let state: RootState;

  const createView = (initialState = state) => {
    return renderComponentWithStore(<PlotList />, {
      preloadedState: initialState,
    });
  };

  beforeEach(() => {
    state = getInitialState();
  });

  it('renders plot grid correctly with no plots', () => {
    const view = createView();

    expect(view.asFragment()).toMatchSnapshot();
  });

  it('renders plot grid correctly with some plots', () => {
    state.plots = {
      '1': { open: true, id: '1', title: 'Plot 1' },
      '2': { open: false, id: '2', title: 'Plot 2' },
      '3': { open: true, id: '3', title: 'Plot 3' },
    };
    const view = createView();

    expect(view.asFragment()).toMatchSnapshot();
  });

  it('creates a plot when user clicks create a plot button', async () => {
    const user = userEvent.setup();
    createView();

    await user.click(screen.getByRole('button', { name: 'Create a plot' }));

    expect(screen.getByText('Untitled 1')).toBeVisible();
  });

  it('deletes a plot when user clicks delete button', async () => {
    state.plots = {
      '1': { open: true, id: '1', title: 'Plot 1' },
    };
    const user = userEvent.setup();
    createView();

    expect(screen.getByText('Plot 1')).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(screen.queryByText('Plot 1')).not.toBeInTheDocument();
  });

  it('opens a plot when user clicks open button', async () => {
    state.plots = {
      '1': { open: false, id: '1', title: 'Plot 1' },
    };
    const user = userEvent.setup();
    const { store } = createView();

    expect(screen.getByText('Plot 1')).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Edit' }));

    expect(store.getState().plots['1']?.open).toBe(true);
  });
});
