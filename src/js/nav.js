(() => {
    const header = document.querySelector('.site-header');
    if (!header) return;

    const nav = header.querySelector('.main-nav');
    const navToggle = header.querySelector('.nav-toggle');
    const dropdownItem = header.querySelector('[data-dropdown]');
    const dropdownToggle = header.querySelector('.nav-dropdown-toggle');

    const isDesktop = () => window.matchMedia('(min-width: 961px)').matches;

    const setMenuOpen = (isOpen) => {
        header.classList.toggle('nav-open', isOpen);
        if (navToggle) navToggle.setAttribute('aria-expanded', String(isOpen));
    };

    const setDropdownOpen = (isOpen) => {
        if (!dropdownItem || !dropdownToggle) return;
        dropdownItem.classList.toggle('is-open', isOpen);
        dropdownToggle.setAttribute('aria-expanded', String(isOpen));
    };

    const closeAllMenus = () => {
        setMenuOpen(false);
        setDropdownOpen(false);
    };

    if (navToggle) {
        navToggle.addEventListener('click', () => {
            const isOpen = header.classList.contains('nav-open');
            setMenuOpen(!isOpen);
            if (isOpen) {
                setDropdownOpen(false);
            }
        });
    }

    if (dropdownToggle) {
        dropdownToggle.addEventListener('click', (event) => {
            event.preventDefault();
            const isOpen = dropdownItem.classList.contains('is-open');
            setDropdownOpen(!isOpen);
            if (!isDesktop() && !header.classList.contains('nav-open')) {
                setMenuOpen(true);
            }
        });
    }

    document.addEventListener('click', (event) => {
        if (!header.contains(event.target)) {
            closeAllMenus();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeAllMenus();
        }
    });

    window.addEventListener('resize', () => {
        if (isDesktop()) {
            setMenuOpen(false);
        }
    });

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const pageMap = {
        'index.html': ['index.html'],
        'maandlasten-bouwdepot.html': ['maandlasten-bouwdepot.html'],
        'nieuwbouw.html': ['nieuwbouw.html'],
        'bouwrente-nieuwbouw.html': ['bouwrente-nieuwbouw.html'],
        'dubbele-lasten-nieuwbouw.html': ['dubbele-lasten-nieuwbouw.html'],
        'renteverlies-bouwdepot.html': ['renteverlies-bouwdepot.html'],
        'maximale-bouwdepot.html': ['maximale-bouwdepot.html'],
        'eigen-geld-bouwdepot.html': ['eigen-geld-bouwdepot.html'],
        'belasting.html': ['belasting.html'],
        'calculators.html': ['calculators.html'],
        'kennisbank.html': ['kennisbank.html'],
        'stappenplan.html': ['stappenplan.html'],
        'over-ons.html': ['over-ons.html'],
        'contact.html': ['contact.html']
    };

    const activeTargets = pageMap[currentPage] || [currentPage];
    const allLinks = nav ? Array.from(nav.querySelectorAll('a[href]')) : [];

    allLinks.forEach((link) => {
        const href = link.getAttribute('href');
        if (!href) return;
        if (activeTargets.includes(href)) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        }
    });

    const calculatorPages = new Set([
        'index.html',
        'maandlasten-bouwdepot.html',
        'nieuwbouw.html',
        'bouwrente-nieuwbouw.html',
        'dubbele-lasten-nieuwbouw.html',
        'renteverlies-bouwdepot.html',
        'maximale-bouwdepot.html',
        'eigen-geld-bouwdepot.html',
        'belasting.html',
        'calculators.html'
    ]);

    if (calculatorPages.has(currentPage)) {
        nav?.classList.add('is-calculator-page');
    }
    const openPrivacySettings = (control) => {
        const status = control.closest?.('.policy-section')?.querySelector('[data-privacy-status]');

        if (!document.querySelector('script[src*="pagead2.googlesyndication.com"]')) {
            window.location.assign('/?privacy=settings');
            return;
        }

        const startedAt = Date.now();

        const tryOpen = () => {
            if (typeof window.googlefc?.showRevocationMessage === 'function') {
                window.googlefc.showRevocationMessage();
                if (status) status.textContent = '';
                return;
            }

            if (Date.now() - startedAt < 5000) {
                window.setTimeout(tryOpen, 150);
                return;
            }

            if (status) {
                status.textContent = 'De instellingen konden niet worden geladen. Controleer of advertentie- of scriptblokkering actief is en probeer het opnieuw.';
            }
        };

        tryOpen();
    };

    const footerLinks = document.querySelector('.footer-links');
    if (footerLinks && !footerLinks.querySelector('[data-privacy-settings]')) {
        const privacyButton = document.createElement('button');
        privacyButton.type = 'button';
        privacyButton.className = 'footer-privacy-button';
        privacyButton.dataset.privacySettings = '';
        privacyButton.textContent = 'Privacy- en cookie-instellingen';
        footerLinks.appendChild(privacyButton);
    }

    document.querySelectorAll('[data-privacy-settings]').forEach((control) => {
        control.addEventListener('click', () => openPrivacySettings(control));
    });

    const privacyQuery = new URLSearchParams(window.location.search).get('privacy');
    if (privacyQuery === 'settings') {
        window.history.replaceState({}, '', window.location.pathname + window.location.hash);
        openPrivacySettings(document.body);
    }

})();
