import pool from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkFCMTokens() {
  try {
    // Count total tokens
    const totalResult = await pool.query(
      'SELECT COUNT(*) as total FROM student_fcm_tokens'
    );
    
    // Count active tokens
    const activeResult = await pool.query(
      'SELECT COUNT(*) as active FROM student_fcm_tokens WHERE is_active = true'
    );
    
    // Count inactive tokens
    const inactiveResult = await pool.query(
      'SELECT COUNT(*) as inactive FROM student_fcm_tokens WHERE is_active = false'
    );
    
    // Get tokens grouped by student
    const studentTokensResult = await pool.query(`
      SELECT 
        s.id,
        s.name,
        COUNT(sft.id) as token_count,
        COUNT(CASE WHEN sft.is_active = true THEN 1 END) as active_token_count
      FROM students s
      LEFT JOIN student_fcm_tokens sft ON s.id = sft.student_id
      GROUP BY s.id, s.name
      HAVING COUNT(sft.id) > 0
      ORDER BY token_count DESC
    `);
    
    // Get all tokens with details
    const allTokensResult = await pool.query(`
      SELECT 
        sft.id,
        sft.student_id,
        s.name as student_name,
        LEFT(sft.fcm_token, 50) || '...' as token_preview,
        sft.is_active,
        sft.created_at,
        sft.updated_at
      FROM student_fcm_tokens sft
      LEFT JOIN students s ON sft.student_id = s.id
      ORDER BY sft.created_at DESC
    `);
    
    console.log('\n📊 FCM Tokens Summary');
    console.log('='.repeat(50));
    console.log(`Total Tokens:     ${totalResult.rows[0].total}`);
    console.log(`Active Tokens:    ${activeResult.rows[0].active}`);
    console.log(`Inactive Tokens:  ${inactiveResult.rows[0].inactive}`);
    console.log(`Students with tokens: ${studentTokensResult.rows.length}`);
    
    if (studentTokensResult.rows.length > 0) {
      console.log('\n👥 Tokens by Student:');
      console.log('-'.repeat(50));
      studentTokensResult.rows.forEach((row) => {
        console.log(`  ${row.name} (${row.id.substring(0, 8)}...):`);
        console.log(`    Total: ${row.token_count}, Active: ${row.active_token_count}`);
      });
    }
    
    if (allTokensResult.rows.length > 0) {
      console.log('\n🔑 All Registered Tokens:');
      console.log('-'.repeat(50));
      allTokensResult.rows.forEach((row, index) => {
        const status = row.is_active ? '✅ Active' : '❌ Inactive';
        console.log(`${index + 1}. ${row.student_name || 'Unknown'} (${row.student_id.substring(0, 8)}...)`);
        console.log(`   Token: ${row.token_preview}`);
        console.log(`   Status: ${status}`);
        console.log(`   Created: ${new Date(row.created_at).toLocaleString()}`);
        console.log('');
      });
    } else {
      console.log('\n⚠️  No FCM tokens registered yet.');
      console.log('   Students need to register their FCM tokens from their mobile app.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking FCM tokens:', error);
    process.exit(1);
  }
}

checkFCMTokens();

