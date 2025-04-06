# from facenet_pytorch import MTCNN, InceptionResnetV1
from mtcnn import MTCNN
from InceptionRestnet import InceptionResnetV1
import torch
from PIL import Image
import numpy as np

# Initialize the MTCNN and FaceNet models
device = torch.device('cuda:0' if torch.cuda.is_available() else 'cpu')
mtcnn = MTCNN(keep_all=False, device=device)
resnet = InceptionResnetV1(pretrained='vggface2', device=device).eval()

def get_embedding(img_path):
    img = Image.open(img_path).convert('RGB')
    # Get face and apply transformation
    img_cropped = mtcnn(img)
    # Handle case when no face is detected
    if img_cropped is None:
        return None
    # Get embedding
    embedding = resnet(img_cropped.unsqueeze(0))
    return embedding.detach()

def compare_faces(img_path1, img_path2, threshold=0.2):
    # Get embeddings for both images
    embedding1 = get_embedding(img_path1)
    embedding2 = get_embedding(img_path2)
    
    # If either face detection failed
    if embedding1 is None or embedding2 is None:
        return "Face detection failed for one or both images"
    
    # Calculate distance between embeddings
    distance = torch.nn.functional.pairwise_distance(embedding1, embedding2).item()
    
    # Convert distance to similarity score (higher means more similar)
    similarity = 1.0 - distance
    
    # Determine if same person based on threshold
    same_person = similarity >= threshold
    
    return {
        "same_person": same_person,
        "similarity": similarity,
        "distance": distance
    }

# Example usage
result = compare_faces("python/facial_recognition/test_photos/photo9.jpeg", "python/facial_recognition/test_photos/photo10.jpeg")
print(f"Same person: {result['same_person']}")
print(f"Similarity score: {result['similarity']:.4f}")