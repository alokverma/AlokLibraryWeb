# PostgreSQL Database Commands

## Quick Access Commands

### 1. Connect to Database (Interactive Mode)
```bash
/opt/homebrew/opt/postgresql@14/bin/psql -d alok_library -U alokverma
```

Or if psql is in your PATH:
```bash
psql -d alok_library -U alokverma
```

### 2. View All Students
```bash
/opt/homebrew/opt/postgresql@14/bin/psql -d alok_library -U alokverma -c "SELECT * FROM students ORDER BY created_at DESC;"
```

### 3. View Students with Formatted Output
```bash
/opt/homebrew/opt/postgresql@14/bin/psql -d alok_library -U alokverma -c "\x" -c "SELECT * FROM students ORDER BY created_at DESC;"
```

### 4. Count Students
```bash
/opt/homebrew/opt/postgresql@14/bin/psql -d alok_library -U alokverma -c "SELECT COUNT(*) as total_students FROM students;"
```

### 5. View Active vs Expired Subscriptions
```bash
/opt/homebrew/opt/postgresql@14/bin/psql -d alok_library -U alokverma -c "SELECT 
  COUNT(CASE WHEN expiry_date >= CURRENT_DATE THEN 1 END) as active,
  COUNT(CASE WHEN expiry_date < CURRENT_DATE THEN 1 END) as expired,
  COUNT(*) as total
FROM students;"
```

### 6. View Table Structure
```bash
/opt/homebrew/opt/postgresql@14/bin/psql -d alok_library -U alokverma -c "\d students"
```

### 7. View All Tables
```bash
/opt/homebrew/opt/postgresql@14/bin/psql -d alok_library -U alokverma -c "\dt"
```

### 8. Search Student by Name
```bash
/opt/homebrew/opt/postgresql@14/bin/psql -d alok_library -U alokverma -c "SELECT * FROM students WHERE name ILIKE '%John%';"
```

### 9. View Students Expiring Soon (Next 30 days)
```bash
/opt/homebrew/opt/postgresql@14/bin/psql -d alok_library -U alokverma -c "SELECT name, phone_number, expiry_date FROM students WHERE expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' ORDER BY expiry_date;"
```

### 10. Delete All Students (Use with caution!)
```bash
/opt/homebrew/opt/postgresql@14/bin/psql -d alok_library -U alokverma -c "DELETE FROM students;"
```

## Interactive Mode Commands

Once connected with `psql -d alok_library -U alokverma`, you can use:

- `\dt` - List all tables
- `\d students` - Describe students table structure
- `\x` - Toggle expanded display (better for wide tables)
- `\q` - Quit psql
- `SELECT * FROM students;` - View all students
- `\?` - Help for psql commands
- `\h` - Help for SQL commands

## Example Interactive Session

```bash
# Connect
psql -d alok_library -U alokverma

# Then inside psql:
alok_library=# \x
Expanded display is on.
alok_library=# SELECT * FROM students LIMIT 1;
alok_library=# \q
```

