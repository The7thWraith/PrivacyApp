import zmq
import io
from PIL import Image, ImageTk
import numpy as np
import time
import tkinter as tk
from threading import Thread
from queue import Queue, Empty


class ImageZMQReceiver:
def __init__(self, endpoint="tcp://localhost:5555", topic="IMAGE"):
"""
Initialize the ZeroMQ image receiver

Args:
endpoint (str): ZeroMQ endpoint to connect to
topic (str): Topic to subscribe to
"""
# Initialize ZeroMQ context and socket
self.context = zmq.Context()
self.socket = self.context.socket(zmq.SUB)
self.socket.connect(endpoint)
self.socket.setsockopt_string(zmq.SUBSCRIBE, topic)

# Set a timeout for receiving messages (in milliseconds)
self.socket.setsockopt(zmq.RCVTIMEO, 100)# Shorter timeout

# Configure high water mark to limit queue size on socket level
self.socket.setsockopt(zmq.RCVHWM, 2)# Limit internal ZMQ queue

self.topic = topic
self.running = False
self.receive_thread = None
self.latest_image = None
self.image_queue = Queue(maxsize=2)# Limit queue size to prevent memory issues

def receive_image(self, timeout=100):
"""
Receive a single image synchronously

Args:
timeout (int): Timeout in milliseconds

Returns:
PIL.Image or None: The received image, or None if no image was received
"""
# Set the timeout
self.socket.setsockopt(zmq.RCVTIMEO, timeout)

try:
# First frame is the topic
topic = self.socket.recv_string(zmq.NOBLOCK)# Non-blocking receive

# Second frame is the image data
image_data = self.socket.recv(zmq.NOBLOCK)# Non-blocking receive

# Convert bytes to PIL Image
image = Image.open(io.BytesIO(image_data))
return image

except zmq.Again:
# Timeout occurred
return None
except Exception as e:
print(f"Error receiving image: {e}")
return None

def start_receiving(self, callback=None):
"""
Start receiving images asynchronously

Args:
callback (callable): Function to call with each received image
"""
if self.running:
return

self.running = True
self.receive_thread = Thread(target=self._receive_loop, args=(callback,))
self.receive_thread.daemon = True
self.receive_thread.start()

def _receive_loop(self, callback):
"""
Internal method for the receiving loop

Args:
callback (callable): Function to call with each received image
"""
while self.running:
image = self.receive_image()
if image is not None:
self.latest_image = image

# If queue is full, remove the oldest image
if self.image_queue.full():
try:
self.image_queue.get_nowait()
except Empty:
pass

# Add new image to queue
try:
self.image_queue.put_nowait(image)
if callback:
callback()# Just notify, don't pass image
except:
pass# Queue is full, skip this frame

time.sleep(0.001)# Very small delay to avoid high CPU usage

def stop_receiving(self):
"""Stop the asynchronous receiving thread"""
self.running = False
if self.receive_thread:
self.receive_thread.join(2)

def get_latest_image(self):
"""Get the most recently received image"""
try:
# Get the latest image from the queue
return self.image_queue.get_nowait()
except Empty:
return None

def close(self):
"""Close the ZeroMQ socket and context"""
self.stop_receiving()
self.socket.close()
self.context.term()


class ImageViewer:
"""Simple Tkinter viewer for displaying received images"""

def __init__(self, receiver, title="ZeroMQ Image Receiver"):
"""Initialize the Tkinter viewer"""
self.receiver = receiver
self.root = tk.Tk()
self.root.title(title)

# Create a label for displaying the image
self.image_label = tk.Label(self.root)
self.image_label.pack(padx=10, pady=10)

# Status label
self.status_label = tk.Label(self.root, text="Waiting for image...")
self.status_label.pack(pady=5)

# FPS counter variables
self.frame_count = 0
self.last_fps_time = time.time()
self.fps = 0

self.current_image = None
self.tk_image = None

# Set up periodic UI updates
self.update_ui()

def update_image(self):
"""Update the displayed image from the receiver queue"""
image = self.receiver.get_latest_image()
if image is not None:
self.current_image = image

# Convert PIL Image to Tkinter PhotoImage
self.tk_image = ImageTk.PhotoImage(image)

# Update the label with the new image
self.image_label.config(image=self.tk_image)

# Update FPS counter
self.frame_count += 1
current_time = time.time()
time_diff = current_time - self.last_fps_time

if time_diff >= 1.0:# Update FPS every second
self.fps = self.frame_count / time_diff
self.frame_count = 0
self.last_fps_time = current_time

# Update status
self.status_label.config(text=f"Image: {image.width}x{image.height} pixels | FPS: {self.fps:.1f}")

# Adjust window size if needed
self.root.geometry(f"{image.width}x{image.height + 30}")

def update_ui(self):
"""Periodically update the UI"""
self.update_image()
# Schedule next update (30ms ≈ 33 FPS max)
self.root.after(30, self.update_ui)

def start(self):
"""Start the Tkinter main loop"""
self.root.mainloop()

def close(self):
"""Close the Tkinter window"""
self.root.quit()
self.root.destroy()


def main():
"""Main function to demonstrate the ZeroMQ image receiver"""
# Create the ZeroMQ receiver
receiver = ImageZMQReceiver()

# Create the image viewer
viewer = ImageViewer(receiver)

# Start receiving images
receiver.start_receiving()

# Start the viewer
try:
viewer.start()
except KeyboardInterrupt:
pass
finally:
receiver.close()
viewer.close()


if __name__ == "__main__":
main()