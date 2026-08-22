-- =============================================================================
-- 05_payment.sql
-- Module Payment (Payments, Payment Transactions)
-- =============================================================================

-- 1. Payments
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    method VARCHAR(20) NOT NULL DEFAULT 'ZALOPAY',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    amount NUMERIC(19, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'VND',
    app_trans_id VARCHAR(100) UNIQUE,
    zp_trans_id VARCHAR(100),
    order_url VARCHAR(1000),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_app_trans_id ON payments(app_trans_id);

-- 2. Payment Transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY,
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    order_id UUID NOT NULL,
    transaction_type VARCHAR(50) NOT NULL, -- CREATE, CALLBACK, STATUS_QUERY, REFUND
    status VARCHAR(20) NOT NULL,           -- PENDING, SUCCESS, FAILED, CANCELLED, EXPIRED, REFUNDED
    amount NUMERIC(19, 2),
    app_trans_id VARCHAR(100),
    zp_trans_id VARCHAR(100),
    raw_request TEXT,
    raw_response TEXT,
    response_code INT,
    response_message VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_id ON payment_transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_app_trans_id ON payment_transactions(app_trans_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at DESC);
