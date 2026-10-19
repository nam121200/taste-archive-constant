/* 네 페이지 공통 움직임 (2026-10-20)
   1) 사진이 걷히며 등장 — 화면에 들어오면 아래에서 위로 커튼이 걷히고, 살짝 크게 시작해 제 크기로 (한 번만)
   2) 페이지 전환 — 서브페이지로 갈 때 도착할 장의 시간대 색 막이 아래에서 올라와 덮고 넘어간다.
      메인(index.html)에는 쓰지 않는다: 메인에 도착할 때도, 메인으로 갈 때도 막 없음.
      도착한 페이지에서는 막이 위로 걷힌다(그쪽은 CSS만으로 걷히므로 이 파일이 안 불려도 화면이 가려진 채 남지 않는다). */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

  // ── 1) 사진이 걷히며 등장
  // 3장 칸 밭(.sp-cell)은 자체 '펴짐'이 있어 뺀다. 같은 무리 안에서는 80ms씩 차례로.
  const groups = [
    // 메인 1·2·4장 사진은 커튼 대신 '아래에서 약하게 떠오르기'(아래 1-2)를 쓴다 — 2026-10-20
    '.note-fig .ph',              // 사람 서브
    '.wall .ph',                  // 공간 서브
    '.spec-card .ph', '.spec-more .ph', '.ob-index img'  // 물건 서브
  ];
  // 커튼(clip-path)으로 완전히 가려진 사진은 '안 보임'으로 잡히므로, 사진이 아니라 사진을 감싼 칸을 지켜본다
  if (!reduce && 'IntersectionObserver' in window) {
    const owner = new Map();
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      (owner.get(e.target) || []).forEach(img => img.classList.add('is-in'));
      io.unobserve(e.target);
    }), { rootMargin: '0px 0px -8% 0px' });
    groups.forEach(sel => {
      document.querySelectorAll(sel).forEach((img, i) => {
        img.classList.add('reveal-ph');
        img.style.setProperty('--rd', (i % 6) * 80 + 'ms');
        const box = img.parentElement;
        if (!owner.has(box)) { owner.set(box, []); io.observe(box); }
        owner.get(box).push(img);
      });
    });
  }

  // ── 1-2) 메인 1·2·4장: 휠을 내리는 만큼 글은 제자리로 떠오르고, 사진은 조금 천천히 따라온다 (2026-10-20)
  //    글: 화면 아래로 들어올 때 32px 아래 → 화면 70% 높이에서 제자리(되돌리면 다시 내려감)
  //    사진: 커튼 없이 처음부터 보이고, 24px 아래에 있다가 화면 55% 높이까지 약하게 올라와 제자리(글보다 짧고 길게). 폰은 절반.
  //    위치만 움직인다(CSS translate) — 글 대비·사진 화질·마우스 올림 확대(transform)와 부딪히지 않는다.
  if (!reduce && document.getElementById('s2')) {
    const items = [];
    const add = (el, kind, delay = 0) => { if (el) items.push({ el, kind, delay, base: 0, h: 0 }); };
    add(document.querySelector('#s2 .gaze-lead'), 'rise');
    document.querySelectorAll('#s2 .work').forEach((w, i) => {
      add(w.querySelector('.work-media'), 'lift', i * 30);
      add(w.querySelector('.work-text'), 'rise', 40 + i * 50);       // 왼쪽부터 차례로, 사진보다 반 박자 늦게
    });
    add(document.querySelector('#s3 .quote'), 'rise');
    document.querySelectorAll('#s3 .ppl-item').forEach(it => {
      add(it.querySelector('.ppl-fig'), 'lift');
      add(it.querySelector('.ppl-text'), 'rise', 60);
    });
    add(document.querySelector('#s5 .quote'), 'rise');
    document.querySelectorAll('#s5 .card').forEach((c, i) => {
      add(c.querySelector('.card-img'), 'lift', i * 40);
      c.querySelectorAll('.card-n, .card-t, .card-when').forEach((t, j) => add(t, 'rise', 20 + i * 40 + j * 25));   // 물결처럼
    });

    const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
    const easeOut = t => 1 - (1 - t) * (1 - t);
    // 움직이기 전 자리를 잰다(움직인 값이 섞이지 않게 잠깐 지우고 잰 뒤 바로 다시 그린다)
    const measure = () => {
      items.forEach(it => { it.el.style.translate = ''; });
      items.forEach(it => { const r = it.el.getBoundingClientRect(); it.base = r.top + scrollY; it.h = r.height; });
      paint();
    };
    let tick = false;
    const paint = () => {
      tick = false;
      const vh = innerHeight, small = innerWidth < 764, RISE = small ? 16 : 32, LIFT = small ? 12 : 24, y = scrollY;
      items.forEach(it => {
        const top = it.base - y;
        let off;
        if (it.kind === 'rise') {
          const p = clamp((vh - top - it.delay) / (vh * .3));
          off = (1 - easeOut(p)) * RISE;
        } else {                                   // lift: 사진 — 처음부터 보이고, 조금 아래에서 약하게 올라온다
          const p = clamp((vh - top - it.delay) / (vh * .45));
          off = (1 - easeOut(p)) * LIFT;
        }
        it.el.style.translate = `0 ${off.toFixed(1)}px`;
      });
    };
    addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(paint); } }, { passive: true });
    addEventListener('resize', measure);
    addEventListener('load', measure);          // 사진이 다 뜬 뒤 자리가 바뀌므로 한 번 더 잰다
    measure();
  }

  // ── 2) 페이지 전환: 떠날 때
  // 도착 페이지(와 그 장)의 시간대 바탕색 — tokens.css의 값과 같다
  const COLOR = { 'index.html': '#15130f', 'people.html': '#201e1a', 'spaces.html': '#f1ede7', 'objects.html': '#f6efe2' };
  const HASH = { '#s3': '#201e1a', '#s4': '#f1ede7', '#s5': '#f6efe2', '#s6': '#fdf5e3' };
  const colorFor = url => {
    const page = url.pathname.split('/').pop() || 'index.html';
    if (page === 'index.html' && HASH[url.hash]) return HASH[url.hash];
    return COLOR[page] || '#15130f';
  };
  if (!reduce) {
    document.addEventListener('click', e => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest('a[href]');
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname) return;          // 같은 페이지 안 이동(#s2 등)은 그대로
      const dest = url.pathname.split('/').pop() || 'index.html';
      if (dest === 'index.html') return;                        // 메인으로 갈 때는 막 없이 바로 (메인에는 전환 막을 쓰지 않는다 — 2026-10-20)
      e.preventDefault();
      root.style.setProperty('--veil', colorFor(url));
      root.classList.remove('veil-in');
      root.classList.add('veil-leave');
      setTimeout(() => { location.href = url.href; }, 560);
    });
    // 뒤로 가기로 돌아왔을 때(페이지 보관 복원) 막이 덮인 채 남지 않게
    addEventListener('pageshow', e => { if (e.persisted) root.classList.remove('veil-leave', 'veil-in'); });
  }
})();
