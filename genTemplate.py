#!/usr/bin/env python3
"""
Prefy Template Generator

Converts .prefy files to .json template files.

Format:
    Category Name (Property 1, Property 2, ..., Property n): Entry 1, Entry 2, ..., Entry n

Example:
    Social Activities (Interest, Frequency): Movies, Concerts, Museums
"""

import json
import sys
import re
from pathlib import Path

# Default levels configuration
DEFAULT_LEVELS = [
    {"id": "none", "name": "None", "color": "#ffffff"},
    {"id": "favorite", "name": "Favorite", "color": "#90cdf4"},
    {"id": "liked", "name": "Liked", "color": "#48bb78"},
    {"id": "neutral", "name": "Neutral", "color": "#fbd38d"},
    {"id": "will-try", "name": "Will Try", "color": "#f6ad55"},
    {"id": "disliked", "name": "Disliked", "color": "#fc8181"},
    {"id": "hard-limit", "name": "Hard Limit", "color": "#f56565"}
]


def parse_prefy_line(line):
    """
    Parse a single line from a .prefy file.

    Format: Category Name (Property 1, Property 2): Entry 1, Entry 2

    Returns:
        tuple: (category_name, properties_list, entries_list) or None if invalid
    """
    line = line.strip()

    # Skip empty lines and comments
    if not line or line.startswith('#'):
        return None

    # Match pattern: Category (prop1, prop2): entry1, entry2
    match = re.match(r'^([^(]+)\(([^)]+)\):\s*(.+)$', line)

    if not match:
        print(f"Warning: Skipping invalid line: {line}")
        return None

    category_name = match.group(1).strip()
    properties_str = match.group(2).strip()
    entries_str = match.group(3).strip()

    # Parse properties
    properties = [prop.strip() for prop in properties_str.split(',') if prop.strip()]

    # Parse entries
    entries = [entry.strip() for entry in entries_str.split(',') if entry.strip()]

    if not category_name or not properties or not entries:
        print(f"Warning: Skipping incomplete line: {line}")
        return None

    return category_name, properties, entries


def generate_id(prefix, name, index=None):
    """Generate a unique ID for categories or entries."""
    # Sanitize name for ID
    sanitized = re.sub(r'[^a-z0-9]+', '_', name.lower())
    if index is not None:
        return f"{prefix}_{sanitized}_{index}"
    return f"{prefix}_{sanitized}_default"


def create_category(category_name, properties, entries, cat_index):
    """Create a category object with all its entries."""
    category_id = generate_id("cat", category_name, cat_index)

    entry_objects = []
    for entry_index, entry_name in enumerate(entries):
        entry_id = generate_id("entry", entry_name, entry_index)

        # Create levels dict with all properties set to "none"
        levels = {prop: "none" for prop in properties}

        entry_objects.append({
            "id": entry_id,
            "name": entry_name,
            "levels": levels
        })

    return {
        "id": category_id,
        "name": category_name,
        "properties": properties,
        "entries": entry_objects
    }


def parse_prefy_file(filepath):
    """Parse a .prefy file and return the template data structure."""
    categories = []

    with open(filepath, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            result = parse_prefy_line(line)
            if result:
                category_name, properties, entries = result
                category = create_category(category_name, properties, entries, len(categories))
                categories.append(category)
                print(f"✓ Parsed category '{category_name}' with {len(entries)} entries")

    return {
        "username": "",
        "levels": DEFAULT_LEVELS,
        "categories": categories
    }


def main():
    """Main function to convert .prefy file to .json template."""
    if len(sys.argv) < 2:
        print("Usage: python genTemplate.py <filename.prefy>")
        print("\nExample .prefy format:")
        print("  Social Activities (Interest, Frequency): Movies, Concerts, Museums")
        print("  Food Preferences (Like, Dislike): Italian, Japanese, Mexican")
        sys.exit(1)

    input_file = Path(sys.argv[1])

    # Validate input file
    if not input_file.exists():
        print(f"Error: File '{input_file}' not found")
        sys.exit(1)

    if input_file.suffix != '.prefy':
        print(f"Warning: Expected .prefy extension, got {input_file.suffix}")

    # Generate output filename
    output_file = input_file.with_suffix('.json')

    print(f"Reading from: {input_file}")
    print(f"Writing to: {output_file}")
    print()

    try:
        # Parse the input file
        template_data = parse_prefy_file(input_file)

        # Write the output JSON
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(template_data, f, indent=2, ensure_ascii=False)

        print()
        print(f"✓ Successfully generated {output_file}")
        print(f"  - {len(template_data['categories'])} categories")
        total_entries = sum(len(cat['entries']) for cat in template_data['categories'])
        print(f"  - {total_entries} total entries")

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
