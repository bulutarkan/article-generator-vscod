import { supabase } from '../services/supabase.js';

async function updateSchema() {
  console.log('Starting schema update...');

  // First check if table exists
  const { data: tableExists, error: checkError } = await supabase
    .rpc('table_exists', { table_name: 'articles' });

  if (checkError) {
    console.error('Error checking table existence:', checkError);
    return;
  }

  if (!tableExists) {
    console.error('Articles table does not exist');
    return;
  }

  // Add missing columns
  const { data, error } = await supabase.rpc('alter_table_add_columns', {
    table_name: 'articles',
    columns: [
      { name: 'articleContent', type: 'text' },
      { name: 'metaDescription', type: 'text' },
      { name: 'keywords', type: 'text[]' },
      { name: 'monthly_searches', type: 'integer' },
      { name: 'primary_keyword', type: 'text' },
      { name: 'keyword_difficulty', type: 'integer' },
      { name: 'content_quality', type: 'text[]' },
      { name: 'tone', type: 'text' },
      { name: 'location', type: 'text' }
    ]
  });

  if (error) {
    console.error('Error updating schema:', error);
    return;
  }

  console.log('Schema updated successfully');
}

updateSchema().catch(console.error);
