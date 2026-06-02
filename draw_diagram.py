import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch

W, H = 28, 58
fig, ax = plt.subplots(figsize=(W, H))
ax.set_xlim(0, W)
ax.set_ylim(0, H)
ax.axis("off")
fig.patch.set_facecolor("#0d1117")

BG     = "#0d1117"
CARD   = "#161b27"
BLUE   = "#3b82f6"
CYAN   = "#22d3ee"
GREEN  = "#10b981"
AMBER  = "#f59e0b"
RED    = "#ef4444"
PURPLE = "#a855f7"
TEXT1  = "#e2e8f0"
TEXT2  = "#94a3b8"
TEXT3  = "#475569"
ARROW  = "#334155"

CX = W / 2

def rect(x, y, w, h, top, bot="", color=BLUE, bg=CARD):
    bx, by = x - w/2, y - h/2
    ax.add_patch(FancyBboxPatch((bx, by), w, h, boxstyle="round,pad=0.10",
                 facecolor=bg, edgecolor=color, linewidth=1.8, zorder=3))
    ax.add_patch(FancyBboxPatch((bx, by), 0.20, h, boxstyle="round,pad=0.0",
                 facecolor=color, edgecolor="none", zorder=4))
    ty = y + (0.16 if bot else 0)
    ax.text(x+0.15, ty, top, ha="center", va="center",
            fontsize=10.5, color=TEXT1, fontweight="bold", zorder=5,
            fontfamily="DejaVu Sans Mono")
    if bot:
        ax.text(x+0.15, y-0.25, bot, ha="center", va="center",
                fontsize=8.5, color=TEXT2, zorder=5, fontfamily="DejaVu Sans Mono")

def dmd(x, y, w, h, label, color=AMBER):
    xs = [x, x+w/2, x, x-w/2, x]
    ys = [y+h/2, y, y-h/2, y, y+h/2]
    ax.fill(xs, ys, color="#1a1f2e", zorder=3)
    ax.plot(xs, ys, color=color, lw=1.8, zorder=4)
    lines = label.split("\n")
    for i, ln in enumerate(lines):
        off = (len(lines)-1)*0.13 - i*0.26 if len(lines)>1 else 0
        ax.text(x, y+off, ln, ha="center", va="center",
                fontsize=9.5, color=color, fontweight="bold", zorder=5,
                fontfamily="DejaVu Sans Mono")

def pill(x, y, w, h, label, color=GREEN, bg="#061a10"):
    ax.add_patch(FancyBboxPatch((x-w/2, y-h/2), w, h,
                 boxstyle="round,pad=0.22", facecolor=bg,
                 edgecolor=color, linewidth=2.0, zorder=3))
    ax.text(x, y, label, ha="center", va="center",
            fontsize=10.5, color=color, fontweight="bold", zorder=4,
            fontfamily="DejaVu Sans Mono")

def side_err(x, y, label, color=RED):
    rect(x, y, 4.0, 0.70, label, color=color, bg="#1c0f0f")

def arr(x1, y1, x2, y2, color=ARROW, label="", side="r"):
    ax.annotate("", xy=(x2,y2), xytext=(x1,y1),
                arrowprops=dict(arrowstyle="-|>", color=color,
                                lw=1.6, mutation_scale=12), zorder=2)
    if label:
        mx = (x1+x2)/2 + (0.15 if side=="r" else -0.15)
        my = (y1+y2)/2
        ax.text(mx, my, label, fontsize=9, color=TEXT2, zorder=5,
                fontfamily="DejaVu Sans Mono",
                ha="left" if side=="r" else "right", va="center")

def hline(x1, x2, y, color=ARROW):
    ax.plot([x1,x2],[y,y], color=color, lw=1.6, zorder=2)

def band(x,y,w,h,label,bg,bc):
    ax.add_patch(FancyBboxPatch((x,y),w,h,boxstyle="round,pad=0.12",
                 facecolor=bg, edgecolor=bc, lw=0.8, zorder=0, alpha=0.55))
    ax.text(x+0.28, y+h-0.32, label, fontsize=10, color=bc, fontweight="bold",
            fontfamily="DejaVu Sans Mono", zorder=1)

# ── Title ──────────────────────────────────────────────────────────────────────
ax.text(CX, 57.3, "Contract Upload  ·  OCR  ·  AI Analysis",
        ha="center", fontsize=18, color=TEXT1, fontweight="bold",
        fontfamily="DejaVu Sans Mono")
