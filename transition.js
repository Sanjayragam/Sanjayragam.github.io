document.addEventListener('DOMContentLoaded', () => {
    // Determine entrance animation based on session storage
    const transitionData = sessionStorage.getItem('pageTransition');
    if (transitionData) {
        sessionStorage.removeItem('pageTransition');
        try {
            const { type } = JSON.parse(transitionData);
            document.body.classList.add(type); 
        } catch (e) {}
    } else {
        document.body.classList.add('fade-in');
    }

    // Intercept navigation
    document.body.addEventListener('click', (e) => {
        const a = e.target.closest('a');
        const onclickEl = e.target.closest('[onclick*="location.href"]');
        
        let targetHref = null;
        let isBack = false;

        if (a && a.href && a.href.startsWith(window.location.origin) && !a.href.includes('#')) {
            targetHref = a.href;
            if (a.classList.contains('back-btn')) isBack = true;
        } else if (onclickEl) {
            const match = onclickEl.getAttribute('onclick').match(/location\.href\s*=\s*'([^']+)'/);
            if (match) {
                // Resolve relative path
                const aEl = document.createElement('a');
                aEl.href = match[1];
                targetHref = aEl.href;
            }
        }

        if (targetHref) {
            e.preventDefault();
            if (onclickEl) e.stopPropagation();

            // Clear entrance class 
            document.body.classList.remove('slide-in-forward', 'slide-in-back', 'fade-in');
            
            // Apply exit class
            const outClass = isBack ? 'slide-out-back' : 'slide-out-forward';
            document.body.classList.add(outClass);
            
            // Store entrance class for next page
            sessionStorage.setItem('pageTransition', JSON.stringify({
                type: isBack ? 'slide-in-back' : 'slide-in-forward'
            }));

            // Navigate after animation
            setTimeout(() => {
                window.location.href = targetHref;
            }, 300); // slightly shorter than animation 0.35s to prevent blank flash
        }
    });

    // Handle browser back button (pageshow event from bfcache)
    window.addEventListener('pageshow', (e) => {
        if (e.persisted) {
            document.body.classList.remove('slide-out-forward', 'slide-out-back');
            document.body.classList.add('slide-in-back');
        }
    });
});
