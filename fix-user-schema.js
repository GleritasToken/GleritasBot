/**
 * This script removes the telegram_id column from the schema.ts file temporarily
 * to allow the application to start without errors until we fix the database.
 */
const fs = require('fs');
const path = require('path');

const schemaFilePath = path.join(__dirname, 'shared', 'schema.ts');

try {
  let schemaContent = fs.readFileSync(schemaFilePath, 'utf8');
  
  // Replace the telegramId line temporarily
  const updatedContent = schemaContent.replace(
    'telegramId: integer("telegram_id"),',
    '// telegramId: integer("telegram_id"), // temporarily commented out'
  );
  
  fs.writeFileSync(schemaFilePath, updatedContent, 'utf8');
  console.log('Successfully updated schema.ts to temporarily remove telegramId field');
} catch (error) {
  console.error('Error updating schema.ts:', error);
}