ax.text(CX, 56.65, "Backend Activity Diagram",
        ha="center", fontsize=11, color=TEXT3, fontfamily="DejaVu Sans Mono")
ax.plot([1.2, W-1.2],[56.3,56.3], color="#1e293b", lw=0.9)

# ─────────────────────────────────────────────────────────────────────────────
# HTTP LAYER  y: 55.8 → 45.8
# ─────────────────────────────────────────────────────────────────────────────
band(1.0, 45.5, W-2, 10.1, "HTTP  /  Request Validation", "#070d1a", "#1e3a5f")

pill(CX, 55.5, 10, 0.75, "POST /api/v1/upload/  +  JWT", color=CYAN, bg="#061820")
arr(CX, 55.12, CX, 54.45)
rect(CX, 54.05, 8.5, 0.78, "Rate limit", "12 requests / 60 seconds", color=AMBER)
arr(CX+4.25, 54.05, CX+6.5, 54.05, color=RED, label=" reject"); side_err(CX+8.5, 54.05, "HTTP 429", RED)
arr(CX, 53.66, CX, 52.98, label=" ok")
rect(CX, 52.58, 8.5, 0.78, "validate_file()", "extension  ·  MIME type", color=BLUE)
arr(CX+4.25, 52.58, CX+6.5, 52.58, color=RED, label=" invalid"); side_err(CX+8.5, 52.58, "HTTP 400", RED)
arr(CX, 52.19, CX, 51.51, label=" valid")
rect(CX, 51.11, 8.5, 0.78, "read_limited_file()", "MAX_FILE_SIZE_MB  ·  reject empty", color=BLUE)
arr(CX+4.25, 51.11, CX+6.5, 51.11, color=RED, label=" reject"); side_err(CX+8.5, 51.11, "HTTP 413/400", RED)
arr(CX, 50.72, CX, 50.04, label=" ok")
rect(CX, 49.64, 8.5, 0.78, "save_file()", "UUID filename → disk", color=BLUE)
arr(CX, 49.25, CX, 48.57)
rect(CX, 48.17, 8.5, 0.78, "INSERT Contract", "status: processing", color=PURPLE)
arr(CX+4.25, 48.17, CX+7.5, 48.17, color=GREEN, label=" immediate")
pill(CX+10.2, 48.17, 5.0, 0.65, "HTTP 200  →  contract id", color=GREEN, bg="#061a10")
arr(CX, 47.78, CX, 47.1)
ax.text(CX, 46.9, "▼  background task  process_contract()", ha="center",
        fontsize=9.5, color=TEXT3, fontfamily="DejaVu Sans Mono")
arr(CX, 46.7, CX, 46.2)

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 1  y: 45 → 26.5
# ─────────────────────────────────────────────────────────────────────────────
band(1.0, 26.2, W-2, 19.8, "PHASE 1  —  Parse · Metadata · Clauses · Embed", "#050f18", "#1e4060")

dmd(CX, 45.75, 5.5, 1.0, "file_type ?", color=CYAN)

# PDF left
LX = 5.2
arr(CX-2.75, 45.75, LX+1.8, 45.75, color=TEXT3, label=" pdf")
rect(LX, 45.75, 3.8, 0.72, "fitz direct", "text extraction", color=CYAN, bg="#061820")
arr(LX, 45.39, LX, 44.65)
dmd(LX, 44.3, 3.6, 0.72, "≥ 10 chars?", color=CYAN)
arr(LX, 43.94, LX, 43.2, color=GREEN, label=" yes")
rect(LX, 42.85, 3.6, 0.68, "method = pdf", "ocr_used = False", color=GREEN, bg="#061a10")
arr(LX+1.8, 44.3, LX+3.9, 44.3, color=AMBER, label=" empty")
rect(LX+5.7, 44.3, 3.8, 0.72, "Tesseract OCR", "page-by-page pixmap", color=AMBER, bg="#1a1000")
arr(LX+5.7, 43.94, LX+5.7, 43.2)
rect(LX+5.7, 42.85, 3.6, 0.68, "method = pdf_ocr", "ocr_used = True", color=AMBER, bg="#1a1000")

