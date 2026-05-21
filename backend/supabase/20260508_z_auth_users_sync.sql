-- Sync Supabase auth users into ZIPPO app tables.
-- Date: 2026-05-08

BEGIN;

CREATE SCHEMA IF NOT EXISTS zippo;

-- Keep this aligned with frontend/src/lib/auth.ts::getNumericUserIdFromAuthUser.
CREATE OR REPLACE FUNCTION zippo.uuid_to_numeric_user_id(p_auth_user_id uuid)
RETURNS integer
LANGUAGE sql
IMMUTABLE
STRICT
AS $$
  SELECT (
    (
      (
        (get_byte(src.bytes, 0)::bigint << 40)
        + (get_byte(src.bytes, 1)::bigint << 32)
        + (get_byte(src.bytes, 2)::bigint << 24)
        + (get_byte(src.bytes, 3)::bigint << 16)
        + (get_byte(src.bytes, 4)::bigint << 8)
        + get_byte(src.bytes, 5)::bigint
      ) % 1000000000
    ) + 1
  )::integer
  FROM (
    SELECT decode(substr(replace(p_auth_user_id::text, '-', ''), 1, 12), 'hex') AS bytes
  ) AS src;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_marketplace_profiles_auth_user_id
ON zippo.marketplace_profiles (auth_user_id);

