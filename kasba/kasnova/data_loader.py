import os
import pandas as pd
from datasets import load_dataset
from huggingface_hub import login

# Log in with your Hugging Face token
login(token="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")

# Load the image dataset from the resized images folder [data_back/](data_back/)
# drop_labels=True omits the original folder-labels
ds = load_dataset("imagefolder", data_dir="data_back", drop_labels=True)

# Read the fixed metadata file containing captions from [data_back/metadata.csv](data_back/metadata.csv)
metadata_df = pd.read_csv("data_back/metadata.csv", quotechar='"', quoting=1, skipinitialspace=True)

def add_text(example):
    # Extract the image file name from the stored image info.
    # If the image is a dict, extract "path", otherwise use the filename attribute of the PIL image.
    if isinstance(example["image"], dict):
        image_path = example["image"]["path"]
    else:
        image_path = example["image"].filename
    file_name = os.path.basename(image_path)
    # Lookup the corresponding text using the file_name
    match = metadata_df.loc[metadata_df["file_name"] == file_name]
    example["text"] = match.iloc[0]["text"] if not match.empty else ""
    return example

# Process the training split to add the text field from metadata
dataset = ds["train"].map(add_text)

# Replace the following model_id with your model name on Hugging Face Hub, e.g., "username/my-dataset"
model_id = "yashh123/kasanova"

# Push the dataset with images and text metadata to Hugging Face
dataset.push_to_hub(model_id)
print(f"Dataset pushed to the hub as {model_id}")