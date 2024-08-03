import os
import json
import shutil

# Load the pack.json file
with open('icons/pack.json', 'r') as f:
    data = json.load(f)

# Directory containing the SVG files
svg_directory = 'icons/SVG'
# Target directory to copy files to
target_directory = '../../public/providers/SVG'

# Ensure the target directory exists
os.makedirs(target_directory, exist_ok=True)

# Iterate over the icons in the pack.json
for icon in data['icons']:
    # Get the current filename and the new name
    current_filename = icon['filename']
    new_name = icon['name']

    # Construct the full path of the current and new filenames
    current_path = os.path.join(
        svg_directory, os.path.basename(current_filename))
    new_path = os.path.join(target_directory, new_name + '.svg')

    # Copy the file
    try:
        shutil.copyfile(current_path, new_path)
        print(f'Copied: {current_path} -> {new_path}')
    except FileNotFoundError:
        print(f'File not found: {current_path}')
    except Exception as e:
        print(f'Error copying {current_path} to {new_path}: {e}')
