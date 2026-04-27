import database from "../database/db.js";

export async function createRafflesTable() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS raffles (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        product_id UUID REFERENCES products(id) ON DELETE SET NULL,
        
        title VARCHAR(255) NOT NULL,
        description TEXT,
        
        max_tickets INT NOT NULL CHECK (max_tickets > 0),
        images JSONB DEFAULT '[]'::JSONB,
        tickets_issued INT NOT NULL DEFAULT 0,
        
        start_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        end_date TIMESTAMP,
        
        winner_ticket_id UUID,
        winner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        finished_at TIMESTAMP,
        
        created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS raffle_tickets (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        raffle_id UUID NOT NULL REFERENCES raffles(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        order_id UUID REFERENCES orders(id) ON DELETE SET NULL,

        ticket_number INT NOT NULL,
        UNIQUE (raffle_id, ticket_number),

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS raffle_available_tickets (
    raffle_id UUID NOT NULL REFERENCES raffles(id) ON DELETE CASCADE,
    ticket_number INT NOT NULL,
    
    PRIMARY KEY (raffle_id, ticket_number) 
    );

    CREATE INDEX IF NOT EXISTS idx_available_tickets_raffle_id ON raffle_available_tickets (raffle_id);
    `;

    await database.query(query);
    console.log("✅ Raffles & raffle_tickets tables ensured.");
  } catch (error) {
    console.error("❌ Failed To Create Raffles Table.", error);
    process.exit(1);
  }
}
