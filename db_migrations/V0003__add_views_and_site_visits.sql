-- Добавляем поле views в таблицу announcements
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- Создаём таблицу для учёта посещений сайта
CREATE TABLE IF NOT EXISTS site_visits (
    id SERIAL PRIMARY KEY,
    visitor_ip VARCHAR(45),
    user_agent TEXT,
    visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индекс для быстрого подсчёта уникальных посетителей
CREATE INDEX IF NOT EXISTS idx_site_visits_ip ON site_visits(visitor_ip);
CREATE INDEX IF NOT EXISTS idx_site_visits_date ON site_visits(visited_at);