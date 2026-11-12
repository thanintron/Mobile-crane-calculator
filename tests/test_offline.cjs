const assert=require('node:assert/strict');
const fs=require('node:fs');
const {calculateLocal,CRANE_MODELS}=require('../static/calculator.js');
const base={crane_model:'TADANO_GR500EX',boom_length_m:17,working_radius_m:8,net_load_ton:5,hook_weight_ton:.5,rigging_weight_ton:.2,wire_fall_deduction_ton:.1,jib_deduction_ton:0,ground_bearing_capacity_ton_m2:15,soil_safety_factor:1.25};
const r=calculateLocal(base);assert.equal(r.total_gross_load_ton,5.8);assert.equal(r.rated_capacity_ton,15);assert.equal(r.utilization_rate_pct,38.67);
for(const [boom,radii]of Object.entries(CRANE_MODELS.TADANO_GR500EX.chart))for(const [radius,capacity]of Object.entries(radii)){assert.equal(calculateLocal({...base,boom_length_m:+boom,working_radius_m:+radius}).rated_capacity_ton,capacity);}
for(const change of [{working_radius_m:1},{boom_length_m:50},{working_radius_m:17},{net_load_ton:-1},{net_load_ton:NaN},{net_load_ton:Infinity},{soil_safety_factor:.5},{crane_model:'missing'}])assert.throws(()=>calculateLocal({...base,...change}));
const app=fs.readFileSync('static/app.js','utf8');assert.ok(!/fetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket/.test(app));
assert.ok(app.includes('window.print()'));assert.ok(app.includes('localStorage.setItem'));
const sw=fs.readFileSync('static/sw.js','utf8');assert.ok(sw.includes('/static/calculator.js'));
console.log('Offline calculation: all chart points, invalid inputs, no plan network calls, local print and shell coverage passed');
