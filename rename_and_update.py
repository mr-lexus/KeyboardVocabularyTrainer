import os
import glob

# Find all CSS files
css_files = glob.glob('src/**/*.css', recursive=True)

# Rename to .scss
for css_file in css_files:
    scss_file = css_file[:-4] + '.scss'
    os.rename(css_file, scss_file)
    print(f"Renamed {css_file} to {scss_file}")

# Update imports in all TS/TSX files
ts_files = glob.glob('src/**/*.{ts,tsx}', recursive=True)
for ts_file in ts_files:
    with open(ts_file, 'r') as f:
        content = f.read()
    
    if '.css' in content:
        new_content = content.replace('.css', '.scss')
        with open(ts_file, 'w') as f:
            f.write(new_content)
        print(f"Updated imports in {ts_file}")
