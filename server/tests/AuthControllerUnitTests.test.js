import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcrypt';
import database from '../database/db.js';


vi.mock('../middlewares/catchAsyncError.js', () => ({
  catchAsyncErrors: (fn) => fn
}));


vi.mock('../database/db.js', () => ({
  default: {
    query: vi.fn()
  }
}));


vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn()
  }
}));


vi.mock('../utils/jwtToken.js', () => ({
  sendToken: vi.fn()
}));


import { register, login, logout } from '../controllers/authController.js';

describe('Auth Controller Tests', () => {
  let req, res, next;

  beforeEach(() => {
    
    req = {
      body: {},
      cookies: {},
      user: {}
    };
    
   
    res = {
      status: vi.fn().mockReturnThis(),
      cookie: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    
    next = vi.fn();
    vi.clearAllMocks();
  });

  
  it('register ar trebui sa returneze eroare 400 daca lipsesc campurile obligatorii', async () => {
    
    req.body = { email: "test@aromalux.ro" };

    await register(req, res, next);

   
    expect(next).toHaveBeenCalledOnce();
    expect(next.mock.calls[0][0].statusCode).toBe(400);
    expect(next.mock.calls[0][0].message).toBe("Please provide all required fields.");
  });

 
  it('login ar trebui sa returneze eroare 401 daca parola este gresita', async () => {
    req.body = { email: "user@aromalux.ro", password: "wrongpassword123" };

    
    const mockDbUser = { id: '1', email: "user@aromalux.ro", password: "hashed_password" };
    database.query.mockResolvedValueOnce({ rows: [mockDbUser] });

    
    bcrypt.compare.mockResolvedValueOnce(false);

    await login(req, res, next);

    
    expect(next).toHaveBeenCalledOnce();
    expect(next.mock.calls[0][0].statusCode).toBe(401);
    expect(next.mock.calls[0][0].message).toBe("Invalid email or password.");
  });

  
  it('logout ar trebui sa curete cookie-ul si sa returneze status 200', async () => {
    await logout(req, res, next);

    
    expect(res.status).toHaveBeenCalledWith(200);
    
   
    expect(res.cookie).toHaveBeenCalledWith("token", "", expect.any(Object));
    
    
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Logged out successfully."
    });
  });
});