from __future__ import annotations

import json
import math
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "static" / "avatars"
OUT.mkdir(parents=True, exist_ok=True)

AVATAR_COUNT_PER_GENDER = 50

SKIN_TONES = ["#F7D7C4", "#F2C6A0", "#E7B98A", "#D99A6C", "#C9825D", "#9F6548"]
HAIR_COLORS = ["#191919", "#2D211B", "#4A3025", "#6B4634", "#8A5A3B", "#B57A4B", "#D8B36A"]
BG_COLORS = ["#EAF4FF", "#F2F7FF", "#EDF8F4", "#FFF4EC", "#F5F0FF", "#FFF0F5", "#EEF2F7", "#F2FBFA"]
SHIRT_COLORS = ["#3A7BD5", "#2F6BFF", "#5A67D8", "#3B82F6", "#0F766E", "#2563EB", "#7C3AED", "#475569", "#DB2777", "#DC2626"]
EYE_COLORS = ["#1E293B", "#3F2D20", "#2F3B2F", "#4A3428"]


def esc(value: str) -> str:
    return value.replace("&", "&amp;").replace("<", "&lt;").replace('"', "&quot;")


def avatar_svg(gender: str, index: int) -> str:
    rng = random.Random(f"relationship-avatar-{gender}-{index}")
    skin = rng.choice(SKIN_TONES)
    hair = rng.choice(HAIR_COLORS)
    bg = rng.choice(BG_COLORS)
    shirt = rng.choice(SHIRT_COLORS)
    eye = rng.choice(EYE_COLORS)
    border = "#3B82F6" if gender == "male" else "#EF476F"
    face_w = rng.randint(86, 98)
    face_h = rng.randint(102, 114)
    face_x = 128 - face_w / 2
    face_y = rng.randint(62, 69)
    eye_y = face_y + rng.randint(44, 50)
    eye_gap = rng.randint(26, 32)
    eye_r = rng.choice([4, 4.5, 5])
    brow_tilt = rng.randint(-3, 3)
    nose_len = rng.randint(9, 15)
    smile = rng.choice([-1, 0, 1, 2])
    glasses = rng.random() < 0.24
    freckles = rng.random() < 0.14
    beard = gender == "male" and rng.random() < 0.24
    earrings = gender == "female" and rng.random() < 0.32

    parts: list[str] = []
    parts.append(f'<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256" role="img" aria-label="{esc(gender)} avatar {index}">')
    parts.append(f'<circle cx="128" cy="128" r="122" fill="{bg}"/>')
    parts.append('<circle cx="128" cy="128" r="118" fill="none" stroke="#FFFFFF" stroke-width="5" opacity="0.9"/>')
    parts.append(f'<path d="M42 250c7-49 37-75 86-75s79 26 86 75" fill="{shirt}"/>')
    parts.append(f'<rect x="111" y="157" width="34" height="35" rx="14" fill="{skin}"/>')

    if gender == "female":
        hair_style = index % 5
        if hair_style == 0:
            parts.append(f'<path d="M75 91c2-41 25-62 55-62 35 0 58 24 58 70l-5 82c-18 8-33 9-55 9-25 0-42-3-57-12z" fill="{hair}"/>')
        elif hair_style == 1:
            parts.append(f'<path d="M72 102c0-51 24-75 58-75 37 0 59 28 59 80l-12 82h-28l-4-58H93l-4 58H63z" fill="{hair}"/>')
        elif hair_style == 2:
            parts.append(f'<circle cx="174" cy="57" r="27" fill="{hair}"/>')
            parts.append(f'<path d="M75 103c-1-49 21-74 56-74 39 0 59 31 57 83l-10 64c-14 9-31 13-51 13-21 0-39-5-54-15z" fill="{hair}"/>')
        elif hair_style == 3:
            parts.append(f'<path d="M68 109c0-54 27-81 62-81 38 0 61 31 60 84l-8 69-23 7-7-62H97l-6 62-24-9z" fill="{hair}"/>')
            parts.append(f'<path d="M91 60c23-28 60-27 84 7-25-13-53-12-84-7z" fill="#FFFFFF" opacity="0.12"/>')
        else:
            parts.append(f'<path d="M72 111c-1-54 22-82 58-82 39 0 61 32 58 84l-3 62c-15 9-35 14-55 14-23 0-42-5-58-15z" fill="{hair}"/>')
            parts.append(f'<path d="M90 51c17-16 47-23 72-7-21 2-43 14-55 31z" fill="#FFFFFF" opacity="0.1"/>')
    else:
        hair_style = index % 5
        if hair_style == 0:
            parts.append(f'<path d="M79 92c4-39 25-61 53-61 31 0 52 22 56 59-18-10-39-15-62-14-17 0-32 6-47 16z" fill="{hair}"/>')
        elif hair_style == 1:
            parts.append(f'<path d="M78 91c8-42 30-62 59-59 26 2 45 22 50 55-25-17-46-20-66-12-16 6-28 12-43 16z" fill="{hair}"/>')
        elif hair_style == 2:
            parts.append(f'<path d="M78 94c2-43 24-65 55-65 33 0 54 23 55 64-22-12-41-14-57-11-19 4-34 7-53 12z" fill="{hair}"/>')
            parts.append(f'<path d="M97 43l4-18 12 12 9-20 11 20 15-13 1 22z" fill="{hair}"/>')
        elif hair_style == 3:
            parts.append(f'<path d="M77 93c4-42 27-64 57-64 34 0 54 25 54 65-13-13-32-19-57-18-23 1-40 7-54 17z" fill="{hair}"/>')
            parts.append(f'<path d="M91 51c27-22 57-19 79 4-26-10-48-8-79-4z" fill="#FFFFFF" opacity="0.12"/>')
        else:
            parts.append(f'<path d="M81 88c7-38 27-57 53-57 30 0 49 19 54 54-20-8-41-10-62-6-18 3-31 5-45 9z" fill="{hair}"/>')

    # ears behind face
    parts.append(f'<ellipse cx="{face_x + 2:.1f}" cy="{face_y + 61:.1f}" rx="10" ry="16" fill="{skin}"/>')
    parts.append(f'<ellipse cx="{face_x + face_w - 2:.1f}" cy="{face_y + 61:.1f}" rx="10" ry="16" fill="{skin}"/>')
    parts.append(f'<rect x="{face_x:.1f}" y="{face_y:.1f}" width="{face_w}" height="{face_h}" rx="{face_w/2:.1f}" fill="{skin}"/>')

    # fringe
    if gender == "female":
        fringe = index % 4
        if fringe == 0:
            parts.append(f'<path d="M83 79c15-31 41-42 72-30 11 4 22 13 30 25-32-15-59-10-76 9z" fill="{hair}"/>')
        elif fringe == 1:
            parts.append(f'<path d="M79 84c17-38 46-51 75-36 11 6 20 14 27 25-31-11-49-4-69 16z" fill="{hair}"/>')
        elif fringe == 2:
            parts.append(f'<path d="M82 80c17-33 42-45 70-35 11 4 22 13 31 27-28-10-52-5-72 13z" fill="{hair}"/>')
            parts.append(f'<path d="M128 46c-2 16-8 29-21 40" fill="none" stroke="#FFFFFF" stroke-width="3" opacity="0.15"/>')
        else:
            parts.append(f'<path d="M83 79c20-33 48-43 76-28 9 5 17 12 23 22-20-6-39-7-57 1-15 6-27 12-42 5z" fill="{hair}"/>')
    else:
        parts.append(f'<path d="M82 80c14-26 36-38 61-34 17 3 31 13 41 29-30-11-59-8-102 5z" fill="{hair}"/>')

    # eyebrows
    lx = 128 - eye_gap
    rx = 128 + eye_gap
    parts.append(f'<path d="M{lx-10} {eye_y-15-brow_tilt} Q{lx} {eye_y-20} {lx+10} {eye_y-15+brow_tilt}" fill="none" stroke="{hair}" stroke-width="5" stroke-linecap="round"/>')
    parts.append(f'<path d="M{rx-10} {eye_y-15+brow_tilt} Q{rx} {eye_y-20} {rx+10} {eye_y-15-brow_tilt}" fill="none" stroke="{hair}" stroke-width="5" stroke-linecap="round"/>')

    # eyes
    parts.append(f'<circle cx="{lx}" cy="{eye_y}" r="{eye_r}" fill="{eye}"/>')
    parts.append(f'<circle cx="{rx}" cy="{eye_y}" r="{eye_r}" fill="{eye}"/>')
    parts.append(f'<circle cx="{lx-1.4}" cy="{eye_y-1.5}" r="1.2" fill="#FFFFFF"/>')
    parts.append(f'<circle cx="{rx-1.4}" cy="{eye_y-1.5}" r="1.2" fill="#FFFFFF"/>')

    if glasses:
        parts.append(f'<circle cx="{lx}" cy="{eye_y}" r="15" fill="none" stroke="#334155" stroke-width="3"/>')
        parts.append(f'<circle cx="{rx}" cy="{eye_y}" r="15" fill="none" stroke="#334155" stroke-width="3"/>')
        parts.append(f'<path d="M{lx+15} {eye_y}h{eye_gap*2-30}" stroke="#334155" stroke-width="3"/>')

    # nose
    parts.append(f'<path d="M128 {eye_y+6}q{-2 if index % 2 else 2} {nose_len} 3 {nose_len+3}" fill="none" stroke="#A86F58" stroke-width="3" stroke-linecap="round" opacity="0.75"/>')

    # mouth
    mouth_y = eye_y + 39
    if smile > 0:
        parts.append(f'<path d="M111 {mouth_y} Q128 {mouth_y+8+smile*2} 145 {mouth_y}" fill="none" stroke="#A64B55" stroke-width="4" stroke-linecap="round"/>')
    elif smile == 0:
        parts.append(f'<path d="M115 {mouth_y+3}h26" fill="none" stroke="#A64B55" stroke-width="4" stroke-linecap="round"/>')
    else:
        parts.append(f'<path d="M112 {mouth_y+7} Q128 {mouth_y-1} 144 {mouth_y+7}" fill="none" stroke="#A64B55" stroke-width="4" stroke-linecap="round"/>')

    if freckles:
        for dx in (-25, -18, 18, 25):
            parts.append(f'<circle cx="{128+dx}" cy="{eye_y+18 + (abs(dx)%3)}" r="1.4" fill="#B7795D" opacity="0.65"/>')

    if beard:
        parts.append(f'<path d="M91 {face_y+79:.1f}c7 29 23 43 37 43s31-14 38-43c-6 39-19 58-38 58s-32-19-37-58z" fill="{hair}" opacity="0.28"/>')
        if index % 2 == 0:
            parts.append(f'<path d="M113 {mouth_y-8}q15-7 30 0" fill="none" stroke="{hair}" stroke-width="5" stroke-linecap="round" opacity="0.5"/>')

    if earrings:
        parts.append('<circle cx="80" cy="132" r="4" fill="#F4C95D"/>')
        parts.append('<circle cx="176" cy="132" r="4" fill="#F4C95D"/>')

    # subtle cheeks
    parts.append(f'<ellipse cx="96" cy="{eye_y+24}" rx="10" ry="5" fill="#F08A8A" opacity="0.18"/>')
    parts.append(f'<ellipse cx="160" cy="{eye_y+24}" rx="10" ry="5" fill="#F08A8A" opacity="0.18"/>')
    parts.append(f'<circle cx="128" cy="128" r="122" fill="none" stroke="{border}" stroke-width="8"/>')
    parts.append('</svg>')
    return "".join(parts)


def main() -> None:
    manifest: list[dict[str, str | int]] = []
    for gender in ("male", "female"):
        for index in range(1, AVATAR_COUNT_PER_GENDER + 1):
            filename = f"{gender}_{index:02d}.svg"
            (OUT / filename).write_text(avatar_svg(gender, index), encoding="utf-8")
            manifest.append({
                "id": f"{gender}_{index:02d}",
                "gender": gender,
                "url": f"/static/avatars/{filename}",
                "index": index,
            })
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Generated {len(manifest)} avatars in {OUT}")


if __name__ == "__main__":
    main()
