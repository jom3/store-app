CREATE TABLE IF NOT EXISTS settings (
  id integer PRIMARY KEY CHECK (id = 1),
  business_name text NOT NULL,
  currency_code text NOT NULL,
  locale text NOT NULL,
  timezone text NOT NULL
);

CREATE TABLE users (
  id serial PRIMARY KEY,
  username text NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'owner', 'warehouse_manager', 'seller')),
  is_active boolean NOT NULL DEFAULT true,
  must_change_password boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX users_username_lower_idx ON users (lower(username));
