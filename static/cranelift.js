// Presets database
    const PRESETS = {
      standard: {
        radius: 10.0,
        boomLength: 25.0,
        pivotHeight: 2.2,
        net: 12.00,
        hook: 0.80,
        rigging: 0.40,
        cable: 0.15,
        extra: 0.15,
        ratedCapacity: 18.00,
        craneWeight: 30.0,
        soilValue: 25
      },
      critical: {
        radius: 14.0,
        boomLength: 30.0,
        pivotHeight: 2.4,
        net: 18.50,
        hook: 1.10,
        rigging: 0.65,
        cable: 0.25,
        extra: 0.20,
        ratedCapacity: 24.00,
        craneWeight: 45.0,
        soilValue: 15
      },
      overload: {
        radius: 18.0,
        boomLength: 28.0,
        pivotHeight: 2.2,
        net: 15.00,
        hook: 0.90,
        rigging: 0.50,
        cable: 0.20,
        extra: 0.20,
        ratedCapacity: 14.50,
        craneWeight: 36.0,
        soilValue: 10
      }
    };

    function recalculateAll() {
      let result;
      try { result = calculateOriginal(readPlanNumbers()); }
      catch(error) { invalidatePlan(error.message); return; }
      window.currentPlanValid = true;
      document.getElementById('printPlan').disabled=false;
      document.getElementById('geometryError').classList.add('hidden');
      document.getElementById('craneSvg').style.visibility='visible';
      const {R,L,thetaDeg,tipHeight,netLoad,totalGrossLoad,ratedCapacity,utilization,margin,maxPointLoad,requiredMatArea,matDimension}=result;
      // 5. Update Quick Badges and Text Fields
      document.getElementById('quickAngle').textContent = thetaDeg.toFixed(1) + '°';
      document.getElementById('quickHeight').textContent = tipHeight.toFixed(1) + ' m';
      document.getElementById('quickGross').textContent = totalGrossLoad.toFixed(2) + ' t';
      document.getElementById('quickPointLoad').textContent = maxPointLoad.toFixed(1) + ' t';

      document.getElementById('grossBadge').textContent = 'Total: ' + totalGrossLoad.toFixed(2) + ' t';
      document.getElementById('displayTotalGross').textContent = totalGrossLoad.toFixed(2);

      document.getElementById('displayPercentage').textContent = utilization.toFixed(1);
      document.getElementById('displayMargin').textContent = (margin >= 0 ? '+' : '') + margin.toFixed(2) + ' t';

      const progressBar = document.getElementById('utilizationProgressBar');
      const progressWidth = Math.min(100, Math.max(0, utilization));
      progressBar.style.width = progressWidth + '%';

      // Update Outrigger Results UI
      document.getElementById('displayPointLoad').textContent = maxPointLoad.toFixed(2) + ' ตัน';
      document.getElementById('displayMatArea').textContent = requiredMatArea.toFixed(2) + ' ตร.ม.';
      document.getElementById('displayMatDim').innerHTML = `${matDimension.toFixed(1)} &times; ${matDimension.toFixed(1)} ม.`;

      // 6. Update Visual Safety Indicators & Dynamic SVG
      updateSafetyIndicators(utilization);
      updateSvgDiagram(R, L, thetaDeg, tipHeight, netLoad, matDimension);
    }

    function updateSafetyIndicators(utilization) {
      const percentageText = document.getElementById('displayPercentage');
      const progressBar = document.getElementById('utilizationProgressBar');
      const statusHeader = document.getElementById('badgeStatusHeader');
      const statusBox = document.getElementById('safetyStatusBox');
      const statusTitle = document.getElementById('safetyStatusTitle');
      const statusDesc = document.getElementById('safetyStatusDesc');
      const statusIcon = document.getElementById('safetyStatusIcon');

      progressBar.className = 'h-full rounded-full trans-smooth';
      percentageText.className = 'text-4xl md:text-5xl font-black font-mono-eng trans-smooth';
      statusBox.className = 'mt-4 p-3.5 rounded-xl border trans-smooth flex items-start gap-3 ';

      if (utilization <= 75.0) {
        percentageText.classList.add('text-emerald-600');
        progressBar.classList.add('bg-emerald-500');
        statusHeader.className = 'text-xs px-2.5 py-0.5 rounded-full font-bold font-mono-eng bg-emerald-50 text-emerald-700 border border-emerald-200';
        statusHeader.textContent = '≤75% • DRAFT';

        statusBox.classList.add('border-emerald-200', 'bg-emerald-50');
        statusTitle.className = 'text-xs md:text-sm font-bold text-emerald-900';
        statusTitle.textContent = 'อัตราใช้พิกัด ≤75% — รอทบทวนแผน';
        statusDesc.textContent = 'สีแสดงช่วงการใช้พิกัดเท่านั้น ไม่ยืนยันความปลอดภัยหรืออนุมัติงานยก ต้องทบทวนข้อมูลจริงและข้อกำหนดของพื้นที่';
        statusIcon.className = 'mt-0.5 text-emerald-600 flex-shrink-0';
        statusIcon.innerHTML = '<i data-lucide="check-circle-2" class="w-5 h-5"></i>';
      } 
      else if (utilization > 75.0 && utilization <= 90.0) {
        percentageText.classList.add('text-amber-600');
        progressBar.classList.add('bg-amber-500');
        statusHeader.className = 'text-xs px-2.5 py-0.5 rounded-full font-bold font-mono-eng bg-amber-50 text-amber-700 border border-amber-200';
        statusHeader.textContent = '75–90% • REVIEW';

        statusBox.classList.add('border-amber-200', 'bg-amber-50');
        statusTitle.className = 'text-xs md:text-sm font-bold text-amber-900';
        statusTitle.textContent = 'อัตราใช้พิกัด >75–90% — ต้องทบทวน';
        statusDesc.textContent = 'ให้ผู้รับผิดชอบประเมินตามเกณฑ์งานยกของพื้นที่และคู่มือผู้ผลิต ระบบยังไม่อนุมัติงานยก';
        statusIcon.className = 'mt-0.5 text-amber-600 flex-shrink-0';
        statusIcon.innerHTML = '<i data-lucide="alert-triangle" class="w-5 h-5"></i>';
      } 
      else if (utilization > 90.0 && utilization <= 100.0) {
        percentageText.classList.add('text-orange-600');
        progressBar.classList.add('bg-orange-500');
        statusHeader.className = 'text-xs px-2.5 py-0.5 rounded-full font-bold font-mono-eng bg-orange-50 text-orange-700 border border-orange-200';
        statusHeader.textContent = 'HIGH RISK (90% - 100%)';

        statusBox.classList.add('border-orange-200', 'bg-orange-50');
        statusTitle.className = 'text-xs md:text-sm font-bold text-orange-900';
        statusTitle.textContent = 'สถานะ: ความเสี่ยงสูงมาก ปัจจัยเผื่อความปลอดภัยต่ำมาก (High Risk)';
        statusDesc.textContent = 'อัตราใช้พิกัดใกล้เต็มค่าที่กรอก ต้องให้ผู้รับผิดชอบทบทวนแผนและข้อจำกัดของเครื่องก่อนดำเนินงาน';
        statusIcon.className = 'mt-0.5 text-orange-600 flex-shrink-0';
        statusIcon.innerHTML = '<i data-lucide="alert-octagon" class="w-5 h-5"></i>';
      } 
      else {
        percentageText.classList.add('text-rose-600', 'animate-pulse');
        progressBar.classList.add('bg-rose-600');
        statusHeader.className = 'text-xs px-2.5 py-0.5 rounded-full font-bold font-mono-eng bg-rose-50 text-rose-700 border border-rose-200 animate-pulse';
        statusHeader.textContent = 'OVERLOAD DANGER (>100%)';

        statusBox.classList.add('border-rose-300', 'bg-rose-50');
        statusTitle.className = 'text-xs md:text-sm font-bold text-rose-900';
        statusTitle.textContent = 'อันตรายสูงสุด: ห้ามทำการยกโดยเด็ดขาด! (Overload Exceeded)';
        statusDesc.textContent = 'น้ำหนักรวมเกินพิกัดความจุของเครนตาม Load Chart มีความเสี่ยงต่อการที่บูมหัก หรือ เครนล้มคว่ำทันที ไม่อนุญาตให้ทำการยก';
        statusIcon.className = 'mt-0.5 text-rose-600 flex-shrink-0';
        statusIcon.innerHTML = '<i data-lucide="skull" class="w-5 h-5"></i>';
      }

      if (window.lucide) lucide.createIcons();
    }

    function updateSvgDiagram(R, L, angleDeg, tipHeight, netLoad, matDim) {
      const pivotX = 130;
      const pivotY = 330;
      const groundY = 400;
      const scale = Math.min(7.5, 290 / Math.max(L, 1), 290 / Math.max(R, 1));

      let headX = pivotX + (R * scale);
      if (headX > 450) headX = 450;
      if (headX < pivotX + 25) headX = pivotX + 25;

      const angleRad = (angleDeg * Math.PI) / 180;
      let headY = pivotY - (L * scale * Math.sin(angleRad));
      if (headY < 40) headY = 40;
      if (headY > pivotY) headY = pivotY - 10;

      // Boom lines
      document.getElementById('boomLine').setAttribute('x1', pivotX);
      document.getElementById('boomLine').setAttribute('y1', pivotY);
      document.getElementById('boomLine').setAttribute('x2', headX);
      document.getElementById('boomLine').setAttribute('y2', headY);

      document.getElementById('boomInnerLine').setAttribute('x1', pivotX);
      document.getElementById('boomInnerLine').setAttribute('y1', pivotY);
      document.getElementById('boomInnerLine').setAttribute('x2', headX);
      document.getElementById('boomInnerLine').setAttribute('y2', headY);

      document.getElementById('boomHead').setAttribute('cx', headX);
      document.getElementById('boomHead').setAttribute('cy', headY);

      // Dimension L
      const nx = -Math.sin(angleRad) * 18;
      const ny = -Math.cos(angleRad) * 18;
      const dimL = document.getElementById('dimBoomLine');
      const dimText = document.getElementById('dimBoomText');
      dimL.setAttribute('x1', pivotX + nx);
      dimL.setAttribute('y1', pivotY + ny);
      dimL.setAttribute('x2', headX + nx);
      dimL.setAttribute('y2', headY + ny);

      const midLx = (pivotX + headX) / 2 + nx * 1.5;
      const midLy = (pivotY + headY) / 2 + ny * 1.5;
      dimText.setAttribute('x', midLx);
      dimText.setAttribute('y', midLy);
      dimText.setAttribute('transform', `rotate(${-angleDeg} ${midLx} ${midLy})`);
      dimText.textContent = `L = ${L.toFixed(1)} m`;

      // Angle Arc
      const arcR = 38;
      const arcEndX = pivotX + arcR * Math.cos(angleRad);
      const arcEndY = pivotY - arcR * Math.sin(angleRad);
      document.getElementById('angleArc').setAttribute('d', `M ${pivotX + arcR} ${pivotY} A ${arcR} ${arcR} 0 0 0 ${arcEndX} ${arcEndY}`);
      document.getElementById('angleLabel').textContent = `θ = ${angleDeg.toFixed(1)}°`;

      // Cable and Hook
      const hookY = Math.min(groundY - 100, Math.max(headY + 45, 230));
      const hoist = document.getElementById('hoistLine');
      hoist.setAttribute('x1', headX);
      hoist.setAttribute('y1', headY);
      hoist.setAttribute('x2', headX);
      hoist.setAttribute('y2', hookY);

      document.getElementById('hookBlockGroup').setAttribute('transform', `translate(${headX - 8}, ${hookY})`);

      // Rigging Slings & Suspended Load
      const hookBottomY = hookY + 36;
      const loadTopY = hookBottomY + 30;
      document.getElementById('sling1').setAttribute('x1', headX);
      document.getElementById('sling1').setAttribute('y1', hookBottomY);
      document.getElementById('sling1').setAttribute('x2', headX - 30);
      document.getElementById('sling1').setAttribute('y2', loadTopY);

      document.getElementById('sling2').setAttribute('x1', headX);
      document.getElementById('sling2').setAttribute('y1', hookBottomY);
      document.getElementById('sling2').setAttribute('x2', headX + 30);
      document.getElementById('sling2').setAttribute('y2', loadTopY);

      document.getElementById('loadGroup').setAttribute('transform', `translate(${headX - 40}, ${loadTopY})`);
      document.getElementById('loadWeightBadge').textContent = netLoad.toFixed(2) + ' t';

      // Dimension R
      document.getElementById('radiusLine').setAttribute('x1', pivotX);
      document.getElementById('radiusLine').setAttribute('x2', headX);
      document.getElementById('radiusText').setAttribute('x', (pivotX + headX) / 2);
      document.getElementById('radiusText').textContent = `Working Radius (R) = ${R.toFixed(1)} m`;

      // Dimension H
      const hGuideX = 460;
      document.getElementById('heightLine').setAttribute('x1', hGuideX);
      document.getElementById('heightLine').setAttribute('x2', hGuideX);
      document.getElementById('heightLine').setAttribute('y1', groundY);
      document.getElementById('heightLine').setAttribute('y2', headY);
      document.getElementById('heightText').setAttribute('y', (groundY + headY) / 2);
      document.getElementById('heightText').setAttribute('transform', `rotate(90 ${hGuideX + 15} ${(groundY + headY) / 2})`);
      document.getElementById('heightText').textContent = `Tip Height H = ${tipHeight.toFixed(1)} m`;

      // Visual Outrigger Mat sizing dynamically
      const matVisualWidth = Math.max(30, Math.min(80, matDim * 28));
      const matRear = document.getElementById('visualMatRear');
      const matFront = document.getElementById('visualMatFront');
      matRear.setAttribute('width', matVisualWidth);
      matRear.setAttribute('x', 65 - matVisualWidth / 2);
      matFront.setAttribute('width', matVisualWidth);
      matFront.setAttribute('x', 195 - matVisualWidth / 2);
    }

    function onSoilSelectChange() {
      const select = document.getElementById('selectSoilType');
      const customWrap = document.getElementById('customSoilWrap');
      if (select.value === 'custom') {
        customWrap.classList.remove('hidden');
      } else {
        customWrap.classList.add('hidden');
      }
      recalculateAll();
    }

    function checkCertValidity() {
      document.getElementById('chkCertValid').checked=false;
    }

    function loadPreset(type) {
      const p = PRESETS[type];
      if (!p) return;

      document.getElementById('inputRadius').value = p.radius.toFixed(1);
      document.getElementById('inputBoomLength').value = p.boomLength.toFixed(1);
      document.getElementById('inputPivotHeight').value = p.pivotHeight.toFixed(1);

      document.getElementById('loadNet').value = p.net.toFixed(2);
      document.getElementById('loadHook').value = p.hook.toFixed(2);
      document.getElementById('loadRigging').value = p.rigging.toFixed(2);
      document.getElementById('loadCable').value = p.cable.toFixed(2);
      document.getElementById('loadExtra').value = p.extra.toFixed(2);

      document.getElementById('inputRatedCapacity').value = p.ratedCapacity.toFixed(2);
      document.getElementById('inputCraneWeight').value = p.craneWeight.toFixed(1);

      document.getElementById('selectSoilType').value = p.soilValue.toString();
      document.getElementById('customSoilWrap').classList.add('hidden');

      recalculateAll();
    }

    function openModal(id) {
      document.getElementById(id).classList.remove('hidden');
    }

    function closeModal(id) {
      document.getElementById(id).classList.add('hidden');
    }

    // Initialize application on load
    window.onload = function() {
      const now = new Date();
      restoreDeviceDraft();

      if (window.lucide) lucide.createIcons();
      recalculateAll();
    };
  