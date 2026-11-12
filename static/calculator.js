'use strict';
const CRANE_MODELS={"TADANO_GR500EX": {"name": "TADANO GR-500EX (50 Ton)", "max_capacity_ton": 50.0, "crane_dead_weight_ton": 39.5, "chart": {"10.7": {"3.0": 50.0, "3.5": 45.0, "4.0": 39.5, "5.0": 30.5, "6.0": 24.0, "8.0": 15.2}, "17.0": {"4.0": 35.0, "5.0": 29.5, "6.0": 23.5, "8.0": 15.0, "10.0": 10.4, "12.0": 7.5}, "24.0": {"5.0": 24.0, "6.0": 21.0, "8.0": 14.5, "10.0": 10.0, "14.0": 5.6, "18.0": 3.2}, "31.0": {"7.0": 14.0, "8.0": 13.5, "10.0": 9.8, "14.0": 5.4, "18.0": 3.0, "22.0": 1.8}, "38.0": {"9.0": 8.5, "10.0": 8.0, "14.0": 5.0, "18.0": 2.8, "22.0": 1.6, "26.0": 0.8}}}};

for(const m of Object.values(CRANE_MODELS))m.chart=Object.fromEntries(Object.entries(m.chart).map(([b,rs])=>[Number(b),Object.fromEntries(Object.entries(rs).map(([r,c])=>[Number(r),c]))]));
function calculateLocal(req){
 const positive=['boom_length_m','working_radius_m','net_load_ton','ground_bearing_capacity_ton_m2'];
 const nonnegative=['hook_weight_ton','rigging_weight_ton','wire_fall_deduction_ton','jib_deduction_ton'];
 for(const n of [...positive,...nonnegative,'soil_safety_factor'])if(typeof req[n]!=='number'||!Number.isFinite(req[n]))throw Error('กรุณาระบุตัวเลขให้ครบถ้วน');
 if(positive.some(n=>req[n]<=0)||nonnegative.some(n=>req[n]<0)||req.soil_safety_factor<1)throw Error('ค่าตัวเลขอยู่นอกช่วงที่กำหนด');
 const model=CRANE_MODELS[req.crane_model];if(!model)throw Error('ไม่พบรุ่นปั้นจั่น');
 const boom=req.boom_length_m,radius=req.working_radius_m;
 if(radius>=boom)throw Error('รัศมีทำงานต้องน้อยกว่าความยาวบูม');
 const booms=Object.keys(model.chart).map(Number).sort((a,b)=>a-b);
 if(boom<booms[0])throw Error('ความยาวบูมต่ำกว่าขอบเขตข้อมูลตัวอย่าง');
 const b=booms.find(x=>x>=boom);if(b===undefined)throw Error('ความยาวบูมเกินขอบเขตตาราง');
 const radii=Object.keys(model.chart[b]).map(Number).sort((a,b)=>a-b);
 if(radius<radii[0])throw Error('รัศมีต่ำกว่าขอบเขตข้อมูลตัวอย่างของช่วงบูมนี้');
 const r=radii.find(x=>x>=radius);if(r===undefined)throw Error('รัศมีเกินขอบเขตตาราง');
 const gross=req.net_load_ton+nonnegative.reduce((s,n)=>s+req[n],0),rated=model.chart[b][r];
 const point=(model.crane_dead_weight_ton+gross)*.75,area=point*req.soil_safety_factor/req.ground_bearing_capacity_ton_m2;
 const round=(n,d=2)=>Number(n.toFixed(d)),side=Math.ceil(Math.sqrt(area)*10)/10;
 const result={total_gross_load_ton:round(gross),rated_capacity_ton:rated,utilization_rate_pct:round(gross/rated*100),boom_angle_deg:round(Math.acos(radius/boom)*180/Math.PI,1),lifting_height_m:round(Math.sqrt(boom*boom-radius*radius)+2),max_point_load_ton:round(point),required_mat_area_m2:round(area),recommended_mat_dim:side.toFixed(1)+' x '+side.toFixed(1)+' ม.'};
 if(Object.values(result).some(v=>typeof v==='number'&&!Number.isFinite(v)))throw Error('ค่าตัวเลขสูงเกินขอบเขตการคำนวณ');
 return result;
}
if(typeof module!=='undefined')module.exports={CRANE_MODELS,calculateLocal};
