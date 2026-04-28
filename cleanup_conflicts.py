#!/usr/bin/env python3
"""Clean git merge conflicts from source files."""

import os
import re
import json

# Files to clean
CONFLICT_FILES = [
    'src/app/src/components/DocumentUpload.tsx',
    'src/app/src/components/Navigation.tsx',
    'src/app/src/components/ProposalsList.tsx',
    'src/app/src/components/TemplateAdminDashboard.tsx',
    'src/app/src/components/TemplateConfigurationEditor.tsx',
    'src/app/src/services/api.ts',
    'src/app/src/i18n/locales/en.json',
    'src/app/src/i18n/locales/fr.json',
    'src/app/src/i18n/locales/de.json',
]

def clean_file(filepath):
    """Extract HEAD version from a file with merge conflicts."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if file has any conflict markers
        has_head_marker = '<<<<<<< HEAD' in content
        has_end_marker = '>>>>>>> ' in content
        
        if not (has_head_marker or has_end_marker):
            print(f"✓ No conflicts in {filepath}")
            return True
        
        # If we have a full conflict, extract HEAD version
        if has_head_marker:
            match = re.search(r'<<<<<<< HEAD(.*?)\n=======', content, re.DOTALL)
            if match:
                # Extract HEAD version (everything before the first =======)
                head_content = content[:match.start()] + match.group(1).lstrip('\n')
                # Remove any remaining conflict markers
                head_content = re.sub(r'\n>>>>>>> [a-f0-9]+\n?$', '\n', head_content)
                head_content = re.sub(r'\n=======\n.*', '', head_content, flags=re.DOTALL)
                content = head_content
        
        # Remove any trailing conflict end markers
        if '>>>>>>> ' in content:
            content = re.sub(r'\n+>>>>>>> [a-f0-9]+\s*$', '', content)
        
        # For JSON files, verify it's valid
        if filepath.endswith('.json'):
            try:
                # Try to parse to verify it's valid JSON
                json.loads(content)
            except json.JSONDecodeError as e:
                print(f"✗ Invalid JSON in {filepath}: {e}")
                return False
        
        # Write cleaned content
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"✓ Cleaned {filepath}")
        return True
    
    except Exception as e:
        print(f"✗ Error cleaning {filepath}: {e}")
        return False

def main():
    """Clean all conflict files."""
    print("Starting merge conflict cleanup...")
    print()
    
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    success_count = 0
    fail_count = 0
    
    for filepath in CONFLICT_FILES:
        if os.path.exists(filepath):
            if clean_file(filepath):
                success_count += 1
            else:
                fail_count += 1
        else:
            print(f"✗ File not found: {filepath}")
            fail_count += 1
    
    print()
    print(f"Results: {success_count} cleaned, {fail_count} failed")
    return fail_count == 0

if __name__ == '__main__':
    success = main()
    exit(0 if success else 1)
