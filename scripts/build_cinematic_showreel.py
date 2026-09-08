import cv2
import numpy as np
import os
import shutil
import math

brain_dir = r"C:\Users\User\.gemini\antigravity\brain\12b26b1e-74a2-4bf1-8c0a-fd048a32d20f"
img1_path = os.path.join(brain_dir, "event_showreel_hero_1788777623089.jpg")
img2_path = os.path.join(brain_dir, "showreel_scene_2_1788777650379.jpg")
img3_path = os.path.join(brain_dir, "showreel_scene_3_1788777680275.jpg")

os.makedirs("assets/videos", exist_ok=True)
os.makedirs("assets/images/hero", exist_ok=True)

# Copy source images to assets
shutil.copy(img1_path, "assets/images/hero/showreel_scene1.jpg")
shutil.copy(img2_path, "assets/images/hero/showreel_scene2.jpg")
shutil.copy(img3_path, "assets/images/hero/showreel_scene3.jpg")

print("Source showreel images staged.")

# Target video resolution
width, height = 1280, 720
fps = 24
total_frames = 72 # Exactly 3.0 seconds

# Load & prepare frames
im1 = cv2.imread(img1_path)
im2 = cv2.imread(img2_path)
im3 = cv2.imread(img3_path)

im1 = cv2.resize(im1, (width, height), interpolation=cv2.INTER_AREA)
im2 = cv2.resize(im2, (width, height), interpolation=cv2.INTER_AREA)
im3 = cv2.resize(im3, (width, height), interpolation=cv2.INTER_AREA)

# Video Writers
fourcc_mp4 = cv2.VideoWriter_fourcc(*'mp4v')
out_mp4 = cv2.VideoWriter('assets/videos/hero.mp4', fourcc_mp4, fps, (width, height))

fourcc_webm = cv2.VideoWriter_fourcc(*'VP80')
out_webm = cv2.VideoWriter('assets/videos/hero.webm', fourcc_webm, fps, (width, height))
if not out_webm.isOpened():
    fourcc_webm = cv2.VideoWriter_fourcc(*'vp80')
    out_webm = cv2.VideoWriter('assets/videos/hero.webm', fourcc_webm, fps, (width, height))

# 3 scenes over 72 frames:
# Scene 1: frames 0..23 (1.0s) -> Festival Pyro Stage with forward zoom
# Scene 2: frames 24..47 (1.0s) -> Kinetic Ring Dome with pan
# Scene 3: frames 48..71 (1.0s) -> Opening Ceremony Gala with crane pan
# With 4-frame fast cinematic cross-dissolves

def apply_cinematic_camera(img, zoom_factor, pan_x, pan_y):
    h, w = img.shape[:2]
    # Zoom
    new_w = int(w * zoom_factor)
    new_h = int(h * zoom_factor)
    resized = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_LINEAR)
    
    # Crop to target (w, h)
    start_x = max(0, min(new_w - w, int((new_w - w) / 2 + pan_x)))
    start_y = max(0, min(new_h - h, int((new_h - h) / 2 + pan_y)))
    return resized[start_y:start_y+h, start_x:start_x+w]

