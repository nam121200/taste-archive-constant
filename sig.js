/* 7주 아카이브 — Constant 시스템판 움직임
   단어 올라오기 · 헤더 숨기기/색 바꾸기 · 시선 번호 · 사진 바꾸기 · 3장 흩뿌린 칸 · 원형 커서 (사진을 누르면 2·3·4장 서브페이지로 — 링크라서 코드 없음) */
(() => {
  document.documentElement.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── 단어 올라오기: 글자를 단어 단위로 감싸고, 화면에 들어오면 켠다
  const wrapWords = el => {
    [...el.childNodes].forEach(node => {
      if (node.nodeType === 3) {
        const frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(document.createTextNode(part)); return; }
          const w = document.createElement('span'); w.className = 'w';
          const i = document.createElement('span'); i.textContent = part;
          w.append(i); frag.append(w);
        });
        node.replaceWith(frag);
      } else if (node.nodeType === 1) {
        const w = document.createElement('span'); w.className = 'w';
        const i = document.createElement('span');
        node.replaceWith(w); i.append(node); w.append(i);
      }
    });
    el.querySelectorAll('.w > span').forEach((s, n) => { s.style.transitionDelay = (n * 60) + 'ms'; });
  };
  const reveals = document.querySelectorAll('[data-reveal]');
  reveals.forEach(wrapWords);
  // 들어올 때마다 다시 재생: 20% 넘게 보이면 올라오고, 화면 밖으로 완전히 나가면 다시 아래로 숨겨 둔다
  const rio = new IntersectionObserver(es => es.forEach(e => {
    if (e.intersectionRatio >= .2) e.target.classList.add('is-on');
    else if (!e.isIntersecting) e.target.classList.remove('is-on');
  }), { threshold: [0, .2] });
  reveals.forEach(el => rio.observe(el));

  // ── 헤더: 아래로 스크롤하면 숨고 위로 올리면 나타남. 아래 깔린 구역이 어두우면 흰 글자
  const hd = document.querySelector('[data-hd]');
  const darks = [...document.querySelectorAll('[data-theme="dark"]')];
  let lastY = scrollY, ticking = false;
  const updateHeader = () => {
    const y = scrollY, probe = hd.offsetHeight / 2;
    const overDark = darks.some(s => { const r = s.getBoundingClientRect(); return r.top <= probe && r.bottom >= probe; });
    hd.classList.toggle('is-dark', overDark);
    hd.classList.toggle('is-solid', y > window.innerHeight * .6);
    if (y > 200 && y > lastY + 4) hd.classList.add('is-hidden');
    else if (y < lastY - 4 || y <= 200) hd.classList.remove('is-hidden');
    lastY = y; ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(updateHeader); ticking = true; } }, { passive: true });
  hd.addEventListener('focusin', () => hd.classList.remove('is-hidden'));
  updateHeader();

  // ── 시간대 배경: 화면 가운데 선에 걸친 구역의 data-time을 body에 옮긴다(색은 tokens.css, 전환 1초는 style.css)
  const times = [...document.querySelectorAll('section[data-time]')];
  const tio = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) document.body.dataset.time = e.target.dataset.time;
  }), { rootMargin: '-50% 0px -50% 0px' });
  times.forEach(t => tio.observe(t));

  // ── 하늘의 원: 밤 구역(1·2장)을 지나는 동안 달이 오른쪽 위에서 화면 아래로 지고,
  //    밝은 구역(3·4장)을 지나는 동안 해가 왼쪽 아래에서 떠오른다.
  //    진하기는 화면에 보이는 구역의 밝기에 묶는다 — 달은 밤 구역이 보이는 만큼, 해는 밝은 구역이 보이는 만큼만 진해진다.
  //    (상한: 달 .18 · 해 .34 — 이 값에서 모든 글자 대비 5:1 이상)
  const sky = document.querySelector('.sky');
  if (sky) {
    const $ = id => document.getElementById(id);
    const darkSecs = [$('s2'), $('s3')], lightSecs = [$('s4'), $('s5'), $('s6')], foot = document.querySelector('.ft');
    const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
    const lerp = (a, b, t) => a + (b - a) * t;
    const easeIn = t => t * t, easeOut = t => 1 - (1 - t) * (1 - t);
    const cover = els => { const vh = innerHeight; return clamp(els.reduce((n, el) => { const r = el.getBoundingClientRect(); return n + Math.max(0, Math.min(vh, r.bottom) - Math.max(0, r.top)); }, 0) / vh); };
    let skyTick = false;
    const paintSky = () => {
      skyTick = false;
      const vh = innerHeight, vw = document.documentElement.clientWidth, y = scrollY;
      const top = el => el.getBoundingClientRect().top + y;
      const mStart = top($('s2')) - vh * .5, mEnd = top($('s4')) - vh * .35;          // 1장이 화면 가운데 → 3장이 올라올 때까지
      const sStart = mEnd, sEnd = top($('s5')) + $('s5').offsetHeight * .5 - vh * .5; // 달이 다 진 뒤 → 4장 가운데까지
      const pm = clamp((y - mStart) / (mEnd - mStart)), ps = clamp((y - sStart) / (sEnd - sStart));
      const dark = cover(darkSecs), light = cover(lightSecs), footFade = 1 - cover([foot]);
      let x, yy, c, a;
      if (pm >= 1) {                                    // 해: 왼쪽 아래 → 왼쪽 위, 살구빛 → 따뜻한 빛 (달이 화면 아래로 다 진 뒤에만)
        const t = easeOut(ps);
        x = lerp(.22, .3, t) * vw; yy = lerp(1.18, .26, t) * vh;
        c = [255, Math.round(lerp(184, 206, t)), Math.round(lerp(152, 140, t))];
        a = .34 * light * footFade;
      } else {                                          // 달: 오른쪽 위 → 오른쪽 아래로 짐
        const t = easeIn(pm);
        x = lerp(.76, .64, t) * vw; yy = lerp(.24, 1.2, t) * vh;
        c = [240, 230, 210];   // 따뜻한 달빛
        a = .18 * dark * (1 - clamp((pm - .7) / .3)) * footFade;
      }
      sky.style.setProperty('--sx', x + 'px');
      sky.style.setProperty('--sy', yy + 'px');
      sky.style.setProperty('--sc', c.join(' '));
      sky.style.setProperty('--sa', a.toFixed(3));
    };
    addEventListener('scroll', () => { if (!skyTick) { skyTick = true; requestAnimationFrame(paintSky); } }, { passive: true });
    addEventListener('resize', paintSky);
    paintSky();
  }

  // ── 1장 시선: 세 묶음이 한 줄에 다 보이므로 번호(1/3)는 없앴다
  const works = [...document.querySelectorAll('[data-work]')];

  // ── 1장 시선: 작은 사진을 누르면 큰 사진이 바뀜(투명도 400ms)
  works.forEach(work => {
    const main = work.querySelector('.work-main');
    const btns = [...work.querySelectorAll('.thumbs button')];
    btns.forEach((b, n) => b.addEventListener('click', () => {
      if (b.classList.contains('is-on')) return;
      btns.forEach(x => x.classList.toggle('is-on', x === b));
      const src = b.querySelector('img').getAttribute('src');
      const swap = () => {
        main.src = src;
        main.alt = main.alt.replace(/사진 \d+$/, '사진 ' + (n + 1));
        main.removeAttribute('width'); main.removeAttribute('height');
        main.classList.remove('is-fading');
      };
      if (reduce) return swap();
      main.classList.add('is-fading');
      setTimeout(swap, 400);
    }));
  });


  // ── 3장 공간: 흩뿌린 칸 (7주 원래 사이트 동작) — 칸이 화면에 들어오면 가운데 점에서 펴지고,
  //    칸·이름에 마우스를 올리면 그 공간 이름과 칸만 밝게, 칸·이름·More는 spaces.html로 가는 링크
  const sp = document.querySelector('.sp');
  if (sp) {
    const items = [...sp.querySelectorAll('.sp-item')], cells = [...sp.querySelectorAll('.sp-cell')];
    const hot = (i, on) => {
      sp.classList.toggle('is-linking', on);
      items.forEach((it, j) => it.classList.toggle('is-hot', on && i === j));
      cells.forEach(c => c.classList.toggle('is-hot', on && +c.dataset.space === i));
    };
    cells.forEach(c => {
      const i = +c.dataset.space;
      c.addEventListener('mouseenter', () => hot(i, true)); c.addEventListener('mouseleave', () => hot(i, false));
      c.addEventListener('focus', () => hot(i, true)); c.addEventListener('blur', () => hot(i, false));
    });
    items.forEach((it, i) => {
      it.addEventListener('mouseenter', () => hot(i, true)); it.addEventListener('mouseleave', () => hot(i, false));
    });
    if (!reduce && 'IntersectionObserver' in window) {
      sp.classList.add('is-armed');
      const cio = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('is-in', e.isIntersecting)), { rootMargin: '0px 0px -8% 0px' });
      cells.forEach(c => cio.observe(c));
    }
  }

  // ── 원형 커서: 평소엔 작은 점, 누를 수 있는 사진 위에선 커지며 라벨
  const cur = document.querySelector('.cursor');
  if (matchMedia('(hover: hover) and (pointer: fine)').matches && !reduce) {
    const label = cur.querySelector('.cursor-l');
    let x = -200, y = -200, big = false;
    const paint = () => { cur.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${big ? 1 : .12})`; };
    addEventListener('mousemove', e => { x = e.clientX; y = e.clientY; cur.classList.add('is-on'); paint(); }, { passive: true });
    document.addEventListener('mouseleave', () => cur.classList.remove('is-on'));
    document.addEventListener('mouseover', e => {
      const t = e.target.closest('[data-cursor]');
      big = !!t;
      cur.classList.toggle('is-big', big);
      if (t) label.textContent = t.dataset.cursor;
      paint();
    });
  }
})();
