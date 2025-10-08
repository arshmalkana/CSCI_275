#!/usr/bin/env python3
"""
Convert Punjab villages JSON to SQL seed data
"""
import json
import sys
from pathlib import Path

# Path to the JSON file
json_file = Path(__file__).parent.parent.parent / "Other Related Docs" / "DB" / "punjab_villages.json"
output_file = Path(__file__).parent.parent / "init" / "03-villages-full.sql"

print(f"Reading: {json_file}")

# Load JSON data
with open(json_file, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Start SQL file
sql_lines = [
    "-- AH Punjab - Full Villages Data from Census",
    "-- Auto-generated from punjab_villages.json",
    "",
    "-- ============================================================================",
    "-- DISTRICTS",
    "-- ============================================================================",
    "",
]

# Track counts
district_count = 0
tehsil_count = 0
village_count = 0

# Process districts
for district in data['districts']:
    district_name = district['name']
    district_code = district['code']

    sql_lines.append(f"-- District: {district_name}")
    sql_lines.append(f"INSERT INTO districts (district_name, state_name) VALUES")
    sql_lines.append(f"('{district_name}', 'Punjab')")
    sql_lines.append(f"ON CONFLICT (district_name) DO NOTHING;")
    sql_lines.append("")

    district_count += 1

sql_lines.append("")
sql_lines.append("-- ============================================================================")
sql_lines.append("-- TEHSILS")
sql_lines.append("-- ============================================================================")
sql_lines.append("")

# Process tehsils
for district in data['districts']:
    district_name = district['name']

    sql_lines.append(f"-- Tehsils for {district_name}")

    for tehsil in district['tehsils']:
        tehsil_name = tehsil['name']
        tehsil_code = tehsil['code']

        sql_lines.append(f"INSERT INTO tehsils (tehsil_name, district_id) VALUES")
        sql_lines.append(f"('{tehsil_name}', (SELECT district_id FROM districts WHERE district_name = '{district_name}'))")
        sql_lines.append(f"ON CONFLICT (tehsil_name, district_id) DO NOTHING;")

        tehsil_count += 1

    sql_lines.append("")

sql_lines.append("")
sql_lines.append("-- ============================================================================")
sql_lines.append("-- VILLAGES")
sql_lines.append("-- ============================================================================")
sql_lines.append("")

# Process villages in batches for better performance
BATCH_SIZE = 100

for district in data['districts']:
    district_name = district['name']

    for tehsil in district['tehsils']:
        tehsil_name = tehsil['name']
        villages = tehsil['villages']

        if not villages:
            continue

        sql_lines.append(f"-- Villages for {tehsil_name}, {district_name} ({len(villages)} villages)")

        # Process in batches
        for i in range(0, len(villages), BATCH_SIZE):
            batch = villages[i:i+BATCH_SIZE]

            sql_lines.append("INSERT INTO villages (village_name, tehsil_id, district_id) VALUES")

            values = []
            for village in batch:
                village_name = village['name'].replace("'", "''")  # Escape single quotes
                values.append(
                    f"('{village_name}', "
                    f"(SELECT tehsil_id FROM tehsils WHERE tehsil_name = '{tehsil_name}' AND district_id = (SELECT district_id FROM districts WHERE district_name = '{district_name}')), "
                    f"(SELECT district_id FROM districts WHERE district_name = '{district_name}'))"
                )

            sql_lines.append(",\n".join(values))
            sql_lines.append("ON CONFLICT (village_name, tehsil_id) DO NOTHING;")
            sql_lines.append("")

            village_count += len(batch)

# Add summary at the end
sql_lines.append("")
sql_lines.append("-- ============================================================================")
sql_lines.append("-- SUMMARY")
sql_lines.append("-- ============================================================================")
sql_lines.append("")
sql_lines.append("DO $$")
sql_lines.append("BEGIN")
sql_lines.append("    RAISE NOTICE 'Full Punjab villages data loaded!';")
sql_lines.append("    RAISE NOTICE 'Total Districts: %', (SELECT COUNT(*) FROM districts);")
sql_lines.append("    RAISE NOTICE 'Total Tehsils: %', (SELECT COUNT(*) FROM tehsils);")
sql_lines.append("    RAISE NOTICE 'Total Villages: %', (SELECT COUNT(*) FROM villages);")
sql_lines.append("END $$;")

# Write to file
print(f"Writing: {output_file}")
with open(output_file, 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql_lines))

print(f"\n✅ Conversion complete!")
print(f"   Districts: {district_count}")
print(f"   Tehsils: {tehsil_count}")
print(f"   Villages: {village_count}")
print(f"\n   Output: {output_file}")