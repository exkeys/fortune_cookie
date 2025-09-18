import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../useAuth';

// Mock Supabase
jest.mock('../../supabaseClient', () => ({
  auth: {
    getUser: jest.fn(),
    onAuthStateChange: jest.fn(),
  },
}));

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with no user', () => {
    const { result } = renderHook(() => useAuth());
    
    expect(result.current.user).toBeNull();
    expect(result.current.isLoggedIn).toBe(false);
    expect(result.current.loading).toBe(true);
  });

  it('should handle login state correctly', async () => {
    const mockUser = { id: '1', email: 'test@example.com' };
    
    // Mock successful auth state change
    const { result } = renderHook(() => useAuth());
    
    act(() => {
      // Simulate auth state change
      result.current.setUser(mockUser);
    });
    
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isLoggedIn).toBe(true);
  });

  it('should handle logout correctly', () => {
    const { result } = renderHook(() => useAuth());
    
    act(() => {
      result.current.setUser(null);
    });
    
    expect(result.current.user).toBeNull();
    expect(result.current.isLoggedIn).toBe(false);
  });
});
