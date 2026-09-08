import cv2
import numpy as np
import os
import math
from PIL import Image, ImageDraw, ImageFont

os.makedirs('assets/videos', exist_ok=True)
os.makedirs('assets/images/hero', exist_ok=True)

width, height = 1280, 720
fps = 24
duration_sec = 3.0
total_frames = int(fps * duration_sec) # 72 frames

print(f"Generating Event Company Showreel: {width}x{height} @ {fps}fps, {total_frames} frames...")

# Video Writers
fourcc_mp4 = cv2.VideoWriter_fourcc(*'mp4v')
out_mp4 = cv2.VideoWriter('assets/videos/hero.mp4', fourcc_mp4, fps, (width, height))

fourcc_webm = cv2.VideoWriter_fourcc(*'VP80')
out_webm = cv2.VideoWriter('assets/videos/hero.webm', fourcc_webm, fps, (width, height))
if not out_webm.isOpened():
    fourcc_webm = cv2.VideoWriter_fourcc(*'vp80')
    out_webm = cv2.VideoWriter('assets/videos/hero.webm', fourcc_webm, fps, (width, height))

# Pre-generate Crowd Silhouettes in foreground
# People heads, shoulders, raised hands and phones filming
np.random.seed(101)
crowd_elements = []
for i in range(110):
    cx = np.random.uniform(-50, width + 50)
    cy = np.random.uniform(height - 140, height + 30)
    head_r = np.random.uniform(18, 32)
    has_arm = np.random.random() > 0.4
    has_phone = np.random.random() > 0.75
    arm_angle = np.random.uniform(-0.6, 0.6)
    crowd_elements.append({
        'cx': cx, 'cy': cy, 'r': head_r,
        'has_arm': has_arm, 'has_phone': has_phone,
        'arm_angle': arm_angle,
        'bounce_freq': np.random.uniform(2.0, 4.0),
        'bounce_phase': np.random.uniform(0, math.pi * 2)
    })

# Pre-generate Pyro / Confetti Sparks
num_sparks = 180
sparks = []
for _ in range(num_sparks):
    sparks.append({
        'x': np.random.uniform(100, width - 100),
        'y': np.random.uniform(100, height - 80),
        'vx': np.random.uniform(-1.5, 1.5),
        'vy': np.random.uniform(-4.0, -1.0),
        'size': np.random.randint(2, 6),
        'color': (int(np.random.uniform(40, 80)), int(np.random.uniform(140, 220)), int(np.random.uniform(220, 255))), # BGR gold/amber
        'flicker': np.random.uniform(3, 8)
    })

# Spotlights configuration
num_spotlights = 8
spotlights = []
for i in range(num_spotlights):
    origin_x = width * (0.15 + 0.7 * (i / (num_spotlights - 1)))
    origin_y = 60
    base_target = width * (0.1 + 0.8 * (1 - i / (num_spotlights - 1)))
    spotlights.append({
        'ox': origin_x,
        'oy': origin_y,
        'base_tx': base_target,
        'sweep_speed': (i % 2 * 2 - 1) * 1.5,
        'phase': i * 0.8,
        'color': [(255, 180, 50), (50, 140, 255), (255, 90, 54), (200, 230, 255)][i % 4] # BGR
    })

peak_frame = None

