import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import matplotlib.patheffects as pe

# ── Canvas ─────────────────────────────────────────────────────────────────────
W, H = 36, 24
fig, ax = plt.subplots(figsize=(W, H))
ax.set_xlim(0, W)
ax.set_ylim(0, H)
ax.axis("off")
fig.patch.set_facecolor("#0d1117")

# ── Palette ────────────────────────────────────────────────────────────────────
BG      = "#0d1117"
BLUE    = "#3b82f6"
CYAN    = "#22d3ee"
GREEN   = "#10b981"
AMBER   = "#f59e0b"
RED     = "#ef4444"
PURPLE  = "#a855f7"
INDIGO  = "#6366f1"
ROSE    = "#f43f5e"
TEAL    = "#14b8a6"
SLATE   = "#334155"
TEXT1   = "#f1f5f9"
TEXT2   = "#94a3b8"
TEXT3   = "#475569"
CARD    = "#161b27"
CARD2   = "#0f172a"

# ── Drawing helpers ────────────────────────────────────────────────────────────
def node(ax, x, y, w, h, title, subtitle="", desc="",
         color=BLUE, bg=CARD, title_size=13, sub_size=10, desc_size=9,
         radius=0.4):
    """Rounded rectangle node with coloured header stripe."""
    bx, by = x - w/2, y - h/2
    # shadow
    ax.add_patch(FancyBboxPatch((bx+0.08, by-0.08), w, h,
                 boxstyle=f"round,pad={radius*0.2}",
                 facecolor="#000000", edgecolor="none",
                 alpha=0.35, zorder=2))
    # main body
    ax.add_patch(FancyBboxPatch((bx, by), w, h,
                 boxstyle=f"round,pad={radius*0.2}",
                 facecolor=bg, edgecolor=color,
                 linewidth=2.0, zorder=3))
    # top colour bar
    bar_h = 0.36
    ax.add_patch(FancyBboxPatch((bx, y + h/2 - bar_h), w, bar_h,
                 boxstyle="round,pad=0.0",
                 facecolor=color, edgecolor="none",
                 alpha=0.88, zorder=4))
    # title
    ax.text(x, y + h/2 - bar_h/2, title, ha="center", va="center",
            fontsize=title_size, color=TEXT1, fontweight="bold",
            fontfamily="DejaVu Sans Mono", zorder=5)
    # subtitle
    if subtitle:
        ay = y + (0.18 if desc else 0)
        ax.text(x, ay, subtitle, ha="center", va="center",
                fontsize=sub_size, color=TEXT2,
                fontfamily="DejaVu Sans Mono", zorder=5)
    # description
    if desc:
        ax.text(x, y - 0.38, desc, ha="center", va="center",
                fontsize=desc_size, color=TEXT3,
                fontfamily="DejaVu Sans Mono", zorder=5,
                style="italic")

def person(ax, x, y, label, sublabel="", color=CYAN):
    """Stick-person actor."""
    # head
    head = plt.Circle((x, y+1.22), 0.38, color=color, fill=True, zorder=4, alpha=0.9)
    ax.add_patch(head)
    # body
    ax.plot([x, x],   [y+0.84, y+0.10], color=color, lw=2.5, zorder=4)
    # arms
    ax.plot([x-0.55, x+0.55], [y+0.62, y+0.62], color=color, lw=2.5, zorder=4)
    # legs
    ax.plot([x, x-0.45], [y+0.10, y-0.38], color=color, lw=2.5, zorder=4)
    ax.plot([x, x+0.45], [y+0.10, y-0.38], color=color, lw=2.5, zorder=4)
    # label
    ax.text(x, y-0.72, label, ha="center", va="top",
            fontsize=12, color=color, fontweight="bold",
            fontfamily="DejaVu Sans Mono", zorder=5)
    if sublabel:
        ax.text(x, y-1.18, sublabel, ha="center", va="top",
                fontsize=9, color=TEXT3,
                fontfamily="DejaVu Sans Mono", zorder=5, style="italic")