def add_flare_and_strobe(frame, intensity, flare_color=(255, 180, 80)):
    if intensity <= 0.01:
        return frame
    h, w = frame.shape[:2]
    flare = np.zeros_like(frame, dtype=np.float32)
    # Horizontal anamorphic line
    cy = int(h * 0.45)
    cv2.line(flare, (0, cy), (w, cy), flare_color, 2)
    # Radial glow at center
    cv2.circle(flare, (w // 2, cy), int(120 * intensity), flare_color, -1)
    flare_blur = cv2.GaussianBlur(flare, (61, 61), 0)
    
    res = cv2.addWeighted(frame.astype(np.float32), 1.0, flare_blur, intensity * 0.45, 0)
    return np.clip(res, 0, 255).astype(np.uint8)

print("Synthesizing 72-frame 3-second showreel with camera motions and dynamic lighting...")

scenes = [
    (im1, 0, 24, "scene1"),
    (im2, 24, 48, "scene2"),
    (im3, 48, 72, "scene3")
]

poster_frame = None

for f in range(total_frames):
    # Determine which scene is active
    if f < 24:
        # Scene 1: zoom 1.00 -> 1.08
        progress = f / 24.0
        curr_frame = apply_cinematic_camera(im1, 1.00 + progress * 0.08, 0, -int(progress * 15))
        # Light strobe at beat
        strobe = math.sin(progress * math.pi * 4) ** 8
        curr_frame = add_flare_and_strobe(curr_frame, strobe * 0.6)

        # Cross-dissolve into scene 2 at end
        if f >= 20:
            alpha = (f - 20) / 4.0
            next_frame = apply_cinematic_camera(im2, 1.00, 0, 0)
            curr_frame = cv2.addWeighted(curr_frame, 1.0 - alpha, next_frame, alpha, 0)

    elif f < 48:
        # Scene 2: zoom 1.06 -> 1.00 + gentle pan
        progress = (f - 24) / 24.0
        curr_frame = apply_cinematic_camera(im2, 1.06 - progress * 0.06, int(progress * 25), 0)
        strobe = math.sin(progress * math.pi * 3) ** 6
        curr_frame = add_flare_and_strobe(curr_frame, strobe * 0.5, flare_color=(80, 220, 255))

        # Cross-dissolve into scene 3 at end
        if f >= 44:
            alpha = (f - 44) / 4.0
            next_frame = apply_cinematic_camera(im3, 1.00, 0, 0)
            curr_frame = cv2.addWeighted(curr_frame, 1.0 - alpha, next_frame, alpha, 0)

    else:
        # Scene 3: zoom 1.00 -> 1.07 + crane up
        progress = (f - 48) / 24.0
        curr_frame = apply_cinematic_camera(im3, 1.00 + progress * 0.07, -int(progress * 15), -int(progress * 20))
        strobe = math.sin(progress * math.pi * 4) ** 6
        curr_frame = add_flare_and_strobe(curr_frame, strobe * 0.55, flare_color=(255, 120, 40))

        # Cross-dissolve back to scene 1 for seamless loop
        if f >= 68:
            alpha = (f - 68) / 4.0
            next_frame = apply_cinematic_camera(im1, 1.00, 0, 0)
            curr_frame = cv2.addWeighted(curr_frame, 1.0 - alpha, next_frame, alpha, 0)

    # Filmic subtle vignette & grade
    vignette = np.zeros((height, width), dtype=np.float32)
    cv2.circle(vignette, (width // 2, height // 2), int(width * 0.65), 1.0, -1)
    vignette = cv2.GaussianBlur(vignette, (121, 121), 0)
    curr_frame = (curr_frame.astype(np.float32) * (0.8 + 0.2 * vignette[..., None])).astype(np.uint8)

    # Subtle editorial watermark in top-right
    cv2.circle(curr_frame, (width - 170, 42), 4, (54, 90, 255), -1) # Red record indicator
    cv2.putText(curr_frame, "EVENT SHOWREEL // 4K", (width - 155, 46),
                cv2.FONT_HERSHEY_SIMPLEX, 0.4, (230, 230, 230), 1, cv2.LINE_AA)
    
    sec = f // 24
    frm = f % 24
    cv2.putText(curr_frame, f"00:0{sec}:{frm:02d}", (width - 155, 64),
                cv2.FONT_HERSHEY_SIMPLEX, 0.35, (160, 160, 160), 1, cv2.LINE_AA)

    # Save peak frame as poster (Scene 1 peak)
    if f == 12:
        poster_frame = curr_frame.copy()

    if out_mp4.isOpened():
        out_mp4.write(curr_frame)
    if out_webm.isOpened():
        out_webm.write(curr_frame)

if out_mp4.isOpened():
    out_mp4.release()
    print("Exported assets/videos/hero.mp4")

if out_webm.isOpened():
    out_webm.release()
    print("Exported assets/videos/hero.webm")
else:
    with open('assets/videos/hero.mp4', 'rb') as s, open('assets/videos/hero.webm', 'wb') as d:
        d.write(s.read())
    print("Exported assets/videos/hero.webm (fallback)")

# Export high-res poster
if poster_frame is not None:
    cv2.imwrite("assets/videos/hero-poster.jpg", poster_frame)
    cv2.imwrite("assets/images/hero/hero-poster.jpg", poster_frame)
    print("Exported poster images.")

print("Cinematic 3-second showreel complete!")
