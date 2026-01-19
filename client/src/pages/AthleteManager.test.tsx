import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AthleteManager from './AthleteManager';

describe('AthleteManager', () => {
    it('should render athlete list', () => {
        render(
            <MemoryRouter>
                <AthleteManager />
            </MemoryRouter>
        );
        expect(screen.getByText(/Athletes/i)).toBeInTheDocument();
    });
});