for f in range(total_frames):
    t_norm = f / total_frames # 0.0 to 1.0
    t_rad = t_norm * math.pi * 2 # 0 to 2*pi for seamless loops
    time_sec = f / fps

    # 1. Base Stage Background: Deep cinematic arena haze with gradient
    frame = np.zeros((height, width, 3), dtype=np.uint8)
    
    # Atmospheric stage background gradient
    bg_intensity = 15 + int(12 * math.sin(t_rad * 2))
    cv2.rectangle(frame, (0, 0), (width, height), (bg_intensity, bg_intensity // 2, bg_intensity // 3), -1)

    # 2. Overhead Truss Structure
    truss_y = 60
    cv2.line(frame, (80, truss_y), (width - 80, truss_y), (60, 60, 65), 5)
    cv2.line(frame, (80, truss_y + 25), (width - 80, truss_y + 25), (45, 45, 50), 3)
    for tx in range(100, width - 80, 40):
        cv2.line(frame, (tx, truss_y), (tx + 20, truss_y + 25), (40, 40, 45), 2)
        cv2.line(frame, (tx + 20, truss_y + 25), (tx + 40, truss_y), (40, 40, 45), 2)

    # 3. Monumental Kinetic Stage LED Screens & Central Ring
    stage_center_x = width // 2
    stage_center_y = int(height * 0.58)

    # Large LED backdrop with dynamic live graphics
    led_w, led_h = 700, 320
    led_x1 = stage_center_x - led_w // 2
    led_y1 = stage_center_y - led_h // 2 - 40
    
    # Animated generative visual on the stage screen
    grid_img = np.zeros((led_h, led_w, 3), dtype=np.uint8)
    for row in range(0, led_h, 24):
        wave_shift = int(30 * math.sin(row * 0.05 + t_rad * 3))
        col_val = int(140 + 100 * math.sin(t_rad + row * 0.02))
        cv2.line(grid_img, (0, row), (led_w, row), (int(col_val * 0.3), int(col_val * 0.6), col_val), 2)
    # Circular emblem on stage screen
    pulse_r = int(70 + 25 * math.sin(t_rad * 4))
    cv2.circle(grid_img, (led_w // 2, led_h // 2), pulse_r, (40, 90, 255), 4)
    cv2.circle(grid_img, (led_w // 2, led_h // 2), pulse_r // 2, (255, 180, 50), -1)

    # Overlay screen onto frame with dark glass borders
    frame[led_y1:led_y1+led_h, led_x1:led_x1+led_w] = cv2.addWeighted(
        frame[led_y1:led_y1+led_h, led_x1:led_x1+led_w], 0.3, grid_img, 0.7, 0
    )
    cv2.rectangle(frame, (led_x1, led_y1), (led_x1 + led_w, led_y1 + led_h), (80, 80, 90), 3)

    # 4. Volumetric Spotlights & Light Beams Layer
    light_layer = np.zeros((height, width, 3), dtype=np.float32)

    for i, spot in enumerate(spotlights):
        # Sweeping angle
        sweep_offset = math.sin(t_rad * 2 + spot['phase']) * 280
        target_x = spot['base_tx'] + sweep_offset
        target_y = height - 60

        # Create cone polygon
        cone_pts = np.array([
            [spot['ox'] - 8, spot['oy']],
            [spot['ox'] + 8, spot['oy']],
            [target_x + 90, target_y],
            [target_x - 90, target_y]
        ], np.int32)

        cv2.fillPoly(light_layer, [cone_pts], spot['color'])

    # Blur volumetric beams for authentic atmospheric haze
    light_layer = cv2.GaussianBlur(light_layer, (65, 65), 0)

    # 5. Laser Fan Array (Sharp laser lines cutting through haze)
    laser_layer = np.zeros((height, width, 3), dtype=np.uint8)
    num_lasers = 14
    for l_i in range(num_lasers):
        l_angle = (l_i / (num_lasers - 1) - 0.5) * 1.8 + math.sin(t_rad * 3) * 0.25
        end_x = int(stage_center_x + math.sin(l_angle) * 900)
        end_y = int(stage_center_y - math.cos(l_angle) * 700)
        # Intense laser colors (cyan, lime, neon orange)
        l_color = (255, 120, 30) if l_i % 2 == 0 else (50, 240, 255)
        cv2.line(laser_layer, (stage_center_x, stage_center_y), (end_x, end_y), l_color, 2)
        # Laser core glow
        cv2.line(laser_layer, (stage_center_x, stage_center_y), (end_x, end_y), (255, 255, 255), 1)

    # Blur lasers slightly for glow
    laser_glow = cv2.GaussianBlur(laser_layer, (15, 15), 0)
    laser_combined = cv2.add(laser_layer, laser_glow)

    # 6. Central Anamorphic Stage Lens Flare & Corona
    flare_layer = np.zeros((height, width, 3), dtype=np.float32)
    flare_intensity = 0.7 + 0.3 * math.sin(t_rad * 6)
    
    # Anamorphic horizontal streak
    streak_len = int(500 * flare_intensity)
    cv2.line(flare_layer, (stage_center_x - streak_len, stage_center_y),
             (stage_center_x + streak_len, stage_center_y), (255, 180, 100), 4)
    cv2.line(flare_layer, (stage_center_x - streak_len // 2, stage_center_y),
             (stage_center_x + streak_len // 2, stage_center_y), (255, 255, 255), 2)

    # Center corona blast
    cv2.circle(flare_layer, (stage_center_x, stage_center_y), int(60 * flare_intensity), (255, 200, 150), -1)
    cv2.circle(flare_layer, (stage_center_x, stage_center_y), int(25 * flare_intensity), (255, 255, 255), -1)
    flare_blurred = cv2.GaussianBlur(flare_layer, (51, 51), 0)

    # Blend Lights, Lasers, Flares with Stage Frame
    frame_float = frame.astype(np.float32)
    frame_float = cv2.add(frame_float, light_layer * 0.45)
    frame_float = cv2.add(frame_float, laser_combined.astype(np.float32) * 0.8)
    frame_float = cv2.add(frame_float, flare_blurred * 0.85)
    frame = np.clip(frame_float, 0, 255).astype(np.uint8)

    # 7. Drifting Golden Confetti & Stage Pyro Sparks
    for s in sparks:
        s_phase = (s['y'] + f * s['vy'] * 3) % (height - 160) + 120
        s_x = (s['x'] + math.sin(t_rad * 2 + s['flicker']) * 30) % width
        s_alpha = 0.5 + 0.5 * math.sin(f * 0.4 + s['flicker'])
        s_color = tuple([int(c * s_alpha) for c in s['color']])
        cv2.circle(frame, (int(s_x), int(s_phase)), s['size'], s_color, -1)

    # 8. Dynamic Foreground Crowd Silhouettes with Bouncing/Waving
    crowd_mask = np.zeros((height, width), dtype=np.uint8)
    for p in crowd_elements:
        bounce = math.sin(t_rad * p['bounce_freq'] + p['bounce_phase']) * 8
        head_x = int(p['cx'])
        head_y = int(p['cy'] + bounce)
        
        # Head
        cv2.circle(crowd_mask, (head_x, head_y), int(p['r']), 255, -1)
        # Shoulders & Body
        cv2.ellipse(crowd_mask, (head_x, head_y + int(p['r'] * 1.6)),
                    (int(p['r'] * 1.9), int(p['r'] * 2.2)), 0, 0, 360, 255, -1)

        # Raised Arm / Cheering
        if p['has_arm']:
            arm_reach = int(p['r'] * 2.5)
            arm_end_x = int(head_x + math.sin(p['arm_angle']) * arm_reach)
            arm_end_y = int(head_y - math.cos(p['arm_angle']) * arm_reach)
            cv2.line(crowd_mask, (head_x + int(p['r'] * 0.7), head_y + int(p['r'] * 0.8)),
                     (arm_end_x, arm_end_y), 255, int(p['r'] * 0.45))
            # Hand
            cv2.circle(crowd_mask, (arm_end_x, arm_end_y), int(p['r'] * 0.35), 255, -1)
            
            # Glowing phone screen in crowd
            if p['has_phone']:
                cv2.rectangle(frame, (arm_end_x - 4, arm_end_y - 7),
                              (arm_end_x + 4, arm_end_y + 1), (255, 240, 200), -1)

    # Crowd silhouette color: near-black silhouette with edge backlight
    crowd_silhouette = np.zeros_like(frame)
    crowd_silhouette[:] = (12, 10, 10)
    
    # Backlit rim highlight on crowd top
    crowd_rim = cv2.Canny(crowd_mask, 100, 200)
    crowd_rim_glow = cv2.GaussianBlur(crowd_rim, (7, 7), 0)
    
    # Apply crowd over frame
    mask_indices = crowd_mask > 0
    frame[mask_indices] = crowd_silhouette[mask_indices]
    rim_indices = crowd_rim_glow > 50
    frame[rim_indices] = (255, 140, 60) # Amber edge rim from stage lights

    # 9. Subtle Showreel Overlay HUD / Branding Watermark
    # Top-right showreel indicator
    cv2.circle(frame, (width - 160, 45), 5, (54, 90, 255), -1) # Red record dot
    cv2.putText(frame, "LIVE SHOWREEL // 4K", (width - 145, 50),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, (220, 220, 220), 1, cv2.LINE_AA)

    # Frame counter / timecode
    tc_frame = f % 24
    tc_sec = int(f / 24)
    cv2.putText(frame, f"00:0{tc_sec}:{tc_frame:02d}", (width - 145, 70),
                cv2.FONT_HERSHEY_SIMPLEX, 0.4, (140, 140, 140), 1, cv2.LINE_AA)

    # Save peak frame for poster
    if f == int(total_frames * 0.45):
        peak_frame = frame.copy()

    # Write frame to video files
    if out_mp4.isOpened():
        out_mp4.write(frame)
    if out_webm.isOpened():
        out_webm.write(frame)

if out_mp4.isOpened():
    out_mp4.release()
    print("Exported: assets/videos/hero.mp4")

if out_webm.isOpened():
    out_webm.release()
    print("Exported: assets/videos/hero.webm")
else:
    # Duplicate MP4 stream to WebM if codec missing
    with open('assets/videos/hero.mp4', 'rb') as s, open('assets/videos/hero.webm', 'wb') as d:
        d.write(s.read())
    print("Exported: assets/videos/hero.webm (fallback)")

# Save high-res poster JPEG
if peak_frame is not None:
    cv2.imwrite('assets/videos/hero-poster.jpg', peak_frame)
    cv2.imwrite('assets/images/hero/hero-poster.jpg', peak_frame)
    print("Exported: assets/videos/hero-poster.jpg and assets/images/hero/hero-poster.jpg")

print("Showreel generation complete!")