# DOCX centre
arr(CX, 45.25, CX, 44.55, color=TEXT3, label=" docx")
rect(CX, 44.2, 3.8, 0.68, "python-docx", "paragraphs + tables", color=BLUE)
arr(CX, 43.86, CX, 43.2)
rect(CX, 42.85, 3.6, 0.68, "method = docx", "ocr_used = False", color=BLUE)

# Image right
RX = W - 5.2
arr(CX+2.75, 45.75, RX-1.8, 45.75, color=TEXT3, label=" jpg/png ")
rect(RX, 45.75, 3.8, 0.72, "PIL + Tesseract", "image_to_string", color=PURPLE, bg="#130d1f")
arr(RX, 45.39, RX, 43.2)
rect(RX, 42.85, 3.6, 0.68, "method = ocr", "ocr_used = True", color=PURPLE, bg="#130d1f")

# merge
for sx in [LX, LX+5.7, CX, RX]:
    arr(sx, 42.51, sx, 42.0)
    hline(sx, CX, 42.0)
arr(CX, 42.0, CX, 41.5)

rect(CX, 41.1, 8.5, 0.78, "clean_text()", "normalise whitespace · encoding · BOM", color=BLUE)
arr(CX, 40.71, CX, 40.03)
dmd(CX, 39.65, 6.0, 1.0, "raw + cleaned ≥ 10 chars?", color=RED)

arr(CX+3.0, 39.65, CX+5.8, 39.65, color=RED, label=" no")
rect(CX+7.8, 39.65, 4.0, 0.78, "DELETE contract", "+ file from disk", color=RED, bg="#1c0f0f")
arr(CX+7.8, 39.26, CX+7.8, 38.7)
pill(CX+7.8, 38.4, 3.6, 0.58, "pipeline aborted", color=RED, bg="#1c0f0f")

arr(CX, 39.15, CX, 38.45, label=" yes")
rect(CX, 38.05, 10, 0.78, "UPDATE Contract",
     "extracted_text · cleaned_text · ocr_used · status: parsed", color=PURPLE)
arr(CX, 37.66, CX, 36.98)

# Metadata
rect(CX, 36.58, 9, 0.78, "save_contract_metadata()", "parties · type · dates · notice_period_days", color=CYAN, bg="#061820")
arr(CX, 36.19, CX, 35.51)
dmd(CX, 35.13, 5.0, 1.0, "OPENAI_API_KEY ?", color=CYAN)

arr(CX-2.5, 35.13, CX-5.0, 35.13, color=RED, label="no ")
rect(CX-7.0, 35.13, 4.0, 0.78, "Regex fallback", "DATE · NOTICE patterns", color=AMBER, bg="#1a1000")

arr(CX+2.5, 35.13, CX+5.0, 35.13, color=GREEN, label=" yes")
rect(CX+7.0, 35.13, 4.0, 0.78, "OpenAI GPT", "JSON → metadata", color=GREEN, bg="#061a10")
arr(CX+7.0, 34.74, CX+7.0, 34.1)
dmd(CX+7.0, 33.75, 3.6, 0.72, "parse ok?", color=AMBER)
arr(CX+7.0, 33.39, CX+7.0, 32.9, color=GREEN, label=" yes")
arr(CX+8.8, 33.75, CX+10.5, 33.75, color=AMBER, label=" err")
rect(CX+12.2, 33.75, 3.6, 0.68, "Regex fallback", "", color=AMBER, bg="#1a1000")
arr(CX+12.2, 33.41, CX+12.2, 32.9)
hline(CX+7.0, CX+12.2, 32.9)
arr(CX+7.0, 32.9, CX+7.0, 32.5)

arr(CX-7.0, 34.74, CX-7.0, 32.5)
hline(CX-7.0, CX+7.0, 32.5)
arr(CX, 32.5, CX, 31.98)
rect(CX, 31.58, 10, 0.78, "UPDATE Contract",
     "effective_date · expiration_date · notice_period_days", color=PURPLE)
arr(CX, 31.19, CX, 30.51)

# Clauses
rect(CX, 30.11, 9, 0.78, "create_clauses()", "split · heading extract · categorise", color=BLUE)
arr(CX, 29.72, CX, 29.04)
rect(CX, 28.64, 9, 0.68, "INSERT Clause rows  ·  status: indexing", color=PURPLE)
arr(CX, 28.30, CX, 27.62)

