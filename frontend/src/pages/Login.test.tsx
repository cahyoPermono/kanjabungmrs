import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from './Login';
import { describe, it, expect, vi } from 'vitest';

// Mock Auth Store? Or Axios?
// Let's mock axios to avoid network calls.
// And useNavigate

vi.mock('axios', () => {
    return {
        default: {
            post: vi.fn(() => Promise.resolve({ data: { token: 'fake-token', user: { role: 'EMPLOYEE' } } })),
            interceptors: {
                request: { use: vi.fn(), eject: vi.fn() },
                response: { use: vi.fn(), eject: vi.fn() }
            },
            defaults: { headers: { common: {} } }
        }
    }
});

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate
    };
});

describe('Login Page', () => {
    it('renders login form', () => {
        render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>
        );
        // Look for the "Login" heading in the CardHeader
        expect(screen.getByText('Login', { selector: 'div' })).toBeInTheDocument();
        // Look for input fields
        expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    });

    it('submits form', async () => {
        render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>
        );
        
        fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
        
        const submitBtn = screen.getByRole('button', { name: /Login/i });
        fireEvent.click(submitBtn);

        // Expect axios post to be called?
        // Wait for async?
    });
});