CREATE OR REPLACE FUNCTION zippo.sync_auth_user_to_zippo_tables()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = zippo, auth, public
AS $$
DECLARE
  target_auth_user_id uuid;
  target_email text;
  role_text text;
  derived_name text;
  meta_full_name text;
  barangay_text text;
  phone_text text;
  address_line_text text;
  derived_user_id integer;
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE zippo.marketplace_profiles
    SET is_active = false, updated_at = now()
    WHERE auth_user_id = OLD.id;
    RETURN OLD;
  END IF;

  target_auth_user_id := NEW.id;
  target_email := COALESCE(NEW.email, '');
  derived_user_id := zippo.uuid_to_numeric_user_id(target_auth_user_id);

  role_text := COALESCE(
    NULLIF(LOWER(NEW.raw_app_meta_data ->> 'role'), ''),
    NULLIF(LOWER(NEW.raw_user_meta_data ->> 'role'), ''),
    'buyer'
  );
  IF role_text NOT IN ('buyer', 'store_owner', 'driver', 'admin') THEN
    role_text := 'buyer';
  END IF;

  meta_full_name := NULLIF(BTRIM(COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')), '');
  derived_name := COALESCE(meta_full_name, NULLIF(split_part(target_email, '@', 1), ''), 'User');
  barangay_text := NULLIF(BTRIM(COALESCE(NEW.raw_user_meta_data ->> 'barangay', '')), '');
  phone_text := NULLIF(BTRIM(COALESCE(NEW.raw_user_meta_data ->> 'phone', '')), '');
  address_line_text := NULLIF(BTRIM(COALESCE(NEW.raw_user_meta_data ->> 'address_line', '')), '');

  -- 1) Sync into zippo.users (legacy app table).
  INSERT INTO zippo.users (
    user_id,
    full_name,
    age_group,
    gender,
    barangay,
    budget_range,
    preferred_occasions,
    lat,
    lng,
    created_at,
    updated_at
  )
  VALUES (
    derived_user_id,
    derived_name,
    '26-35'::zippo.age_group,
    'M'::zippo.gender_code,
    COALESCE(barangay_text, 'Unknown'),
    'mid'::zippo.budget_range,
    '{}'::text[],
    0,
    0,
    current_date,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    barangay = COALESCE(NULLIF(EXCLUDED.barangay, ''), zippo.users.barangay),
    updated_at = now();

  -- 2) Sync into zippo.marketplace_profiles (new marketplace profile table).
  UPDATE zippo.marketplace_profiles
  SET
    auth_user_id = target_auth_user_id,
    user_id = derived_user_id,
    role = role_text,
    full_name = COALESCE(meta_full_name, zippo.marketplace_profiles.full_name),
    email = CASE WHEN target_email <> '' THEN target_email ELSE zippo.marketplace_profiles.email END,
    phone = COALESCE(phone_text, zippo.marketplace_profiles.phone),
    barangay = COALESCE(barangay_text, zippo.marketplace_profiles.barangay),
    address_line = COALESCE(address_line_text, zippo.marketplace_profiles.address_line),
    is_active = true,
    updated_at = now()
  WHERE auth_user_id = target_auth_user_id;

  IF NOT FOUND THEN
    UPDATE zippo.marketplace_profiles
    SET
      auth_user_id = target_auth_user_id,
      role = role_text,
      full_name = COALESCE(meta_full_name, zippo.marketplace_profiles.full_name, derived_name),
      email = CASE WHEN target_email <> '' THEN target_email ELSE zippo.marketplace_profiles.email END,
      phone = COALESCE(phone_text, zippo.marketplace_profiles.phone),
      barangay = COALESCE(barangay_text, zippo.marketplace_profiles.barangay),
      address_line = COALESCE(address_line_text, zippo.marketplace_profiles.address_line),
      is_active = true,
      updated_at = now()
    WHERE user_id = derived_user_id
      AND (auth_user_id IS NULL OR auth_user_id = target_auth_user_id);
  END IF;

  IF NOT FOUND THEN
    INSERT INTO zippo.marketplace_profiles (
      auth_user_id,
      user_id,
      role,
      full_name,
      email,
      phone,
      barangay,
      address_line,
      is_active
    )
    VALUES (
      target_auth_user_id,
      derived_user_id,
      role_text,
      derived_name,
      target_email,
      phone_text,
      barangay_text,
      address_line_text,
      true
    )
    ON CONFLICT (auth_user_id) DO UPDATE
    SET
      user_id = EXCLUDED.user_id,
      role = EXCLUDED.role,
      full_name = COALESCE(meta_full_name, zippo.marketplace_profiles.full_name, EXCLUDED.full_name),
      email = CASE WHEN EXCLUDED.email <> '' THEN EXCLUDED.email ELSE zippo.marketplace_profiles.email END,
      phone = COALESCE(EXCLUDED.phone, zippo.marketplace_profiles.phone),
      barangay = COALESCE(EXCLUDED.barangay, zippo.marketplace_profiles.barangay),
      address_line = COALESCE(EXCLUDED.address_line, zippo.marketplace_profiles.address_line),
      is_active = true,
      updated_at = now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_auth_user_to_zippo_tables ON auth.users;
CREATE TRIGGER trg_sync_auth_user_to_zippo_tables
AFTER INSERT OR UPDATE OR DELETE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION zippo.sync_auth_user_to_zippo_tables();

-- Backfill current auth users into both tables.
INSERT INTO zippo.users (
  user_id,
  full_name,
  age_group,
  gender,
  barangay,
  budget_range,
  preferred_occasions,
  lat,
  lng,
  created_at,
  updated_at
)
SELECT
  zippo.uuid_to_numeric_user_id(au.id) AS user_id,
  COALESCE(NULLIF(BTRIM(au.raw_user_meta_data ->> 'full_name'), ''), NULLIF(split_part(au.email, '@', 1), ''), 'User') AS full_name,
  '26-35'::zippo.age_group AS age_group,
  'M'::zippo.gender_code AS gender,
  COALESCE(NULLIF(BTRIM(au.raw_user_meta_data ->> 'barangay'), ''), 'Unknown') AS barangay,
  'mid'::zippo.budget_range AS budget_range,
  '{}'::text[] AS preferred_occasions,
  0 AS lat,
  0 AS lng,
  current_date AS created_at,
  now() AS updated_at
FROM auth.users au
ON CONFLICT (user_id) DO UPDATE
SET
  full_name = EXCLUDED.full_name,
  barangay = COALESCE(NULLIF(EXCLUDED.barangay, ''), zippo.users.barangay),
  updated_at = now();

INSERT INTO zippo.marketplace_profiles (
  auth_user_id,
  user_id,
  role,
  full_name,
  email,
  phone,
  barangay,
  address_line,
  is_active
)
SELECT
  au.id AS auth_user_id,
  zippo.uuid_to_numeric_user_id(au.id) AS user_id,
  CASE
    WHEN LOWER(COALESCE(au.raw_app_meta_data ->> 'role', au.raw_user_meta_data ->> 'role', 'buyer')) IN ('buyer', 'store_owner', 'driver', 'admin')
      THEN LOWER(COALESCE(au.raw_app_meta_data ->> 'role', au.raw_user_meta_data ->> 'role', 'buyer'))
    ELSE 'buyer'
  END AS role,
  COALESCE(NULLIF(BTRIM(au.raw_user_meta_data ->> 'full_name'), ''), NULLIF(split_part(au.email, '@', 1), ''), 'User') AS full_name,
  COALESCE(au.email, '') AS email,
  NULLIF(BTRIM(au.raw_user_meta_data ->> 'phone'), '') AS phone,
  NULLIF(BTRIM(au.raw_user_meta_data ->> 'barangay'), '') AS barangay,
  NULLIF(BTRIM(au.raw_user_meta_data ->> 'address_line'), '') AS address_line,
  true AS is_active
FROM auth.users au
ON CONFLICT (auth_user_id) DO UPDATE
SET
  user_id = EXCLUDED.user_id,
  role = EXCLUDED.role,
  full_name = COALESCE(NULLIF(BTRIM(EXCLUDED.full_name), ''), zippo.marketplace_profiles.full_name),
  email = CASE WHEN EXCLUDED.email <> '' THEN EXCLUDED.email ELSE zippo.marketplace_profiles.email END,
  phone = COALESCE(EXCLUDED.phone, zippo.marketplace_profiles.phone),
  barangay = COALESCE(EXCLUDED.barangay, zippo.marketplace_profiles.barangay),
  address_line = COALESCE(EXCLUDED.address_line, zippo.marketplace_profiles.address_line),
  is_active = true,
  updated_at = now();

COMMIT;