# Embeddings
rect(CX, 27.22, 9, 0.78, "upsert_embeddings()", "500-char chunks  ·  80-char overlap", color=BLUE)
arr(CX, 26.83, CX, 26.35)
dmd(CX, 26.0, 5.0, 0.88, "OPENAI_API_KEY ?", color=CYAN)

LX2 = CX - 7.0
arr(CX-2.5, 26.0, LX2+1.5, 26.0, color=AMBER, label="no ")
dmd(LX2, 26.0, 3.8, 0.78, "SentenceTx?", color=AMBER)
arr(LX2, 25.61, LX2, 25.0, color=GREEN, label=" yes")
rect(LX2, 24.65, 3.8, 0.68, "MiniLM-L6-v2", "384 dims local", color=AMBER, bg="#1a1000")
arr(LX2-1.9, 26.0, LX2-3.8, 26.0, color=RED, label="no ")
rect(LX2-5.2, 26.0, 3.0, 0.68, "Hash fallback", "correct dims", color=RED, bg="#1c0f0f")
arr(LX2-5.2, 25.66, LX2-5.2, 24.65)
hline(LX2-5.2, LX2, 24.65)

RX2 = CX + 7.0
arr(CX+2.5, 26.0, RX2-1.5, 26.0, color=GREEN, label=" yes")
rect(RX2, 26.0, 4.0, 0.78, "text-embedding-3-small", "1536 dims · OpenAI", color=GREEN, bg="#061a10")
arr(RX2, 25.61, RX2, 24.65)

hline(LX2, RX2, 24.65)
arr(CX, 24.65, CX, 24.15)
rect(CX, 23.75, 9, 0.78, "Qdrant upsert", "or in-memory if Qdrant unavailable", color=CYAN, bg="#061820")
arr(CX, 23.36, CX, 22.68)
rect(CX, 22.28, 10, 0.78, "UPDATE Contract",
     "is_indexed=True · embedding_status=completed · status: analysis_pending", color=PURPLE)

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 2  y: 21.5 → 3
# ─────────────────────────────────────────────────────────────────────────────
band(1.0, 2.8, W-2, 19.2, "PHASE 2  —  OpenAI Analysis", "#050d0a", "#1a4030")

arr(CX, 21.89, CX, 21.3)
dmd(CX, 20.92, 5.0, 0.88, "OPENAI_API_KEY ?", color=CYAN)
arr(CX-2.5, 20.92, CX-5.8, 20.92, color=RED, label="no ")
rect(CX-7.8, 20.92, 4.2, 0.78, "status: analysis_failed", "'AI unavailable'", color=RED, bg="#1c0f0f")
pill(CX-7.8, 20.1, 4.0, 0.60, "user can retry", color=RED, bg="#1c0f0f")
arr(CX-7.8, 20.53, CX-7.8, 20.4)
arr(CX, 20.48, CX, 19.85, label=" yes")

# Summary
rect(CX, 19.45, 9.5, 0.78, "generate_summary_text()",
     "GPT → prose · 2-4 paragraphs · no markdown", color=GREEN, bg="#061a10")
arr(CX, 19.06, CX, 18.38)
dmd(CX, 18.0, 4.5, 0.88, "OpenAI ok?", color=GREEN)
arr(CX+2.25, 18.0, CX+5.2, 18.0, color=GREEN, label=" ok")
rect(CX+7.2, 18.0, 4.0, 0.68, "INSERT Summary", "", color=GREEN, bg="#061a10")
arr(CX-2.25, 18.0, CX-5.2, 18.0, color=RED, label="fail ")
rect(CX-7.2, 18.0, 3.8, 0.68, "failure_count ++", "", color=RED, bg="#1c0f0f")
for sx in [CX+7.2, CX-7.2]:
    arr(sx, 17.66, sx, 17.2); hline(sx, CX, 17.2)
arr(CX, 17.2, CX, 16.72)

# Risks
rect(CX, 16.32, 9.5, 0.78, "_ai_risks()",
     "GPT → JSON · salvage parser on truncation", color=RED, bg="#1c0f0f")
