import os
import shutil
import json
from PIL import Image, UnidentifiedImageError

# Define the path to the folder containing the images and the output folder
input_folder = 'data'
output_folder = 'data_back'

# Create the output folder if it doesn't exist
os.makedirs(output_folder, exist_ok=True)

# Load existing metadata
metadata_path = os.path.join(output_folder, "metadata.json")
metadata = []
try:
    with open(metadata_path, 'r') as f:
        for line in f:
            if line.strip():  # Skip empty lines
                metadata.append(json.loads(line))
    print(f"Loaded {len(metadata)} existing metadata entries.")
except (FileNotFoundError, json.JSONDecodeError) as e:
    print(f"No existing metadata found or error reading it: {e}")

# Find the last design index number in existing metadata
last_index = 0
for item in metadata:
    filename = item.get("file_name", "")
    if filename.startswith("design_") and filename.endswith(".jpeg"):
        try:
            index = int(filename.split("_")[1].split(".")[0])
            last_index = max(last_index, index)
        except (ValueError, IndexError):
            continue

print(f"Last design index found: {last_index}")
new_index = last_index + 1  # Start from the next number

# Get a list of all image files in the input folder
image_files = [f for f in os.listdir(input_folder) if f.endswith(('.png', '.jpg', '.jpeg'))]

# Check which images are already processed (to avoid duplicates)
existing_source_files = []
for item in metadata:
    source_file = item.get("source_file", "")
    if source_file:
        existing_source_files.append(source_file)

# Filter out already processed files
new_image_files = [f for f in image_files if f not in existing_source_files]
print(f"Found {len(new_image_files)} new images to process.")

# Counter for successful copies
success_count = 0

# Loop through all new files in the input folder
for filename in new_image_files:
    try:
        # Create new filename with sequential numbering
        new_filename = f"design_{new_index}.jpeg"
        new_index += 1
        
        # Copy the image to the output folder with the new filename
        source_path = os.path.join(input_folder, filename)
        output_path = os.path.join(output_folder, new_filename)
        
        # Copy the file directly without resizing
        shutil.copy2(source_path, output_path)
        
        # Add entry to metadata
        metadata.append({
            "file_name": new_filename,
            "text": "Rajasthani design on male kurta"
        })
        
        print(f"Copied {filename} as {new_filename}")
        success_count += 1
        
    except (IOError, OSError) as e:
        print(f"Error processing {filename}: {e}")
        continue

# Save metadata back to the file
if success_count > 0:
    with open(metadata_path, 'w') as f:
        for item in metadata:
            f.write(json.dumps(item) + '\n')

print(f"Processed {len(new_image_files)} new images. Successfully copied {success_count} images to the '{output_folder}' folder.")
print(f"Updated metadata.json with caption 'Rajasthani bagru design' for all new images.")