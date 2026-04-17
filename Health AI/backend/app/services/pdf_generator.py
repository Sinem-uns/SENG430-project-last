"""
PDF Certificate generator for the HEALTH-AI ML Learning Tool.
Uses ReportLab to produce a polished A4 certificate.
"""
from __future__ import annotations

import io
from typing import Any, Dict, List

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, mm
from reportlab.platypus import (
    HRFlowable,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    Table,
    TableStyle,
)
from reportlab.graphics.shapes import Drawing, String
from reportlab.graphics.charts.barcharts import HorizontalBarChart
from reportlab.graphics.charts.spider import SpiderChart
from reportlab.lib.colors import Color


# ---------------------------------------------------------------------------
# Colour palette
# ---------------------------------------------------------------------------
NAVY = colors.HexColor("#1B3A6B")
TEAL = colors.HexColor("#0D9488")
LIGHT_BLUE = colors.HexColor("#EFF6FF")
LIGHT_TEAL = colors.HexColor("#F0FDFA")
MID_GREY = colors.HexColor("#6B7280")
LIGHT_GREY = colors.HexColor("#F3F4F6")
DARK_GREY = colors.HexColor("#1F2937")
WHITE = colors.white

PAGE_W, PAGE_H = A4
MARGIN = 2 * cm


def _hr(width: float = 16 * cm, color: Any = TEAL, thickness: float = 1.5) -> HRFlowable:
    return HRFlowable(width=width, thickness=thickness, color=color, spaceAfter=4, spaceBefore=4)


def _styles() -> Dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    return {
        "header_main": ParagraphStyle(
            "header_main",
            fontName="Helvetica-Bold",
            fontSize=22,
            textColor=NAVY,
            alignment=TA_CENTER,
            spaceAfter=2,
        ),
        "header_sub": ParagraphStyle(
            "header_sub",
            fontName="Helvetica",
            fontSize=10,
            textColor=TEAL,
            alignment=TA_CENTER,
            spaceAfter=6,
        ),
        "section_title": ParagraphStyle(
            "section_title",
            fontName="Helvetica-Bold",
            fontSize=13,
            textColor=NAVY,
            spaceBefore=10,
            spaceAfter=4,
        ),
        "body": ParagraphStyle(
            "body",
            fontName="Helvetica",
            fontSize=10,
            textColor=DARK_GREY,
            spaceAfter=3,
            leading=14,
        ),
        "body_center": ParagraphStyle(
            "body_center",
            fontName="Helvetica",
            fontSize=10,
            textColor=DARK_GREY,
            alignment=TA_CENTER,
            spaceAfter=3,
            leading=14,
        ),
        "label": ParagraphStyle(
            "label",
            fontName="Helvetica-Bold",
            fontSize=9,
            textColor=MID_GREY,
            spaceAfter=1,
        ),
        "value": ParagraphStyle(
            "value",
            fontName="Helvetica",
            fontSize=10,
            textColor=DARK_GREY,
            spaceAfter=2,
        ),
        "footer": ParagraphStyle(
            "footer",
            fontName="Helvetica-Oblique",
            fontSize=8,
            textColor=MID_GREY,
            alignment=TA_CENTER,
            spaceAfter=2,
        ),
        "check_ok": ParagraphStyle(
            "check_ok",
            fontName="Helvetica",
            fontSize=10,
            textColor=TEAL,
            spaceAfter=2,
            leading=14,
        ),
        "check_no": ParagraphStyle(
            "check_no",
            fontName="Helvetica",
            fontSize=10,
            textColor=MID_GREY,
            spaceAfter=2,
            leading=14,
        ),
    }