arr(CX, 15.93, CX, 15.25)
dmd(CX, 14.87, 4.5, 0.88, "AI results?", color=RED)
arr(CX+2.25, 14.87, CX+5.2, 14.87, color=GREEN, label=" yes")
rect(CX+7.2, 14.87, 3.8, 0.68, "persist AI risks", "", color=GREEN, bg="#061a10")
arr(CX-2.25, 14.87, CX-5.2, 14.87, color=AMBER, label="empty ")
rect(CX-7.2, 14.87, 4.0, 0.78, "Regex fallback", "RISK_PATTERNS on clauses", color=AMBER, bg="#1a1000")
for sx in [CX+7.2, CX-7.2]:
    arr(sx, 14.53, sx, 14.0); hline(sx, CX, 14.0)
arr(CX, 14.0, CX, 13.52)

# Obligations
rect(CX, 13.12, 9.5, 0.78, "create_or_replace_obligations()",
     "GPT → due dates · owners · obligation text", color=AMBER, bg="#1a1000")
arr(CX, 12.73, CX, 12.05)
dmd(CX, 11.67, 4.5, 0.88, "OpenAI ok?", color=AMBER)
arr(CX+2.25, 11.67, CX+5.2, 11.67, color=GREEN, label=" ok")
rect(CX+7.2, 11.67, 4.0, 0.68, "INSERT Obligations", "", color=GREEN, bg="#061a10")
arr(CX-2.25, 11.67, CX-5.2, 11.67, color=RED, label="fail ")
rect(CX-7.2, 11.67, 3.8, 0.68, "failure_count ++", "", color=RED, bg="#1c0f0f")
for sx in [CX+7.2, CX-7.2]:
    arr(sx, 11.33, sx, 10.8); hline(sx, CX, 10.8)
arr(CX, 10.8, CX, 10.32)

# Alerts
rect(CX, 9.92, 10, 0.78, "generate_alerts_for_contract()",
     "rule-based · expiry checks · overdue · no OpenAI", color=CYAN, bg="#061820")
arr(CX, 9.53, CX, 8.85)
rect(CX, 8.45, 8, 0.68, "INSERT Alert rows", "", color=CYAN, bg="#061820")
arr(CX, 8.11, CX, 7.43)

# Final decision
dmd(CX, 7.0, 8.0, 1.1, "all 3 failed AND no data?", color=RED)
arr(CX+4.0, 7.0, CX+7.2, 7.0, color=RED, label=" yes")
rect(CX+9.2, 7.0, 4.2, 0.78, "status: analysis_failed", "'retry when available'", color=RED, bg="#1c0f0f")
arr(CX-4.0, 7.0, CX-7.2, 7.0, color=GREEN, label="no ")
rect(CX-9.2, 7.0, 4.2, 0.78, "status: completed", "processing_error = None", color=GREEN, bg="#061a10")
for sx in [CX+9.2, CX-9.2]:
    arr(sx, 6.61, sx, 6.1); hline(sx, CX, 6.1)
arr(CX, 6.1, CX, 5.55)

pill(CX, 5.15, 14, 0.82,
     "Contract in UI  ·  Ask AI enabled  ·  Vector search active",
     color=GREEN, bg="#061a10")

# ── Legend ────────────────────────────────────────────────────────────────────
lx, ly = 1.8, 4.3
ax.text(lx, ly, "Legend", fontsize=10, color=TEXT2, fontweight="bold",
        fontfamily="DejaVu Sans Mono")
items = [(BLUE,"Process step"), (PURPLE,"DB write"), (GREEN,"Success / OpenAI"),
         (AMBER,"Fallback"), (RED,"Error / failure"), (CYAN,"Decision / vector")]
for i,(col,lbl) in enumerate(items):
    bx = lx + (i%3)*8.8
    by = ly - 0.55 - (i//3)*0.62
    ax.add_patch(FancyBboxPatch((bx,by-0.14),0.36,0.28,
                 boxstyle="round,pad=0.04",
                 facecolor=col+"28",edgecolor=col,lw=1.2,zorder=5))
    ax.text(bx+0.52, by, lbl, fontsize=9.5, color=TEXT2, zorder=6,
            fontfamily="DejaVu Sans Mono", va="center")

ax.text(CX, 3.15, "Contract Lens  ·  Backend Pipeline  ·  2026",
        ha="center", fontsize=9, color=TEXT3, fontfamily="DejaVu Sans Mono")

plt.tight_layout(pad=0.2)
out = r"c:\Users\danao\contract-intelligence-platform\pipeline_diagram.png"
plt.savefig(out, dpi=160, bbox_inches="tight", facecolor=BG, edgecolor="none")
plt.close()
print(f"Saved: {out}")