def ext(ax, x, y, w, h, title, subtitle="", desc="", color=SLATE):
    """External system box (dashed border)."""
    bx, by = x - w/2, y - h/2
    ax.add_patch(FancyBboxPatch((bx+0.07, by-0.07), w, h,
                 boxstyle="round,pad=0.08",
                 facecolor="#000000", edgecolor="none",
                 alpha=0.3, zorder=2))
    ax.add_patch(FancyBboxPatch((bx, by), w, h,
                 boxstyle="round,pad=0.08",
                 facecolor="#111827", edgecolor=color,
                 linewidth=1.6, linestyle="--", zorder=3))
    bar_h = 0.34
    ax.add_patch(FancyBboxPatch((bx, y + h/2 - bar_h), w, bar_h,
                 boxstyle="round,pad=0.0",
                 facecolor=color, edgecolor="none", alpha=0.7, zorder=4))
    ax.text(x, y + h/2 - bar_h/2, title, ha="center", va="center",
            fontsize=11.5, color=TEXT1, fontweight="bold",
            fontfamily="DejaVu Sans Mono", zorder=5)
    if subtitle:
        ay = y + (0.14 if desc else 0)
        ax.text(x, ay, subtitle, ha="center", va="center",
                fontsize=9.5, color=TEXT2,
                fontfamily="DejaVu Sans Mono", zorder=5)
    if desc:
        ax.text(x, y-0.36, desc, ha="center", va="center",
                fontsize=8.5, color=TEXT3,
                fontfamily="DejaVu Sans Mono", zorder=5, style="italic")
    # «external system» tag
    ax.text(x, y + h/2 - bar_h - 0.01, "«external»", ha="center", va="bottom",
            fontsize=7.5, color=color, fontfamily="DejaVu Sans Mono",
            alpha=0.7, zorder=5)

def db(ax, x, y, w, h, title, subtitle="", color=PURPLE):
    """Cylinder-style database node."""
    ry = h * 0.12   # ellipse y-radius
    bx, by = x - w/2, y - h/2
    body_h = h - ry
    # body rect
    ax.add_patch(FancyBboxPatch((bx, by), w, body_h,
                 boxstyle="round,pad=0.06",
                 facecolor="#111827", edgecolor=color,
                 linewidth=1.8, zorder=3))
    # top ellipse
    top_e = mpatches.Ellipse((x, by + body_h), w, ry*2,
                              facecolor=color, edgecolor=color,
                              alpha=0.75, linewidth=1.8, zorder=4)
    ax.add_patch(top_e)
    # bottom ellipse
    bot_e = mpatches.Ellipse((x, by), w, ry*2,
                              facecolor="#1a1f2e", edgecolor=color,
                              alpha=0.6, linewidth=1.2, zorder=4)
    ax.add_patch(bot_e)
    ax.text(x, y - ry*0.3, title, ha="center", va="center",
            fontsize=11, color=TEXT1, fontweight="bold",
            fontfamily="DejaVu Sans Mono", zorder=5)
    if subtitle:
        ax.text(x, y - ry*0.3 - 0.45, subtitle, ha="center", va="center",
                fontsize=8.5, color=TEXT2,
                fontfamily="DejaVu Sans Mono", zorder=5)

def arrow(ax, x1, y1, x2, y2, label="", color=SLATE,
          label_color=None, lw=1.8, style="->", offset=(0,0)):
    """Annotated arrow between nodes."""
    ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(
                    arrowstyle=style,
                    color=color, lw=lw,
                    mutation_scale=16,
                    connectionstyle="arc3,rad=0.0"),
                zorder=6)
    if label:
        mx = (x1+x2)/2 + offset[0]
        my = (y1+y2)/2 + offset[1]
        lc = label_color or color
        bg_patch = FancyBboxPatch((mx-0.01, my-0.18), 0.02, 0.02,
                    boxstyle="round,pad=0.18",
                    facecolor=BG, edgecolor="none", alpha=0.82, zorder=7)
        ax.add_patch(bg_patch)
        ax.text(mx, my, label, ha="center", va="center",
                fontsize=8.5, color=lc,
                fontfamily="DejaVu Sans Mono", zorder=8,
                bbox=dict(facecolor=BG, edgecolor="none",
                          boxstyle="round,pad=0.18", alpha=0.85))

import matplotlib.patches as mpatches

# ══════════════════════════════════════════════════════════════════════════════
# BACKGROUND ZONES
# ══════════════════════════════════════════════════════════════════════════════

# System boundary box
sys_box = FancyBboxPatch((6.8, 4.2), 22.4, 15.2,
                         boxstyle="round,pad=0.2",
                         facecolor="#0a0f1e", edgecolor=INDIGO,
                         linewidth=1.4, linestyle="-", zorder=1, alpha=0.7)
ax.add_patch(sys_box)
ax.text(18.0, 19.55, "Contract Lens Platform",
        ha="center", va="center", fontsize=14, color=INDIGO,
        fontweight="bold", fontfamily="DejaVu Sans Mono", zorder=2)
ax.text(18.0, 19.1, "«system boundary»",
        ha="center", va="center", fontsize=9, color=TEXT3,
        fontfamily="DejaVu Sans Mono", zorder=2, style="italic")

# ══════════════════════════════════════════════════════════════════════════════
# TITLE
# ══════════════════════════════════════════════════════════════════════════════
ax.text(W/2, 23.35, "Contract Lens  —  System Context Diagram",
        ha="center", fontsize=20, color=TEXT1, fontweight="bold",
        fontfamily="DejaVu Sans Mono")