def generate_certificate(
    domain_label: str,
    model_type: str,
    model_params: Dict[str, Any],
    metrics: Any,            # MetricsResult
    bias_summary: List[Dict[str, Any]],
    checklist_items: List[Dict[str, Any]],
    generated_at: str,
    confusion_matrix: List[List[int]] = None,
    is_detailed: bool = False,
    feature_importance: List[Dict[str, Any]] = None,
) -> bytes:
    """
    Generate a polished A4 PDF certificate and return it as bytes.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=1.5 * cm,
        bottomMargin=1.5 * cm,
    )

    st = _styles()
    story = []

    # -----------------------------------------------------------------------
    # Header
    # -----------------------------------------------------------------------
    story.append(Paragraph("HEALTH-AI · ML Learning Tool", st["header_main"]))
    story.append(Paragraph("Erasmus+ KA220-HED · Healthcare AI Education Platform", st["header_sub"]))
    story.append(_hr())
    story.append(Spacer(1, 6 * mm))

    # -----------------------------------------------------------------------
    # Section 1: Completion Certificate
    # -----------------------------------------------------------------------
    story.append(Paragraph("Learning Completion Certificate", st["section_title"]))
    story.append(Spacer(1, 3 * mm))

    completion_data = [
        ["Specialty / Domain", domain_label],
        ["Model Type", model_type.replace("_", " ").title()],
        ["Date & Time", generated_at],
        ["Statement", "This certifies completion of the guided ML learning journey"],
    ]
    completion_table = Table(
        completion_data,
        colWidths=[5 * cm, 11 * cm],
        hAlign="LEFT",
    )
    completion_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (0, -1), LIGHT_BLUE),
            ("BACKGROUND", (1, 0), (1, -1), WHITE),
            ("TEXTCOLOR", (0, 0), (0, -1), NAVY),
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("ROWBACKGROUNDS", (0, 0), (-1, -1), [LIGHT_BLUE, WHITE]),
        ])
    )
    story.append(completion_table)
    story.append(Spacer(1, 5 * mm))
    story.append(_hr())

    # -----------------------------------------------------------------------
    # Section 2: Model Performance Summary
    # -----------------------------------------------------------------------
    story.append(Paragraph("Model Performance Summary", st["section_title"]))
    story.append(Spacer(1, 3 * mm))

    def fmt_pct(v: float) -> str:
        return f"{v * 100:.1f}%"

    def _score_color(v: float) -> colors.Color:
        if v >= 0.85:
            return TEAL
        if v >= 0.70:
            return NAVY
        return colors.HexColor("#DC2626")

    metrics_rows = [
        ["Metric", "Value", "Interpretation"],
        ["Accuracy", fmt_pct(metrics.accuracy), _quality_label(metrics.accuracy)],
        ["Sensitivity (Recall)", fmt_pct(metrics.sensitivity), _quality_label(metrics.sensitivity)],
        ["Specificity", fmt_pct(metrics.specificity), _quality_label(metrics.specificity)],
        ["Precision", fmt_pct(metrics.precision), _quality_label(metrics.precision)],
        ["F1 Score", fmt_pct(metrics.f1), _quality_label(metrics.f1)],
        ["AUC-ROC", fmt_pct(metrics.auc), _quality_label(metrics.auc)],
    ]

    metrics_table = Table(
        metrics_rows,
        colWidths=[5.5 * cm, 3.5 * cm, 7 * cm],
        hAlign="LEFT",
    )
    metrics_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 10),
            ("ALIGN", (1, 1), (1, -1), "CENTER"),
            ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
            ("FONTNAME", (1, 1), (-1, -1), "Helvetica"),
            ("FONTSIZE", (0, 1), (-1, -1), 10),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_GREY]),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ])
    )
    story.append(metrics_table)
    story.append(Spacer(1, 5 * mm))
    story.append(_hr())

    # -----------------------------------------------------------------------
    # Section 3: Bias Audit Summary
    # -----------------------------------------------------------------------
    story.append(Paragraph("Bias Audit Summary", st["section_title"]))
    story.append(Spacer(1, 3 * mm))

    if bias_summary:
        bias_header = ["Subgroup", "Group", "N", "Sensitivity", "Specificity", "Δ Sens.", "Δ Spec.", "Status"]
        bias_rows = [bias_header]
        for sg in bias_summary:
            status = str(sg.get("status", "OK"))
            status_text = f"{'✓' if status == 'OK' else ('△' if status == 'Review' else '✗')} {status}"
            bias_rows.append([
                str(sg.get("name", "")),
                str(sg.get("group", "")),
                str(sg.get("n", "")),
                f"{float(sg.get('sensitivity', 0)) * 100:.1f}%",
                f"{float(sg.get('specificity', 0)) * 100:.1f}%",
                f"{float(sg.get('delta_sensitivity', 0)) * 100:+.1f}pp",
                f"{float(sg.get('delta_specificity', 0)) * 100:+.1f}pp",
                status_text,
            ])

        bias_col_widths = [3 * cm, 2.5 * cm, 1.5 * cm, 2.5 * cm, 2.5 * cm, 2 * cm, 2 * cm, 1.5 * cm]
        bias_table = Table(bias_rows, colWidths=bias_col_widths, hAlign="LEFT")

        ts = [
            ("BACKGROUND", (0, 0), (-1, 0), TEAL),
            ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_TEAL]),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING", (0, 0), (-1, -1), 4),
            ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ]
        # Colour-code status column
        for row_idx, sg in enumerate(bias_summary, start=1):
            status = str(sg.get("status", "OK"))
            if status == "Warning":
                ts.append(("TEXTCOLOR", (7, row_idx), (7, row_idx), colors.HexColor("#DC2626")))
                ts.append(("FONTNAME", (7, row_idx), (7, row_idx), "Helvetica-Bold"))
            elif status == "Review":
                ts.append(("TEXTCOLOR", (7, row_idx), (7, row_idx), colors.HexColor("#D97706")))

        bias_table.setStyle(TableStyle(ts))
        story.append(bias_table)
    else:
        story.append(Paragraph("No bias audit data provided.", st["body"]))

    story.append(Spacer(1, 5 * mm))
    story.append(_hr())

    # -----------------------------------------------------------------------
    # Section 4: EU AI Act Readiness Checklist
    # -----------------------------------------------------------------------
    story.append(Paragraph("EU AI Act Readiness Checklist", st["section_title"]))
    story.append(Spacer(1, 3 * mm))

    if checklist_items:
        for item in checklist_items:
            checked = bool(item.get("checked", False))
            label = str(item.get("label", ""))
            mark = "☑" if checked else "☐"
            style_key = "check_ok" if checked else "check_no"
            story.append(Paragraph(f"{mark}  {label}", st[style_key]))
    else:
        story.append(Paragraph("No checklist items provided.", st["body"]))

    story.append(Spacer(1, 8 * mm))
    story.append(_hr(color=MID_GREY, thickness=0.5))
    story.append(Spacer(1, 3 * mm))

    if is_detailed:
        story.append(Paragraph("Performance Metrics Overview", st["section_title"]))
        story.append(Spacer(1, 4 * mm))
        
        # Spider Chart
        acc = getattr(metrics, 'accuracy', 0) or 0
        sens = getattr(metrics, 'sensitivity', 0) or 0
        spec = getattr(metrics, 'specificity', 0) or 0
        prec = getattr(metrics, 'precision', 0) or 0
        f1 = getattr(metrics, 'f1', getattr(metrics, 'f1_score', 0)) or 0
        
        drawing = Drawing(400, 200)
        sc = SpiderChart()
        sc.x = 120
        sc.y = 20
        sc.width = 160
        sc.height = 160
        sc.data = [[acc * 100, sens * 100, spec * 100, prec * 100, f1 * 100]]
        sc.labels = ['Accuracy', 'Sensitivity', 'Specificity', 'Precision', 'F1 Score']
        sc.strands[0].fillColor = TEAL
        sc.strands[0].strokeColor = TEAL
        sc.strands[0].strokeWidth = 2
        
        drawing.add(sc)
        story.append(drawing)
        story.append(Spacer(1, 5 * mm))
        story.append(_hr())

        if confusion_matrix and len(confusion_matrix) > 0:
            story.append(Paragraph("Confusion Matrix Heatmap", st["section_title"]))
            story.append(Spacer(1, 3 * mm))
            
            # Find max val for color scaling
            max_val = max(max(row) for row in confusion_matrix) if confusion_matrix else 1
            if max_val == 0: max_val = 1
            
            headers = ["True \\ Pred"] + [f"Pred {i}" for i in range(len(confusion_matrix[0]))]
            cm_data = [headers]
            styles = [
                ("BACKGROUND", (0, 0), (-1, 0), LIGHT_GREY),
                ("TEXTCOLOR", (0, 0), (-1, 0), DARK_GREY),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("GRID", (0, 0), (-1, -1), 1, MID_GREY),
                ("BACKGROUND", (0, 1), (0, -1), LIGHT_GREY),
                ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
            ]
            
            for i, row in enumerate(confusion_matrix):
                cm_data.append([f"True {i}"] + row)
                for j, val in enumerate(row):
                    ratio = val / max_val
                    # Scale alpha between 0.05 and 0.9 depending on relative magnitude
                    alpha = max(0.05, ratio * 0.9)
                    cell_color = Color(13/255.0, 148/255.0, 136/255.0, alpha)
                    text_col = WHITE if ratio > 0.5 else DARK_GREY
                    styles.append(("BACKGROUND", (j+1, i+1), (j+1, i+1), cell_color))
                    styles.append(("TEXTCOLOR", (j+1, i+1), (j+1, i+1), text_col))
            
            cm_table = Table(cm_data, colWidths=[2.5*cm] + [1.5*cm]*len(confusion_matrix[0]))
            cm_table.setStyle(TableStyle(styles))
            story.append(cm_table)
            story.append(Spacer(1, 5 * mm))
            story.append(_hr())

        if feature_importance:
            story.append(Paragraph("AI Feature Importance Graphic", st["section_title"]))
            story.append(Spacer(1, 3 * mm))
            
            top_features = sorted(feature_importance, key=lambda x: x.get("importance", 0), reverse=True)[:8]
            top_features.reverse()  # For bottom-up drawing in HorizontalBarChart
            
            data = [[f.get("importance", 0) * 100 for f in top_features]]
            labels = [f.get("feature", "unknown") for f in top_features]
            
            drawing = Drawing(400, 200)
            bc = HorizontalBarChart()
            bc.x = 120
            bc.y = 20
            bc.height = 160
            bc.width = 250
            bc.data = data
            bc.categoryAxis.categoryNames = labels
            bc.categoryAxis.labels.boxAnchor = 'e'
            bc.categoryAxis.labels.dx = -5
            bc.categoryAxis.labels.fontSize = 8
            bc.valueAxis.valueMin = 0
            bc.valueAxis.valueMax = max(100, (max(data[0]) if data[0] else 100))
            bc.valueAxis.valueStep = 20
            bc.valueAxis.labels.fontSize = 8
            bc.bars[0].fillColor = TEAL
            bc.barSpacing = 2.5
            bc.categoryAxis.strokeWidth = 0.5
            bc.valueAxis.strokeWidth = 0.5
            
            drawing.add(bc)
            story.append(drawing)
            story.append(Spacer(1, 5 * mm))
            story.append(_hr())

        story.append(Paragraph("Detailed Model Configuration", st["section_title"]))
        story.append(Spacer(1, 3 * mm))
        
        # Format model params neatly
        if model_params:
            param_rows = [["Parameter", "Configured Value"]]
            for k, v in model_params.items():
                param_rows.append([str(k), str(v)])
            param_table = Table(param_rows, colWidths=[6 * cm, 6 * cm], hAlign="LEFT")
            param_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), NAVY),
                ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("GRID", (0, 0), (-1, -1), 0.5, MID_GREY),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_GREY]),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ]))
            story.append(param_table)
        else:
            story.append(Paragraph("Default configurations used.", st["body"]))
            
        story.append(Spacer(1, 5 * mm))
        story.append(_hr())

        if bias_summary and len(bias_summary) > 0:
            story.append(Paragraph("Subgroup Fairness Analysis", st["section_title"]))
            story.append(Spacer(1, 3 * mm))
            
            fairness_data = [["Subgroup", "Sensitivity", "Specificity"]]
            for g in bias_summary:
                group_name = g.get("name", "Unknown")
                sens = f"{g.get('sensitivity', 0)*100:.1f}%"
                spec = f"{g.get('specificity', 0)*100:.1f}%"
                fairness_data.append([group_name, sens, spec])
                
            ftable = Table(fairness_data, colWidths=[6*cm, 3.5*cm, 3.5*cm], hAlign="LEFT")
            ftable.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), LIGHT_GREY),
                ("TEXTCOLOR", (0, 0), (-1, 0), DARK_GREY),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("GRID", (0, 0), (-1, -1), 0.5, MID_GREY),
                ("ALIGN", (1, 0), (-1, -1), "CENTER"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_GREY]),
            ]))
            story.append(ftable)
            story.append(Spacer(1, 8 * mm))
            story.append(_hr())
            
        story.append(Spacer(1, 5 * mm))
        story.append(_hr())
        
        story.append(Paragraph("Clinical Interpretability Notes", st["section_title"]))
        story.append(Spacer(1, 3 * mm))
        story.append(Paragraph(
            "This model provides statistical associations and probabilistic predictions based purely on the historical training data "
            "provided during the experimental session. These outputs do not supersede clinical judgment and do not prove causal "
            "mechanisms. In a real-world setting, further verification against out-of-distribution demographic populations is required.", 
            st["body"]
        ))
        
        story.append(Spacer(1, 8 * mm))
        story.append(_hr(color=MID_GREY, thickness=0.5))
        story.append(Spacer(1, 3 * mm))

    # -----------------------------------------------------------------------
    # Footer
    # -----------------------------------------------------------------------
    story.append(
        Paragraph(
            "For educational purposes only. Not for clinical use. "
            "Generated by HEALTH-AI · ML Learning Tool · Erasmus+ KA220-HED",
            st["footer"],
        )
    )

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes


def _quality_label(v: float) -> str:
    """Human-readable quality description for a metric value."""
    if v >= 0.90:
        return "Excellent"
    if v >= 0.80:
        return "Good"
    if v >= 0.70:
        return "Acceptable"
    if v >= 0.60:
        return "Moderate"
    return "Needs improvement"
