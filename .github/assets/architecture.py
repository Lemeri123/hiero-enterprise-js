"""Generate the README architecture diagram (light + dark) in Hiero colours.

Edit this file, not the SVGs, then run:

    python3 .github/assets/architecture.py .github/assets
"""
import sys

THEMES = {
    "light": dict(
        bg="#faf9f5", dot="#e3e1d6", text="#1e1e1e", muted="#5f5f5f",
        card="#ffffff", stroke="#e5e4d7", accent="#b81a56", accent2="#992350",
        chip="#fbeef3", chipText="#8a1d47", chipStroke="#f2cfdc",
        mhead1="#3a0a1e", mhead2="#6d1338", mchip="#f3f2ec", mchipText="#3a0a1e",
        mchipStroke="#e2e0d5", net1="#24000f", net2="#3a0a1e", netText="#e5e4d7",
        netCard="#3a0a1e", netStroke="#6d1338", wire="#b81a56", wire2="#6d1338",
        app="#ffffff", appChip="#f3f2ec", step="#ffffff",
    ),
    "dark": dict(
        bg="#121212", dot="#262626", text="#efefee", muted="#a6a6a6",
        card="#1b1b1b", stroke="#2f2f2f", accent="#d92d6a", accent2="#b81a56",
        chip="#2a0b18", chipText="#f3c4d5", chipStroke="#5a1430",
        mhead1="#4a0f27", mhead2="#6d1338", mchip="#232323", mchipText="#e5e4d7",
        mchipStroke="#3a3a3a", net1="#24000f", net2="#3a0a1e", netText="#e5e4d7",
        netCard="#3a0a1e", netStroke="#6d1338", wire="#d92d6a", wire2="#a33a63",
        app="#1b1b1b", appChip="#262626", step="#222222",
    ),
}

SANS = "'Space Grotesk','Segoe UI',Helvetica,Arial,sans-serif"
MONO = "'IBM Plex Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace"


def chip(x, y, label, fill, stroke, color, w=None, mono=True, size=13):
    w = w or (len(label) * 7.9 + 26)
    font = MONO if mono else SANS
    return (
        f'<rect x="{x}" y="{y}" width="{w}" height="28" rx="14" fill="{fill}" stroke="{stroke}"/>'
        f'<text x="{x + w / 2}" y="{y + 18.5}" text-anchor="middle" font-family="{font}" '
        f'font-size="{size}" fill="{color}">{label}</text>'
    ), w


def chips_row(x, y, labels, gap, **kw):
    out, cx = [], x
    for label in labels:
        s, w = chip(cx, y, label, **kw)
        out.append(s)
        cx += w + gap
    return "".join(out)