ax.text(W/2, 22.75, "C4 Level 1  ·  Architecture Overview",
        ha="center", fontsize=11, color=TEXT3, fontfamily="DejaVu Sans Mono")
ax.plot([1.5, W-1.5], [22.45, 22.45], color="#1e293b", lw=0.9)

# ══════════════════════════════════════════════════════════════════════════════
# ACTOR
# ══════════════════════════════════════════════════════════════════════════════
person(ax, 3.0, 11.2, "Legal Team", "Lawyers · Managers\nContract Reviewers", color=CYAN)

# ══════════════════════════════════════════════════════════════════════════════
# FRONTEND
# ══════════════════════════════════════════════════════════════════════════════
node(ax, 11.2, 15.5, 7.2, 4.8,
     "Next.js Frontend",
     subtitle="React 19  ·  Next.js 16  ·  TypeScript",
     desc="Dashboard · Contracts · Upload · Ask AI\nRisks · Obligations · Alerts · Profile",
     color=CYAN, bg="#061820",
     title_size=13, sub_size=9.5, desc_size=8.5)

node(ax, 11.2, 9.2, 7.2, 4.0,
     "Auth Layer",
     subtitle="JWT Tokens  ·  httpOnly cookies\nEmail verification · Rate limiting",
     color=INDIGO, bg="#0d0f1f",
     title_size=12, sub_size=9)

# ══════════════════════════════════════════════════════════════════════════════
# BACKEND
# ══════════════════════════════════════════════════════════════════════════════
node(ax, 20.2, 15.5, 7.2, 4.8,
     "FastAPI Backend",
     subtitle="Python  ·  REST API  ·  /api/v1",
     desc="Upload · Contracts · Auth · Users\nInsights · Dashboard · Alerts",
     color=BLUE, bg="#0a1020",
     title_size=13, sub_size=9.5, desc_size=8.5)

node(ax, 20.2, 9.2, 7.2, 4.0,
     "AI Pipeline",
     subtitle="Background tasks  ·  async\nOCR · Parse · Embed · Analyse",
     color=PURPLE, bg="#100a1f",
     title_size=12, sub_size=9)

# ══════════════════════════════════════════════════════════════════════════════
# DATA STORES  (bottom centre)
# ══════════════════════════════════════════════════════════════════════════════
db(ax, 11.8, 5.0, 4.0, 2.0,
   "PostgreSQL",
   subtitle="Users · Contracts\nClauses · Risks · Alerts",
   color=BLUE)

db(ax, 18.4, 5.0, 4.0, 2.0,
   "Qdrant",
   subtitle="Vector embeddings\n1536-dim semantic index",
   color=PURPLE)

ext(ax, 24.8, 5.0, 3.8, 2.0,
    "File System",
    subtitle="uploads/\nUUID filenames",
    desc="PDF · DOCX · JPG · PNG",
    color=SLATE)

# ══════════════════════════════════════════════════════════════════════════════
# EXTERNAL SERVICES  (right column)
# ══════════════════════════════════════════════════════════════════════════════
ext(ax, 30.8, 18.5, 4.4, 3.2,
    "OpenAI API",
    subtitle="gpt-4o-mini\ntext-embedding-3-small",
    desc="Summary · Risks · Obligations\nMetadata · Q&A · Embeddings",
    color=GREEN)

ext(ax, 30.8, 13.2, 4.4, 2.8,
    "SMTP Server",
    subtitle="Port 587  ·  STARTTLS",
    desc="Email verification codes\n6-digit OTP · 10-min expiry",
    color=AMBER)

ext(ax, 30.8, 8.3, 4.4, 2.8,
    "Tesseract OCR",
    subtitle="Local binary  ·  pytesseract",
    desc="Scanned PDFs & images\npage-by-page extraction",
    color=ROSE)

# ══════════════════════════════════════════════════════════════════════════════
# ARROWS
# ══════════════════════════════════════════════════════════════════════════════

# User ↔ Frontend
arrow(ax, 4.5, 13.2, 7.6, 15.2,
      "HTTPS  /  Browser", color=CYAN, label_color=CYAN, offset=(0.3, 0.2))
arrow(ax, 7.6, 14.8, 4.5, 12.8,
      "Pages  /  Data", color=CYAN, label_color=TEXT2, offset=(-0.3, -0.2))

# User ↔ Auth
arrow(ax, 4.5, 10.6, 7.6, 9.8,
      "Login  /  Register", color=INDIGO, label_color=INDIGO, offset=(0.3, 0.2))

# Frontend ↔ Backend
arrow(ax, 14.8, 15.5, 16.6, 15.5,
      "REST /api/v1", color=BLUE, label_color=BLUE, offset=(0, 0.22))
