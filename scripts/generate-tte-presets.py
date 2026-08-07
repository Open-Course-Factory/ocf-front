#!/usr/bin/env python3
"""Regenerate the canned TTE effect presets in src/assets/tte/.

Renders terminaltexteffects animations offline and stores them as asciicast v2
(.cast) files — the format the in-terminal replayer consumes (see
src/utils/asciicast.ts). Frames are paced at PLAYBACK_FPS with synthetic
timestamps because TTE only paces in real time while rendering to a TTY.

Usage (uv provides the tte library, no venv needed):

    uvx --from terminaltexteffects python3 scripts/generate-tte-presets.py

Conventions (campaign-wide): 80x24 canvas, <= ~3 s, small enough to ship as
lazy-loaded bundle chunks. Preset text is bilingual-neutral because a canned
asset cannot know the viewer's locale.
"""

import json
import math
import sys
from pathlib import Path

from terminaltexteffects.effects.effect_burn import Burn
from terminaltexteffects.effects.effect_decrypt import Decrypt
from terminaltexteffects.effects.effect_fireworks import Fireworks
from terminaltexteffects.effects.effect_rings import Rings
from terminaltexteffects.effects.effect_slide import Slide
from terminaltexteffects.effects.effect_unstable import Unstable

WIDTH, HEIGHT = 80, 24
PLAYBACK_FPS = 30
MAX_FRAMES = 90  # ~3 s at PLAYBACK_FPS; longer renders are downsampled

# Full-canvas effects (matrix, beams, rain...) weigh megabytes per recording
# because every frame repaints every cell with an SGR sequence — stick to
# text-local effects so each preset stays a small lazy-loaded chunk.
PRESETS = {
    "intro-decrypt": (Decrypt, "ACCÈS AUTORISÉ · ACCESS GRANTED"),
    "intro-slide": (Slide, "NIVEAU SUIVANT · NEXT LEVEL"),
    "intro-unstable": (Unstable, "PRÊT ? GO ! · READY ? GO !"),
    "outro-fireworks": (Fireworks, "BRAVO !"),
    "outro-burn": (Burn, "ÉTAPE VALIDÉE · STEP CLEARED"),
    "outro-rings": (Rings, "O C F"),
}


def render(effect_cls, text: str) -> list[str]:
    effect = effect_cls(text)
    tc = effect.terminal_config
    tc.canvas_width = WIDTH
    tc.canvas_height = HEIGHT
    tc.anchor_canvas = "c"
    tc.anchor_text = "c"
    tc.ignore_terminal_dimensions = True
    return list(effect)


def to_cast(frames: list[str]) -> str:
    step = max(1, math.ceil(len(frames) / MAX_FRAMES))
    kept = frames[::step]
    dt = 1.0 / PLAYBACK_FPS
    lines = [json.dumps({"version": 2, "width": WIDTH, "height": HEIGHT})]
    lines.append(json.dumps([0.0, "o", "\x1b[?25l\x1b[2J\x1b[H"]))
    for i, frame in enumerate(kept):
        data = "\x1b[H" + frame.replace("\n", "\r\n")
        lines.append(json.dumps([round((i + 1) * dt, 4), "o", data]))
    lines.append(json.dumps([round((len(kept) + 1) * dt, 4), "o", "\x1b[?25h"]))
    return "\n".join(lines) + "\n"


def main() -> int:
    out_dir = Path(__file__).resolve().parent.parent / "src" / "assets" / "tte"
    out_dir.mkdir(parents=True, exist_ok=True)
    for name, (effect_cls, text) in PRESETS.items():
        cast = to_cast(render(effect_cls, text))
        path = out_dir / f"{name}.cast"
        path.write_text(cast, encoding="utf-8")
        print(f"{path.name}: {len(cast) // 1024} KiB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
