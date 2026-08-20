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
    memory: memoryMode
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