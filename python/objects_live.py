import cv2
from ultralytics import YOLO

import os
os.environ['OBJC_DISABLE_INITIALIZE_FORK_SAFETY'] = 'YES'

# Load the YOLOv8 model
model = YOLO('python/models/best.pt')  # using the nano model for better performance

# Access the webcam (usually 0 for built-in webcam)
cap = cv2.VideoCapture(0)

# Check if the webcam is opened correctly
if not cap.isOpened():
    raise IOError("Cannot open webcam")

while True:
    # Read a frame from the webcam
    ret, frame = cap.read()
    if not ret:
        break
        
    # Run YOLOv8 inference on the frame
    results = model(frame)
    
    # Visualize the results on the frame
    annotated_frame = results[0].plot()
    
    # Display the annotated frame
    cv2.imshow('YOLOv8 Webcam Detection', annotated_frame)
    
    # Break the loop if 'q' is pressed
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Release the webcam and close all windows
cap.release()
cv2.destroyAllWindows()