arrow(ax, 16.6, 15.0, 14.8, 15.0,
      "JSON responses", color=TEXT3, label_color=TEXT3, offset=(0, -0.22))

# Auth ↔ Backend
arrow(ax, 14.8, 9.2, 16.6, 9.2,
      "Token validation", color=INDIGO, label_color=INDIGO, offset=(0, 0.22))

# Frontend ↔ Auth  (internal)
arrow(ax, 11.2, 13.1, 11.2, 11.2,
      "", color=INDIGO)
arrow(ax, 11.5, 11.2, 11.5, 13.1,
      "", color=INDIGO)

# Backend ↔ AI Pipeline  (internal)
arrow(ax, 20.2, 13.1, 20.2, 11.2,
      "", color=PURPLE)
arrow(ax, 20.5, 11.2, 20.5, 13.1,
      "", color=PURPLE)

# Backend → PostgreSQL
arrow(ax, 17.8, 13.1, 13.4, 6.5,
      "SQLAlchemy ORM", color=BLUE, label_color=BLUE, offset=(-1.0, 0.3))

# AI Pipeline → Qdrant
arrow(ax, 20.2, 7.2, 20.0, 6.5,
      "qdrant-client SDK", color=PURPLE, label_color=PURPLE, offset=(1.5, 0.0))

# AI Pipeline → File System
arrow(ax, 22.2, 7.2, 24.0, 5.8,
      "read file", color=SLATE, label_color=TEXT3, offset=(0.8, 0.25))

# Backend → OpenAI
arrow(ax, 23.6, 17.0, 28.6, 18.2,
      "openai SDK  ·  HTTPS", color=GREEN, label_color=GREEN, offset=(0.2, 0.35))

# AI Pipeline → OpenAI
arrow(ax, 23.6, 10.2, 28.6, 14.8,
      "chat · embed", color=GREEN, label_color=GREEN, offset=(1.0, 0.2))

# Auth / Backend → SMTP
arrow(ax, 23.6, 14.6, 28.6, 13.6,
      "smtplib  ·  TLS 587", color=AMBER, label_color=AMBER, offset=(0.2, 0.3))

# AI Pipeline → Tesseract
arrow(ax, 23.6, 8.5, 28.6, 8.5,
      "pytesseract  ·  subprocess", color=ROSE, label_color=ROSE, offset=(0, 0.3))

# ══════════════════════════════════════════════════════════════════════════════
# LEGEND
# ══════════════════════════════════════════════════════════════════════════════
lx, ly = 1.4, 6.0
ax.text(lx, ly, "Legend", fontsize=11, color=TEXT2, fontweight="bold",
        fontfamily="DejaVu Sans Mono")

legend_items = [
    (CYAN,   "Frontend system"),
    (BLUE,   "Backend / API"),
    (INDIGO, "Auth / Security"),
    (PURPLE, "AI pipeline / Vector DB"),
    (GREEN,  "OpenAI (LLM + Embeddings)"),
    (AMBER,  "Email / SMTP"),
    (ROSE,   "OCR (local)"),
    (SLATE,  "File storage / External"),
]
for i, (col, lbl) in enumerate(legend_items):
    by = ly - 0.58 - i * 0.52
    ax.add_patch(FancyBboxPatch((lx, by-0.12), 0.34, 0.28,
                 boxstyle="round,pad=0.04",
                 facecolor=col+"28", edgecolor=col, lw=1.4, zorder=5))
    ax.text(lx + 0.52, by, lbl, fontsize=9.5, color=TEXT2,
            fontfamily="DejaVu Sans Mono", va="center", zorder=6)

# ── Dashed = external  note
ax.plot([lx, lx+0.34], [ly-5.0, ly-5.0], color=TEXT3,
        lw=1.4, linestyle="--", zorder=5)
ax.text(lx+0.52, ly-5.0, "Dashed border = external service",
        fontsize=9, color=TEXT3, fontfamily="DejaVu Sans Mono", va="center")
ax.plot([lx, lx+0.34], [ly-5.5, ly-5.5], color=TEXT3,
        lw=1.6, linestyle="-", zorder=5)
ax.text(lx+0.52, ly-5.5, "Solid border = internal component",
        fontsize=9, color=TEXT3, fontfamily="DejaVu Sans Mono", va="center")

ax.text(W/2, 0.45, "Contract Lens  ·  System Context Diagram  ·  2026",
        ha="center", fontsize=9, color=TEXT3, fontfamily="DejaVu Sans Mono")

plt.tight_layout(pad=0.1)
out = r"c:\Users\danao\contract-intelligence-platform\context_diagram.png"
plt.savefig(out, dpi=160, bbox_inches="tight",
            facecolor=BG, edgecolor="none")
plt.close()
print(f"Saved: {out}")
