(() => {
  const header = document.querySelector('.site-header');
  const menuButton = document.querySelector('.menu-button');
  const mobileNav = document.querySelector('.mobile-nav');

  const updateHeader = () => {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 16);
  };

  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  document.querySelectorAll('.set-card').forEach((set) => {
    set.open = true;
  });

  const closeMenu = () => {
    if (!menuButton || !mobileNav) return;
    mobileNav.classList.remove('open');
    mobileNav.setAttribute('aria-hidden', 'true');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open menu');
    document.body.classList.remove('menu-open');
  };

  if (menuButton && mobileNav) {
    menuButton.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('open');
      mobileNav.setAttribute('aria-hidden', String(!isOpen));
      menuButton.setAttribute('aria-expanded', String(isOpen));
      menuButton.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
      document.body.classList.toggle('menu-open', isOpen);
    });

    mobileNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 960) closeMenu();
    });
  }

  const player = document.getElementById('audioPlayer');
  const playerShell = document.querySelector('.player-shell');
  const audioTitle = document.getElementById('audioTitle');
  const audioMeta = document.getElementById('audioMeta');
  const audioKind = document.getElementById('audioKind');
  const tracks = [...document.querySelectorAll('.audio-track[data-src]')];

  const setTrackState = (selected) => {
    tracks.forEach((track) => {
      const active = track === selected;
      track.classList.toggle('active', active);
      track.setAttribute('aria-pressed', String(active));
      const action = track.querySelector('.track-action');
      if (action) action.textContent = active && player && !player.paused ? 'Pause' : 'Play';
    });
  };

  if (player && audioTitle && audioMeta && audioKind && tracks.length) {
    tracks.forEach((track) => {
      track.addEventListener('click', async () => {
        const sameTrack = player.getAttribute('src') === track.dataset.src;

        if (sameTrack && !player.paused) {
          player.pause();
          setTrackState(track);
          return;
        }

        if (!sameTrack) {
          player.pause();
          player.setAttribute('src', track.dataset.src);
          player.load();
        }

        audioTitle.textContent = track.dataset.title;
        audioMeta.textContent = track.dataset.meta;
        audioKind.textContent = track.dataset.kind;
        setTrackState(track);

        try {
          await player.play();
        } catch (error) {
          player.controls = true;
        }
      });
    });

    const activeTrack = () => tracks.find((track) => track.classList.contains('active')) || tracks[0];
    player.addEventListener('play', () => {
      playerShell?.classList.add('is-playing');
      setTrackState(activeTrack());
    });
    player.addEventListener('pause', () => {
      playerShell?.classList.remove('is-playing');
      setTrackState(activeTrack());
    });
    player.addEventListener('ended', () => {
      playerShell?.classList.remove('is-playing');
      setTrackState(activeTrack());
    });
  }

  document.querySelectorAll('.youtube-frame[data-youtube-id]').forEach((frame) => {
    const poster = frame.querySelector('.youtube-poster');
    if (!poster) return;

    poster.addEventListener('click', (event) => {
      if (!/^https?:$/.test(window.location.protocol)) return;

      event.preventDefault();
      const videoId = frame.dataset.youtubeId;
      if (!/^[\w-]{11}$/.test(videoId || '')) return;

      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
      iframe.title = frame.dataset.youtubeTitle || 'YouTube video';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.allowFullscreen = true;

      frame.replaceChildren(iframe);
      frame.classList.add('is-playing');
    });
  });

  const repertoireTabs = [...document.querySelectorAll('[data-repertoire-tab]')];
  const repertoirePanels = [...document.querySelectorAll('[data-repertoire-panel]')];

  if (repertoireTabs.length && repertoirePanels.length) {
    const activateRepertoire = (targetId, moveFocus = false, updateUrl = false) => {
      const selectedTab = repertoireTabs.find((tab) => tab.dataset.repertoireTab === targetId);
      const selectedPanel = repertoirePanels.find((panel) => panel.id === targetId);
      if (!selectedTab || !selectedPanel) return;

      repertoireTabs.forEach((tab) => {
        const active = tab === selectedTab;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
      });

      repertoirePanels.forEach((panel) => {
        panel.hidden = panel !== selectedPanel;
      });

      if (moveFocus) selectedTab.focus();
      if (updateUrl) history.replaceState(null, '', `#${targetId}`);
    };

    repertoireTabs.forEach((tab, index) => {
      tab.addEventListener('click', () => activateRepertoire(tab.dataset.repertoireTab, false, true));
      tab.addEventListener('keydown', (event) => {
        let nextIndex = index;
        if (event.key === 'ArrowRight') nextIndex = (index + 1) % repertoireTabs.length;
        if (event.key === 'ArrowLeft') nextIndex = (index - 1 + repertoireTabs.length) % repertoireTabs.length;
        if (event.key === 'Home') nextIndex = 0;
        if (event.key === 'End') nextIndex = repertoireTabs.length - 1;
        if (nextIndex === index) return;
        event.preventDefault();
        activateRepertoire(repertoireTabs[nextIndex].dataset.repertoireTab, true, true);
      });
    });

    const initialTarget = window.location.hash.slice(1);
    if (repertoirePanels.some((panel) => panel.id === initialTarget)) activateRepertoire(initialTarget);
  }

  const songSearch = document.getElementById('songSearch');
  const searchStatus = document.getElementById('searchStatus');
  const repertoireSections = [...document.querySelectorAll('[data-repertoire-section]')];

  if (songSearch && searchStatus && repertoireSections.length) {
    const songs = [...document.querySelectorAll('.song-list li')];
    const normalise = (value) => value.toLocaleLowerCase('en-AU').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const filterSongs = () => {
      const query = normalise(songSearch.value.trim());
      let visibleTotal = 0;

      songs.forEach((song) => {
        const matches = !query || normalise(song.textContent).includes(query);
        song.classList.toggle('is-hidden', !matches);
        if (matches) visibleTotal += 1;
      });

      repertoireSections.forEach((section) => {
        const sectionMatches = section.querySelectorAll('.song-list li:not(.is-hidden)').length;
        const emptyMessage = section.querySelector('.empty-section');
        if (emptyMessage) emptyMessage.hidden = sectionMatches > 0;
      });

      const noun = visibleTotal === 1 ? 'song' : 'songs';
      searchStatus.textContent = query ? `${visibleTotal} matching ${noun}` : `${visibleTotal} songs shown`;
    };

    songSearch.addEventListener('input', filterSongs);
  }

  const enquiryForm = document.getElementById('enquiryForm');
  const dateField = document.getElementById('date');
  const formStatus = document.getElementById('formStatus');

  if (dateField) {
    const now = new Date();
    const localToday = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    dateField.min = localToday;
  }

  if (enquiryForm) {
    enquiryForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(enquiryForm);
      const value = (name, fallback = 'To confirm') => String(data.get(name) || '').trim() || fallback;
      const name = value('name', '');
      const eventDate = value('date');
      const subjectDate = eventDate === 'To confirm' ? '' : ` — ${eventDate}`;
      const subject = `Live music enquiry${subjectDate}`;
      const body = [
        'Hi Robert,',
        '',
        'I would like to enquire about live music.',
        '',
        `Name: ${name}`,
        `Reply email: ${value('email', '')}`,
        `Date: ${eventDate}`,
        `Location: ${value('location')}`,
        `Occasion: ${value('occasion')}`,
        `Format: ${value('format', 'Open to advice')}`,
        `Booking length: ${value('sets', 'Open to advice')}`,
        `Approximate times: ${value('times')}`,
        '',
        'Additional details:',
        value('message', 'None supplied'),
        '',
        `Regards,`,
        name
      ].join('\r\n');

      if (formStatus) formStatus.textContent = 'Opening your email app with the enquiry filled in…';
      window.location.href = `mailto:robertrosina@outlook.com.au?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  }

  const faqItems = [...document.querySelectorAll('.faq-list details')];
  faqItems.forEach((item) => {
    item.addEventListener('toggle', () => {
      if (!item.open) return;
      faqItems.forEach((other) => {
        if (other !== item) other.open = false;
      });
    });
  });

  document.querySelectorAll('[data-year]').forEach((year) => {
    year.textContent = String(new Date().getFullYear());
  });

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealItems = [...document.querySelectorAll('.reveal')];

  if (!reducedMotion && 'IntersectionObserver' in window && revealItems.length) {
    document.documentElement.classList.add('motion-ready');
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -7% 0px', threshold: .08 });

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }
})();
