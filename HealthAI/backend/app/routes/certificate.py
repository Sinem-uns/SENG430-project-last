"""
Certificate generation route for the HEALTH-AI ML Learning Tool.

POST /api/certificate  – generate PDF certificate, return base64-encoded string.
"""
from __future__ import annotations

import base64
import logging

from fastapi import APIRouter, HTTPException

from app.schemas.api import CertificateRequest, CertificateResponse
from app.services import pdf_generator

router = APIRouter(tags=["certificate"])
logger = logging.getLogger(__name__)


@router.post("/generate-certificate", response_model=CertificateResponse)
async def generate_certificate(req: CertificateRequest) -> CertificateResponse:
    """
    Generate a polished A4 PDF certificate that summarises the user's ML
    learning journey, model performance, bias audit, and EU AI Act checklist.

    Returns the PDF as a base64-encoded string inside a JSON response:
        { "pdf_base64": "<base64 string>" }
    """
    try:
        pdf_bytes = pdf_generator.generate_certificate(
            domain_label=req.domain_label,
            model_type=req.model_type,
            model_params=req.model_params,
            metrics=req.metrics,
            bias_summary=req.bias_summary,
            checklist_items=[item.model_dump() for item in req.checklist_items],
            generated_at=req.generated_at,
        )
    except Exception as exc:
        logger.exception("PDF generation failed.")
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {exc}")

    pdf_b64 = base64.b64encode(pdf_bytes).decode("utf-8")
    return CertificateResponse(pdf_base64=pdf_b64)

@router.post("/generate-detailed-certificate", response_model=CertificateResponse)
async def generate_detailed_certificate_route(req: CertificateRequest) -> CertificateResponse:
    try:
        pdf_bytes = pdf_generator.generate_certificate(
            domain_label=req.domain_label,
            model_type=req.model_type,
            model_params=req.model_params,
            metrics=req.metrics,
            confusion_matrix=req.confusion_matrix,
            bias_summary=req.bias_summary,
            checklist_items=[item.model_dump() for item in req.checklist_items],
            generated_at=req.generated_at,
            is_detailed=True,
            feature_importance=req.feature_importance,
        )
    except Exception as exc:
        logger.exception("Detailed PDF generation failed.")
        raise HTTPException(status_code=500, detail=f"Detailed PDF generation failed: {exc}")

    pdf_b64 = base64.b64encode(pdf_bytes).decode("utf-8")
    return CertificateResponse(pdf_base64=pdf_b64)

