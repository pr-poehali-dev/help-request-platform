CREATE TABLE IF NOT EXISTS t_p34278592_help_request_platfor.announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100),
    author_name VARCHAR(100) NOT NULL,
    author_contact VARCHAR(200),
    type VARCHAR(20) DEFAULT 'regular' CHECK (type IN ('regular', 'boosted', 'vip')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
    payment_amount INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived'))
);

CREATE TABLE IF NOT EXISTS t_p34278592_help_request_platfor.responses (
    id SERIAL PRIMARY KEY,
    announcement_id INTEGER NOT NULL,
    responder_name VARCHAR(100) NOT NULL,
    responder_contact VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined'))
);

CREATE TABLE IF NOT EXISTS t_p34278592_help_request_platfor.messages (
    id SERIAL PRIMARY KEY,
    response_id INTEGER NOT NULL,
    sender_name VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_announcements_type ON t_p34278592_help_request_platfor.announcements(type);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON t_p34278592_help_request_platfor.announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_responses_announcement ON t_p34278592_help_request_platfor.responses(announcement_id);
CREATE INDEX IF NOT EXISTS idx_messages_response ON t_p34278592_help_request_platfor.messages(response_id);