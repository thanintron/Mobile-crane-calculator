import io
import math
import base64
import qrcode
from datetime import datetime, date
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML

app = FastAPI(
    title="Mobile Crane Lifting Plan & Safety API",
    version="1.0.0",
    description="Backend API สำหรับคำนวณและออกรายงาน Lifting Plan ตามกฎหมายไทย"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

env = Environment(loader=FileSystemLoader("templates"))

LOAD_CHART_DATABASE = {
    "TADANO_GR500EX": {
        "name": "TADANO GR-500EX (50 Ton)",
        "max_capacity_ton": 50.0,
        "crane_dead_weight_ton": 39.5,
        "chart": {
            10.7: {3.0: 50.0, 3.5: 45.0, 4.0: 39.5, 5.0: 30.5, 6.0: 24.0, 8.0: 15.2},
            17.0: {4.0: 35.0, 5.0: 29.5, 6.0: 23.5, 8.0: 15.0, 10.0: 10.4, 12.0: 7.5},
            24.0: {5.0: 24.0, 6.0: 21.0, 8.0: 14.5, 10.0: 10.0, 14.0: 5.6, 18.0: 3.2},
            31.0: {7.0: 14.0, 8.0: 13.5, 10.0: 9.8, 14.0: 5.4, 18.0: 3.0, 22.0: 1.8},
            38.0: {9.0: 8.5, 10.0: 8.0, 14.0: 5.0, 18.0: 2.8, 22.0: 1.6, 26.0: 0.8}
        }
    }
}

class LiftCalculationRequest(BaseModel):
    crane_model: str = Field("TADANO_GR500EX")
    boom_length_m: float = Field(..., gt=0)
    working_radius_m: float = Field(..., gt=0)
    net_load_ton: float = Field(..., gt=0)
    hook_weight_ton: float = Field(0.5, ge=0)
    rigging_weight_ton: float = Field(0.2, ge=0)
    wire_fall_deduction_ton: float = Field(0.1, ge=0)
    jib_deduction_ton: float = Field(0.0, ge=0)
    ground_bearing_capacity_ton_m2: float = Field(15.0, gt=0)
    soil_safety_factor: float = Field(1.25, ge=1.0)
    wind_speed_kmh: Optional[float] = Field(15.0, ge=0)
    pj2_inspection_date: Optional[date] = None
    certified_engineer_no: Optional[str] = None
    planner_name: Optional[str] = None
    safety_officer_name: Optional[str] = None
    engineer_name: Optional[str] = None

def get_rated_capacity(model: str, boom: float, radius: float) -> float:
    if model not in LOAD_CHART_DATABASE:
        raise HTTPException(status_code=400, detail=f"ไม่พบสเปกเครนรุ่น: {model}")
    chart = LOAD_CHART_DATABASE[model]["chart"]
    available_booms = sorted(chart.keys())
    target_boom = next((b for b in available_booms if b >= boom), None)
    if not target_boom:
        raise HTTPException(status_code=400, detail=f"ความยาวบูม {boom} ม. เกินขอบเขตตาราง")
    radius_data = chart[target_boom]
    available_radii = sorted(radius_data.keys())
    if radius > available_radii[-1]:
        raise HTTPException(status_code=400, detail=f"รัศมี {radius} ม. เกินระยะทำงานสูงสุด")
    target_radius = next((r for r in available_radii if r >= radius), None)
    return radius_data[target_radius]

def generate_qr_base64(data_text: str) -> str:
    qr = qrcode.QRCode(version=1, box_size=4, border=1)
    qr.add_data(data_text)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")

@app.post("/api/v1/crane/calculate")
async def calculate_lift(req: LiftCalculationRequest):
    if req.working_radius_m >= req.boom_length_m:
        raise HTTPException(status_code=422, detail="รัศมีทำงาน (R) ต้องน้อยกว่าความยาวบูม (L)")
    
    cos_theta = req.working_radius_m / req.boom_length_m
    boom_angle_deg = math.degrees(math.acos(cos_theta))
    lifting_height_m = (req.boom_length_m * math.sqrt(1 - cos_theta**2)) + 2.0
    
    total_gross = req.net_load_ton + req.hook_weight_ton + req.rigging_weight_ton + req.wire_fall_deduction_ton + req.jib_deduction_ton
    rated_capacity = get_rated_capacity(req.crane_model, req.boom_length_m, req.working_radius_m)
    utilization_rate = (total_gross / rated_capacity) * 100.0
    
    dead_weight = LOAD_CHART_DATABASE[req.crane_model]["crane_dead_weight_ton"]
    total_system_weight = dead_weight + total_gross
    max_point_load = total_system_weight * 0.75
    required_mat_area = (max_point_load * req.soil_safety_factor) / req.ground_bearing_capacity_ton_m2
    side_m = math.ceil(math.sqrt(required_mat_area) * 10) / 10
    
    return {
        "boom_angle_deg": round(boom_angle_deg, 1),
        "lifting_height_m": round(lifting_height_m, 2),
        "total_gross_load_ton": round(total_gross, 2),
        "rated_capacity_ton": round(rated_capacity, 2),
        "utilization_rate_pct": round(utilization_rate, 2),
        "max_point_load_ton": round(max_point_load, 2),
        "required_mat_area_m2": round(required_mat_area, 2),
        "recommended_mat_dim": f"{side_m:.1f} x {side_m:.1f} ม."
    }

@app.post("/api/v1/crane/export-pdf")
async def export_pdf(req: LiftCalculationRequest):
    calc = await calculate_lift(req)
    template = env.get_template("lifting_plan_template.html")
    
    util = calc["utilization_rate_pct"]
    status_class = "DANGER" if util > 100 else ("CRITICAL" if util >= 75 else "SAFE")
    status_label = "OVERLOAD PROHIBITED" if util > 100 else ("CRITICAL LIFT" if util >= 75 else "APPROVED LIFT")
    
    plan_id = f"LP-{datetime.now().strftime('%Y%m%d-%H%M')}"
    qr_b64 = generate_qr_base64(f"https://safety.verify/lift?id={plan_id}")
    
    render_data = {
        "plan_id": plan_id,
        "date_str": datetime.now().strftime("%d/%m/%Y %H:%M"),
        "status_class": status_class,
        "status_label": status_label,
        "qr_base64": qr_b64,
        "data": {**req.dict(), **calc, "crane_name": LOAD_CHART_DATABASE[req.crane_model]["name"]}
    }
    
    rendered_html = template.render(**render_data)
    pdf_bytes = HTML(string=rendered_html).write_pdf()
    
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={plan_id}.pdf"}
    )