def render(t):
    W, H = 1200, 836
    o = []
    o.append(
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" '
        f'role="img" aria-labelledby="title desc">'
        '<title id="title">Hiero Enterprise JS architecture</title>'
        '<desc id="desc">An application uses enterprise-core to send signed transactions to '
        'Hiero consensus nodes over gRPC, and enterprise-mirror to read history from the '
        'mirror node REST API. Consensus nodes stream records to the mirror node.</desc>'
    )
    o.append(f"""<defs>
  <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse">
    <circle cx="2" cy="2" r="1.3" fill="{t['dot']}"/>
  </pattern>
  <linearGradient id="coreHead" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="{t['accent2']}"/><stop offset="1" stop-color="{t['accent']}"/>
  </linearGradient>
  <linearGradient id="mirrorHead" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="{t['mhead1']}"/><stop offset="1" stop-color="{t['mhead2']}"/>
  </linearGradient>
  <linearGradient id="net" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="{t['net1']}"/><stop offset="1" stop-color="{t['net2']}"/>
  </linearGradient>
  <filter id="shadow" x="-5%" y="-5%" width="110%" height="120%">
    <feDropShadow dx="0" dy="6" stdDeviation="9" flood-color="#000" flood-opacity="0.08"/>
  </filter>
  <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
    <path d="M0 0 L10 5 L0 10 z" fill="{t['wire']}"/>
  </marker>
  <marker id="arrow2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
    <path d="M0 0 L10 5 L0 10 z" fill="{t['wire2']}"/>
  </marker>
</defs>""")
    o.append(f'<rect width="{W}" height="{H}" fill="{t["bg"]}"/>')
    o.append(f'<rect width="{W}" height="{H}" fill="url(#dots)"/>')

    # ── Application band ───────────────────────────────────────────────
    o.append(f'<rect x="40" y="36" width="1120" height="104" rx="18" fill="{t["app"]}" '
             f'stroke="{t["stroke"]}" filter="url(#shadow)"/>')
    o.append(f'<text x="68" y="74" font-family="{SANS}" font-size="12" letter-spacing="2" '
             f'font-weight="600" fill="{t["accent"]}">YOUR APPLICATION</text>')
    o.append(f'<text x="68" y="100" font-family="{SANS}" font-size="20" font-weight="600" '
             f'fill="{t["text"]}">Script · worker · API server</text>')
    o.append(f'<text x="68" y="123" font-family="{SANS}" font-size="13.5" fill="{t["muted"]}">'
             'Create the services once at startup, share them, close the context on shutdown.</text>')
    o.append(chips_row(700, 72, ["new HieroContext()", "createMirrorNodeClient()"], 12,
                       fill=t["appChip"], stroke=t["stroke"], color=t["text"]))

    # wires app -> packages
    o.append(f'<path d="M300 140 V184" stroke="{t["wire"]}" stroke-width="2.2" fill="none" marker-end="url(#arrow)"/>')
    o.append(f'<path d="M900 140 V184" stroke="{t["wire2"]}" stroke-width="2.2" fill="none" marker-end="url(#arrow2)"/>')
    o.append(f'<text x="312" y="167" font-family="{MONO}" font-size="12" fill="{t["muted"]}">writes</text>')
    o.append(f'<text x="912" y="167" font-family="{MONO}" font-size="12" fill="{t["muted"]}">reads</text>')

    # ── Core panel ─────────────────────────────────────────────────────
    px, py, pw, ph = 40, 190, 550, 400
    o.append(f'<rect x="{px}" y="{py}" width="{pw}" height="{ph}" rx="18" fill="{t["card"]}" '
             f'stroke="{t["stroke"]}" filter="url(#shadow)"/>')
    o.append(f'<path d="M{px} {py + 18} a18 18 0 0 1 18 -18 H{px + pw - 18} a18 18 0 0 1 18 18 V{py + 64} H{px} z" fill="url(#coreHead)"/>')
    o.append(f'<text x="{px + 26}" y="{py + 30}" font-family="{MONO}" font-size="15" font-weight="600" fill="#ffffff">@hiero-hackers/enterprise-core</text>')
    o.append(f'<text x="{px + 26}" y="{py + 51}" font-family="{SANS}" font-size="12.5" letter-spacing="1.2" fill="#fde7ef">WRITE SIDE · SIGNED TRANSACTIONS · NEEDS AN OPERATOR</text>')

    # HieroContext card
    cy = py + 84
    o.append(f'<rect x="{px + 22}" y="{cy}" width="{pw - 44}" height="66" rx="12" fill="{t["chip"]}" stroke="{t["chipStroke"]}"/>')
    o.append(f'<text x="{px + 40}" y="{cy + 27}" font-family="{MONO}" font-size="14.5" font-weight="600" fill="{t["chipText"]}">HieroContext</text>')
    o.append(f'<text x="{px + 40}" y="{cy + 49}" font-family="{SANS}" font-size="13" fill="{t["muted"]}">network · operator key (kept private) · SDK client · transaction listeners</text>')

    # services
    sy = cy + 90
    o.append(f'<text x="{px + 26}" y="{sy}" font-family="{SANS}" font-size="11.5" letter-spacing="1.6" font-weight="600" fill="{t["muted"]}">SERVICES</text>')
    o.append(chips_row(px + 22, sy + 12, ["Account", "Token", "Topic", "File"], 10,
                       fill=t["card"], stroke=t["chipStroke"], color=t["chipText"], w=118))
    o.append(chips_row(px + 22, sy + 50, ["Contract", "Schedule", "Network"], 10,
                       fill=t["card"], stroke=t["chipStroke"], color=t["chipText"], w=118))

    # pipeline
    ly = sy + 112
    o.append(f'<text x="{px + 26}" y="{ly}" font-family="{SANS}" font-size="11.5" letter-spacing="1.6" font-weight="600" fill="{t["muted"]}">EVERY OPERATION</text>')
    steps = ["validate", "build", "sign", "submit", "receipt"]
    sx, sw, gap = px + 22, 88, 14
    for i, s in enumerate(steps):
        x = sx + i * (sw + gap)
        fill = t["accent"] if i == 0 else t["step"]
        color = "#ffffff" if i == 0 else t["text"]
        stroke = t["accent"] if i == 0 else t["stroke"]
        o.append(f'<rect x="{x}" y="{ly + 12}" width="{sw}" height="34" rx="9" fill="{fill}" stroke="{stroke}"/>')
        o.append(f'<text x="{x + sw / 2}" y="{ly + 34}" text-anchor="middle" font-family="{MONO}" font-size="13" fill="{color}">{s}</text>')
        if i < len(steps) - 1:
            ax = x + sw + 2
            o.append(f'<path d="M{ax} {ly + 29} h{gap - 4}" stroke="{t["muted"]}" stroke-width="1.6" marker-end="url(#arrow2)"/>')
    o.append(f'<text x="{px + 26}" y="{ly + 70}" font-family="{SANS}" font-size="13" fill="{t["muted"]}">'
             f'Bad input stops at <tspan font-family="{MONO}" fill="{t["chipText"]}">INPUT_INVALID</tspan> before any fee is paid;'
             '</text>')
    o.append(f'<text x="{px + 26}" y="{ly + 89}" font-family="{SANS}" font-size="13" fill="{t["muted"]}">'
             f'every failure surfaces as a typed <tspan font-family="{MONO}" fill="{t["chipText"]}">HieroError</tspan>.</text>')

    # ── Mirror panel ───────────────────────────────────────────────────
    qx = 610
    o.append(f'<rect x="{qx}" y="{py}" width="{pw}" height="{ph}" rx="18" fill="{t["card"]}" '
             f'stroke="{t["stroke"]}" filter="url(#shadow)"/>')
    o.append(f'<path d="M{qx} {py + 18} a18 18 0 0 1 18 -18 H{qx + pw - 18} a18 18 0 0 1 18 18 V{py + 64} H{qx} z" fill="url(#mirrorHead)"/>')
    o.append(f'<text x="{qx + 26}" y="{py + 30}" font-family="{MONO}" font-size="15" font-weight="600" fill="#ffffff">@hiero-hackers/enterprise-mirror</text>')
    o.append(f'<text x="{qx + 26}" y="{py + 51}" font-family="{SANS}" font-size="12.5" letter-spacing="1.2" fill="#f1dbe4">READ SIDE · ZERO DEPENDENCIES · NO KEYS</text>')

    ry = py + 96
    o.append(f'<text x="{qx + 26}" y="{ry}" font-family="{SANS}" font-size="11.5" letter-spacing="1.6" font-weight="600" fill="{t["muted"]}">REPOSITORIES</text>')
    o.append(chips_row(qx + 22, ry + 12, ["Account", "Token", "Nft", "Topic"], 10,
                       fill=t["mchip"], stroke=t["mchipStroke"], color=t["mchipText"], w=118))
    o.append(chips_row(qx + 22, ry + 50, ["Transaction", "Contract", "Block", "Schedule"], 10,
                       fill=t["mchip"], stroke=t["mchipStroke"], color=t["mchipText"], w=118))
    o.append(chips_row(qx + 22, ry + 88, ["Network"], 10,
                       fill=t["mchip"], stroke=t["mchipStroke"], color=t["mchipText"], w=118))

    my = ry + 140
    o.append(f'<rect x="{qx + 22}" y="{my}" width="{pw - 44}" height="66" rx="12" fill="{t["mchip"]}" stroke="{t["mchipStroke"]}"/>')
    o.append(f'<text x="{qx + 40}" y="{my + 27}" font-family="{MONO}" font-size="14.5" font-weight="600" fill="{t["mchipText"]}">MirrorNodeClient</text>')
    o.append(f'<text x="{qx + 40}" y="{my + 49}" font-family="{SANS}" font-size="13" fill="{t["muted"]}">rate limiting · retries · lossless numbers · typed pages</text>')

    hy = my + 92
    o.append(f'<text x="{qx + 26}" y="{hy}" font-family="{SANS}" font-size="13" fill="{t["muted"]}">'
             f'Every list returns a <tspan font-family="{MONO}" fill="{t["mchipText"]}">Page</tspan> with <tspan font-family="{MONO}" fill="{t["mchipText"]}">next()</tspan>;'
             f' <tspan font-family="{MONO}" fill="{t["mchipText"]}">collectAll</tspan> and</text>')
    o.append(f'<text x="{qx + 26}" y="{hy + 19}" font-family="{SANS}" font-size="13" fill="{t["muted"]}">'
             f'<tspan font-family="{MONO}" fill="{t["mchipText"]}">paginate</tspan> drain or stream any listing.</text>')
    o.append(f'<text x="{qx + 26}" y="{hy + 44}" font-family="{SANS}" font-size="13" fill="{t["muted"]}">'
             'Unit helpers convert tinybar ⇄ ℏ, token decimals and consensus timestamps.</text>')

    # ── Wires to the network ──────────────────────────────────────────
    o.append(f'<path d="M300 590 V664" stroke="{t["wire"]}" stroke-width="2.2" fill="none" marker-end="url(#arrow)"/>')
    o.append(f'<text x="312" y="624" font-family="{MONO}" font-size="12" fill="{t["muted"]}">gRPC · signed · fees in ℏ</text>')
    o.append(f'<path d="M900 590 V664" stroke="{t["wire2"]}" stroke-width="2.2" fill="none" marker-end="url(#arrow2)"/>')
    o.append(f'<text x="912" y="624" font-family="{MONO}" font-size="12" fill="{t["muted"]}">HTTPS REST · free</text>')
    o.append(f'<path d="M520 590 C 560 640, 700 640, 760 664" stroke="{t["wire2"]}" stroke-width="1.6" '
             f'stroke-dasharray="5 5" fill="none" marker-end="url(#arrow2)"/>')
    o.append(f'<text x="602" y="612" font-family="{MONO}" font-size="11.5" fill="{t["muted"]}">balances (SDK)</text>')

    # ── Network band ───────────────────────────────────────────────────
    ny = 670
    o.append(f'<rect x="40" y="{ny}" width="1120" height="136" rx="18" fill="url(#net)"/>')
    o.append(f'<text x="68" y="{ny + 32}" font-family="{SANS}" font-size="12" letter-spacing="2" font-weight="600" fill="#f08fb1">HIERO NETWORK</text>')
    o.append(f'<text x="68" y="{ny + 54}" font-family="{SANS}" font-size="13" fill="{t["netText"]}" opacity="0.8">mainnet · testnet · previewnet · local</text>')
    for x, title, sub in ((150, "Consensus nodes", "order and execute transactions"),
                          (750, "Mirror node", "indexes history, serves /api/v1")):
        o.append(f'<rect x="{x}" y="{ny + 66}" width="300" height="54" rx="11" fill="{t["netCard"]}" stroke="{t["netStroke"]}"/>')
        o.append(f'<text x="{x + 18}" y="{ny + 88}" font-family="{SANS}" font-size="14.5" font-weight="600" fill="#ffffff">{title}</text>')
        o.append(f'<text x="{x + 18}" y="{ny + 108}" font-family="{SANS}" font-size="12.5" fill="{t["netText"]}" opacity="0.75">{sub}</text>')
    o.append(f'<path d="M458 {ny + 93} H742" stroke="#f08fb1" stroke-width="2" stroke-dasharray="2 6" stroke-linecap="round" fill="none"/>')
    o.append(f'<path d="M732 {ny + 87} L744 {ny + 93} L732 {ny + 99}" stroke="#f08fb1" stroke-width="2" fill="none" stroke-linecap="round"/>')
    o.append(f'<text x="600" y="{ny + 84}" text-anchor="middle" font-family="{MONO}" font-size="11.5" fill="{t["netText"]}" opacity="0.85">record stream</text>')

    o.append("</svg>")
    return "".join(o)


out = sys.argv[1]
for name, theme in THEMES.items():
    with open(f"{out}/architecture-{name}.svg", "w") as f:
        f.write(render(theme) + "\n")
