from ultralytics import YOLO
import cv2

# Load the model
model = YOLO('python/models/full_train1.pt')

# Predict on the image
results = model.predict(
    source='python/data/credit_cards.v1i.yolov11/train/images/0hvCg3WrUOfRrnFgD_jpg.rf.db42ce75d3bc6e1f8616c2553addefab.jpg', 
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