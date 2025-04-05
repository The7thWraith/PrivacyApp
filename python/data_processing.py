import os
import shutil
from glob import glob
import yaml

# Define datasets and their class names
datasets = [
    ("data/credit_cards.v1i.yolov11", ['id_card']),
    ("data/license_plate_data.v11i.yolov11", ['License_Plate']),
    ("data/road_names.v1i.yolov11", ['road-names']),
]

output_dir = "data/combined_data.yolov11"
splits = ['train', 'valid', 'test']
combined_names = []
class_offset = 0

# Prepare output directories
for split in splits:
    os.makedirs(os.path.join(output_dir, split, 'images'), exist_ok=True)
    os.makedirs(os.path.join(output_dir, split, 'labels'), exist_ok=True)

# Process each dataset
for dataset_path, class_names in datasets:
    print(f"Processing: {dataset_path}")
    
    for split in splits:
        img_dir = os.path.join(dataset_path, split, 'images')
        label_dir = os.path.join(dataset_path, split, 'labels')

        image_files = glob(os.path.join(img_dir, '*.jpg'))

        for img_path in image_files:
            img_name = os.path.basename(img_path)
            label_path = os.path.join(label_dir, img_name.replace('.jpg', '.txt'))

            new_img_name = f"{dataset_path.split('/')[-1]}_{img_name}"
            new_label_name = new_img_name.replace('.jpg', '.txt')

            new_img_path = os.path.join(output_dir, split, 'images', new_img_name)
            new_label_path = os.path.join(output_dir, split, 'labels', new_label_name)

            shutil.copy2(img_path, new_img_path)

            if os.path.exists(label_path):
                with open(label_path, 'r') as fin, open(new_label_path, 'w') as fout:
                    for line in fin:
                        parts = line.strip().split()
                        old_class_id = int(parts[0])
                        new_class_id = old_class_id + class_offset
                        fout.write(f"{new_class_id} {' '.join(parts[1:])}\n")

    combined_names.extend(class_names)
    class_offset += len(class_names)

# Create final data.yaml
combined_yaml = {
    'train': f"{output_dir}/train/images",
    'val': f"{output_dir}/valid/images",
    'test': f"{output_dir}/test/images",
    'nc': len(combined_names),
    'names': combined_names
}

with open(os.path.join(output_dir, 'data.yaml'), 'w') as f:
    yaml.dump(combined_yaml, f)

print("Combined dataset created successfully at:", output_dir)
