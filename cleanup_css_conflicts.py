#!/usr/bin/env python3
import os
import re

def clean_css_files():
    """Clean merge conflict markers from CSS files"""
    css_files = [
        'src/app/src/App.css',
        'src/app/src/pages/HomePage.css',
        'src/app/src/pages/AdminPage.css',
        'src/app/src/pages/LoginPage.css',
        'src/app/src/pages/HistoryPage.css',
        'src/app/src/pages/ProposalDetailPage.css',
        'src/app/src/components/Navigation.css',
        'src/app/src/components/ProposalsList.css',
        'src/app/src/components/DocumentUpload.css',
        'src/app/src/components/TemplateAdminDashboard.css',
        'src/app/src/components/TemplateConfigurationEditor.css',
        'src/app/quality-checker/QualityChecker.css',
        'src/app/quality-checker/TemplateLibrary.css',
    ]
    
    print("Cleaning CSS merge conflict markers...")
    cleaned_count = 0
    
    for css_file in css_files:
        filepath = os.path.join('C:\\Users\\rohirt\\CG_QA', css_file)
        if not os.path.exists(filepath):
            continue
            
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Check if file has conflict markers
            if '<<<<<<< HEAD' not in content:
                continue
            
            # Remove conflict markers - keep HEAD version
            # Pattern: <<<<<<< HEAD ... ======= ... >>>>>>> hash
            cleaned = re.sub(
                r'<<<<<<< HEAD\n(.*?)\n=======\n(.*?)\n>>>>>>> [a-f0-9]+',
                r'\1',
                content,
                flags=re.DOTALL
            )
            
            # If no match, try alternative pattern (in case of line ending differences)
            if cleaned == content and '<<<<<<< HEAD' in content:
                # Just remove everything between markers and keep HEAD
                cleaned = re.sub(
                    r'<<<<<<< HEAD.*?=======.*?>>>>>>> [a-f0-9]+\n',
                    '',
                    content,
                    flags=re.DOTALL
                )
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(cleaned)
            
            print(f"  ✓ Cleaned: {css_file}")
            cleaned_count += 1
            
        except Exception as e:
            print(f"  ✗ Error cleaning {css_file}: {str(e)}")
    
    print(f"\nResults: {cleaned_count} CSS files cleaned")

if __name__ == '__main__':
    clean_css_files()
