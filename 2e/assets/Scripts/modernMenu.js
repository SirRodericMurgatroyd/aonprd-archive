;window.nethysModernMenu = (function () {
    'use strict';

    let menuContainer = null;

    function handleTopLevelItemClick(e) {
        const subitems = e.currentTarget.nextElementSibling;

        if (subitems && subitems.classList.contains('modern-menu-subitems')) {
            menuContainer.querySelectorAll('.modern-menu-subitems')
                .forEach(x => x === subitems ? x.classList.toggle('is-shown') : x.classList.remove('is-shown'));
            
            menuContainer.querySelectorAll('.modern-menu-items > .modern-menu-item').forEach(x => x.classList.remove('is-selected'));

            if (subitems.classList.contains('is-shown')) {
                e.currentTarget.classList.add('is-selected');
            }
        }
    }

    function init() {
        menuContainer = document.querySelector('.modern-menu-container');

        menuContainer.querySelectorAll('.modern-menu-items > .modern-menu-item').forEach(topLevelItem => {
            topLevelItem.addEventListener('click', handleTopLevelItemClick);
        });

        document.querySelector('.game-selector').addEventListener('click', e => e.currentTarget.classList.toggle('is-selected'));
    }

    return {
        init
    };
})();