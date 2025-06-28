/**
 * @fileoverview File Parser Test
 * @description Simple test to verify file parser functionality
 */

import { runFileParserDemo } from '@/lib/file-parser-examples';

// Test the file parser demo
console.log('🧪 Testing File Parser...\n');

try {
  const result = runFileParserDemo();
  console.log('\n✅ File Parser test completed successfully!');
} catch (error) {
  console.error('\n❌ File Parser test failed:', error);
}
