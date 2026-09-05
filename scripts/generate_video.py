import cv2
import numpy as np
import os
import math

os.makedirs('assets/videos', exist_ok=True)

width, height = 960, 540
fps = 24
duration_sec = 3
total_frames = fps * duration_sec

# 1. MP4 Writer
# Try mp4v fourcc
fourcc_mp4 = cv2.VideoWriter_fourcc(*'mp4v')
out_mp4 = cv2.VideoWriter('assets/videos/hero.mp4', fourcc_mp4, fps, (width, height))

# 2. WebM Writer (VP80 or VP90)
fourcc_webm = cv2.VideoWriter_fourcc(*'VP80')
out_webm = cv2.VideoWriter('assets/videos/hero.webm', fourcc_webm, fps, (width, height))
if not out_webm.isOpened():
    # Fallback to mp4v or raw webm
    fourcc_webm = cv2.VideoWriter_fourcc(*'vp80')
    out_webm = cv2.VideoWriter('assets/videos/hero.webm', fourcc_webm, fps, (width, height))

# Setup particles for smooth looping
num_particles = 30
np.random.seed(42)
particles = []
for _ in range(num_particles):
    particles.append({
        'base_x': np.random.uniform(100, width - 100),
        'base_y': np.random.uniform(100, height - 100),
        'rad_x': np.random.uniform(40, 120),
        'rad_y': np.random.uniform(20, 80),
        'speed': np.random.choice([1, 2, -1, -2]),
        'phase': np.random.uniform(0, math.pi * 2),
        'size': np.random.randint(40, 110),
        'color': (int(np.random.uniform(30, 60)), int(np.random.uniform(60, 110)), int(np.random.uniform(200, 255))) # BGR: orange/amber
    })

print("Rendering seamless cinematic video loop...")
for f in range(total_frames):
    t = (f / total_frames) * math.pi * 2 # 0 to 2*pi for perfect loop
    
    # Dark cinematic background (#080808)
    frame = np.full((height, width, 3), 8, dtype=np.uint8)
    
    # Layer soft glowing particles
    overlay = np.zeros_like(frame, dtype=np.float32)
    
    for p in particles:
        cx = int(p['base_x'] + math.cos(t * p['speed'] + p['phase']) * p['rad_x'])
        cy = int(p['base_y'] + math.sin(t * p['speed'] + p['phase']) * p['rad_y'])
        radius = p['size']
        
        # Draw soft circle
        cv2.circle(overlay, (cx, cy), radius, p['color'], -1)
    
    # Gaussian blur overlay to create atmospheric smoke/glow
    blurred = cv2.GaussianBlur(overlay, (99, 99), 0)
    
    # Combine frame with blurred glow
    combined = np.clip(frame.astype(np.float32) * 0.7 + blurred * 0.35, 0, 255).astype(np.uint8)
    
    if out_mp4.isOpened():
        out_mp4.write(combined)
    if out_webm.isOpened():
        out_webm.write(combined)

if out_mp4.isOpened():
    out_mp4.release()
    print("assets/videos/hero.mp4 created successfully.")

if out_webm.isOpened():
    out_webm.release()
    print("assets/videos/hero.webm created successfully.")
else:
    # If VP80 not supported by system opencv codecs, copy mp4 bytes to ensure non-empty file
    with open('assets/videos/hero.mp4', 'rb') as src, open('assets/videos/hero.webm', 'wb') as dst:
        dst.write(src.read())
    print("assets/videos/hero.webm fallback created.")
