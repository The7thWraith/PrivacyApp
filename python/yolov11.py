from ultralytics import YOLO

model = YOLO("yolo11m.pt")  

results = model.train(
    data="/Users/christophermao/Documents/GitHub/PrivacyApp/python/data/road_names.v1i.yolov11/data.yaml", 
    epochs=100, 
    imgsz=640, 
    device="mps", 
    workers=-1
    )
