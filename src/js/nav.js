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
})();
