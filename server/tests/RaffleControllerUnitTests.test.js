import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRaffle, fetchRaffleDetails, deleteRaffle } from '../controllers/raffleController.js';

vi.mock('../database/db.js', () => ({
  default: {
    query: vi.fn(),
    connect: vi.fn(),
  }
}));

vi.mock('cloudinary', () => ({
  v2: {
    uploader: {
      destroy: vi.fn(),
      upload: vi.fn(),
    }
  }
}));


import database from '../database/db.js';

describe('Raffle Controller Tests', () => {
  let req, res, next;

 
  beforeEach(() => {
    req = {
      body: {},
      params: {},
      user: { id: 'user-123' },
      query: {}
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
    vi.clearAllMocks();
  });

 
  it('createRaffle ar trebui sa returneze eroare daca lipseste titlul sau max_tickets', async () => {
    
    req.body = {
      description: "Tombola de test",
      
    };

  
    await createRaffle(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  
    expect(next.mock.calls[0][0].message).toBe("Title and a valid positive max_tickets count are required.");
  });

  
  it('fetchRaffleDetails ar trebui sa returneze 404 daca tombola nu este gasita in baza de date', async () => {
    req.params = { raffleId: '12345' };
    
   
    database.query.mockResolvedValueOnce({ rows: [] });

    await fetchRaffleDetails(req, res, next);

    
    expect(next).toHaveBeenCalledOnce();
    expect(next.mock.calls[0][0].statusCode).toBe(404);
    expect(next.mock.calls[0][0].message).toBe("Raffle not found.");
  });

  
  it('deleteRaffle ar trebui sa stearga tombola si sa returneze status 200', async () => {
    req.params = { raffleId: '67890' };

    // REZOLVARE: Îi spunem bazei de date exact ce să răspundă în funcție de comandă
    database.query.mockImplementation((queryString) => {
      // Dacă face SELECT, îi dăm tombola
      if (queryString.includes('SELECT')) {
        return Promise.resolve({ rows: [{ id: '67890', images: "[]" }] });
      }
      // Dacă face DELETE, îi dăm un răspuns gol (succes)
      return Promise.resolve({});
    });

    await deleteRaffle(req, res, next);

    // DEBUGGING: Dacă a crăpat pe parcurs, va apela next(eroare). 
    // Această linie o va printa în consolă cu roșu ca să o vedem clar!
    if (next.mock.calls.length > 0) {
      console.error("🚨 EROAREA ASCUNSĂ ESTE:", next.mock.calls[0][0]);
    }

    // Acum verificăm dacă a ajuns la final cu succes
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Raffle deleted successfully.",
    });
  });
});