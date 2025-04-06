from ultralytics import YOLO
import cv2

# Load the model
model = YOLO('python/models/best.pt')

# Predict on the image
results = model.predict(
    source='python/cars.jpeg', 
    conf=0.005,
    save=False
)

# Loop through results
# for r in results:
#     print(r)
#     img = r.plot()  # This plots the results (boxes, masks, etc.) on the image
#     cv2.imshow("Predictions", img)
#     cv2.waitKey(0)
#     cv2.destroyAllWindows()

for r in results:
    img = r.plot()  # this includes low-confidence predictions
    cv2.imshow("Debug", img)
    cv2.waitKey(0)