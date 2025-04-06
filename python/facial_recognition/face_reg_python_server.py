import zmq
import cv2
import numpy as np
import json
from facenet import compare_faces

context = zmq.Context()
socket = context.socket(zmq.REP)
socket.bind("tcp://*:5555")

first_frame = None
while True:
    msg = socket.recv()
    current_frame = cv2.imdecode(np.frombuffer(msg, np.uint8), cv2.IMREAD_COLOR)
    
    if first_frame is None:
        first_frame = current_frame

    # Run your model (example: classification or pose estimation)
    result = compare_faces(first_frame, current_frame)
    
    response = json.dumps(result).encode('utf-8')
    socket.send(response)
