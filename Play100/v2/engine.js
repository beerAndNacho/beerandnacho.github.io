(() => {
  'use strict';

  const catalog = window.PLAY100_CATALOG || [];
  const slug =
    window.PLAY100_SLUG ||
    location.pathname.split('/').filter(Boolean).pop();
  const game = catalog.find((entry) => entry.slug === slug);

  if (!game) {
    document.body.innerHTML =
      '<main style="padding:32px;font-family:system-ui">게임 데이터를 찾지 못했습니다.</main>';
    return;
  }

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escapeHtml = (value) =>
    String(value).replace(/[&<>"']/g, (char) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      })[char]
    );

  let seed = (() => {
    let hash = 2166136261;
    for (const char of game.slug) {
      hash ^= char.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  })();

  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const icons = ['◈', '◆', '●', '▲', '■', '✦', '✹', '⬢', '✧', '⬡', '⌁', '◎'];

  let stage = 1;
  let score = 0;
  let combo = 0;
  let lives = 3;
  let seconds = 75;
  let timerId = 0;
  let ended = false;
  let cleanup = () => {};
  let transitionId = 0;

  document.documentElement.style.cssText = `--bg:${game.palette[0]};--paper:${game.palette[1]};--accent:${game.palette[2]};--ink:${game.palette[3]}`;
  document.title = `${game.title} — PLAY100 GAME-${String(game.id).padStart(3, '0')}`;

  function environmentMarkup() {
    const environment = game.environments[(stage - 1) % game.environments.length];
    return (
      `<div class="world-title">${escapeHtml(environment)}</div>` +
      game.objects
        .slice(0, 8)
        .map(
          (object, index) => `
            <div
              class="world-object"
              style="left:${7 + (index % 4) * 23}%;top:${45 + ((index * 37) % 120)}px;animation-delay:${index * 0.18}s"
            >
              <b>${icons[(index + game.id) % icons.length]}</b>${escapeHtml(object)}
            </div>`
        )
        .join('')
    );
  }

  document.body.innerHTML = `
    <div class="game-shell">
      <header class="topbar">
        <a class="brand" href="/Play100/"><i></i>PLAY100</a>
        <div class="top-meta">
          <span>GAME-${String(game.id).padStart(3, '0')}</span>
          <span>${escapeHtml(game.category)}</span>
          <a href="/Play100/">전체 게임</a>
        </div>
      </header>
      <main class="layout">
        <section class="brief">
          <div class="eyebrow"><span>${escapeHtml(game.role)}</span><span>·</span><span>${escapeHtml(game.duration)}</span></div>
          <h1>${escapeHtml(game.title)}</h1>
          <p>${escapeHtml(game.description)}</p>
          <div class="role">당신의 역할 · ${escapeHtml(game.role)}</div>
          <div class="verbs">${game.verbs.map((verb) => `<span>${escapeHtml(verb)}</span>`).join('')}</div>
          <div class="world" id="world">${environmentMarkup()}</div>
          <div class="mission-log">
            <h3>TITLE-SPECIFIC MATERIALS</h3>
            <div class="object-list">${game.objects.map((object) => `<span class="object-chip">${escapeHtml(object)}</span>`).join('')}</div>
          </div>
          <p class="footer-note">마우스·터치·키보드 지원 · 기록은 이 브라우저에 저장됩니다.</p>
        </section>
        <section class="play">
          <div class="hud">
            <div><span>STAGE</span><strong id="stage">1 / 5</strong></div>
            <div><span>SCORE</span><strong id="score">0</strong></div>
            <div><span>COMBO</span><strong id="combo">0</strong></div>
            <div><span>TIME</span><strong id="time">75</strong></div>
          </div>
          <div class="game-panel" id="panel"></div>
        </section>
      </main>
    </div>`;

  const panel = $('#panel');

  function updateHud() {
    const stageElement = $('#stage');
    const scoreElement = $('#score');
    const comboElement = $('#combo');
    const timeElement = $('#time');
    const worldElement = $('#world');
    if (stageElement) stageElement.textContent = `${stage} / ${game.stages || 5}`;
    if (scoreElement) scoreElement.textContent = String(score);
    if (comboElement) comboElement.textContent = String(combo);
    if (timeElement) timeElement.textContent = String(seconds);
    if (worldElement) worldElement.innerHTML = environmentMarkup();
  }

  function playTone(success = true) {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const context = new AudioContextClass();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = success ? 620 : 130;
      gain.gain.value = 0.045;
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.08);
      oscillator.addEventListener('ended', () => context.close());
    } catch {
      // Audio is optional.
    }
  }

  function burst(x, y) {
    for (let index = 0; index < 10; index += 1) {
      const particle = document.createElement('i');
      particle.className = 'particle';
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.setProperty('--dx', `${random() * 140 - 70}px`);
      particle.style.setProperty('--dy', `${random() * 110 - 80}px`);
      panel.appendChild(particle);
      setTimeout(() => particle.remove(), 700);
    }
  }

  function setFeedback(message, success = true) {
    const element = $('.feedback', panel);
    if (element) element.textContent = message;
    playTone(success);
    if (!success) {
      panel.classList.add('shake');
      setTimeout(() => panel.classList.remove('shake'), 260);
    }
  }

  function reward(points = 100, message = '좋습니다.') {
    if (ended) return;
    score += points + combo * 15;
    combo += 1;
    setFeedback(message, true);
    updateHud();
  }

  function penalize(message = '다시 판단해 보세요.') {
    if (ended) return;
    combo = 0;
    lives -= 1;
    setFeedback(message, false);
    updateHud();
    if (lives <= 0) finish(false);
  }

  function advance(delay = 550) {
    if (ended) return;
    clearTimeout(transitionId);
    transitionId = setTimeout(() => {
      if (ended) return;
      if (stage >= (game.stages || 5)) {
        finish(true);
        return;
      }
      stage += 1;
      cleanup();
      cleanup = () => {};
      renderMode();
      updateHud();
    }, delay);
  }

  function finish(won) {
    if (ended) return;
    ended = true;
    clearInterval(timerId);
    clearTimeout(transitionId);
    cleanup();
    cleanup = () => {};

    const medal = score >= 900 ? 'GOLD' : score >= 600 ? 'SILVER' : 'BRONZE';
    const key = `play100:${game.slug}`;
    let previous = {};
    try {
      previous = JSON.parse(localStorage.getItem(key) || '{}');
      localStorage.setItem(
        key,
        JSON.stringify({
          score: Math.max(previous.score || 0, score),
          medal,
          completed: Boolean(won || previous.completed),
          at: new Date().toISOString()
        })
      );
    } catch {
      // Saving is optional.
    }

    panel.insertAdjacentHTML(
      'beforeend',
      `<div class="overlay"><div><div class="eyebrow">MISSION REPORT</div><h3>${won ? '완료' : '근무 종료'}</h3><p>${escapeHtml(game.title)} · ${score}점 · ${medal}</p><button id="restart">다시 플레이</button></div></div>`
    );

    $('#restart', panel)?.addEventListener('click', () => {
      stage = 1;
      score = 0;
      combo = 0;
      lives = 3;
      seconds = 75;
      ended = false;
      start();
    });
  }

  function startTimer() {
    clearInterval(timerId);
    seconds = 75;
    timerId = setInterval(() => {
      if (ended) return;
      seconds -= 1;
      updateHud();
      if (seconds <= 0) finish(false);
    }, 1000);
  }

  function common(title, instruction, body) {
    panel.innerHTML = `<h2>${escapeHtml(title)}</h2><p class="instruction">${escapeHtml(instruction)}</p><div class="feedback"></div>${body}`;
  }

  function deductionMode() {
    const traits = ['붉은 표식', '젖은 흔적', '새벽 기록', '왼쪽 구역', '금속 소리', '푸른 문서'];
    const candidates = Array.from({ length: 4 }, (_, index) => ({
      name: game.objects[(index + stage) % game.objects.length],
      first: traits[(index + stage) % traits.length],
      second: traits[(index * 2 + stage + 1) % traits.length]
    }));
    const targetIndex = Math.floor(random() * candidates.length);
    const target = candidates[targetIndex];
    const recordNumber = stage + game.id;

    common(
      '단서 세 개를 만족하는 대상을 찾으세요.',
      `${game.role}로서 모순 없는 후보 하나를 지목합니다.`,
      `<div class="clues"><div class="clue">단서 1 · ${escapeHtml(target.first)}</div><div class="clue">단서 2 · ${escapeHtml(target.second)}</div><div class="clue">단서 3 · 기록 번호 ${recordNumber}</div></div><div class="cards">${candidates
        .map(
          (candidate, index) => `<button class="candidate" data-index="${index}"><b>${escapeHtml(candidate.name)}</b><small>${escapeHtml(candidate.first)} · ${escapeHtml(candidate.second)} · 기록 ${index === targetIndex ? recordNumber : recordNumber + index + 2}</small></button>`
        )
        .join('')}</div>`
    );

    $$('.candidate', panel).forEach((button) => {
      button.addEventListener('click', (event) => {
        if (Number(button.dataset.index) === targetIndex) {
          reward(150, '단서가 정확히 일치합니다.');
          burst(event.offsetX, event.offsetY);
          advance();
        } else {
          penalize('이 후보는 단서와 충돌합니다.');
        }
      });
    });
  }

  function networkMode() {
    const size = 25;
    const target = Array.from(
      { length: size },
      (_, index) => ((index + stage + game.id) % 4 === 0) || index % 6 === 0
    );
    const state = [...target];
    const solutionClicks = [];

    const affected = (index) =>
      [index, index - 1, index + 1, index - 5, index + 5].filter(
        (next) =>
          next >= 0 &&
          next < size &&
          !(index % 5 === 0 && next === index - 1) &&
          !(index % 5 === 4 && next === index + 1)
      );

    const toggle = (index) => {
      for (const next of affected(index)) state[next] = !state[next];
    };

    const scrambleCount = 4 + stage;
    for (let move = 0; move < scrambleCount; move += 1) {
      const index = Math.floor(random() * size);
      toggle(index);
      solutionClicks.push(index);
    }

    common(
      '전체 경로를 활성화하세요.',
      `${game.objects[0]}에서 ${game.objects[3]}까지 필수 신호를 켭니다.`,
      `<div class="grid">${state
        .map(
          (active, index) => `<button class="cell ${active ? 'on' : ''}" data-index="${index}">${target[index] ? '◆' : '·'}</button>`
        )
        .join('')}</div><div class="button-row" style="margin-top:14px"><button class="action primary" id="check">연결 검사</button><button class="action" id="hint">힌트</button></div>`
    );

    const cells = $$('.cell', panel);
    const redraw = () =>
      cells.forEach((cell, index) => cell.classList.toggle('on', state[index]));

    cells.forEach((cell) => {
      cell.addEventListener('click', () => {
        toggle(Number(cell.dataset.index));
        redraw();
      });
    });

    $('#hint', panel)?.addEventListener('click', () => {
      const index = solutionClicks.find((candidate) => {
        const copy = [...state];
        for (const next of affected(candidate)) copy[next] = !copy[next];
        const before = state.filter((value, i) => value !== target[i]).length;
        const after = copy.filter((value, i) => value !== target[i]).length;
        return after < before;
      });
      const targetCell = cells[index ?? solutionClicks[0] ?? 0];
      targetCell?.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.2)' }, { transform: 'scale(1)' }],
        500
      );
    });

    $('#check', panel)?.addEventListener('click', () => {
      if (target.every((value, index) => value === state[index])) {
        reward(180, '신호망이 연결됐습니다.');
        advance();
      } else {
        penalize('꺼져 있거나 불필요하게 켜진 노드가 있습니다.');
      }
    });
  }

  function gearMode() {
    const count = 4;
    const targets = Array.from({ length: count }, (_, index) => (index * 2 + stage + game.id) % 8);
    const values = targets.map((target) => (target + 1 + Math.floor(random() * 6)) % 8);

    common(
      '표식을 모두 정렬하세요.',
      `${game.objects[0]}과 ${game.objects[1]}의 회전 관계를 맞춥니다.`,
      `<div class="rotors">${values
        .map(
          (value, index) => `<div class="rotor"><button class="action" data-direction="-1" data-index="${index}">−</button><div><strong>${escapeHtml(game.objects[index])}</strong><div class="dial" id="dial${index}" style="transform:rotate(${value * 45}deg)"></div><small>목표 표식 ${targets[index]}</small></div><button class="action" data-direction="1" data-index="${index}">+</button></div>`
        )
        .join('')}</div><button class="action primary" id="check" style="margin-top:14px">가동 시험</button>`
    );

    $$('[data-direction]', panel).forEach((button) => {
      button.addEventListener('click', () => {
        const index = Number(button.dataset.index);
        values[index] = (values[index] + Number(button.dataset.direction) + 8) % 8;
        const dial = $(`#dial${index}`, panel);
        if (dial) dial.style.transform = `rotate(${values[index] * 45}deg)`;
      });
    });

    $('#check', panel)?.addEventListener('click', () => {
      if (values.every((value, index) => value === targets[index])) {
        reward(180, '기계가 정확히 움직입니다.');
        advance();
      } else {
        penalize('표식이 아직 맞지 않습니다.');
      }
    });
  }

  function spatialMode() {
    const tiles = Array.from({ length: 15 }, (_, index) => index + 1).concat(0);
    let blank = 15;

    const neighbors = (index) =>
      [index - 1, index + 1, index - 4, index + 4].filter(
        (next) =>
          next >= 0 &&
          next < 16 &&
          !(index % 4 === 0 && next === index - 1) &&
          !(index % 4 === 3 && next === index + 1)
      );

    let previousBlank = -1;
    for (let move = 0; move < 45 + stage * 4; move += 1) {
      const options = neighbors(blank).filter((next) => next !== previousBlank);
      const next = options[Math.floor(random() * options.length)];
      [tiles[blank], tiles[next]] = [tiles[next], tiles[blank]];
      previousBlank = blank;
      blank = next;
    }

    common(
      '빈칸을 이용해 순서를 복원하세요.',
      `${game.objects[0]}부터 ${game.objects[3]}까지 동선으로 배치합니다.`,
      '<div class="slider-board"></div><button class="action primary" id="check" style="margin-top:14px">배치 검사</button>'
    );

    const draw = () => {
      const board = $('.slider-board', panel);
      board.innerHTML = tiles
        .map(
          (value, index) => `<button class="tile ${value === 0 ? 'blank' : ''}" data-index="${index}">${value ? escapeHtml(game.objects[(value - 1) % game.objects.length]) : ''}</button>`
        )
        .join('');
      $$('.tile', board).forEach((tile) => {
        tile.addEventListener('click', () => {
          const index = Number(tile.dataset.index);
          if (!neighbors(blank).includes(index)) return;
          [tiles[blank], tiles[index]] = [tiles[index], tiles[blank]];
          blank = index;
          draw();
        });
      });
    };

    draw();
    $('#check', panel)?.addEventListener('click', () => {
      if (tiles.every((value, index) => value === (index === 15 ? 0 : index + 1))) {
        reward(220, '배치가 완성됐습니다.');
        advance();
      } else {
        penalize('아직 순서가 맞지 않습니다.');
      }
    });
  }

  function arcadeMode() {
    common(
      '대상을 모으고 위험을 피하세요.',
      `${game.objects[0]}을 움직여 노란 목표를 획득합니다.`,
      `<div class="arena" id="arena"><div class="player" id="player">${icons[game.id % icons.length]}</div><div class="target" id="target">✦</div><div class="hazard" id="hazard">×</div></div><div class="touch-controls"><button id="left">← 이동</button><button id="right">이동 →</button></div>`
    );

    const arena = $('#arena', panel);
    const player = $('#player', panel);
    const target = $('#target', panel);
    const hazard = $('#hazard', panel);
    let x = 30;
    let y = 220;
    let targetX = 250;
    let targetY = 220 + Math.sin((targetX + stage * 20) / 70) * 45;
    let hazardX = 420;
    let hazardY = 210;
    let frameId = 0;
    let captured = 0;

    const place = () => {
      player.style.left = `${x}px`;
      player.style.top = `${y}px`;
      target.style.left = `${targetX}px`;
      target.style.top = `${targetY}px`;
      hazard.style.left = `${hazardX}px`;
      hazard.style.top = `${hazardY}px`;
    };

    const chooseTarget = () => {
      targetX = 70 + random() * Math.max(120, arena.clientWidth - 140);
      targetY = 220 + Math.sin((targetX + stage * 20) / 70) * 45;
    };

    const move = (direction) => {
      x = Math.max(0, Math.min(arena.clientWidth - 46, x + direction * 34));
      y = 220 + Math.sin((x + stage * 20) / 70) * 45;
      place();
    };

    const handleKey = (event) => {
      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') move(-1);
      if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') move(1);
    };

    addEventListener('keydown', handleKey);
    $('#left', panel).onpointerdown = () => move(-1);
    $('#right', panel).onpointerdown = () => move(1);

    const tick = () => {
      if (ended) return;
      hazardX -= 2 + stage * 0.4;
      if (hazardX < -50) {
        hazardX = arena.clientWidth + 50;
        hazardY = 160 + random() * 100;
      }
      if (Math.hypot(x - targetX, y - targetY) < 46) {
        captured += 1;
        reward(120, '목표를 확보했습니다.');
        chooseTarget();
        if (captured >= 3) advance(250);
      }
      if (Math.hypot(x - hazardX, y - hazardY) < 43) {
        penalize('위험물과 충돌했습니다.');
        hazardX = arena.clientWidth + 60;
      }
      place();
      frameId = requestAnimationFrame(tick);
    };

    chooseTarget();
    place();
    tick();
    cleanup = () => {
      removeEventListener('keydown', handleKey);
      cancelAnimationFrame(frameId);
    };
  }

  function rhythmMode() {
    let frameId = 0;
    let hits = 0;
    common(
      '빛이 중앙에 겹칠 때 탭하세요.',
      `${game.objects[0]}의 박자를 읽고 정확도를 유지합니다.`,
      '<div class="arena" style="background:var(--ink)"><div id="pulse" style="position:absolute;left:50%;top:50%;width:70px;height:70px;border:5px solid var(--accent);border-radius:50%;transform:translate(-50%,-50%)"></div><div style="position:absolute;left:50%;top:50%;width:84px;height:84px;border:2px solid white;border-radius:50%;transform:translate(-50%,-50%)"></div></div><button class="action primary" id="tap" style="width:100%;margin-top:10px;min-height:60px">BEAT TAP</button>'
    );

    const pulse = $('#pulse', panel);
    const loop = (time) => {
      const progress = (time % 1100) / 1100;
      pulse.style.transform = `translate(-50%,-50%) scale(${0.25 + progress * 1.4})`;
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);

    $('#tap', panel)?.addEventListener('click', (event) => {
      const error = Math.abs((performance.now() % 1100) / 1100 - 0.54);
      if (error < 0.16) {
        hits += 1;
        reward(error < 0.07 ? 180 : 120, error < 0.07 ? 'PERFECT' : 'GOOD');
        burst(event.offsetX, event.offsetY);
        if (hits >= 4) advance(250);
      } else {
        penalize('박자 원이 중앙선에서 벗어났습니다.');
      }
    });

    cleanup = () => cancelAnimationFrame(frameId);
  }

  function wordMode() {
    const answer = game.objects[(stage + game.id) % Math.min(8, game.objects.length)];
    const options = [
      answer,
      ...game.objects
        .filter((object) => object !== answer)
        .sort(() => random() - 0.5)
        .slice(0, 3)
    ].sort(() => random() - 0.5);

    common(
      '설명에 맞는 낱말을 고르세요.',
      `${game.description} — ${game.category} 세계의 핵심 소재를 찾습니다.`,
      `<div class="choice-grid">${options
        .map(
          (option, index) => `<button class="choice" data-answer="${escapeHtml(option)}"><b>${escapeHtml(option)}</b><small>${escapeHtml(game.objects[(index + 2) % game.objects.length])}와 연결</small></button>`
        )
        .join('')}</div>`
    );

    $$('.choice', panel).forEach((button) => {
      button.addEventListener('click', (event) => {
        if (button.dataset.answer === answer) {
          reward(140, '정확한 낱말입니다.');
          burst(event.offsetX, event.offsetY);
          advance();
        } else {
          penalize('설명과 직접 연결되는 낱말이 아닙니다.');
        }
      });
    });
  }

  function cozyMode() {
    let meters = [40, 55, 30];
    let turn = 0;
    common(
      '세 공간을 돌보며 하루를 완성하세요.',
      `${game.objects[0]}·${game.objects[1]}·${game.objects[2]}의 상태를 균형 있게 유지합니다.`,
      `<div class="stations">${[0, 1, 2]
        .map(
          (index) => `<div class="station"><strong>${escapeHtml(game.objects[index])}</strong><div class="meter"><i id="meter${index}" style="width:${meters[index]}%"></i></div><button data-index="${index}">${escapeHtml(game.verbs[index])}</button></div>`
        )
        .join('')}</div><p class="instruction">8턴 동안 모두 20 이상을 지키세요.</p>`
    );

    $$('.station button', panel).forEach((button) => {
      button.addEventListener('click', () => {
        const selected = Number(button.dataset.index);
        meters = meters.map((value, index) =>
          Math.max(0, Math.min(100, value + (index === selected ? 28 : -8 - random() * 7)))
        );
        turn += 1;
        meters.forEach((value, index) => {
          const meter = $(`#meter${index}`, panel);
          if (meter) meter.style.width = `${value}%`;
        });
        if (meters.some((value) => value <= 0)) {
          penalize('한 공간의 상태가 무너졌습니다.');
        } else {
          reward(45, '작은 공간이 안정됐습니다.');
          if (turn >= 8) advance(250);
        }
      });
    });
  }

  function managementMode() {
    let values = [55, 40, 65, 35];
    let resources = 7;
    let turn = 1;

    common(
      '제한 자원을 네 구역에 배분하세요.',
      `${game.objects[0]} 운영. 모든 구역을 25 이상으로 유지합니다.`,
      '<div class="clue">턴 <b id="turn">1</b> / 5 · 남은 자원 <b id="resources">7</b></div><div class="lanes"></div><button class="action primary" id="end-turn" style="margin-top:14px">턴 마감</button>'
    );

    const draw = () => {
      const lanes = $('.lanes', panel);
      lanes.innerHTML = values
        .map(
          (value, index) => `<div class="lane"><div><strong>${escapeHtml(game.objects[index])}</strong><div class="meter"><i style="width:${value}%"></i></div></div><div class="lane-controls"><button data-index="${index}" data-direction="-1">−</button><button data-index="${index}" data-direction="1">+</button></div></div>`
        )
        .join('');
      $$('.lane-controls button', lanes).forEach((button) => {
        button.addEventListener('click', () => {
          const index = Number(button.dataset.index);
          const direction = Number(button.dataset.direction);
          if (direction > 0 && resources > 0) {
            values[index] += 12;
            resources -= 1;
          } else if (direction < 0 && values[index] > 12) {
            values[index] -= 12;
            resources += 1;
          }
          values[index] = Math.max(0, Math.min(100, values[index]));
          $('#resources', panel).textContent = String(resources);
          draw();
        });
      });
    };

    draw();
    $('#end-turn', panel)?.addEventListener('click', () => {
      values = values.map((value) => value - (8 + Math.floor(random() * 18)));
      if (values.some((value) => value < 25)) {
        penalize('수요를 감당하지 못한 구역이 있습니다.');
        values = values.map((value) => Math.max(30, value + 12));
      } else {
        reward(110, '운영이 안정적으로 이어집니다.');
      }
      turn += 1;
      resources = Math.min(9, resources + 5);
      if (turn > 5) {
        advance(250);
        return;
      }
      $('#turn', panel).textContent = String(turn);
      $('#resources', panel).textContent = String(resources);
      draw();
    });
  }

  function cardsMode() {
    let health = 70;
    let enemy = 65;
    let energy = 3;
    let turn = 1;
    const actions = [
      ['강한 행동', 24, 3],
      ['안정 행동', 14, 2],
      ['회복 행동', -18, 2]
    ];

    const draw = () => {
      common(
        `${game.objects[0]} 전략 턴 ${turn}`,
        `${game.objects[1]}의 반응을 읽고 카드 한 장을 고릅니다.`,
        `<div class="story-stats"><div>내 상태 <b>${health}</b></div><div>상대 상태 <b>${enemy}</b></div><div>에너지 <b>${energy}</b></div></div><div class="cards">${actions
          .map(
            (action, index) => `<button class="card" data-index="${index}"><b>${escapeHtml(action[0])}</b><small>효과 ${action[1] > 0 ? `-${action[1]}` : `+${-action[1]}`} · 비용 ${action[2]}</small></button>`
          )
          .join('')}</div>`
      );

      $$('.card', panel).forEach((button) => {
        button.addEventListener('click', () => {
          const action = actions[Number(button.dataset.index)];
          if (energy < action[2]) {
            penalize('에너지가 부족합니다.');
            return;
          }
          energy -= action[2];
          if (action[1] > 0) enemy -= action[1] + Math.floor(random() * 8);
          else health = Math.min(100, health - action[1]);
          health -= 8 + Math.floor(random() * 13);
          energy = Math.min(5, energy + 2);
          turn += 1;

          if (enemy <= 0) {
            reward(240, '전략이 통했습니다.');
            advance(300);
          } else if (health <= 0) {
            penalize('상대 대응에 밀렸습니다.');
          } else {
            draw();
          }
        });
      });
    };

    draw();
  }

  function duelMode() {
    let leftScore = 0;
    let rightScore = 0;
    let ready = false;
    let cueTimeout = 0;

    common(
      '신호가 켜진 뒤 먼저 입력하세요.',
      '왼쪽 A키 / 오른쪽 L키. 터치 버튼도 지원합니다.',
      `<div class="duel-stage"><div class="fighter"><strong>LEFT</strong><p>${escapeHtml(game.objects[0])}</p><button id="left-fighter">A / 탭</button><b id="left-score">0</b></div><div class="cue" id="cue">WAIT</div><div class="fighter"><strong>RIGHT</strong><p>${escapeHtml(game.objects[1])}</p><button id="right-fighter">L / 탭</button><b id="right-score">0</b></div></div>`
    );

    const round = () => {
      ready = false;
      $('#cue', panel).textContent = 'WAIT';
      clearTimeout(cueTimeout);
      cueTimeout = setTimeout(() => {
        ready = true;
        $('#cue', panel).textContent = 'NOW!';
        playTone();
      }, 800 + random() * 1800);
    };

    const hit = (side) => {
      if (!ready) {
        if (side === 'left') rightScore += 1;
        else leftScore += 1;
        setFeedback('성급한 입력입니다.', false);
      } else {
        if (side === 'left') leftScore += 1;
        else rightScore += 1;
        setFeedback(side === 'left' ? '왼쪽 선점!' : '오른쪽 선점!');
      }
      $('#left-score', panel).textContent = String(leftScore);
      $('#right-score', panel).textContent = String(rightScore);
      if (leftScore >= 5 || rightScore >= 5) {
        score += Math.max(leftScore, rightScore) * 100;
        advance(250);
      } else {
        round();
      }
    };

    const handleKey = (event) => {
      if (event.key.toLowerCase() === 'a') hit('left');
      if (event.key.toLowerCase() === 'l') hit('right');
    };
    addEventListener('keydown', handleKey);
    $('#left-fighter', panel).onclick = () => hit('left');
    $('#right-fighter', panel).onclick = () => hit('right');
    round();
    cleanup = () => {
      removeEventListener('keydown', handleKey);
      clearTimeout(cueTimeout);
    };
  }

  function storyMode() {
    let stats = [55, 55, 55];
    let scene = 1;
    const labels = ['자원', '신뢰', '위험'];

    const draw = () => {
      const object = game.objects[(scene + stage) % game.objects.length];
      common(
        game.environments[(scene - 1) % game.environments.length],
        `${object}와 관련된 선택을 해야 합니다.`,
        `<div class="story-stats">${stats.map((value, index) => `<div>${labels[index]} <b>${value}</b></div>`).join('')}</div><div class="story-scene"><strong>${escapeHtml(object)} 사건</strong><p>${escapeHtml(game.description)} 빠른 행동·정보 확인·협력 요청 중 하나를 선택하세요.</p></div><div class="choice-grid"><button class="choice" data-choice="0"><b>바로 행동</b><small>자원 -8 · 신뢰 +12 · 위험 +8</small></button><button class="choice" data-choice="1"><b>정보 확인</b><small>자원 -4 · 신뢰 +5 · 위험 -10</small></button><button class="choice" data-choice="2"><b>협력 요청</b><small>자원 +4 · 신뢰 +8 · 위험 -3</small></button></div>`
      );

      $$('.choice', panel).forEach((button) => {
        button.addEventListener('click', () => {
          const choice = Number(button.dataset.choice);
          if (choice === 0) stats = [stats[0] - 8, stats[1] + 12, stats[2] + 8];
          if (choice === 1) stats = [stats[0] - 4, stats[1] + 5, stats[2] - 10];
          if (choice === 2) stats = [stats[0] + 4, stats[1] + 8, stats[2] - 3];
          stats = stats.map((value) => Math.max(0, Math.min(100, value)));
          scene += 1;
          reward(65, '선택이 다음 장면에 반영됐습니다.');
          if (scene > 5) advance(250);
          else draw();
        });
      });
    };

    draw();
  }

  function memoryMode() {
    const values = game.objects.slice(0, 6);
    const deck = [...values, ...values].sort(() => random() - 0.5);
    let first = null;
    let locked = false;
    let matched = 0;

    common(
      '같은 소재의 위치를 기억하세요.',
      `${game.objects[0]}부터 두 장씩 짝을 맞춥니다.`,
      `<div class="memory-grid">${deck.map((value, index) => `<button class="memory-card" data-index="${index}" data-value="${escapeHtml(value)}">${escapeHtml(value)}</button>`).join('')}</div>`
    );

    $$('.memory-card', panel).forEach((card) => {
      card.addEventListener('click', () => {
        if (locked || card.classList.contains('matched') || card === first) return;
        card.classList.add('open');
        if (!first) {
          first = card;
          return;
        }
        if (card.dataset.value === first.dataset.value) {
          card.classList.add('matched');
          first.classList.add('matched');
          first = null;
          matched += 2;
          reward(90, '기억한 위치가 맞았습니다.');
          if (matched === deck.length) advance(250);
        } else {
          locked = true;
          penalize('다른 소재입니다.');
          setTimeout(() => {
            card.classList.remove('open');
            first?.classList.remove('open');
            first = null;
            locked = false;
          }, 650);
        }
      });
    });
  }

  function foldMode() {
    const size = 16;
    const target = Array.from({ length: size }, (_, index) => ((index + game.id + stage) % 5 === 0));
    const state = [...target];
    const folds = [
      { name: '왼쪽 접기', cells: [0, 4, 8, 12, 1, 5, 9, 13] },
      { name: '오른쪽 접기', cells: [2, 6, 10, 14, 3, 7, 11, 15] },
      { name: '위쪽 접기', cells: [0, 1, 2, 3, 4, 5, 6, 7] },
      { name: '아래쪽 접기', cells: [8, 9, 10, 11, 12, 13, 14, 15] }
    ];
    for (let index = 0; index < 3 + stage; index += 1) {
      const foldIndex = Math.floor(random() * folds.length);
      for (const cell of folds[foldIndex].cells) state[cell] = !state[cell];
    }

    common(
      '접는 선을 선택해 목표 도장을 겹치세요.',
      '검은 표식이 목표 지도와 같은 위치가 되면 완성입니다.',
      `<div style="display:grid;grid-template-columns:1fr 1fr;gap:18px"><div><strong>현재 지도</strong><div id="fold-current" style="display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-top:8px"></div></div><div><strong>목표 도장</strong><div id="fold-target" style="display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-top:8px"></div></div></div><div class="button-row" id="fold-actions" style="margin-top:16px"></div><button class="action primary" id="fold-check" style="margin-top:12px">겹침 검사</button>`
    );

    const drawPattern = (selector, values) => {
      $(selector, panel).innerHTML = values
        .map((value) => `<i style="aspect-ratio:1;border:2px solid var(--ink);background:${value ? 'var(--accent)' : '#fffaf0'}"></i>`)
        .join('');
    };
    const draw = () => {
      drawPattern('#fold-current', state);
      drawPattern('#fold-target', target);
    };
    $('#fold-actions', panel).innerHTML = folds
      .map((fold, index) => `<button class="action" data-fold="${index}">${fold.name}</button>`)
      .join('');
    $$('[data-fold]', panel).forEach((button) => {
      button.addEventListener('click', () => {
        for (const cell of folds[Number(button.dataset.fold)].cells) state[cell] = !state[cell];
        draw();
      });
    });
    $('#fold-check', panel).onclick = () => {
      if (state.every((value, index) => value === target[index])) {
        reward(180, '지도의 도장이 정확히 겹쳤습니다.');
        advance();
      } else penalize('접힌 표식이 목표와 다릅니다.');
    };
    draw();
  }

  function knotMode() {
    const labels = ['A', 'A', 'B', 'B', 'C', 'C'];
    for (let count = 0; count < 5 + stage; count += 1) {
      const a = Math.floor(random() * labels.length);
      const b = Math.floor(random() * labels.length);
      [labels[a], labels[b]] = [labels[b], labels[a]];
    }
    let selected = -1;
    const points = Array.from({ length: 6 }, (_, index) => {
      const angle = -Math.PI / 2 + (Math.PI * 2 * index) / 6;
      return { x: 150 + Math.cos(angle) * 112, y: 150 + Math.sin(angle) * 112 };
    });

    const intersection = (a, b, c, d) => {
      const cross = (p, q, r) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
      return cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0;
    };
    const pairs = () => ['A', 'B', 'C'].map((label) => labels.map((value, index) => value === label ? index : -1).filter((index) => index >= 0));
    const crossingCount = () => {
      const connected = pairs();
      let count = 0;
      for (let i = 0; i < connected.length; i += 1) {
        for (let j = i + 1; j < connected.length; j += 1) {
          if (intersection(points[connected[i][0]], points[connected[i][1]], points[connected[j][0]], points[connected[j][1]])) count += 1;
        }
      }
      return count;
    };

    common(
      '밧줄 끝 두 개를 바꿔 교차를 없애세요.',
      '같은 문자끼리 연결된 세 밧줄이 서로 가로지르지 않아야 합니다.',
      '<div id="knot-board" style="position:relative;width:300px;height:300px;margin:auto;border:3px solid var(--ink);border-radius:50%;background:#fffaf0"><svg id="knot-svg" viewBox="0 0 300 300" style="position:absolute;inset:0;width:100%;height:100%"></svg></div><div class="clue" style="margin-top:12px">현재 교차 · <b id="crossings"></b></div>'
    );

    const draw = () => {
      const svg = $('#knot-svg', panel);
      svg.innerHTML = pairs().map((pair, index) => `<line x1="${points[pair[0]].x}" y1="${points[pair[0]].y}" x2="${points[pair[1]].x}" y2="${points[pair[1]].y}" stroke="${['#ec6d46','#2d7f8d','#9a6bc4'][index]}" stroke-width="10" stroke-linecap="round"/>`).join('');
      const board = $('#knot-board', panel);
      $$('.knot-end', board).forEach((button) => button.remove());
      points.forEach((point, index) => {
        const button = document.createElement('button');
        button.className = 'knot-end';
        button.textContent = labels[index];
        button.style.cssText = `position:absolute;left:${point.x - 19}px;top:${point.y - 19}px;width:38px;height:38px;border:3px solid var(--ink);border-radius:50%;background:${selected === index ? 'var(--accent)' : '#fff'};font-weight:950`;
        button.onclick = () => {
          if (selected < 0) selected = index;
          else if (selected !== index) {
            [labels[selected], labels[index]] = [labels[index], labels[selected]];
            selected = -1;
          } else selected = -1;
          draw();
          if (crossingCount() === 0) {
            reward(200, '모든 계류 밧줄이 풀렸습니다.');
            advance();
          }
        };
        board.appendChild(button);
      });
      $('#crossings', panel).textContent = String(crossingCount());
    };
    draw();
  }

  function parkingMode() {
    const cars = [
      { id: 'R', row: 2, col: 0, length: 2, orientation: 'h', color: 'var(--accent)' },
      { id: 'A', row: 1, col: 2, length: 2, orientation: 'v', color: '#2d7f8d' },
      { id: 'B', row: 0, col: 4, length: 3, orientation: 'v', color: '#d7a83e' },
      { id: 'C', row: 4, col: 1, length: 2, orientation: 'h', color: '#8a69aa' }
    ];
    let selected = 'R';
    const occupied = (ignore) => {
      const set = new Set();
      for (const car of cars) if (car.id !== ignore) for (let offset = 0; offset < car.length; offset += 1) set.add(`${car.row + (car.orientation === 'v' ? offset : 0)},${car.col + (car.orientation === 'h' ? offset : 0)}`);
      return set;
    };

    common(
      '빨간 배달 밴을 오른쪽 출구로 보내세요.',
      '차량을 선택하고 진행 방향으로 한 칸씩 이동합니다.',
      '<div id="parking-board" style="position:relative;display:grid;grid-template-columns:repeat(6,1fr);aspect-ratio:1;max-width:450px;margin:auto;background:repeating-linear-gradient(0deg,#fffaf0 0 calc(16.66% - 2px),#cfc6b5 calc(16.66% - 2px) 16.66%),repeating-linear-gradient(90deg,transparent 0 calc(16.66% - 2px),#cfc6b5 calc(16.66% - 2px) 16.66%);border:3px solid var(--ink)"></div><div class="button-row" style="margin-top:12px"><button class="action" id="car-back">← / ↑</button><button class="action primary" id="car-forward">→ / ↓</button></div><div class="feedback"></div>'
    );

    const draw = () => {
      const board = $('#parking-board', panel);
      board.innerHTML = '<i style="position:absolute;right:-18px;top:33.33%;width:18px;height:16.66%;background:#6cad62;border:3px solid var(--ink);border-left:0"></i>';
      for (const car of cars) {
        const button = document.createElement('button');
        button.textContent = car.id;
        button.style.cssText = `position:absolute;left:${(car.col / 6) * 100}%;top:${(car.row / 6) * 100}%;width:${((car.orientation === 'h' ? car.length : 1) / 6) * 100}%;height:${((car.orientation === 'v' ? car.length : 1) / 6) * 100}%;border:${selected === car.id ? 5 : 2}px solid var(--ink);background:${car.color};color:#fff;font-weight:950;transition:.15s`;
        button.onclick = () => { selected = car.id; draw(); };
        board.appendChild(button);
      }
    };

    const move = (direction) => {
      const car = cars.find((item) => item.id === selected);
      const blocks = occupied(car.id);
      const nextRow = car.row + (car.orientation === 'v' ? direction : 0);
      const nextCol = car.col + (car.orientation === 'h' ? direction : 0);
      const cells = Array.from({ length: car.length }, (_, offset) => `${nextRow + (car.orientation === 'v' ? offset : 0)},${nextCol + (car.orientation === 'h' ? offset : 0)}`);
      const inside = nextRow >= 0 && nextCol >= 0 && nextRow + (car.orientation === 'v' ? car.length : 1) <= 6 && nextCol + (car.orientation === 'h' ? car.length : 1) <= 6;
      if (!inside || cells.some((cell) => blocks.has(cell))) return penalize('다른 차량이나 경계에 막혔습니다.');
      car.row = nextRow; car.col = nextCol; draw();
      if (car.id === 'R' && car.col + car.length === 6) { reward(220, '배달 밴이 출구를 확보했습니다.'); advance(); }
    };
    $('#car-back', panel).onclick = () => move(-1);
    $('#car-forward', panel).onclick = () => move(1);
    draw();
  }

  function packingMode() {
    const pieces = [
      { name: game.objects[0], width: 2, height: 2 },
      { name: game.objects[1], width: 1, height: 4 },
      { name: game.objects[2], width: 2, height: 2 },
      { name: game.objects[3], width: 1, height: 4 }
    ];
    const board = Array(16).fill(-1);
    let selected = 0;
    let rotated = false;

    common(
      '화물 네 개를 빈칸 없이 적재하세요.',
      '화물을 선택하고 필요하면 회전한 뒤 시작 칸을 누릅니다.',
      '<div id="packing-pieces" class="button-row"></div><button class="action" id="rotate-piece" style="margin:10px 0">선택 화물 회전</button><div id="packing-board" style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;max-width:420px;margin:auto"></div><div class="feedback"></div>'
    );

    const draw = () => {
      $('#packing-pieces', panel).innerHTML = pieces.map((piece, index) => `<button class="action ${selected === index ? 'primary' : ''}" data-piece="${index}" ${board.includes(index) ? 'disabled' : ''}>${escapeHtml(piece.name)} ${rotated && selected === index ? '↻' : ''}</button>`).join('');
      $$('[data-piece]', panel).forEach((button) => button.onclick = () => { selected = Number(button.dataset.piece); rotated = false; draw(); });
      $('#packing-board', panel).innerHTML = board.map((value, index) => `<button class="cell ${value >= 0 ? 'on' : ''}" data-cell="${index}">${value >= 0 ? value + 1 : ''}</button>`).join('');
      $$('[data-cell]', panel).forEach((cell) => cell.onclick = () => place(Number(cell.dataset.cell)));
    };

    const place = (start) => {
      if (board.includes(selected)) return;
      const piece = pieces[selected];
      const width = rotated ? piece.height : piece.width;
      const height = rotated ? piece.width : piece.height;
      const row = Math.floor(start / 4), col = start % 4;
      if (col + width > 4 || row + height > 4) return penalize('화물칸 경계를 넘습니다.');
      const cells = [];
      for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) cells.push((row + y) * 4 + col + x);
      if (cells.some((index) => board[index] >= 0)) return penalize('다른 화물과 겹칩니다.');
      for (const index of cells) board[index] = selected;
      reward(45, '화물이 적재됐습니다.');
      const nextPiece = pieces.findIndex((_, index) => !board.includes(index));
      if (nextPiece >= 0) selected = nextPiece;
      draw();
      if (board.every((value) => value >= 0)) { reward(180, '화물칸을 빈틈없이 채웠습니다.'); advance(); }
    };
    $('#rotate-piece', panel).onclick = () => { rotated = !rotated; draw(); };
    draw();
  }

  function orbitMode() {
    const width = 520, height = 310, planet = { x: 260, y: 165, r: 42 };
    const solutionAngle = -35 + stage * 3;
    const solutionPower = 7 + stage * 0.3;
    const simulate = (angleDeg, power, collect = false) => {
      let x = 42, y = 230, vx = Math.cos(angleDeg * Math.PI / 180) * power, vy = Math.sin(angleDeg * Math.PI / 180) * power;
      const path = [];
      for (let step = 0; step < 180; step += 1) {
        const dx = planet.x - x, dy = planet.y - y, dist = Math.max(28, Math.hypot(dx, dy));
        const gravity = 38 / (dist * dist);
        vx += (dx / dist) * gravity * 20;
        vy += (dy / dist) * gravity * 20;
        x += vx; y += vy;
        if (collect) path.push({ x, y });
        if (x < -20 || x > width + 20 || y < -20 || y > height + 20 || dist < planet.r) break;
      }
      return path;
    };
    const solutionPath = simulate(solutionAngle, solutionPower, true);
    const targetPoint = solutionPath[Math.min(solutionPath.length - 1, 105)] || { x: 440, y: 70 };

    common(
      '발사각과 추진력을 조절해 궤도 정거장에 접안하세요.',
      '행성의 중력으로 경로가 휘어집니다. 여러 번 시험할 수 있습니다.',
      `<canvas id="orbit-canvas" width="${width}" height="${height}" style="width:100%;max-width:${width}px;border:3px solid var(--ink);background:#071827"></canvas><label>발사각 <b id="angle-value">${solutionAngle + 12}</b>°<input id="angle" type="range" min="-70" max="10" value="${solutionAngle + 12}" style="width:100%"></label><label>추진력 <b id="power-value">${(solutionPower - 1).toFixed(1)}</b><input id="power" type="range" min="4" max="11" step="0.1" value="${solutionPower - 1}" style="width:100%"></label><button class="action primary" id="launch">배송 캡슐 발사</button><div class="feedback"></div>`
    );
    const canvas = $('#orbit-canvas', panel), context = canvas.getContext('2d');
    const drawBase = () => {
      context.clearRect(0, 0, width, height);
      context.fillStyle = '#071827'; context.fillRect(0, 0, width, height);
      context.fillStyle = '#376f86'; context.beginPath(); context.arc(planet.x, planet.y, planet.r, 0, Math.PI * 2); context.fill();
      context.strokeStyle = 'rgba(255,255,255,.16)'; context.beginPath(); context.arc(planet.x, planet.y, 105, 0, Math.PI * 2); context.stroke();
      context.fillStyle = '#ffd95a'; context.fillRect(targetPoint.x - 13, targetPoint.y - 13, 26, 26);
      context.fillStyle = '#ec6d46'; context.beginPath(); context.arc(42, 230, 8, 0, Math.PI * 2); context.fill();
    };
    drawBase();
    $('#angle', panel).oninput = (event) => $('#angle-value', panel).textContent = event.target.value;
    $('#power', panel).oninput = (event) => $('#power-value', panel).textContent = event.target.value;
    $('#launch', panel).onclick = () => {
      const path = simulate(Number($('#angle', panel).value), Number($('#power', panel).value), true);
      let index = 0, minDistance = Infinity, frame = 0;
      const animate = () => {
        drawBase();
        context.strokeStyle = '#f1ede1'; context.lineWidth = 2; context.beginPath();
        path.slice(0, index + 1).forEach((point, i) => i ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y)); context.stroke();
        const point = path[Math.min(index, path.length - 1)];
        if (point) { context.fillStyle = '#fff'; context.beginPath(); context.arc(point.x, point.y, 6, 0, Math.PI * 2); context.fill(); minDistance = Math.min(minDistance, Math.hypot(point.x - targetPoint.x, point.y - targetPoint.y)); }
        index += 2;
        if (index < path.length) frame = requestAnimationFrame(animate);
        else if (minDistance < 25) { reward(240, '배송 캡슐이 궤도 정거장에 접안했습니다.'); advance(); }
        else penalize('캡슐이 정거장 궤도를 벗어났습니다.');
      };
      frame = requestAnimationFrame(animate);
      cleanup = () => cancelAnimationFrame(frame);
    };
  }

  function gravityMode() {
    common('중력을 뒤집어 양말 세 묶음을 수집하세요.', '화면을 누르거나 버튼을 사용하면 바닥과 천장이 뒤바뀝니다.', '<div class="arena" id="gravity-arena" style="background:linear-gradient(#d6f0f2 0 50%,#8c7868 50%)"><div class="player" id="gravity-player">▣</div><div id="socks"></div><div id="gravity-obstacles"></div></div><button class="action primary" id="flip" style="width:100%;margin-top:10px">중력 반전</button><div class="feedback"></div>');
    const arena = $('#gravity-arena', panel), player = $('#gravity-player', panel);
    let x = 30, y = 230, velocity = 0, gravity = 0.35, collected = 0, frame = 0;
    const socks = Array.from({ length: 3 }, (_, index) => ({ x: 180 + index * 135, y: index % 2 ? 35 : 235, found: false }));
    const obstacles = [{ x: 275, y: 125 }];
    $('#socks', panel).innerHTML = socks.map((_, i) => `<i id="sock${i}" style="position:absolute;width:30px;height:30px;background:#ffd95a;border:2px solid var(--ink);display:grid;place-items:center">S</i>`).join('');
    $('#gravity-obstacles', panel).innerHTML = obstacles.map((_, i) => `<i id="gobs${i}" style="position:absolute;width:34px;height:90px;background:#263238;border:2px solid var(--ink)"></i>`).join('');
    const flip = () => { gravity *= -1; velocity = 0; playTone(); };
    $('#flip', panel).onclick = flip; arena.onclick = flip;
    const tick = () => {
      x += 1.7 + stage * .1; velocity += gravity; y += velocity; y = Math.max(0, Math.min(260, y)); if (y === 0 || y === 260) velocity = 0;
      player.style.left = `${x}px`; player.style.top = `${y}px`;
      socks.forEach((sock, i) => { const el = $(`#sock${i}`, panel); el.style.left = `${sock.x}px`; el.style.top = `${sock.y}px`; if (!sock.found && Math.hypot(x - sock.x, y - sock.y) < 38) { sock.found = true; el.style.display = 'none'; collected++; reward(80, '양말 묶음을 수집했습니다.'); } });
      obstacles.forEach((obstacle, i) => { const el = $(`#gobs${i}`, panel); el.style.left = `${obstacle.x}px`; el.style.top = `${obstacle.y}px`; if (Math.abs(x - obstacle.x) < 34 && Math.abs(y - obstacle.y) < 65) { penalize('세탁 레일에 부딪혔습니다.'); obstacle.x += 180; } });
      if (collected >= 3) advance(250); else if (x > arena.clientWidth - 45) { x = 20; }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick); cleanup = () => cancelAnimationFrame(frame);
  }

  function steeringMode() {
    common('종이배를 조타해 부표 세 개를 통과하세요.', '왼쪽·오른쪽으로 물살과 바위를 피합니다.', '<div class="arena" id="river" style="background:linear-gradient(90deg,#8a6c48 0 12%,#4b9fb3 12% 88%,#8a6c48 88%)"><div class="player" id="boat">△</div><div id="river-items"></div></div><div class="touch-controls"><button id="river-left">← 조타</button><button id="river-right">조타 →</button></div><div class="feedback"></div>');
    const arena = $('#river', panel), boat = $('#boat', panel); let x = 220, frame = 0, passed = 0;
    const items = Array.from({ length: 7 }, (_, i) => ({ x: 80 + random() * 340, y: -i * 90, buoy: i % 2 === 0 }));
    $('#river-items', panel).innerHTML = items.map((item, i) => `<i id="river${i}" style="position:absolute;width:${item.buoy ? 28 : 42}px;height:${item.buoy ? 28 : 42}px;border:2px solid var(--ink);background:${item.buoy ? '#ffd95a' : '#263238'};display:grid;place-items:center">${item.buoy ? 'B' : '×'}</i>`).join('');
    const move = (d) => x = Math.max(55, Math.min(arena.clientWidth - 95, x + d * 34));
    $('#river-left', panel).onclick = () => move(-1); $('#river-right', panel).onclick = () => move(1);
    const key = (e) => { if (e.key === 'ArrowLeft') move(-1); if (e.key === 'ArrowRight') move(1); }; addEventListener('keydown', key);
    const tick = () => { boat.style.left = `${x}px`; boat.style.top = '245px'; items.forEach((item, i) => { item.y += 2.2 + stage * .2; if (item.y > 320) { item.y = -80; item.x = 70 + random() * 360; } const el = $(`#river${i}`, panel); el.style.left = `${item.x}px`; el.style.top = `${item.y}px`; if (Math.abs(item.y - 245) < 35 && Math.abs(item.x - x) < 38) { if (item.buoy) { passed++; reward(90, '항로 부표를 통과했습니다.'); } else penalize('급류 바위에 부딪혔습니다.'); item.y = -90; item.x = 70 + random() * 360; } }); if (passed >= 3) advance(250); frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick); cleanup = () => { cancelAnimationFrame(frame); removeEventListener('keydown', key); };
  }

  function ricochetMode() {
    const width = 520, height = 300;
    common('한 번의 네온 광선으로 표적을 맞히세요.', '벽에 닿은 광선은 같은 각도로 반사됩니다.', `<canvas id="ray-canvas" width="${width}" height="${height}" style="width:100%;max-width:${width}px;background:#0b1023;border:3px solid var(--ink)"></canvas><label>발사각 <b id="ray-value">25</b>°<input id="ray-angle" type="range" min="-70" max="70" value="25" style="width:100%"></label><button class="action primary" id="ray-fire">NEON FIRE</button><div class="feedback"></div>`);
    const canvas = $('#ray-canvas', panel), context = canvas.getContext('2d'), target = { x: 420, y: 55 + stage * 23, r: 16 };
    const draw = (path = []) => { context.fillStyle = '#0b1023'; context.fillRect(0, 0, width, height); context.fillStyle = '#ffdd55'; context.beginPath(); context.arc(target.x, target.y, target.r, 0, Math.PI * 2); context.fill(); context.strokeStyle = '#ec6dff'; context.lineWidth = 4; if (path.length) { context.beginPath(); path.forEach((p, i) => i ? context.lineTo(p.x, p.y) : context.moveTo(p.x, p.y)); context.stroke(); } };
    draw(); $('#ray-angle', panel).oninput = e => $('#ray-value', panel).textContent = e.target.value;
    $('#ray-fire', panel).onclick = () => { let x = 30, y = 250, angle = Number($('#ray-angle', panel).value) * Math.PI / 180, vx = Math.cos(angle) * 5, vy = Math.sin(angle) * 5, path = [{x,y}], hit = false; for (let step=0;step<500;step++){ x+=vx; y+=vy; if(x<=0||x>=width){vx*=-1;x=Math.max(0,Math.min(width,x));} if(y<=0||y>=height){vy*=-1;y=Math.max(0,Math.min(height,y));} path.push({x,y}); if(Math.hypot(x-target.x,y-target.y)<target.r+5){hit=true;break;} } draw(path); hit?(reward(230,'네온 표적이 점등됐습니다.'),advance()):penalize('광선이 표적을 지나쳤습니다.'); };
  }

  function altitudeMode() {
    common('열기구 고도를 조절해 승객 세 명을 태우세요.', '상승·하강 버튼으로 승강장 높이에 맞춥니다.', '<div class="arena" id="sky" style="background:linear-gradient(#9bd5eb,#f6d8a8)"><div class="player" id="balloon">◉</div><div id="platforms"></div><div class="hazard" id="cloud">☁</div></div><div class="touch-controls"><button id="down">하강</button><button id="up">상승</button></div><div class="feedback"></div>');
    const arena=$('#sky',panel),balloon=$('#balloon',panel),cloud=$('#cloud',panel);let y=150,vy=0,frame=0,picked=0;const platforms=Array.from({length:3},(_,i)=>({x:180+i*145,y:50+i%2*150,done:false}));$('#platforms',panel).innerHTML=platforms.map((_,i)=>`<i id="plat${i}" style="position:absolute;width:55px;height:24px;background:#ffd95a;border:2px solid var(--ink)">승객</i>`).join('');const push=d=>vy+=d*1.8;$('#up',panel).onclick=()=>push(-1);$('#down',panel).onclick=()=>push(1);let x=30;const tick=()=>{x+=1.25;vy*=.96;y=Math.max(0,Math.min(255,y+vy));balloon.style.left=`${x}px`;balloon.style.top=`${y}px`;platforms.forEach((p,i)=>{const el=$(`#plat${i}`,panel);el.style.left=`${p.x}px`;el.style.top=`${p.y}px`;if(!p.done&&Math.abs(x-p.x)<38&&Math.abs(y-p.y)<38){p.done=true;el.style.display='none';picked++;reward(90,'승객이 탑승했습니다.');}});const cx=330,cy=120+Math.sin(performance.now()/500)*60;cloud.style.left=`${cx}px`;cloud.style.top=`${cy}px`;if(Math.abs(x-cx)<35&&Math.abs(y-cy)<35){penalize('먹구름에 휩쓸렸습니다.');x-=55;}if(picked>=3)advance(250);else if(x>arena.clientWidth-45)x=20;frame=requestAnimationFrame(tick)};frame=requestAnimationFrame(tick);cleanup=()=>cancelAnimationFrame(frame);
  }

  function pendulumMode() {
    common('가로등 갈고리를 옮겨 보석 세 개를 회수하세요.', '진자가 오른쪽을 향할 때 다음 갈고리로 이동합니다.', '<div class="arena" id="pendulum-arena" style="background:linear-gradient(#11162c 0 75%,#4b3a32 75%)"><svg id="pendulum-svg" viewBox="0 0 520 310" style="width:100%;height:100%"></svg></div><button class="action primary" id="release" style="width:100%;margin-top:10px">갈고리 놓기 / 연결</button><div class="feedback"></div>');
    const svg=$('#pendulum-svg',panel),anchors=[{x:70,y:60},{x:200,y:80},{x:330,y:55},{x:455,y:85}];let current=0,angle=-.8,dir=1,frame=0,collected=0;const tick=()=>{angle+=dir*.025;if(angle>.9||angle<-.9)dir*=-1;const a=anchors[current],px=a.x+Math.sin(angle)*95,py=a.y+Math.cos(angle)*95;svg.innerHTML=anchors.map((p,i)=>`<circle cx="${p.x}" cy="${p.y}" r="9" fill="${i<=current?'#ffd95a':'#fff'}"/><text x="${p.x-5}" y="${p.y-16}" fill="#fff">${i<3?'◆':''}</text>`).join('')+`<line x1="${a.x}" y1="${a.y}" x2="${px}" y2="${py}" stroke="#eee" stroke-width="4"/><circle cx="${px}" cy="${py}" r="14" fill="#ec6d46"/>`;frame=requestAnimationFrame(tick)};$('#release',panel).onclick=()=>{if(angle>.35&&current<anchors.length-1){current++;collected++;reward(110,'다음 갈고리에 연결했습니다.');angle=-.8;if(collected>=3)advance(250)}else penalize('진자 각도가 다음 갈고리에 닿지 않습니다.')};frame=requestAnimationFrame(tick);cleanup=()=>cancelAnimationFrame(frame);
  }

  function polarityMode() {
    common('극성을 바꿔 금속 장벽을 통과하세요.', '같은 극은 밀고 다른 극은 끌어당깁니다.', '<div class="arena" id="magnet-arena" style="background:#cad7df"><div class="player" id="magnet-player">+</div><div id="magnets"></div></div><button class="action primary" id="polarity" style="width:100%;margin-top:10px">극성 전환</button><div class="feedback"></div>');
    const arena=$('#magnet-arena',panel),player=$('#magnet-player',panel);let polarity=1,x=30,y=140,frame=0,passed=0;const magnets=Array.from({length:5},(_,i)=>({x:180+i*115,sign:i%2?1:-1}));$('#magnets',panel).innerHTML=magnets.map((m,i)=>`<i id="mag${i}" style="position:absolute;width:42px;height:110px;background:${m.sign>0?'#d84b4b':'#3c64bb'};border:2px solid var(--ink);display:grid;place-items:center;color:white;font-size:24px">${m.sign>0?'+':'−'}</i>`).join('');$('#polarity',panel).onclick=()=>{polarity*=-1;player.textContent=polarity>0?'+':'−';playTone()};const tick=()=>{x+=1.5;y+=(145-y)*.04;magnets.forEach((m,i)=>{const el=$(`#mag${i}`,panel);const mx=m.x-(performance.now()/8)%720;el.style.left=`${mx}px`;el.style.top='95px';if(Math.abs(mx-x)<55){y+=(m.sign===polarity?-5:5);if(Math.abs(y-145)>125){penalize('자기장에 끌려 경로를 이탈했습니다.');y=145;}}if(mx<-50&&!el.dataset.passed){el.dataset.passed='1';passed++;reward(45,'금속 장벽을 통과했습니다.');}});player.style.left=`${x}px`;player.style.top=`${y}px`;if(x>arena.clientWidth-60)x=25;if(passed>=5)advance(250);frame=requestAnimationFrame(tick)};frame=requestAnimationFrame(tick);cleanup=()=>cancelAnimationFrame(frame);
  }

  function iceMode() {
    const size=6,walls=new Set(['1,1','1,2','3,2','4,2','4,4','2,4']),goal={r:0,c:5};let pos={r:5,c:0};
    common('화물을 방향 패널로 밀어 목적지 창고에 보내세요.', '화물은 벽이나 경계에 닿을 때까지 멈추지 않습니다.', '<div id="ice-board" style="display:grid;grid-template-columns:repeat(6,1fr);gap:4px;max-width:430px;margin:auto"></div><div class="button-row" style="justify-content:center;margin-top:12px"><button class="action" data-move="-1,0">↑</button><button class="action" data-move="0,-1">←</button><button class="action" data-move="0,1">→</button><button class="action" data-move="1,0">↓</button></div><div class="feedback"></div>');
    const draw=()=>{$('#ice-board',panel).innerHTML=Array.from({length:size*size},(_,i)=>{const r=Math.floor(i/size),c=i%size,key=`${r},${c}`;return `<i style="aspect-ratio:1;border:2px solid var(--ink);display:grid;place-items:center;background:${walls.has(key)?'#263238':r===goal.r&&c===goal.c?'#ffd95a':r===pos.r&&c===pos.c?'var(--accent)':'#e8f4fa'}">${r===pos.r&&c===pos.c?'▣':r===goal.r&&c===goal.c?'H':''}</i>`}).join('')};$$('[data-move]',panel).forEach(b=>b.onclick=()=>{const [dr,dc]=b.dataset.move.split(',').map(Number);let moved=false;while(true){const nr=pos.r+dr,nc=pos.c+dc;if(nr<0||nr>=size||nc<0||nc>=size||walls.has(`${nr},${nc}`))break;pos={r:nr,c:nc};moved=true;}if(!moved)penalize('바로 앞이 막혀 있습니다.');else{reward(30,'빙판을 미끄러졌습니다.');draw();if(pos.r===goal.r&&pos.c===goal.c){reward(200,'화물이 목적지 창고에 도착했습니다.');advance();}}});draw();
  }

  const hangulWords=['기차','차표','표정','정보','보리','리본','본능','능력','역사','사과','과자','자동차','차례','예술','술잔','잔디'];
  function hangulMode(){let current=hangulWords[(game.id+stage)%hangulWords.length],round=0;const draw=()=>{const last=current.at(-1),valid=hangulWords.filter(w=>w.startsWith(last)&&w!==current),answer=valid[0]||hangulWords.find(w=>w!==current),opts=[answer,...hangulWords.filter(w=>w!==answer&&w!==current).sort(()=>random()-.5).slice(0,3)].sort(()=>random()-.5);common('끝 음절로 이어지는 단어를 고르세요.',`현재 단어 · ${current} / 끝 음절 · ${last}`,`<div class="choice-grid">${opts.map(w=>`<button class="choice" data-word="${w}"><b>${w}</b><small>${w[0]}로 시작</small></button>`).join('')}</div>`);$$('.choice',panel).forEach(b=>b.onclick=()=>{if(b.dataset.word===answer){current=answer;round++;reward(100,'단어 사슬이 이어졌습니다.');round>=5?advance(250):draw()}else penalize('마지막 음절과 이어지지 않습니다.')})};draw()}

  const missingPuzzles=[['도서관','서'],['자전거','전'],['비행기','행'],['해바라기','바'],['신호등','호'],['우체국','체']];
  function missingMode(){const [word,letter]=missingPuzzles[(stage+game.id)%missingPuzzles.length],blank=word.replace(letter,'□'),opts=[letter,'가','도','미'].sort(()=>random()-.5);common('사라진 글자를 골라 간판을 복원하세요.',blank,`<div style="font-size:44px;font-weight:950;text-align:center;margin:25px">${blank}</div><div class="choice-grid">${opts.map(o=>`<button class="choice" data-letter="${o}"><b>${o}</b></button>`).join('')}</div>`);$$('.choice',panel).forEach(b=>b.onclick=()=>b.dataset.letter===letter?(reward(160,'간판이 복원됐습니다.'),advance()):penalize('이 글자는 간판 문맥과 맞지 않습니다.'))}

  const emojiPuzzles=[['🌧️☂️','우산'],['🌙🍞','달빛 빵집'],['🚲📦','자전거 배달'],['🐑☁️','구름 양'],['🔦🌊','등대'],['📚🌙','밤의 책방']];
  function emojiMode(){const [clue,answer]=emojiPuzzles[(stage+game.id)%emojiPuzzles.length],opts=[answer,...emojiPuzzles.map(x=>x[1]).filter(x=>x!==answer).sort(()=>random()-.5).slice(0,3)].sort(()=>random()-.5);common('이모지 조합이 뜻하는 표현을 찾으세요.',clue,`<div style="font-size:58px;text-align:center;margin:20px">${clue}</div><div class="choice-grid">${opts.map(o=>`<button class="choice" data-answer="${escapeHtml(o)}"><b>${escapeHtml(o)}</b></button>`).join('')}</div>`);$$('.choice',panel).forEach(b=>b.onclick=()=>b.dataset.answer===answer?(reward(160,'연상 표현이 맞았습니다.'),advance()):penalize('이모지 관계를 다시 보세요.'))}

  const typingPhrases=['신호를 확인하고 문을 연다','빠르게 입력해 추격자를 피한다','정확한 문장이 탈출 경로를 만든다','마지막 문장을 끝까지 입력한다'];
  function typingMode(){let index=0;const draw=()=>{const phrase=typingPhrases[(index+stage)%typingPhrases.length];common('문장을 정확히 입력하세요.',phrase,`<div class="meter"><i id="typing-distance" style="width:${Math.max(10,100-index*20)}%"></i></div><input id="typing-input" autocomplete="off" style="width:100%;padding:14px;border:3px solid var(--ink);font-size:18px" placeholder="문장을 입력하고 Enter"><div class="feedback"></div>`);const input=$('#typing-input',panel);input.focus();input.onkeydown=e=>{if(e.key!=='Enter')return;if(input.value.trim()===phrase){index++;reward(100,'추격자와 거리가 벌어졌습니다.');index>=4?advance(250):draw()}else{input.value='';penalize('오타가 있습니다. 다시 입력하세요.')}}};draw()}

  const syllables=[{word:'강',initial:['ㄱ','ㄴ','ㄷ'],vowel:['ㅏ','ㅓ','ㅗ'],final:['ㅇ','ㄴ','ㅁ']},{word:'문',initial:['ㅁ','ㅂ','ㅅ'],vowel:['ㅜ','ㅗ','ㅏ'],final:['ㄴ','ㅇ','ㄹ']},{word:'빛',initial:['ㅂ','ㅈ','ㄷ'],vowel:['ㅣ','ㅏ','ㅓ'],final:['ㅊ','ㅅ','ㄱ']}];
  function syllableMode(){const puzzle=syllables[(stage+game.id)%syllables.length],selected=[null,null,null];common('초성·중성·종성을 조합해 목표 글자를 만드세요.',`목표 생산품 · ${puzzle.word}`,`<div id="syllable-columns" style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px"></div><button class="action primary" id="syllable-check" style="margin-top:12px">생산 검사</button><div class="feedback"></div>`);const groups=[puzzle.initial,puzzle.vowel,puzzle.final],answers=[groups[0][0],groups[1][0],groups[2][0]];$('#syllable-columns',panel).innerHTML=groups.map((group,g)=>`<div>${group.map(v=>`<button class="action" data-group="${g}" data-value="${v}" style="width:100%;margin-bottom:6px">${v}</button>`).join('')}</div>`).join('');$$('[data-group]',panel).forEach(b=>b.onclick=()=>{selected[+b.dataset.group]=b.dataset.value;$$(`[data-group="${b.dataset.group}"]`,panel).forEach(x=>x.classList.toggle('primary',x===b))});$('#syllable-check',panel).onclick=()=>selected.every((v,i)=>v===answers[i])?(reward(190,'목표 글자가 생산됐습니다.'),advance()):penalize('블록 조합이 목표 글자와 다릅니다.')}

  const sentences=['작은 배가 항구에 도착했다','탐정은 젖은 발자국을 발견했다','구름 양이 밤하늘을 건넜다','배달원은 마지막 소포를 전달했다'];
  function sentenceMode(){const answer=sentences[(stage+game.id)%sentences.length].split(' '),pool=[...answer].sort(()=>random()-.5),built=[];common('문장 부품을 올바른 순서로 조립하세요.',answer.join(' '),'<div class="clue" id="sentence-built">아직 조립 전</div><div class="button-row" id="sentence-pool" style="margin-top:12px"></div><div class="button-row" style="margin-top:12px"><button class="action" id="sentence-reset">초기화</button><button class="action primary" id="sentence-check">수리 검사</button></div><div class="feedback"></div>');const draw=()=>{$('#sentence-built',panel).textContent=built.join(' ')||'아직 조립 전';$('#sentence-pool',panel).innerHTML=pool.map((word,i)=>`<button class="action" data-token="${i}">${word}</button>`).join('');$$('[data-token]',panel).forEach(b=>b.onclick=()=>{built.push(pool.splice(+b.dataset.token,1)[0]);draw()})};$('#sentence-reset',panel).onclick=()=>{pool.push(...built.splice(0));pool.sort(()=>random()-.5);draw()};$('#sentence-check',panel).onclick=()=>built.join(' ')===answer.join(' ')?(reward(190,'문장이 자연스럽게 복원됐습니다.'),advance()):penalize('문장 순서를 다시 확인하세요.');draw()}

  const sprintSets=[{name:'과일',words:['사과','배','포도','수박','딸기','복숭아']},{name:'동물',words:['고양이','강아지','토끼','사자','호랑이','곰']},{name:'교통',words:['기차','버스','택시','자전거','비행기','배']}];
  function sprintMode(){const set=sprintSets[(stage+game.id)%sprintSets.length],used=new Set();common('범주에 맞는 단어를 다섯 개 입력하세요.',`범주 · ${set.name}`,`<input id="sprint-input" style="width:100%;padding:14px;border:3px solid var(--ink)" placeholder="단어 입력 후 Enter"><div class="clue">기록 <b id="sprint-count">0</b> / 5</div><div id="sprint-used" class="verbs"></div><div class="feedback"></div>`);const input=$('#sprint-input',panel);input.focus();input.onkeydown=e=>{if(e.key!=='Enter')return;const word=input.value.trim();input.value='';if(!set.words.includes(word))return penalize('이 범주에 포함되지 않는 단어입니다.');if(used.has(word))return penalize('이미 입력한 단어입니다.');used.add(word);$('#sprint-count',panel).textContent=used.size;$('#sprint-used',panel).innerHTML=[...used].map(w=>`<span>${w}</span>`).join('');reward(60,'유효한 단어입니다.');if(used.size>=5)advance(250)}}

  const debugCases=[{code:['const total = 0;','for (const n of items) {','  total += n;','}'],bug:0,patch:'let total = 0;'},{code:['const user = null;','console.log(user.name);','return true;',''],bug:1,patch:'console.log(user?.name);'},{code:['for (let i = 0; i <= list.length; i++) {','  use(list[i]);','}',''],bug:0,patch:'i < list.length'}];
  function debugMode(){const item=debugCases[(stage+game.id)%debugCases.length];common('문을 막은 오류 줄을 찾아 패치하세요.',`수정 힌트 · ${item.patch}`,`<div id="code-lines" style="font-family:monospace;background:#101820;color:#dce9e2;padding:16px"></div><div class="feedback"></div>`);$('#code-lines',panel).innerHTML=item.code.map((line,i)=>`<button data-line="${i}" style="display:block;width:100%;text-align:left;background:transparent;color:inherit;border:0;padding:9px"><span style="color:#7da2ad">${i+1}</span> ${escapeHtml(line||' ')}</button>`).join('');$$('[data-line]',panel).forEach(b=>b.onclick=()=>+b.dataset.line===item.bug?(reward(210,'오류 벌레를 제거해 문이 열렸습니다.'),advance()):penalize('이 줄은 오류의 원인이 아닙니다.'))}

  function metaMode(){let completed=0,medals=0;for(let id=1;id<100;id++){const entry=window.PLAY100_CATALOG.find(g=>g.id===id);if(!entry)continue;try{const save=JSON.parse(localStorage.getItem(`play100:${entry.slug}`)||'{}');if(save.completed)completed++;if(save.medal)medals++;}catch{}}const symbols=['◈','▲','✦','⬢','◎'],sequence=Array.from({length:4},()=>symbols[Math.floor(random()*symbols.length)]),input=[];common('99개의 기록과 문양을 사용해 백 번째 문을 여세요.',`완료 게임 ${completed} · 보유 메달 ${medals}. 문양 순서를 기억하세요.`,`<div style="font-size:48px;text-align:center;letter-spacing:16px;margin:24px" id="meta-sequence">${sequence.join('')}</div><div class="button-row" id="meta-buttons" style="justify-content:center"></div><div class="clue">입력 · <b id="meta-input">—</b></div><div class="feedback"></div>`);setTimeout(()=>{const el=$('#meta-sequence',panel);if(el)el.textContent='◼ ◼ ◼ ◼'},2400+Math.min(completed,20)*80);$('#meta-buttons',panel).innerHTML=symbols.map(s=>`<button class="action" data-symbol="${s}" style="font-size:24px">${s}</button>`).join('');$$('[data-symbol]',panel).forEach(b=>b.onclick=()=>{input.push(b.dataset.symbol);$('#meta-input',panel).textContent=input.join(' ');const i=input.length-1;if(input[i]!==sequence[i]){input.length=0;$('#meta-input',panel).textContent='—';return penalize('문양 순서가 달라 문이 잠겼습니다.');}if(input.length===sequence.length){reward(500+medals*5,'백 번째 문이 열렸습니다.');advance(250)}})}

  const modes = {
    deduction: deductionMode,
    network: networkMode,
    gear: gearMode,
    spatial: spatialMode,
    arcade: arcadeMode,
    rhythm: rhythmMode,
    word: wordMode,
    cozy: cozyMode,
    management: managementMode,
    cards: cardsMode,
    duel: duelMode,
    story: storyMode,
    memory: memoryMode,
    fold: foldMode,
    knot: knotMode,
    parking: parkingMode,
    packing: packingMode,
    orbit: orbitMode,
    gravity: gravityMode,
    steering: steeringMode,
    ricochet: ricochetMode,
    altitude: altitudeMode,
    pendulum: pendulumMode,
    polarity: polarityMode,
    ice: iceMode,
    hangul: hangulMode,
    missing: missingMode,
    emoji: emojiMode,
    typing: typingMode,
    syllable: syllableMode,
    sentence: sentenceMode,
    sprint: sprintMode,
    debug: debugMode,
    meta: metaMode
  };

  function renderMode() {
    (modes[game.mode] || deductionMode)();
  }

  function start() {
    clearInterval(timerId);
    clearTimeout(transitionId);
    cleanup();
    cleanup = () => {};
    ended = false;
    startTimer();
    renderMode();
    updateHud();
  }

  start();
})();