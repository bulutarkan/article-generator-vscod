-- Function to check if table exists
CREATE OR REPLACE FUNCTION table_exists(table_name text) 
RETURNS boolean AS $$
DECLARE
  result boolean;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = table_exists.table_name
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to add multiple columns to a table
CREATE OR REPLACE FUNCTION alter_table_add_columns(
  table_name text,
  columns jsonb
) RETURNS void AS $$
DECLARE
  column_record record;
  column_type text;
  column_exists boolean;
BEGIN
  FOR column_record IN SELECT * FROM jsonb_array_elements(columns)
  LOOP
    -- Check if column already exists
    SELECT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = alter_table_add_columns.table_name
      AND column_name = (column_record->>'name')::text
    ) INTO column_exists;

    IF NOT column_exists THEN
      EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s', 
        alter_table_add_columns.table_name, 
        (column_record->>'name')::text, 
        (column_record->>'type')::text);
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
