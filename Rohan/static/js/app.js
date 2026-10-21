/**
 * Urban Traffic Flow Optimization - Interactive Dashboard Logic
 * Mini Project 4
 */

document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------
    // DOM ELEMENTS
    // -------------------------------------------------------------
    const form = document.getElementById('prediction-form');
    const hourSlider = document.getElementById('hour-slider');
    const hourDisplay = document.getElementById('hour-display');
    const dayPills = document.querySelectorAll('.day-pill');
    const dayInput = document.getElementById('day_of_week');
    const dayTypeBadge = document.getElementById('day-type-badge');
    
    const tempSlider = document.getElementById('temp-slider');
    const tempDisplay = document.getElementById('temp-display');
    const rainSlider = document.getElementById('rain-slider');
    const rainDisplay = document.getElementById('rain-display');
    const snowSlider = document.getElementById('snow-slider');
    const snowDisplay = document.getElementById('snow-display');
    const cloudsSlider = document.getElementById('clouds-slider');
    const cloudsDisplay = document.getElementById('clouds-display');
    
    const weatherSelect = document.getElementById('weather-select');
    const monthSelect = document.getElementById('month-select');
    const holidaySelect = document.getElementById('holiday-select');
    
    const togglePrecip = document.getElementById('toggle-precip');
    const precipContent = document.getElementById('precip-content');
    const precipChevron = document.getElementById('precip-chevron');
    
    const presetButtons = document.querySelectorAll('.preset-pill');
    const btnReset = document.getElementById('btn-reset');
    
    // Outputs
    const volumeDisplay = document.getElementById('predicted-volume');
    const gaugeFillArc = document.getElementById('gauge-fill-arc');
    const severityBadge = document.getElementById('severity-badge');
    const severityIcon = document.getElementById('severity-icon');
    const severityText = document.getElementById('severity-text');
    const adviceText = document.getElementById('advice-text');
    const statRegime = document.getElementById('stat-regime');
    const statWeatherImpact = document.getElementById('stat-weather-impact');
    const chartPeakVolume = document.getElementById('chart-peak-volume');
    
    // Canvas
    const canvas = document.getElementById('traffic-curve-canvas');
    const ctx = canvas.getContext('2d');

    let currentVolume = 0;
    let dayCurveData = [];

    // -------------------------------------------------------------
    // COLLAPSIBLE PRECIPITATION SECTION
    // -------------------------------------------------------------
    togglePrecip.addEventListener('click', () => {
        precipContent.classList.toggle('open');
        precipChevron.classList.toggle('fa-chevron-up');
        precipChevron.classList.toggle('fa-chevron-down');
    });

    // -------------------------------------------------------------
    // SLIDER & INPUT EVENT LISTENERS
    // -------------------------------------------------------------
    function formatHour(h) {
        const hourNum = parseInt(h);
        const period = hourNum >= 12 ? 'PM' : 'AM';
        const displayH = hourNum % 12 === 0 ? 12 : hourNum % 12;
        const padH = displayH < 10 ? '0' + displayH : displayH;
        
        let tag = '';
        if ((hourNum >= 7 && hourNum <= 9) || (hourNum >= 16 && hourNum <= 18)) {
            tag = ' <small>(Rush Hour)</small>';
        } else if (hourNum >= 0 && hourNum <= 4) {
            tag = ' <small style="color:#64748b">(Off-Peak)</small>';
        }
        return `${padH}:00 ${period}${tag}`;
    }

    hourSlider.addEventListener('input', (e) => {
        hourDisplay.innerHTML = formatHour(e.target.value);
        debouncePredict();
    });

    tempSlider.addEventListener('input', (e) => {
        const c = parseFloat(e.target.value);
        const f = (c * 9/5 + 32).toFixed(1);
        tempDisplay.innerHTML = `${c.toFixed(1)}°C <small>(${f}°F)</small>`;
        debouncePredict();
    });

    rainSlider.addEventListener('input', (e) => {
        rainDisplay.textContent = `${parseFloat(e.target.value).toFixed(1)} mm`;
        debouncePredict();
    });

    snowSlider.addEventListener('input', (e) => {
        snowDisplay.textContent = `${parseFloat(e.target.value).toFixed(1)} mm`;
        debouncePredict();
    });

    cloudsSlider.addEventListener('input', (e) => {
        cloudsDisplay.textContent = `${e.target.value}%`;
        debouncePredict();
    });

    weatherSelect.addEventListener('change', debouncePredict);
    monthSelect.addEventListener('change', debouncePredict);
    holidaySelect.addEventListener('change', debouncePredict);

    // DAY PILLS
    dayPills.forEach(pill => {
        pill.addEventListener('click', () => {
            dayPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            const dayVal = parseInt(pill.getAttribute('data-day'));
            dayInput.value = dayVal;
            
            const isWeekend = dayVal >= 5;
            dayTypeBadge.textContent = isWeekend ? 'Weekend' : 'Weekday';
            dayTypeBadge.className = isWeekend ? 'value-chip chip-weekend' : 'value-chip chip-weekday';
            
            debouncePredict();
        });
    });

    // -------------------------------------------------------------
    // PRESET SCENARIOS
    // -------------------------------------------------------------
    const presets = {
        'morning-rush': {
            hour: 8,
            day: 1, // Tuesday
            month: 10,
            weather: 'Rain',
            temp: 6.0,
            rain: 3.5,
            snow: 0.0,
            clouds: 90,
            holiday: 0
        },
        'midday-freeflow': {
            hour: 13,
            day: 2, // Wednesday
            month: 6,
            weather: 'Clear',
            temp: 24.0,
            rain: 0.0,
            snow: 0.0,
            clouds: 10,
            holiday: 0
        },
        'evening-peak': {
            hour: 17,
            day: 4, // Friday
            month: 9,
            weather: 'Clouds',
            temp: 19.5,
            rain: 0.0,
            snow: 0.0,
            clouds: 60,
            holiday: 0
        },
        'winter-blizzard': {
            hour: 8,
            day: 0, // Monday
            month: 1,
            weather: 'Snow',
            temp: -16.0,
            rain: 0.0,
            snow: 2.2,
            clouds: 100,
            holiday: 0
        },
        'weekend-leisure': {
            hour: 15,
            day: 6, // Sunday
            month: 7,
            weather: 'Clear',
            temp: 26.0,
            rain: 0.0,
            snow: 0.0,
            clouds: 20,
            holiday: 0
        },
        'holiday': {
            hour: 12,
            day: 3, // Thursday
            month: 11,
            weather: 'Clouds',
            temp: 2.0,
            rain: 0.0,
            snow: 0.0,
            clouds: 75,
            holiday: 1
        }
    };

    presetButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            presetButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const presetKey = btn.getAttribute('data-preset');
            const p = presets[presetKey];
            if (p) {
                applyPreset(p);
            }
        });
    });

    function applyPreset(p) {
        hourSlider.value = p.hour;
        hourDisplay.innerHTML = formatHour(p.hour);

        dayInput.value = p.day;
        dayPills.forEach(pill => {
            const d = parseInt(pill.getAttribute('data-day'));
            pill.classList.toggle('active', d === p.day);
        });
        const isWeekend = p.day >= 5;
        dayTypeBadge.textContent = isWeekend ? 'Weekend' : 'Weekday';
        dayTypeBadge.className = isWeekend ? 'value-chip chip-weekend' : 'value-chip chip-weekday';

        monthSelect.value = p.month;
        weatherSelect.value = p.weather;
        holidaySelect.value = p.holiday;

        tempSlider.value = p.temp;
        const f = (p.temp * 9/5 + 32).toFixed(1);
        tempDisplay.innerHTML = `${p.temp.toFixed(1)}°C <small>(${f}°F)</small>`;

        rainSlider.value = p.rain;
        rainDisplay.textContent = `${p.rain.toFixed(1)} mm`;

        snowSlider.value = p.snow;
        snowDisplay.textContent = `${p.snow.toFixed(1)} mm`;

        cloudsSlider.value = p.clouds;
        cloudsDisplay.textContent = `${p.clouds}%`;

        predictTraffic();
    }

    btnReset.addEventListener('click', () => {
        applyPreset(presets['morning-rush']);
        presetButtons.forEach(b => b.classList.remove('active'));
        document.querySelector('[data-preset="morning-rush"]').classList.add('active');
    });

    // -------------------------------------------------------------
    // PREDICTION DEBOUNCE
    // -------------------------------------------------------------
    let debounceTimer;
    function debouncePredict() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            predictTraffic();
        }, 120);
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        predictTraffic();
    });

    // -------------------------------------------------------------
    // CALL BACKEND API
    // -------------------------------------------------------------
    async function predictTraffic() {
        const payload = {
            hour: parseInt(hourSlider.value),
            day_of_week: parseInt(dayInput.value),
            month: parseInt(monthSelect.value),
            year: 2018,
            is_holiday: parseInt(holidaySelect.value),
            temp_c: parseFloat(tempSlider.value),
            rain_1h: parseFloat(rainSlider.value),
            snow_1h: parseFloat(snowSlider.value),
            clouds_all: parseInt(cloudsSlider.value),
            weather_main: weatherSelect.value
        };

        try {
            const resp = await fetch('/api/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await resp.json();
            if (data.success) {
                renderResults(data);
            }
        } catch (err) {
            console.error('Prediction API Error:', err);
        }
    }

    // -------------------------------------------------------------
    // RENDER RESULTS TO DOM
    // -------------------------------------------------------------
    function renderResults(data) {
        const targetVol = data.predicted_volume;
        animateNumber(currentVolume, targetVol, 500, (val) => {
            volumeDisplay.textContent = val.toLocaleString();
        });
        currentVolume = targetVol;

        // Speedometer Arc Update
        // Semicircle length is ~251.2
        const maxCapacity = 7200;
        const ratio = Math.min(Math.max(targetVol / maxCapacity, 0), 1);
        const arcLength = 251.2;
        const newOffset = arcLength * (1 - ratio);
        gaugeFillArc.style.strokeDashoffset = newOffset;

        // Classification & Advice
        const cls = data.classification;
        severityText.textContent = `${cls.level} (${cls.badge.split('(')[1].replace(')', '')})`;
        severityBadge.className = `severity-badge badge-${cls.severity}`;
        severityIcon.className = cls.icon;
        adviceText.textContent = cls.advice;

        // Regime Stat
        const h = parseInt(hourSlider.value);
        if (h >= 7 && h <= 9) {
            statRegime.textContent = 'Morning Peak (Rush)';
        } else if (h >= 16 && h <= 18) {
            statRegime.textContent = 'Evening Peak (Rush)';
        } else if (h >= 11 && h <= 14) {
            statRegime.textContent = 'Midday Steady';
        } else if (h >= 0 && h <= 4) {
            statRegime.textContent = 'Night Trough (Low)';
        } else {
            statRegime.textContent = 'Transitional Flow';
        }

        // Weather Impact Stat
        const w = weatherSelect.value;
        const rain = parseFloat(rainSlider.value);
        const snow = parseFloat(snowSlider.value);
        if (w === 'Squall' || snow > 1.0) {
            statWeatherImpact.textContent = '-30% Severe Drag';
        } else if (w === 'Thunderstorm' || w === 'Snow' || rain > 5.0) {
            statWeatherImpact.textContent = '-20% Capacity';
        } else if (w === 'Rain' || w === 'Fog' || w === 'Mist') {
            statWeatherImpact.textContent = '-12% Delay Risk';
        } else {
            statWeatherImpact.textContent = 'Optimal Flow (0%)';
        }

        // 24-Hour Curve
        dayCurveData = data.day_curve || [];
        if (dayCurveData.length > 0) {
            const maxDayVol = Math.max(...dayCurveData.map(d => d.volume));
            chartPeakVolume.textContent = `~${Math.round(maxDayVol).toLocaleString()} veh/hr`;
            drawTrafficCurve(dayCurveData, h);
        }
    }

    // Number counting animation
    function animateNumber(start, end, duration, callback) {
        const startTime = performance.now();
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentVal = Math.round(start + (end - start) * easeOut);
            callback(currentVal);
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        requestAnimationFrame(update);
    }

    // -------------------------------------------------------------
    // CANVAS 24-HOUR TRAFFIC CURVE CHART
    // -------------------------------------------------------------
    function setupCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
    }

    function drawTrafficCurve(curveData, selectedHour) {
        const rect = canvas.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        ctx.clearRect(0, 0, width, height);

        if (!curveData || curveData.length === 0) return;

        const padLeft = 35;
        const padRight = 15;
        const padTop = 15;
        const padBottom = 25;

        const graphW = width - padLeft - padRight;
        const graphH = height - padTop - padBottom;
        const maxVal = 6800;

        // 1. Draw Rush Hour Shaded Bands
        const x7 = padLeft + (7 / 23) * graphW;
        const x9 = padLeft + (9 / 23) * graphW;
        const x16 = padLeft + (16 / 23) * graphW;
        const x18 = padLeft + (18 / 23) * graphW;

        ctx.fillStyle = 'rgba(245, 158, 11, 0.08)';
        ctx.fillRect(x7, padTop, x9 - x7, graphH);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
        ctx.fillRect(x16, padTop, x18 - x16, graphH);

        // 2. Horizontal Gridlines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.fillStyle = '#64748b';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';

        const gridSteps = [0, 2000, 4000, 6000];
        gridSteps.forEach(val => {
            const y = padTop + graphH - (val / maxVal) * graphH;
            ctx.beginPath();
            ctx.moveTo(padLeft, y);
            ctx.lineTo(width - padRight, y);
            ctx.stroke();
            ctx.fillText(`${val / 1000}k`, padLeft - 6, y + 3);
        });

        // 3. Compute Points for Smooth Curve
        const points = curveData.map((d, i) => {
            const x = padLeft + (i / 23) * graphW;
            const y = padTop + graphH - (d.volume / maxVal) * graphH;
            return { x, y };
        });

        // 4. Fill Gradient Under Curve
        const gradient = ctx.createLinearGradient(0, padTop, 0, padTop + graphH);
        gradient.addColorStop(0, 'rgba(6, 182, 212, 0.35)');
        gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.15)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

        ctx.beginPath();
        ctx.moveTo(points[0].x, padTop + graphH);
        ctx.lineTo(points[0].x, points[0].y);

        for (let i = 0; i < points.length - 1; i++) {
            const xc = (points[i].x + points[i + 1].x) / 2;
            const yc = (points[i].y + points[i + 1].y) / 2;
            ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.lineTo(points[points.length - 1].x, padTop + graphH);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // 5. Draw Glowing Curve Line
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 0; i < points.length - 1; i++) {
            const xc = (points[i].x + points[i + 1].x) / 2;
            const yc = (points[i].y + points[i + 1].y) / 2;
            ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // 6. Draw Selected Hour Vertical Highlight & Glowing Node
        if (selectedHour >= 0 && selectedHour <= 23) {
            const selP = points[selectedHour];

            // Vertical indicator line
            ctx.beginPath();
            ctx.setLineDash([3, 3]);
            ctx.moveTo(selP.x, padTop);
            ctx.lineTo(selP.x, padTop + graphH);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.setLineDash([]);

            // Outer pulsing glow
            ctx.beginPath();
            ctx.arc(selP.x, selP.y, 9, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(6, 182, 212, 0.3)';
            ctx.fill();

            // Inner solid dot
            ctx.beginPath();
            ctx.arc(selP.x, selP.y, 4.5, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // 7. X-Axis Time Labels
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'center';
        const hoursToShow = [0, 4, 8, 12, 16, 20, 23];
        hoursToShow.forEach(h => {
            const x = padLeft + (h / 23) * graphW;
            ctx.fillText(`${h}:00`, x, height - 6);
        });
    }

    window.addEventListener('resize', () => {
        setupCanvas();
        if (dayCurveData.length > 0) {
            drawTrafficCurve(dayCurveData, parseInt(hourSlider.value));
        }
    });

    // -------------------------------------------------------------
    // INITIALIZATION
    // -------------------------------------------------------------
    setupCanvas();
    predictTraffic();
});
