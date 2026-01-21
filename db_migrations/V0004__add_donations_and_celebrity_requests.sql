-- Таблица для пожертвований
CREATE TABLE IF NOT EXISTS donations (
    id SERIAL PRIMARY KEY,
    donor_name VARCHAR(255) NOT NULL,
    donor_contact VARCHAR(255),
    amount INTEGER NOT NULL,
    message TEXT,
    payment_status VARCHAR(50) DEFAULT 'pending',
    assigned_to TEXT,
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица для обращений к знаменитостям
CREATE TABLE IF NOT EXISTS celebrity_requests (
    id SERIAL PRIMARY KEY,
    requester_name VARCHAR(255) NOT NULL,
    requester_contact VARCHAR(255),
    celebrity_name VARCHAR(255) NOT NULL,
    request_text TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(payment_status);
CREATE INDEX IF NOT EXISTS idx_celebrity_status ON celebrity_requests(status);