import re
import os

def fix_file(file_path):
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Remove trailing whitespace from all lines
    content = re.sub(r'[ \t]+$', '', content, flags=re.MULTILINE)
    
    # Ensure exactly one newline at the end
    content = content.rstrip('\n') + '\n'
    
    with open(file_path, 'w') as f:
        f.write(content)
    
    print(f"Fixed: {file_path}")

# Fix the Python files
fix_file(os.path.join('python_utils', '__init__.py'))
fix_file(os.path.join('python_utils', 'calculator.py'))
fix_file(os.path.join('python_utils', 'bank_account.py')) 