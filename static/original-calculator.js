'use strict';
function calculateOriginal(v){
 const positive=['R','L','netLoad','ratedCapacity','craneWeight','gbc'];
 const zero=['pivotHeight','hook','rigging','cable','extra'];
 for(const k of [...positive,...zero,'soilSF'])if(typeof v[k]!=='number'||!Number.isFinite(v[k]))throw Error('กรุณากรอกตัวเลขให้ครบถ้วน');
 if(positive.some(k=>v[k]<=0)||zero.some(k=>v[k]<0)||v.soilSF<1)throw Error('ค่าตัวเลขต้องอยู่ในช่วงที่กำหนด (Safety Factor ≥1)');
 if(v.R>=v.L)throw Error('รัศมี R ต้องน้อยกว่าความยาวบูม L');
 const thetaRad=Math.acos(v.R/v.L),thetaDeg=thetaRad*180/Math.PI,tipHeight=v.pivotHeight+Math.sqrt(v.L*v.L-v.R*v.R);
 const totalGrossLoad=v.netLoad+v.hook+v.rigging+v.cable+v.extra,utilization=Number((totalGrossLoad/v.ratedCapacity*100).toFixed(10)),margin=v.ratedCapacity-totalGrossLoad;
 const maxPointLoad=(v.craneWeight+totalGrossLoad)*.75,requiredMatArea=maxPointLoad*v.soilSF/v.gbc,matDimension=Math.ceil(Math.sqrt(requiredMatArea)*10)/10;
 const out={...v,thetaDeg,tipHeight,totalGrossLoad,utilization,margin,maxPointLoad,requiredMatArea,matDimension};
 if(Object.values(out).some(x=>!Number.isFinite(x)))throw Error('ตัวเลขสูงเกินขอบเขตการคำนวณ');
 return out;
}
function readPlanNumbers(){const ids={R:'inputRadius',L:'inputBoomLength',pivotHeight:'inputPivotHeight',netLoad:'loadNet',hook:'loadHook',rigging:'loadRigging',cable:'loadCable',extra:'loadExtra',ratedCapacity:'inputRatedCapacity',craneWeight:'inputCraneWeight',soilSF:'inputSoilSF'};const v={};for(const[k,id]of Object.entries(ids)){const raw=document.getElementById(id).value;v[k]=raw.trim()===''?NaN:Number(raw);}const soil=document.getElementById('selectSoilType').value;v.gbc=soil==='custom'?(document.getElementById('inputCustomGBC').value.trim()===''?NaN:Number(document.getElementById('inputCustomGBC').value)):Number(soil);return v;}
function invalidatePlan(reason){window.currentPlanValid=false;document.getElementById('printPlan').disabled=true;const err=document.getElementById('geometryError');err.textContent=reason;err.classList.remove('hidden');document.getElementById('craneSvg').style.visibility='hidden';for(const id of ['quickAngle','quickHeight','quickGross','quickPointLoad','grossBadge','displayTotalGross','displayPercentage','displayMargin','displayPointLoad','displayMatArea','displayMatDim'])document.getElementById(id).textContent='—';document.getElementById('utilizationProgressBar').style.width='0%';document.getElementById('badgeStatusHeader').textContent='ข้อมูลไม่ครบ / ไม่ถูกต้อง';document.getElementById('safetyStatusTitle').textContent='ยังประเมินไม่ได้';document.getElementById('safetyStatusDesc').textContent=reason;}
function printPlan(){recalculateAll();if(window.currentPlanValid)window.print();}
if(typeof module!=='undefined')module.exports={calculateOriginal};
